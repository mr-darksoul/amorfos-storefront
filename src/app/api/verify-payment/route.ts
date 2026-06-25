import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

/**
 * Verifies a Razorpay payment signature after the modal succeeds.
 * Razorpay signs `${order_id}|${payment_id}` with your key secret;
 * we recompute the HMAC and compare. This is what proves the payment
 * is genuine before we treat the order as paid.
 */
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
    crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(razorpay_signature),
    );

  if (!verified) {
    return NextResponse.json({ verified: false }, { status: 400 });
  }

  // In production you'd persist the order + mark it paid here.
  return NextResponse.json({ verified: true, paymentId: razorpay_payment_id });
}
