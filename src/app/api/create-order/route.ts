import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getAdminProducts } from "@/lib/adminProducts";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { site } from "@/lib/site";

export const runtime = "nodejs";

interface IncomingLine {
  id: string;
  qty: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

const SHIPPING_FLAT = 79;

export async function POST(req: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId.includes("REPLACE_ME")) {
    return NextResponse.json(
      { error: "Payments are not configured yet." },
      { status: 503 },
    );
  }

  let body: { items?: IncomingLine[]; customer?: CustomerInfo };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const lines = body.items ?? [];
  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  const customer: CustomerInfo = {
    name: body.customer?.name?.trim() || "Guest",
    phone: body.customer?.phone?.trim() || "",
    email: body.customer?.email?.trim() || "",
    address: body.customer?.address?.trim() || "",
    city: body.customer?.city?.trim() || "",
    state: body.customer?.state?.trim() || "",
    pincode: body.customer?.pincode?.trim() || "",
  };

  const products = await getAdminProducts();
  let subtotal = 0;
  const orderItems: { id: string; name: string; qty: number; price: number }[] = [];

  for (const line of lines) {
    const product = products.find((p) => p.id === line.id);
    const qty = Math.max(1, Math.min(99, Math.floor(Number(line.qty) || 0)));
    if (!product) {
      return NextResponse.json({ error: `Unknown product: ${line.id}` }, { status: 400 });
    }
    subtotal += product.price * qty;
    orderItems.push({ id: product.id, name: product.name, qty, price: product.price });
  }

  const shipping = subtotal >= site.freeShippingThreshold ? 0 : SHIPPING_FLAT;
  const amount = subtotal + shipping;

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `amf_${Date.now()}`,
      notes: {
        brand: site.name,
        customer: customer.name,
        items: orderItems.map((i) => `${i.qty}× ${i.name}`).join(", ").slice(0, 480),
      },
    });

    // Persist as a pending order if Supabase is configured
    if (isSupabaseConfigured()) {
      await supabase().from("orders").insert({
        razorpay_order_id: order.id,
        amount,
        subtotal,
        shipping,
        status: "pending",
        customer,
        items: orderItems,
      });
    }

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      subtotal,
      shipping,
      keyId,
      customer,
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 502 },
    );
  }
}
