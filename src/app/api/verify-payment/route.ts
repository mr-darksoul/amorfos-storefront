import { NextResponse, after } from "next/server";
import crypto from "crypto";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { createShiprocketOrder, isShiprocketConfigured } from "@/lib/shiprocket";
import { sendOrderConfirmationEmail, sendOrderConfirmationWhatsApp } from "@/lib/notify";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret || keySecret.includes("REPLACE_ME")) {
    return NextResponse.json(
      { verified: false, error: "Payments not configured." },
      { status: 503 },
    );
  }

  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const verified =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));

  if (!verified) {
    if (isSupabaseConfigured()) {
      await supabase()
        .from("orders")
        .update({ status: "failed" })
        // Only a still-pending order may be flipped to failed. Without this an
        // unauthenticated request carrying a real order id + junk signature
        // could mark an already-paid order failed.
        .eq("razorpay_order_id", razorpay_order_id)
        .eq("status", "pending");
    }
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    // Only a still-pending order transitions to paid. This makes the whole
    // post-payment side-effect block idempotent: a duplicate/replayed verify
    // call (Razorpay retry, double network request) updates 0 rows and skips
    // fulfillment, so we never send duplicate emails or create a second
    // Shiprocket order.
    const { data: paidRows } = await supabase()
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id,
        paid_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("status", "pending")
      .select("id");

    if (!paidRows || paidRows.length === 0) {
      // Nothing transitioned. Either the order was already paid (a harmless
      // replay — just confirm again) or there is genuinely no row, which is a
      // critical data gap (customer charged, nothing to fulfill). Distinguish
      // the two so we only alert on the real problem, and never re-run
      // fulfillment for an already-paid order.
      const { data: existing } = await supabase()
        .from("orders")
        .select("status")
        .eq("razorpay_order_id", razorpay_order_id)
        .maybeSingle();

      if (!existing) {
        console.error(
          `[verify-payment] CRITICAL: verified payment ${razorpay_payment_id} ` +
            `for order ${razorpay_order_id} matched no DB row — manual recovery needed.`,
        );
      }

      // Payment is real, so still confirm to the customer either way.
      return NextResponse.json({ verified: true, paymentId: razorpay_payment_id });
    }

    // Run after the response is sent, but keep the serverless function alive
    // until it completes (plain fire-and-forget is killed on Vercel once the
    // response flushes). Errors here must never block payment confirmation.
    after(async () => {
      try {
        const { data: order } = await supabase()
          .from("orders")
          .select("*")
          .eq("razorpay_order_id", razorpay_order_id)
          .single();

        if (!order) return;

        // Decrement inventory for stock-tracked products. The SQL function
        // clamps at 0 and ignores products that don't track stock, so this is
        // safe to call for every order. Errors are non-fatal.
        const { error: stockErr } = await supabase().rpc("decrement_stock", {
          p_items: order.items,
        });
        if (stockErr) {
          console.error("[post-payment] stock decrement failed:", stockErr);
        }

        // Generate post-purchase review token
        let reviewUrl: string | undefined;
        try {
          const mukhiList = (order.items as { id: string }[])
            .map((item) => {
              const m = item.id.match(/^(\d+)-mukhi/);
              return m ? parseInt(m[1], 10) : null;
            })
            .filter((m): m is number => m !== null && m >= 1 && m <= 21);

          const uniqueMukhi = [...new Set(mukhiList)];
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
              const { site } = await import("@/lib/site");
              reviewUrl = `${site.url}/reviews/${tokenRow.token}`;
            }
          }
        } catch (e) {
          console.error("[post-payment] review token generation failed:", e);
        }

        // Send notifications (non-blocking on Shiprocket)
        await Promise.allSettled([
          sendOrderConfirmationEmail(order, reviewUrl),
          sendOrderConfirmationWhatsApp(order),
        ]);

        if (!isShiprocketConfigured()) return;

        const result = await createShiprocketOrder(order);
        await supabase()
          .from("orders")
          .update({
            shiprocket_order_id: result.shiprocket_order_id,
            shiprocket_shipment_id: result.shipment_id,
            fulfillment_status: "synced",
          })
          .eq("id", order.id);
      } catch (err) {
        console.error("[post-payment] background sync failed:", err);
      }
    });
  }

  return NextResponse.json({ verified: true, paymentId: razorpay_payment_id });
}
