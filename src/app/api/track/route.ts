import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isShiprocketConfigured, trackShipment } from "@/lib/shiprocket";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const awbParam = searchParams.get("awb");
  const phone = searchParams.get("phone");
  const orderId = searchParams.get("orderId");

  if (!isShiprocketConfigured()) {
    return NextResponse.json({ error: "Tracking not available." }, { status: 503 });
  }

  let awb = awbParam;

  // Resolve AWB from phone or orderId via Supabase
  if (!awb && isSupabaseConfigured()) {
    let query = supabase().from("orders").select("shiprocket_awb");

    if (phone) {
      // Supabase jsonb customer->>'phone' lookup
      query = query.filter("customer->>phone", "eq", phone.replace(/\D/g, "").slice(-10));
    } else if (orderId) {
      query = query.eq("razorpay_order_id", orderId);
    } else {
      return NextResponse.json(
        { error: "Provide awb, phone, or orderId." },
        { status: 400 },
      );
    }

    const { data } = await query.order("created_at", { ascending: false }).limit(1).single();
    awb = data?.shiprocket_awb ?? null;
  }

  if (!awb) {
    return NextResponse.json(
      { error: "No tracking information yet. Please check back after your order ships." },
      { status: 404 },
    );
  }

  try {
    const result = await trackShipment(awb);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[track] Shiprocket error:", err);
    return NextResponse.json(
      { error: "Could not fetch tracking details. Please try again later." },
      { status: 502 },
    );
  }
}
