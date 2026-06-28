import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import PaymentRef from "@/components/PaymentRef";
import PurchaseTracker from "@/components/PurchaseTracker";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { TrackedItem } from "@/lib/analytics";
import { site, waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Thank you for your order",
  description: "Your Amorfos order is confirmed.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/thank-you" },
};

interface OrderItemRow {
  id: string;
  name: string;
  price: number;
  qty: number;
  category?: string;
}

/** Look up the paid order so the browser Purchase event carries a real value. */
async function getPurchase(
  paymentId: string | undefined,
): Promise<{ value: number; items: TrackedItem[] } | null> {
  if (!paymentId || !isSupabaseConfigured()) return null;
  try {
    const { data } = await supabase()
      .from("orders")
      .select("amount, items, status")
      .eq("razorpay_payment_id", paymentId)
      .maybeSingle();
    if (!data || data.status !== "paid") return null;
    const items: TrackedItem[] = ((data.items as OrderItemRow[]) ?? []).map(
      (i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        qty: i.qty,
        category: i.category,
      }),
    );
    return { value: data.amount as number, items };
  } catch {
    return null;
  }
}

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const { payment } = await searchParams;
  const purchase = await getPurchase(payment);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
      {payment && purchase && (
        <PurchaseTracker
          eventId={payment}
          value={purchase.value}
          items={purchase.items}
        />
      )}
      <div className="grid size-16 place-items-center rounded-full border border-gold text-gold">
        <CheckIcon className="size-8" />
      </div>
      <p className="eyebrow mt-8 mb-3">Order confirmed</p>
      <h1 className="display text-4xl sm:text-5xl">Thank you for your order.</h1>
      <p className="mx-auto mt-5 max-w-md leading-relaxed text-ink-dim">
        Your payment was received and your order is being prepared with care. A
        confirmation will reach you shortly, and your Lab Certificate travels with
        the bead.
      </p>

      <Suspense fallback={null}>
        <PaymentRef />
      </Suspense>

      <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
        <Link href="/shop" className="btn btn-primary">
          Continue shopping
        </Link>
        <a
          href={waLink("Hi Amorfos, I just placed an order and have a question.")}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          Message us on WhatsApp
        </a>
      </div>

      <p className="mt-10 text-xs text-ink-faint">
        {site.name} · {site.address}
      </p>
    </div>
  );
}
