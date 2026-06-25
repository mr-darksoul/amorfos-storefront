import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getAdminProducts } from "@/lib/adminProducts";
import { site } from "@/lib/site";

export const runtime = "nodejs";

interface IncomingLine {
  id: string;
  qty: number;
}

const SHIPPING_FLAT = 79; // ₹ below the free-shipping threshold

/**
 * Creates a Razorpay order. The amount is computed here on the server
 * from the catalogue — the client's prices are never trusted.
 */
export async function POST(req: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keyId.includes("REPLACE_ME")) {
    return NextResponse.json(
      {
        error:
          "Payments are not configured yet. Add your Razorpay keys to .env.local (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).",
      },
      { status: 503 },
    );
  }

  let body: { items?: IncomingLine[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const lines = body.items ?? [];
  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  // Recompute the subtotal from the trusted catalogue.
  const products = await getAdminProducts();
  let subtotal = 0;
  const summary: { name: string; qty: number; price: number }[] = [];
  for (const line of lines) {
    const product = products.find((p) => p.id === line.id);
    const qty = Math.max(1, Math.min(99, Math.floor(Number(line.qty) || 0)));
    if (!product) {
      return NextResponse.json(
        { error: `Unknown product: ${line.id}` },
        { status: 400 },
      );
    }
    subtotal += product.price * qty;
    summary.push({ name: product.name, qty, price: product.price });
  }

  const shipping = subtotal >= site.freeShippingThreshold ? 0 : SHIPPING_FLAT;
  const amount = subtotal + shipping; // INR

  try {
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: "INR",
      receipt: `amf_${Date.now()}`,
      notes: {
        brand: site.name,
        items: summary.map((s) => `${s.qty}× ${s.name}`).join(", ").slice(0, 480),
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      subtotal,
      shipping,
      keyId, // publishable key id for the client modal
    });
  } catch (err) {
    console.error("Razorpay order creation failed:", err);
    return NextResponse.json(
      { error: "Could not start checkout. Please try again." },
      { status: 502 },
    );
  }
}
