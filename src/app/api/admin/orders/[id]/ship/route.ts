import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  assignAWB,
  generateLabel,
  isShiprocketConfigured,
  requestPickup,
} from "@/lib/shiprocket";

export const runtime = "nodejs";

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
  if (!order.shiprocket_shipment_id) {
    return NextResponse.json(
      { error: "Order not yet synced to Shiprocket. Wait a moment and retry." },
      { status: 400 },
    );
  }
  if (order.shiprocket_awb) {
    return NextResponse.json(
      { awb: order.shiprocket_awb, labelUrl: order.shiprocket_label_url },
    );
  }

  try {
    const shipmentId = order.shiprocket_shipment_id as string;

    const awb = await assignAWB(shipmentId);
    await requestPickup(shipmentId);
    const labelUrl = await generateLabel(shipmentId);

    await supabase()
      .from("orders")
      .update({
        shiprocket_awb: awb,
        shiprocket_label_url: labelUrl,
        fulfillment_status: "processing",
      })
      .eq("id", id);

    return NextResponse.json({ awb, labelUrl });
  } catch (err) {
    console.error("[ship] Shiprocket error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Shiprocket request failed." },
      { status: 502 },
    );
  }
}
