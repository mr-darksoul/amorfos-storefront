import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { createShiprocketOrder, isShiprocketConfigured } from "@/lib/shiprocket";

export const runtime = "nodejs";

// Re-runs the Shiprocket order creation that normally happens in the
// verify-payment after() block — for paid orders whose automatic sync failed
// (fulfillment_status 'failed', or stuck 'unfulfilled'). Auth is handled
// entirely by middleware.ts, like every /api/admin route.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }
  if (!isShiprocketConfigured()) {
    return NextResponse.json({ error: "Shiprocket not configured." }, { status: 503 });
  }

  const { data: order, error } = await supabase()
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  if (order.status !== "paid") {
    return NextResponse.json({ error: "Order is not paid." }, { status: 400 });
  }
  if (order.shiprocket_shipment_id) {
    return NextResponse.json(
      { error: "Order is already synced to Shiprocket." },
      { status: 400 },
    );
  }

  try {
    const result = await createShiprocketOrder(order);
    await supabase()
      .from("orders")
      .update({
        shiprocket_order_id: result.shiprocket_order_id,
        shiprocket_shipment_id: result.shipment_id,
        fulfillment_status: "synced",
      })
      .eq("id", id);

    return NextResponse.json({
      shiprocketOrderId: result.shiprocket_order_id,
      shipmentId: result.shipment_id,
    });
  } catch (err) {
    console.error("[retry-sync] Shiprocket error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Shiprocket request failed." },
      { status: 502 },
    );
  }
}
