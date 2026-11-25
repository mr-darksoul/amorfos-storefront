/** Format a number of rupees as ₹1,499 (no paise). */
export function inr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Percentage off, rounded — e.g. discountPct(449, 899) => 50 */
export function discountPct(price: number, mrp: number): number {
  if (mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

const ORIGIN_ADJ: Record<string, string> = {
  Nepal: "Nepali",
  Indonesia: "Indonesian",
  India: "Indian",
};

/**
 * Clean, shopper-facing product title. Stored names are long Amazon-era
 * keyword strings ("Amorfos® Certified 6 Mukhi Nepali Rudraksha Pendant,
 * Nepal (Brown)"); those stay as-is for the meta title, feed, orders and
 * invoices (SEO + records). On the page we show e.g. "6 Mukhi Nepali
 * Rudraksha Pendant". Single-mukhi pendants and malas are rebuilt from
 * structured fields; everything else gets the boilerplate stripped.
 */
export function displayName(p: {
  name: string;
  category: string;
  mukhi: number | null;
  origin: string;
}): string {
  const adj = ORIGIN_ADJ[p.origin];
  if (p.mukhi && adj && (p.category === "pendant" || p.category === "loose")) {
    const kind = p.category === "pendant" ? "Pendant" : "Bead";
    return `${p.mukhi} Mukhi ${adj} Rudraksha ${kind}`;
  }
  if (p.mukhi && p.category === "mala") {
    return `${p.mukhi} Mukhi Rudraksha Mala`;
  }
  return p.name
    .replace(/Amorfos®?/gi, "")
    .replace(/\b(Lab\s+)?Certified\b/gi, "")
    .replace(/\bNatural\b/gi, "")
    .replace(/[(\s—-]*\bBrown\b\)?/gi, "")
    .replace(/\bRudraksh(?:a)?s?\b|\bRudrakash\b/gi, "Rudraksha")
    .replace(/,\s*(Nepal|Indonesia|India)\b/g, "")
    .replace(/\s*,\s*(?=,|$)/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s,—-]+|[\s,—-]+$/g, "")
    .trim();
}
