import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import PaymentRef from "@/components/PaymentRef";
import { site, waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Thank you for your order",
  description: "Your Amorfos order is confirmed.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/thank-you" },
};

export default function ThankYouPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
      <div className="grid size-16 place-items-center rounded-full border border-gold text-gold">
        <CheckIcon className="size-8" />
      </div>
      <p className="eyebrow mt-8 mb-3">Order confirmed</p>
      <h1 className="display text-4xl sm:text-5xl">Thank you for your order.</h1>
      <p className="mx-auto mt-5 max-w-md leading-relaxed text-bone-dim">
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

      <p className="mt-10 text-xs text-bone-faint">
        {site.name} · {site.address}
      </p>
    </div>
  );
}
