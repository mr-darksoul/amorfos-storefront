/**
 * Customer / shipping validation — shared by the checkout form (client) and
 * /api/create-order (server). The server is the real guard; the client copy
 * just gives instant feedback. Keeping one implementation means the two can
 * never drift.
 *
 * All fields are required: every order ships a physical product, so we need a
 * deliverable address, and email is required so order/shipping notifications
 * can reach the customer.
 */

export interface CustomerInput {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export type CustomerErrors = Partial<Record<keyof CustomerInput, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/; // Indian mobile, 10 digits
const PINCODE_RE = /^\d{6}$/;
const HAS_LETTER = /\p{L}/u;

/** Strip everything but digits — used to normalise phone before validating/storing. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function validateCustomer(input: CustomerInput): CustomerErrors {
  const errors: CustomerErrors = {};

  const name = (input.name ?? "").trim();
  const phone = digitsOnly(input.phone ?? "");
  const email = (input.email ?? "").trim();
  const address = (input.address ?? "").trim();
  const city = (input.city ?? "").trim();
  const state = (input.state ?? "").trim();
  const pincode = (input.pincode ?? "").trim();

  if (!name) errors.name = "Required";
  else if (name.length < 2 || !HAS_LETTER.test(name))
    errors.name = "Enter your full name";

  if (!phone) errors.phone = "Required";
  else if (!PHONE_RE.test(phone))
    errors.phone = "Enter a valid 10-digit mobile number";

  if (!email) errors.email = "Required";
  else if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email address";

  if (!address) errors.address = "Required";
  else if (address.length < 5) errors.address = "Enter your full address";

  if (!city) errors.city = "Required";
  else if (!HAS_LETTER.test(city)) errors.city = "Enter a valid city";

  if (!state) errors.state = "Required";
  else if (!HAS_LETTER.test(state)) errors.state = "Enter a valid state";

  if (!pincode) errors.pincode = "Required";
  else if (!PINCODE_RE.test(pincode)) errors.pincode = "Enter a 6-digit pincode";

  return errors;
}
