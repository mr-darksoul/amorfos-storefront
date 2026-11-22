import { NextResponse, after } from "next/server";
import crypto from "crypto";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  clientContextFromRequest,
  markOrderPaid,
  runPostPaymentWork,
} from "@/lib/paidOrder";

export const runtime = "nodejs";

/**
 * Browser-side confirmation from the Razorpay checkout handler. The Razorpay
 * webhook (`api/webhooks/razorpay`) covers the case where this call never
 * arrives — e.g. the tab is closed or reloaded after paying in a UPI app.
 */
export async function POST(req: Request) {
  // The request object isn't available inside after().
  const clientContext = clientContextFromRequest(req);
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
        // Only a still-pending order may be flipped to failed, so a junk
        // signature can never un-pay an order.
        .eq("razorpay_order_id", razorpay_order_id)
        .eq("status", "pending");
    }
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  if (isSupabaseConfigured()) {
    try {
      const result = await markOrderPaid(razorpay_order_id, razorpay_payment_id);
      // Only the caller that flips the order to paid runs fulfilment, so a
      // replayed call or the webhook arriving first never duplicates it.
      if (result === "transitioned") {
        after(() => runPostPaymentWork(razorpay_order_id, razorpay_payment_id, clientContext));
      }
    } catch (err) {
      // The payment is genuine; the Razorpay webhook will retry the update.
      console.error("[verify-payment] could not mark order paid:", err);
    }
  }

  return NextResponse.json({ verified: true, paymentId: razorpay_payment_id });
}
