import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getAdminProducts } from "@/lib/adminProducts";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { site } from "@/lib/site";
import { validateCustomer, digitsOnly } from "@/lib/validateCustomer";

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

  // Validate server-side — the client checks are convenience only and can be
  // bypassed by calling this route directly. Every order ships a physical
  // product, so name, phone, email and a full address are all required.
  const fieldErrors = validateCustomer(body.customer ?? {});
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      { error: "Please check your contact and shipping details.", fields: fieldErrors },
      { status: 400 },
    );
  }

  const c = body.customer!;
  const customer: CustomerInfo = {
    name: c.name!.trim(),
    phone: digitsOnly(c.phone!),
    email: c.email!.trim(),
    address: c.address!.trim(),
    city: c.city!.trim(),
    state: c.state!.trim(),
    pincode: c.pincode!.trim(),
  };

  const products = await getAdminProducts();
  let subtotal = 0;
  const orderItems: {
    id: string;
    name: string;
    qty: number;
    price: number;
    category: string;
  }[] = [];

  for (const line of lines) {
    const product = products.find((p) => p.id === line.id);
    const qty = Math.max(1, Math.min(99, Math.floor(Number(line.qty) || 0)));
    if (!product) {
      return NextResponse.json({ error: `Unknown product: ${line.id}` }, { status: 400 });
    }
    // Inventory check (only for products that opt into stock tracking).
    if (typeof product.stock === "number" && qty > product.stock) {
      return NextResponse.json(
        {
          error:
            product.stock <= 0
              ? `${product.name} is sold out.`
              : `Only ${product.stock} left of ${product.name}.`,
        },
        { status: 409 },
      );
    }
    subtotal += product.price * qty;
    orderItems.push({
      id: product.id,
      name: product.name,
      qty,
      price: product.price,
      category: product.category,
    });
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

    // Persist as a pending order if Supabase is configured. If this fails we
    // must NOT hand the client an orderId — otherwise the customer could pay
    // into an order that has no DB row, so verify-payment would update 0 rows
    // and no confirmation / fulfillment would ever happen.
    if (isSupabaseConfigured()) {
      const { error: insertErr } = await supabase().from("orders").insert({
        razorpay_order_id: order.id,
        amount,
        subtotal,
        shipping,
        status: "pending",
        customer,
        items: orderItems,
      });
      if (insertErr) {
        console.error("Failed to persist pending order:", insertErr);
        return NextResponse.json(
          { error: "Could not start checkout. Please try again." },
          { status: 500 },
        );
      }
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
