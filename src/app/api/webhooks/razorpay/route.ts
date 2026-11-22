import { NextResponse, after } from "next/server";
import crypto from "crypto";
import { isSupabaseConfigured } from "@/lib/supabase";
import { markOrderPaid, runPostPaymentWork } from "@/lib/paidOrder";

export const runtime = "nodejs";

interface RazorpayWebhook {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string } };
    order?: { entity?: { id?: string } };
  };
}

/**
 * Server-to-server payment confirmation from Razorpay. Completes paid orders
 * even when the shopper's browser never calls verify-payment (tab closed or
 * reloaded after paying in a UPI app). Subscribe to `order.paid` and
 * `payment.captured`; both are idempotent with the browser path.
 *
 * Non-2xx responses make Razorpay retry, so return 200 for anything we
 * deliberately ignore and 500 only when a retry could help.
 */
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  // Signature is computed over the exact raw body.
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  let event: RazorpayWebhook;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (event.event !== "order.paid" && event.event !== "payment.captured") {
    return NextResponse.json({ ok: true, ignored: event.event ?? null });
  }

  const payment = event.payload?.payment?.entity;
  const orderId = event.payload?.order?.entity?.id ?? payment?.order_id;
  const paymentId = payment?.id;
  if (!orderId || !paymentId) {
    return NextResponse.json({ ok: true, ignored: "no order/payment id" });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, ignored: "no database" });
  }

  try {
    const result = await markOrderPaid(orderId, paymentId);
    if (result === "transitioned") {
      console.info(`[razorpay-webhook] ${event.event}: completed order ${orderId}`);
      after(() => runPostPaymentWork(orderId, paymentId));
    }
    return NextResponse.json({ ok: true, result });
  } catch (err) {
    console.error("[razorpay-webhook] could not mark order paid:", err);
    return NextResponse.json({ error: "Temporary failure." }, { status: 500 });
  }
}
