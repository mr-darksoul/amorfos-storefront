const BASE_URL = "https://apiv2.shiprocket.in/v1/external";

// Module-level token cache (reused across warm function invocations)
let tokenCache: { token: string; expiresAt: number } | null = null;

// ── Types ──────────────────────────────────────────────────────────────────

export interface SupabaseOrder {
  id: string;
  razorpay_order_id: string;
  amount: number;
  subtotal: number;
  shipping: number;
  customer: {
    name?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  items: { id: string; name: string; qty: number; price: number }[];
  paid_at: string | null;
  shiprocket_shipment_id?: string | null;
  shiprocket_awb?: string | null;
}

export interface TrackingEvent {
  date: string;
  activity: string;
  location: string;
}

export interface TrackingResult {
  awb: string;
  currentStatus: string;
  events: TrackingEvent[];
}

// ── Weight helpers ─────────────────────────────────────────────────────────

const WEIGHT_KG: Record<string, number> = {
  mala: 0.2,
  pendant: 0.05,
  combination: 0.15,
  loose: 0.1,
};

function inferCategory(productId: string): string {
  if (productId.includes("mala")) return "mala";
  if (productId.includes("combination") || productId.includes("combo")) return "combination";
  if (productId.includes("loose")) return "loose";
  return "pendant";
}

function totalWeightKg(items: SupabaseOrder["items"]): number {
  const weight = items.reduce((sum, item) => {
    const cat = inferCategory(item.id);
    return sum + (WEIGHT_KG[cat] ?? 0.1) * item.qty;
  }, 0);
  return Math.max(Math.round(weight * 1000) / 1000, 0.1); // min 100g, 3 decimal places
}

// ── Auth ───────────────────────────────────────────────────────────────────

export function isShiprocketConfigured(): boolean {
  return !!(process.env.SHIPROCKET_EMAIL && process.env.SHIPROCKET_PASSWORD);
}

async function getToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now) return tokenCache.token;

  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Shiprocket auth failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { token: string };
  tokenCache = { token: data.token, expiresAt: now + 23 * 60 * 60 * 1000 };
  return data.token;
}

// ── Core fetch wrapper ─────────────────────────────────────────────────────

async function sr<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers as Record<string, string>),
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Shiprocket ${path} (${res.status}): ${JSON.stringify(data)}`);
  }
  return data as T;
}

// ── Order creation ─────────────────────────────────────────────────────────

export async function createShiprocketOrder(
  order: SupabaseOrder,
): Promise<{ shiprocket_order_id: string; shipment_id: string }> {
  const { customer, items, subtotal, razorpay_order_id, paid_at } = order;
  const weight = totalWeightKg(items);
  const orderDate = (paid_at ? new Date(paid_at) : new Date())
    .toISOString()
    .replace("T", " ")
    .slice(0, 19);

  const nameParts = (customer.name || "Customer").split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || "";

  const body: Record<string, unknown> = {
    order_id: razorpay_order_id,
    order_date: orderDate,
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: customer.address || "Address not provided",
    billing_city: customer.city || "Delhi",
    billing_pincode: customer.pincode || "110085",
    billing_state: customer.state || "Delhi",
    billing_country: "India",
    billing_email: customer.email || "",
    billing_phone: customer.phone || "",
    shipping_is_billing: 1,
    order_items: items.map((item) => ({
      name: item.name,
      sku: item.id,
      units: item.qty,
      selling_price: item.price,
      discount: 0,
      tax: 0,
      hsn: 711319,
    })),
    payment_method: "Prepaid",
    sub_total: subtotal,
    length: 10,
    breadth: 10,
    height: 5,
    weight,
  };

  if (process.env.SHIPROCKET_CHANNEL_ID) {
    body.channel_id = Number(process.env.SHIPROCKET_CHANNEL_ID);
  }

  const data = await sr<{ order_id: number; shipment_id: number }>("/orders/create/adhoc", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return {
    shiprocket_order_id: String(data.order_id),
    shipment_id: String(data.shipment_id),
  };
}

// ── AWB + pickup + label ───────────────────────────────────────────────────

export async function assignAWB(shipmentId: string): Promise<string> {
  const data = await sr<Record<string, unknown>>("/courier/assign/awb", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });

  // Shiprocket returns awb_code nested in response.data
  const responseData = (data?.response as Record<string, unknown>)?.data as
    | Record<string, unknown>
    | undefined;
  const awb = responseData?.awb_code ?? data?.awb_code;

  if (!awb) {
    throw new Error(`AWB assignment returned no awb_code: ${JSON.stringify(data)}`);
  }
  return String(awb);
}

export async function requestPickup(shipmentId: string): Promise<void> {
  await sr("/courier/generate/pickup", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });
}

export async function generateLabel(shipmentId: string): Promise<string> {
  const data = await sr<Record<string, unknown>>("/courier/generate/label", {
    method: "POST",
    body: JSON.stringify({ shipment_id: [shipmentId] }),
  });

  const labelUrl =
    (data?.response as Record<string, unknown>)?.label_url ?? data?.label_url;

  if (!labelUrl) {
    throw new Error(`Label generation returned no label_url: ${JSON.stringify(data)}`);
  }
  return String(labelUrl);
}

// ── Tracking ───────────────────────────────────────────────────────────────

export async function trackShipment(awb: string): Promise<TrackingResult> {
  const data = await sr<Record<string, unknown>>(`/courier/track/awb/${awb}`);

  const trackingData = data?.tracking_data as Record<string, unknown> | undefined;
  const currentStatus =
    String(trackingData?.current_status ?? trackingData?.shipment_status_id ?? "In Transit");

  const rawActivities = (trackingData?.shipment_track_activities ?? []) as Array<
    Record<string, string>
  >;

  const events: TrackingEvent[] = rawActivities.map((ev) => ({
    date: ev.date ?? "",
    activity: ev.activity ?? ev.status ?? "",
    location: ev.location ?? "",
  }));

  return { awb, currentStatus, events };
}
