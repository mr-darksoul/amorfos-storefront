import { supabase } from "@/lib/supabase";
import { createShiprocketOrder, isShiprocketConfigured } from "@/lib/shiprocket";
import {
  sendOrderConfirmationEmail,
  sendOrderConfirmationWhatsApp,
  sendOpsAlertEmail,
  escapeHtml,
} from "@/lib/notify";
import { sendMetaPurchaseEvent } from "@/lib/metaCapi";
import { site } from "@/lib/site";

/** Shopper's browser details, used to match the Meta Conversions API event. */
export interface ClientContext {
  clientIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  sourceUrl?: string;
  /** First-party analytics ids (lib/siteTracker.ts) — attributes the order to a visit. */
  analyticsSid?: string;
  analyticsVid?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function uuidOrUndefined(v: string | undefined): string | undefined {
  return v && UUID_RE.test(v) ? v : undefined;
}

export function clientContextFromRequest(req: Request): ClientContext {
  const cookieHeader = req.headers.get("cookie") ?? "";
  const readCookie = (name: string) =>
    cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))?.[1];
  return {
    clientIp:
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined,
    userAgent: req.headers.get("user-agent") || undefined,
    fbp: readCookie("_fbp"),
    fbc: readCookie("_fbc"),
    sourceUrl: req.headers.get("referer") || undefined,
    analyticsSid: uuidOrUndefined(readCookie("amf_sid")),
    analyticsVid: uuidOrUndefined(readCookie("amf_vid")),
  };
}

export type MarkPaidResult = "transitioned" | "already_paid" | "missing";

/**
 * Atomically flips an order to paid. Only the caller that wins the transition
 * should run post-payment work, so the browser callback and the Razorpay
 * webhook can both arrive without duplicate emails or Shiprocket orders.
 * `failed` is included because a forged, unsigned verify call can mark a
 * pending order failed before the genuine, signed payment arrives.
 */
export async function markOrderPaid(
  razorpayOrderId: string,
  razorpayPaymentId: string,
): Promise<MarkPaidResult> {
  const { data: paidRows, error } = await supabase()
    .from("orders")
    .update({
      status: "paid",
      razorpay_payment_id: razorpayPaymentId,
      paid_at: new Date().toISOString(),
    })
    .eq("razorpay_order_id", razorpayOrderId)
    .in("status", ["pending", "failed"])
    .select("id");

  if (error) throw new Error(`markOrderPaid failed: ${error.message}`);
  if (paidRows && paidRows.length > 0) return "transitioned";

  const { data: existing } = await supabase()
    .from("orders")
    .select("status")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();

  if (!existing) {
    console.error(
      `[paid-order] CRITICAL: payment ${razorpayPaymentId} for order ${razorpayOrderId} ` +
        `matched no DB row — manual recovery needed.`,
    );
    return "missing";
  }
  return "already_paid";
}

/**
 * Everything that happens after an order becomes paid: Meta purchase event,
 * stock, review link, confirmation email/WhatsApp and Shiprocket booking.
 * Call it only after `markOrderPaid` returned "transitioned", inside `after()`.
 */
