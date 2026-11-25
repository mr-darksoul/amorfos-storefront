import { NextResponse, after } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { sendShippingUpdateEmail, sendShippingUpdateWhatsApp } from "@/lib/notify";

export const runtime = "nodejs";

// Terminal states: once reached, later webhook events never move the order.
const TERMINAL = new Set(["delivered", "returned", "cancelled"]);

// Map Shiprocket status strings to our fulfillment_status values.
// Order matters: "UNDELIVERED" and "RTO DELIVERED" both contain "delivered",
// so the failure/return checks must run before the plain "delivered" match.
function mapStatus(srStatus: string): string {
  const s = srStatus.toLowerCase();
  if (s.includes("rto") || s.includes("return")) return "returned";
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("undelivered") || s.includes("lost") || s.includes("damaged")) return "delivery_issue";
  if (s.includes("out for delivery")) return "out_for_delivery";
  if (s.includes("delivered")) return "delivered";
  if (s.includes("picked up") || s.includes("pickup")) return "processing";
  return "shipped";
}

// Statuses the customer should hear about. Internal states (returned,
// cancelled, delivery_issue) are for the admin, not an automatic message.
const NOTIFY = new Set(["processing", "shipped", "out_for_delivery", "delivered"]);

export async function POST(req: Request) {
  // Auth is mandatory. If the token is unset, every caller is rejected — this
  // endpoint mutates order state, so it must never be left publicly writable by
  // a missing env var. (SHIPROCKET_WEBHOOK_TOKEN is set in production.)
  const webhookToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  // Shiprocket sends the configured token in the x-api-key header.
  // Accept a few header variants for robustness; the log below records which
  // one actually arrives so the unused fallbacks can eventually be removed.
  const headerUsed = ["x-api-key", "x-shiprocket-signature", "authorization"].find((h) =>
    req.headers.get(h),
  );
  const provided = headerUsed ? req.headers.get(headerUsed) : null;
  const ok =
    !!webhookToken &&
    (provided === webhookToken || provided === `Bearer ${webhookToken}`);
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (headerUsed !== "x-api-key") {
    console.warn(`[delivery-status] webhook authenticated via fallback header: ${headerUsed}`);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const awb = String(payload.awb || payload.AWB || "");
  const currentStatus = String(payload.current_status || payload.status || "");

  if (!awb) {
    return NextResponse.json({ ok: true }); // silently accept unknown payloads
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true });
  }

  const { data: order } = await supabase()
    .from("orders")
    .select("*")
    .eq("shiprocket_awb", awb)
    .single();

  if (!order) {
    return NextResponse.json({ ok: true }); // not our order
  }

  const fulfillmentStatus = mapStatus(currentStatus);

  // No-regression / idempotency guard. Shiprocket can deliver events out of
  // order or repeat them, so:
  //  - never move an order out of a terminal state (delivered/returned/cancelled), and
  //  - skip when the status is unchanged (avoids duplicate notifications).
  if (
    TERMINAL.has(order.fulfillment_status) ||
    order.fulfillment_status === fulfillmentStatus
  ) {
    return NextResponse.json({ ok: true });
  }

  await supabase()
    .from("orders")
    .update({ fulfillment_status: fulfillmentStatus })
    .eq("id", order.id);

  if (!NOTIFY.has(fulfillmentStatus)) {
    console.warn(`[delivery-status] order ${order.id} → ${fulfillmentStatus} (${currentStatus})`);
  }

  // Notify the customer after the response. Must use after(): a bare
  // fire-and-forget promise is killed by Vercel once the response flushes.
  if (NOTIFY.has(fulfillmentStatus)) {
    after(async () => {
      const results = await Promise.allSettled([
        sendShippingUpdateEmail(order, currentStatus, awb),
        sendShippingUpdateWhatsApp(order, currentStatus, awb),
      ]);
      for (const r of results) {
        if (r.status === "rejected") {
          console.error("[delivery-status] notification error:", r.reason);
        }
      }
    });
  }

  return NextResponse.json({ ok: true });
}
