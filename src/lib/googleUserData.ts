import crypto from "crypto";

/**
 * Google Ads enhanced conversions — customer data for the purchase conversion.
 *
 * Built on the server and SHA-256 hashed here, so the raw email and phone never
 * reach the thank-you page's HTML (anyone holding the payment id can open that
 * page). The browser passes the hashes to `gtag('set', 'user_data', …)` just
 * before the conversion fires (see `trackPurchase` in `lib/analytics.ts`).
 * Normalisation follows Google's rules for pre-hashed data.
 */

export interface GoogleUserData {
  sha256_email_address?: string;
  sha256_phone_number?: string;
}

const sha256 = (v: string) => crypto.createHash("sha256").update(v).digest("hex");

/** Trim + lowercase; Gmail addresses also drop dots in the local part. */
function normaliseEmail(email: string): string | undefined {
  const v = email.trim().toLowerCase();
  const at = v.lastIndexOf("@");
  if (at < 1) return undefined;
  let local = v.slice(0, at);
  const domain = v.slice(at + 1);
  if (domain === "gmail.com" || domain === "googlemail.com") {
    local = local.replace(/\./g, "");
  }
  return `${local}@${domain}`;
}

/** E.164 (+<country><number>); a bare 10-digit number is taken as Indian. */
function normalisePhone(phone: string): string | undefined {
  let digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length === 10) digits = `91${digits}`;
  return digits.length >= 11 ? `+${digits}` : undefined;
}

export function googleUserData(
  customer?: { email?: string | null; phone?: string | null } | null,
): GoogleUserData | undefined {
  const email = customer?.email ? normaliseEmail(customer.email) : undefined;
  const phone = customer?.phone ? normalisePhone(customer.phone) : undefined;
  if (!email && !phone) return undefined;
  return {
    ...(email && { sha256_email_address: sha256(email) }),
    ...(phone && { sha256_phone_number: sha256(phone) }),
  };
}
