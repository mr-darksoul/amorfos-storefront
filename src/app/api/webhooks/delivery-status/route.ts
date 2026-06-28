import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { sendShippingUpdateEmail, sendShippingUpdateWhatsApp } from "@/lib/notify";

export const runtime = "nodejs";

// Map Shiprocket status strings to our fulfillment_status values
function mapStatus(srStatus: string): string {
  const s = srStatus.toLowerCase();
  if (s.includes("picked up") || s.includes("pickup")) return "processing";
  if (s.includes("out for delivery")) return "out_for_delivery";
  if (s.includes("delivered")) return "delivered";
  if (s.includes("in transit") || s.includes("transit")) return "shipped";
  if (s.includes("shipped")) return "shipped";
  return "shipped";
}

export async function POST(req: Request) {
  // Auth is mandatory. If the token is unset, every caller is rejected — this
  // endpoint mutates order state, so it must never be left publicly writable by
  // a missing env var. (SHIPROCKET_WEBHOOK_TOKEN is set in production.)
  const webhookToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  // Shiprocket sends the configured token in the x-api-key header.
  // Accept a few header variants for robustness.
  const provided =
    req.headers.get("x-api-key") ||
    req.headers.get("x-shiprocket-signature") ||
    req.headers.get("authorization");
  const ok =
    !!webhookToken &&
    (provided === webhookToken || provided === `Bearer ${webhookToken}`);
  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  //  - never move a delivered order backwards, and
  //  - skip when the status is unchanged (avoids duplicate notifications).
  if (
    order.fulfillment_status === "delivered" ||
    order.fulfillment_status === fulfillmentStatus
  ) {
    return NextResponse.json({ ok: true });
  }

  await supabase()
    .from("orders")
    .update({ fulfillment_status: fulfillmentStatus })
    .eq("id", order.id);

  // Notify customer — fire-and-forget, errors logged only
  void Promise.allSettled([
    sendShippingUpdateEmail(order, currentStatus, awb),
    sendShippingUpdateWhatsApp(order, currentStatus, awb),
  ]).then((results) => {
    for (const r of results) {
      if (r.status === "rejected") {
        console.error("[webhook] notification error:", r.reason);
      }
    }
  });

  return NextResponse.json({ ok: true });
}
