import nodemailer from "nodemailer";
import { site, waLink } from "@/lib/site";
import type { SupabaseOrder } from "@/lib/shiprocket";

// ── Helpers ────────────────────────────────────────────────────────────────

function normalisePhone(phone: string): string {
  // Strip non-digits, remove leading 0, prefix with 91
  const digits = phone.replace(/\D/g, "").replace(/^0/, "");
  return digits.startsWith("91") ? digits : `91${digits}`;
}

function inrFormat(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// ── SMTP email (GoDaddy / any provider) ──────────────────────────────────────

let transporter: nodemailer.Transporter | null = null;

function smtpTransport(): nodemailer.Transporter | null {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  if (transporter) return transporter;

  const port = Number(process.env.SMTP_PORT || 465);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const transport = smtpTransport();
  if (!transport) {
    console.warn("[email] SMTP not configured, skipping:", subject);
    return;
  }
  const from = process.env.SMTP_FROM || `${site.name} <${site.email}>`;
  await transport.sendMail({ from, to, subject, html });
}

function orderItemsHtml(order: SupabaseOrder): string {
  return order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:6px 0;color:#5c4a2a;font-size:13px;">${item.qty}× ${item.name}</td>
          <td style="padding:6px 0;color:#5c4a2a;font-size:13px;text-align:right;">${inrFormat(item.price * item.qty)}</td>
        </tr>`,
    )
    .join("");
}

function baseEmailHtml(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f6f1e7;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e7;padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;background:#efe7d5;border-radius:4px;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:#221b12;padding:28px 36px;">
          <p style="margin:0;color:#f6f1e7;font-family:'Georgia',serif;font-size:22px;letter-spacing:0.12em;">${site.name}</p>
          <p style="margin:4px 0 0;color:#97712f;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Authentic Rudraksha</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:36px;">
          <h1 style="margin:0 0 20px;color:#221b12;font-family:'Georgia',serif;font-size:22px;font-weight:normal;">${title}</h1>
          ${body}
          <!-- Footer -->
          <hr style="margin:28px 0;border:none;border-top:1px solid #d4c9b0;">
          <p style="margin:0;color:#8a7355;font-size:12px;line-height:1.6;">
            Questions? WhatsApp us at <a href="${waLink()}" style="color:#97712f;">${site.whatsappDisplay}</a>
            or email <a href="mailto:${site.email}" style="color:#97712f;">${site.email}</a>
          </p>
          <p style="margin:8px 0 0;color:#b5a48a;font-size:11px;">${site.name} · ${site.address}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendOrderConfirmationEmail(order: SupabaseOrder, reviewUrl?: string): Promise<void> {
  if (!order.customer.email) return;

  const body = `
    <p style="margin:0 0 16px;color:#5c4a2a;font-size:14px;line-height:1.7;">
      Hi ${order.customer.name?.split(" ")[0] || "there"}, your order has been received and payment confirmed.
      We'll update you once it ships.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #d4c9b0;border-bottom:1px solid #d4c9b0;margin:16px 0;">
      ${orderItemsHtml(order)}
      <tr>
        <td style="padding:8px 0 4px;color:#8a7355;font-size:12px;">Shipping</td>
        <td style="padding:8px 0 4px;color:#8a7355;font-size:12px;text-align:right;">${order.shipping === 0 ? "Free" : inrFormat(order.shipping)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0 8px;color:#221b12;font-size:15px;font-family:'Georgia',serif;">Total</td>
        <td style="padding:4px 0 8px;color:#221b12;font-size:15px;font-family:'Georgia',serif;text-align:right;">${inrFormat(order.amount)}</td>
      </tr>
    </table>
    <p style="margin:16px 0 0;color:#5c4a2a;font-size:13px;">
      You can track your order at
      <a href="${site.url}/track" style="color:#97712f;">${site.url}/track</a>
      once it ships.
    </p>
    ${reviewUrl ? `
    <div style="margin:24px 0 0;padding:20px;background:#f6f1e7;border-radius:4px;text-align:center;">
      <p style="margin:0 0 12px;color:#5c4a2a;font-size:13px;line-height:1.6;">
        Once your order arrives, we'd love to hear your thoughts.
      </p>
      <a href="${reviewUrl}" style="display:inline-block;background:#97712f;color:#f6f1e7;font-size:12px;padding:10px 24px;border-radius:2px;text-decoration:none;letter-spacing:0.1em;text-transform:uppercase;">
        Leave a Review
      </a>
    </div>` : ""}`;

  await sendEmail(
    order.customer.email,
    `Your ${site.name} order is confirmed`,
    baseEmailHtml("Order confirmed", body),
  );
}

export async function sendShippingUpdateEmail(
  order: SupabaseOrder,
  status: string,
  awb: string,
): Promise<void> {
  if (!order.customer.email) return;

  const isDelivered = status.toLowerCase().includes("deliver");
  const subject = isDelivered
    ? `Your ${site.name} order has been delivered`
    : `Your ${site.name} order is on its way`;

  const trackUrl = `${site.url}/track?awb=${awb}`;

  const body = `
    <p style="margin:0 0 16px;color:#5c4a2a;font-size:14px;line-height:1.7;">
      Hi ${order.customer.name?.split(" ")[0] || "there"} — ${
        isDelivered
          ? "your order has been delivered. We hope you love your Rudraksha."
          : `your order is now <strong style="color:#221b12;">${status}</strong>.`
      }
    </p>
    <p style="margin:0 0 20px;">
      <a href="${trackUrl}" style="display:inline-block;background:#97712f;color:#f6f1e7;font-size:13px;padding:10px 24px;border-radius:2px;text-decoration:none;letter-spacing:0.08em;">
        Track your order
      </a>
    </p>
    <p style="margin:0;color:#8a7355;font-size:12px;">AWB: ${awb}</p>`;

  await sendEmail(
    order.customer.email,
    subject,
    baseEmailHtml(isDelivered ? "Delivered" : "Order shipped", body),
  );
}

// ── WhatsApp Cloud API ─────────────────────────────────────────────────────

function isWhatsAppConfigured(): boolean {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export async function sendWhatsApp(
  phone: string,
  templateName: string,
  components: unknown[] = [],
): Promise<void> {
  if (!isWhatsAppConfigured()) return;

  const to = normalisePhone(phone);
  const url = `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en" },
        components,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[whatsapp] send failed (${res.status}): ${body}`);
  }
}

export async function sendOrderConfirmationWhatsApp(order: SupabaseOrder): Promise<void> {
  if (!order.customer.phone || !process.env.WHATSAPP_ORDER_TEMPLATE_NAME) return;

  // Template parameters depend on your approved Meta template.
  // Example: template body "Hi {{1}}, your order of ₹{{2}} is confirmed. Track at {{3}}"
  await sendWhatsApp(order.customer.phone, process.env.WHATSAPP_ORDER_TEMPLATE_NAME, [
    {
      type: "body",
      parameters: [
        { type: "text", text: order.customer.name?.split(" ")[0] || "there" },
        { type: "text", text: inrFormat(order.amount) },
        { type: "text", text: `${site.url}/track` },
      ],
    },
  ]);
}

export async function sendShippingUpdateWhatsApp(
  order: SupabaseOrder,
  status: string,
  awb: string,
): Promise<void> {
  if (!order.customer.phone || !process.env.WHATSAPP_SHIPPING_TEMPLATE_NAME) return;

  // Example: template body "Hi {{1}}, your order is now {{2}}. Track: {{3}}"
  await sendWhatsApp(order.customer.phone, process.env.WHATSAPP_SHIPPING_TEMPLATE_NAME, [
    {
      type: "body",
      parameters: [
        { type: "text", text: order.customer.name?.split(" ")[0] || "there" },
        { type: "text", text: status },
        { type: "text", text: `${site.url}/track?awb=${awb}` },
      ],
    },
  ]);
}

// ── Abandoned-cart recovery ─────────────────────────────────────────────────

/** A short, human summary of the cart for a recovery message. */
function cartSummary(order: SupabaseOrder): string {
  const items = order.items ?? [];
  if (items.length === 0) return "your selection";
  const first = `${items[0].qty}× ${items[0].name}`;
  return items.length === 1 ? first : `${first} +${items.length - 1} more`;
}

/** Deep-link the customer back to the bead they were buying. */
function recoveryLink(order: SupabaseOrder): string {
  const firstId = order.items?.[0]?.id;
  return firstId ? `${site.url}/shop/${firstId}` : `${site.url}/shop`;
}

export async function sendAbandonedCartWhatsApp(order: SupabaseOrder): Promise<void> {
  if (!order.customer.phone || !process.env.WHATSAPP_ABANDONED_TEMPLATE_NAME) return;

  // Example approved template body:
  //   "Hi {{1}}, your {{2}} is still reserved at Amorfos. Complete your order
  //    here: {{3}}. Questions? Just reply to this message."
  await sendWhatsApp(order.customer.phone, process.env.WHATSAPP_ABANDONED_TEMPLATE_NAME, [
    {
      type: "body",
      parameters: [
        { type: "text", text: order.customer.name?.split(" ")[0] || "there" },
        { type: "text", text: cartSummary(order) },
        { type: "text", text: recoveryLink(order) },
      ],
    },
  ]);
}

export async function sendAbandonedCartEmail(order: SupabaseOrder): Promise<void> {
  if (!order.customer.email) return;

  const link = recoveryLink(order);
  const body = `
    <p style="margin:0 0 16px;color:#5c4a2a;font-size:14px;line-height:1.7;">
      Hi ${order.customer.name?.split(" ")[0] || "there"}, you left something with us —
      and it&rsquo;s still here, certified and ready.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #d4c9b0;border-bottom:1px solid #d4c9b0;margin:16px 0;">
      ${orderItemsHtml(order)}
    </table>
    <p style="margin:16px 0 20px;">
      <a href="${link}" style="display:inline-block;background:#97712f;color:#f6f1e7;font-size:13px;padding:11px 26px;border-radius:2px;text-decoration:none;letter-spacing:0.08em;">
        Complete your order
      </a>
    </p>
    <p style="margin:0;color:#8a7355;font-size:12px;line-height:1.6;">
      Every Amorfos bead is Lab Certified and sent sealed. If you have a question
      before you decide, just reply or message us on WhatsApp — a real person answers.
    </p>`;

  await sendEmail(
    order.customer.email,
    `Your ${site.name} selection is still here`,
    baseEmailHtml("Still here for you", body),
  );
}
