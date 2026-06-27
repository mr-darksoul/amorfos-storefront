import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Shipping, Returns & Authenticity",
  description:
    "Amorfos shipping, 7-day returns on unused sealed products, and how we Lab Certify every Rudraksha.",
  alternates: { canonical: "/policies" },
};

const sections = [
  {
    id: "shipping",
    title: "Shipping",
    body: [
      `Free shipping on all orders above ₹${site.freeShippingThreshold}. A flat ₹79 applies below that.`,
      "Orders are dispatched within 1–2 business days from Delhi and typically arrive in 3–6 business days, depending on your location.",
      "You'll receive tracking as soon as your order ships. For anything urgent, message us on WhatsApp.",
    ],
  },
  {
    id: "returns",
    title: "7-Day Returns",
    body: [
      "We accept returns within 7 days of delivery on unused products in their original, sealed packaging.",
      "Because each bead is a consecrated, personal item, products that have been worn, used in puja, or whose seal is broken cannot be returned for hygiene and authenticity reasons.",
      "To start a return, message us on WhatsApp with your order details. Refunds are issued to the original payment method once we receive and inspect the item.",
    ],
  },
  {
    id: "authenticity",
    title: "Lab Certification & Authenticity",
    body: [
      "Every Amorfos Rudraksha is Lab Certified. The certificate accompanies your order and documents the bead's mukhi and origin.",
      "Beads are hand-selected from Nepal and Indonesia, then sealed before dispatch so you receive exactly what was certified.",
      "Rudraksha is worn on the basis of recommendations from astrologers and pandits. We make no medical or miraculous claims about any product.",
    ],
  },
];

export default function PoliciesPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8 md:py-24">
      <p className="eyebrow mb-3">The fine print, kept honest</p>
      <h1 className="display text-4xl sm:text-5xl">Shipping, returns & care</h1>

      <div className="mt-12 space-y-14">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-28">
            <h2 className="font-serif text-2xl text-gold-soft">{s.title}</h2>
            <div className="mt-4 space-y-4">
              {s.body.map((p, i) => (
                <p key={i} className="leading-relaxed text-ink-dim">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
