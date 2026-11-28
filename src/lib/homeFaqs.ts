import { inr } from "./format";
import { site } from "./site";
import type { Product } from "./types";

/**
 * Answer-first Q&A for the homepage — the questions people put to Google and
 * AI assistants before buying Rudraksha. Shared by the homepage (visible +
 * FAQPage JSON-LD) and /llms-full.txt so both always say the same thing.
 * Prices are computed from the live catalogue.
 */
export function buildHomeFaqs(products: Product[]): { q: string; a: string }[] {
  const pendantPrices = products
    .filter((p) => p.category === "pendant" && p.price > 0)
    .map((p) => p.price);
  const fromPrice = pendantPrices.length ? Math.min(...pendantPrices) : null;
  const topPrice = pendantPrices.length ? Math.max(...pendantPrices) : null;

  return [
    {
      q: "Where can I buy original Rudraksha online in India?",
      a: `Amorfos (amorfos.in) is a Delhi house that sells only Lab Certified Rudraksha — 1 to 14 Mukhi pendants, Gauri Shankar, malas and combinations from Nepal, Indonesia and India — shipped across India with the certificate in the box. ${site.trackRecord}.`,
    },
    {
      q: "How do I know if a Rudraksha is original?",
      a: "A genuine bead's faces (mukhi) are natural lines running from top to bottom, with no carving, glue or filled holes; joined beads such as Gauri Shankar must have grown together. Because fakes can be convincing to the eye, the reliable answer is lab certification, which checks the bead's internal structure and origin. Every Amorfos bead is Lab Certified.",
    },
    {
      q: "Which Rudraksha should I wear?",
      a: "Most people begin with the 5 Mukhi, traditionally considered suitable for everyone and for daily wear. Other beads are chosen by their ruling deity and planet — for example 7 Mukhi (Mahalakshmi, Saturn) or 6 Mukhi (Kartikeya, Venus) — usually on the recommendation of an astrologer or pandit.",
    },
    {
      q: "What is the difference between Nepali and Indonesian Rudraksha?",
      a: "Both are genuine Rudraksha. Nepali beads are larger, with deeper and more defined faces, and are rarer, so they cost more. Indonesian beads are smaller, lighter and more affordable — a good choice for higher mukhi beads that are very expensive from Nepal.",
    },
    ...(fromPrice && topPrice
      ? [
          {
            q: "How much does an original Rudraksha cost?",
            a: `At Amorfos, Lab Certified Rudraksha pendants start at ${inr(fromPrice)} and go up to ${inr(topPrice)} for the rarest Nepali beads. Price depends on the mukhi, origin and bead size.`,
          },
        ]
      : []),
    {
      q: "Does Amorfos deliver across India, and can I return a bead?",
      a: `Yes. Orders ship within 1–2 days and arrive in 3–7 days anywhere in India, free above ₹${site.freeShippingThreshold}. Unused products in their original sealed packaging can be returned within 7 days.`,
    },
  ];
}
