"use client";

/**
 * Client-side analytics dispatch for GA4, Google Ads and the Meta Pixel.
 *
 * Every function here is a safe no-op when the corresponding tag is absent
 * (env id unset, or the script blocked by an ad-blocker), so call sites never
 * need to guard. The browser pixel fires alongside the server-side Meta
 * Conversions API (see `lib/metaCapi.ts`); the two are de-duplicated by Meta
 * using a shared `eventID` — for purchases that id is the Razorpay payment id.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { queue?: unknown[] };
  }
}

export const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;
export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;
export const GOOGLE_ADS_PURCHASE_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL;
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

const CURRENCY = "INR";

export interface TrackedItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  category?: string;
}

function gtag(...args: unknown[]): void {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

function fbq(...args: unknown[]): void {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
}

const gaItems = (items: TrackedItem[]) =>
  items.map((i) => ({
    item_id: i.id,
    item_name: i.name,
    item_category: i.category,
    price: i.price,
    quantity: i.qty,
  }));

const fbContents = (items: TrackedItem[]) =>
  items.map((i) => ({ id: i.id, quantity: i.qty, item_price: i.price }));

/** A single product detail view. */
export function trackViewContent(item: TrackedItem): void {
  gtag("event", "view_item", {
    currency: CURRENCY,
    value: item.price,
    items: gaItems([item]),
  });
  fbq("track", "ViewContent", {
    content_type: "product",
    content_ids: [item.id],
    content_name: item.name,
    content_category: item.category,
    currency: CURRENCY,
    value: item.price,
  });
}

export function trackAddToCart(item: TrackedItem): void {
  const value = item.price * item.qty;
  gtag("event", "add_to_cart", {
    currency: CURRENCY,
    value,
    items: gaItems([item]),
  });
  fbq("track", "AddToCart", {
    content_type: "product",
    content_ids: [item.id],
    content_name: item.name,
    contents: fbContents([item]),
    currency: CURRENCY,
    value,
  });
}

export function trackInitiateCheckout(items: TrackedItem[], value: number): void {
  gtag("event", "begin_checkout", {
    currency: CURRENCY,
    value,
    items: gaItems(items),
  });
  fbq("track", "InitiateCheckout", {
    content_type: "product",
    content_ids: items.map((i) => i.id),
    contents: fbContents(items),
    num_items: items.reduce((n, i) => n + i.qty, 0),
    currency: CURRENCY,
    value,
  });
}

/**
 * A completed purchase. `eventId` (the Razorpay payment id) is sent as the
 * Meta `eventID` and the GA4/Ads `transaction_id` so the server-side CAPI
 * event and the Google Ads conversion are de-duplicated.
 */
export function trackPurchase(opts: {
  eventId: string;
  value: number;
  items: TrackedItem[];
}): void {
  const { eventId, value, items } = opts;

  gtag("event", "purchase", {
    transaction_id: eventId,
    currency: CURRENCY,
    value,
    items: gaItems(items),
  });

  if (GOOGLE_ADS_ID && GOOGLE_ADS_PURCHASE_LABEL) {
    gtag("event", "conversion", {
      send_to: `${GOOGLE_ADS_ID}/${GOOGLE_ADS_PURCHASE_LABEL}`,
      transaction_id: eventId,
      currency: CURRENCY,
      value,
    });
  }

  fbq(
    "track",
    "Purchase",
    {
      content_type: "product",
      content_ids: items.map((i) => i.id),
      contents: fbContents(items),
      currency: CURRENCY,
      value,
    },
    { eventID: eventId },
  );
}

/** Fire when a visitor joins the list (modal or footer). */
export function trackLead(source: string): void {
  gtag("event", "generate_lead", { method: source });
  fbq("track", "Lead", { content_name: source });
}
