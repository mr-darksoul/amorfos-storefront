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
