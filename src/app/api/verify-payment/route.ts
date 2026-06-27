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
    const { data: paidRows } = await supabase()
      .from("orders")
      .update({
        status: "paid",
        razorpay_payment_id,
        paid_at: new Date().toISOString(),
      })
      .eq("razorpay_order_id", razorpay_order_id)
      .select("id");

    // A verified payment with no matching order row is a critical data gap:
    // the customer was charged but we have nothing to fulfill. We can't
    // reconstruct the order here (no items/customer), so log loudly for manual
    // recovery — but still confirm to the customer, since the payment is real.
    if (!paidRows || paidRows.length === 0) {
      console.error(
        `[verify-payment] CRITICAL: verified payment ${razorpay_payment_id} ` +
          `for order ${razorpay_order_id} matched no DB row — manual recovery needed.`,
      );
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

        // Send notifications (non-blocking on Shiprocket)
        await Promise.allSettled([
          sendOrderConfirmationEmail(order),
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
