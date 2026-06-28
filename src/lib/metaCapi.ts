import crypto from "crypto";

/**
 * Meta Conversions API (server-side) — the authoritative Purchase signal.
 *
 * The browser pixel can be blocked, throttled or lost on redirect; firing the
 * same purchase server-side from `verify-payment` (where we *know* the payment
 * succeeded) makes conversion tracking reliable. Meta de-duplicates the browser
 * pixel event and this one using a shared `event_id` — for purchases that is the
 * Razorpay payment id, sent here and as `eventID` on the client (see
 * `lib/analytics.ts`).
 *
 * No-ops when META_PIXEL_ID / META_CAPI_TOKEN are unset. All PII is SHA-256
 * hashed as required by Meta.
 */

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

/** Meta requires user data normalised (trimmed, lowercased) then hashed. */
function hashEmail(email?: string): string | undefined {
  if (!email) return undefined;
  const v = email.trim().toLowerCase();
  return v ? sha256(v) : undefined;
}

function hashPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  // Digits only, with country code; assume India (91) when missing.
  let digits = phone.replace(/\D/g, "").replace(/^0/, "");
  if (digits && !digits.startsWith("91")) digits = `91${digits}`;
  return digits ? sha256(digits) : undefined;
}

export interface PurchaseEvent {
  /** Razorpay payment id — the de-dup key shared with the browser pixel. */
  eventId: string;
  value: number;
  currency?: string;
  email?: string;
  phone?: string;
  contentIds?: string[];
  /** The /thank-you URL, used as event_source_url when known. */
  sourceUrl?: string;
  /** Best-effort client IP / user agent for better match quality. */
  clientIp?: string;
  userAgent?: string;
}

export function isMetaCapiConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_META_PIXEL_ID && process.env.META_CAPI_TOKEN);
}

export async function sendMetaPurchaseEvent(e: PurchaseEvent): Promise<void> {
  if (!isMetaCapiConfigured()) return;

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_CAPI_TOKEN;
  const url = `https://graph.facebook.com/v18.0/${pixelId}/events`;

  const userData: Record<string, unknown> = {};
  const em = hashEmail(e.email);
  const ph = hashPhone(e.phone);
  if (em) userData.em = [em];
  if (ph) userData.ph = [ph];
  if (e.clientIp) userData.client_ip_address = e.clientIp;
  if (e.userAgent) userData.client_user_agent = e.userAgent;

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: e.eventId,
        action_source: "website",
        ...(e.sourceUrl ? { event_source_url: e.sourceUrl } : {}),
        user_data: userData,
        custom_data: {
          currency: e.currency || "INR",
          value: e.value,
          ...(e.contentIds
            ? { content_type: "product", content_ids: e.contentIds }
            : {}),
        },
      },
    ],
    ...(process.env.META_TEST_EVENT_CODE
      ? { test_event_code: process.env.META_TEST_EVENT_CODE }
      : {}),
  };

  try {
    const res = await fetch(`${url}?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[meta-capi] purchase failed (${res.status}): ${text}`);
    }
  } catch (err) {
    console.error("[meta-capi] purchase request error:", err);
  }
}