export async function runPostPaymentWork(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  liveContext?: ClientContext,
): Promise<void> {
  try {
    const { data: order } = await supabase()
      .from("orders")
      .select("*")
      .eq("razorpay_order_id", razorpayOrderId)
      .single();

    if (!order) return;

    const ctx: ClientContext = {
      ...((order.client_context as ClientContext | null) ?? {}),
      ...Object.fromEntries(
        Object.entries(liveContext ?? {}).filter(([, v]) => v !== undefined),
      ),
    };

    // De-duplicated against the browser pixel on /thank-you via event_id.
    await sendMetaPurchaseEvent({
      eventId: razorpayPaymentId,
      value: order.amount,
      currency: "INR",
      email: order.customer?.email,
      phone: order.customer?.phone,
      name: order.customer?.name,
      city: order.customer?.city,
      state: order.customer?.state,
      pincode: order.customer?.pincode,
      contentIds: (order.items as { id: string }[]).map((i) => i.id),
      sourceUrl: ctx.sourceUrl || `${site.url}/checkout`,
      clientIp: ctx.clientIp,
      userAgent: ctx.userAgent,
      fbp: ctx.fbp,
      fbc: ctx.fbc,
    });

    // The SQL function clamps at 0 and ignores products that don't track stock.
    const { error: stockErr } = await supabase().rpc("decrement_stock", {
      p_items: order.items,
    });
    if (stockErr) {
      console.error("[post-payment] stock decrement failed:", stockErr);
    }

    let reviewUrl: string | undefined;
    try {
      // Reviews are keyed by mukhi. Combinations carry it per bead in `beads[]`;
      // the slug regex is a fallback for items whose product row is gone.
      const itemIds = (order.items as { id: string }[]).map((i) => i.id);
      const { data: productRows } = await supabase()
        .from("products")
        .select("id, data")
        .in("id", itemIds);

      const mukhiList: number[] = [];
      const resolvedIds = new Set<string>();
      for (const row of productRows ?? []) {
        const p = row.data as {
          mukhi?: number | null;
          beads?: { mukhi?: number }[];
        };
        resolvedIds.add(row.id as string);
        if (typeof p.mukhi === "number") mukhiList.push(p.mukhi);
        for (const bead of p.beads ?? []) {
          if (typeof bead.mukhi === "number") mukhiList.push(bead.mukhi);
        }
      }
      for (const id of itemIds) {
        if (resolvedIds.has(id)) continue;
        const m = id.match(/^(\d+)-mukhi/);
        if (m) mukhiList.push(parseInt(m[1], 10));
      }

      const uniqueMukhi = [...new Set(mukhiList.filter((m) => m >= 1 && m <= 21))];
      if (uniqueMukhi.length > 0) {
        const { data: tokenRow } = await supabase()
          .from("review_tokens")
          .insert({
            order_id: order.id,
            customer_name: order.customer?.name ?? null,
            customer_email: order.customer?.email ?? null,
            mukhi_list: uniqueMukhi,
          })
          .select("token")
          .single();
        if (tokenRow?.token) {
          reviewUrl = `${site.url}/reviews/${tokenRow.token}`;
        }
      }
    } catch (e) {
      console.error("[post-payment] review token generation failed:", e);
    }

    await Promise.allSettled([
      sendOrderConfirmationEmail(order, reviewUrl),
      sendOrderConfirmationWhatsApp(order),
    ]);

    if (!isShiprocketConfigured()) return;

    try {
      const result = await createShiprocketOrder(order);
      await supabase()
        .from("orders")
        .update({
          shiprocket_order_id: result.shiprocket_order_id,
          shiprocket_shipment_id: result.shipment_id,
          fulfillment_status: "synced",
        })
        .eq("id", order.id);
    } catch (syncErr) {
      // Must not die silently: admin gets a Retry sync button and an alert.
      console.error(`[post-payment] Shiprocket sync failed for ${order.id}:`, syncErr);
      await supabase()
        .from("orders")
        .update({ fulfillment_status: "failed" })
        .eq("id", order.id);
      await sendOpsAlertEmail("Shiprocket sync failed for a paid order", [
        `Order <strong>${escapeHtml(razorpayOrderId)}</strong> (payment ${escapeHtml(razorpayPaymentId)}) is paid but did not sync to Shiprocket.`,
        `Customer: ${escapeHtml(order.customer?.name ?? "—")} · ${escapeHtml(order.customer?.phone ?? "—")}`,
        `Use the <strong>Retry sync</strong> button in /admin/orders, or create the order in Shiprocket manually.`,
        `Error: ${escapeHtml(syncErr instanceof Error ? syncErr.message : String(syncErr))}`,
      ]);
    }
  } catch (err) {
    console.error("[post-payment] background sync failed:", err);
  }
}
