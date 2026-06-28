"use client";

import { useEffect } from "react";
import { trackPurchase, type TrackedItem } from "@/lib/analytics";

/**
 * Fires the browser-side Purchase (GA4 + Google Ads conversion + Meta Pixel)
 * on the thank-you page. The server already fired the authoritative Meta CAPI
 * Purchase in verify-payment; both carry the same `eventId` (Razorpay payment
 * id) so Meta de-duplicates. A sessionStorage guard prevents a page refresh
 * from double-counting.
 */
export default function PurchaseTracker({
  eventId,
  value,
  items,
}: {
  eventId: string;
  value: number;
  items: TrackedItem[];
}) {
  useEffect(() => {
    if (!eventId) return;
    const key = `amorfos.purchase.${eventId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      /* private mode — fall through and fire once per mount */
    }
    trackPurchase({ eventId, value, items });
  }, [eventId, value, items]);

  return null;
}
