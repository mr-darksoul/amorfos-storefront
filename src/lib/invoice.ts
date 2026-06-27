import { jsPDF } from "jspdf";
import { site } from "@/lib/site";
import type { Order } from "@/app/admin/orders/AdminOrdersClient";

/** Amounts for the PDF. jsPDF's built-in font can't render ₹, so use "Rs.". */
function rs(n: number): string {
  return `Rs. ${n.toLocaleString("en-IN")}`;
}

/** AMF-YYYYMMDD-XXXXXX — readable, deterministic per order. */
function invoiceNumber(order: Order): string {
  const d = new Date(order.paid_at || order.created_at);
  const ymd =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const ref = (order.razorpay_payment_id || order.id).replace(/[^a-zA-Z0-9]/g, "");
  return `AMF-${ymd}-${ref.slice(0, 6).toUpperCase()}`;
}

/** Build a branded invoice for a paid order and trigger a PDF download. */
export function downloadInvoice(order: Order): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const M = 48; // page margin
  const right = pageW - M;
  const gold: [number, number, number] = [151, 113, 47]; // --color-gold
  const ink: [number, number, number] = [34, 27, 18]; // --color-ink
  const dim: [number, number, number] = [110, 98, 80];

  const invNo = invoiceNumber(order);
  const invDate = new Date(order.paid_at || order.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // ── Header ────────────────────────────────────────────────────────
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...ink);
  doc.text(site.name, M, 64);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(20);
  doc.setTextColor(...gold);
  doc.text("INVOICE", right, 64, { align: "right" });

  // Seller block
  doc.setFontSize(9);
  doc.setTextColor(...dim);
  const seller = [site.tagline, site.address, site.email, site.whatsappDisplay];
  doc.text(seller, M, 84, { lineHeightFactor: 1.5 });

  // Invoice meta (right column)
  const meta: [string, string][] = [
    ["Invoice No.", invNo],
    ["Date", invDate],
  ];
  if (order.razorpay_payment_id) meta.push(["Payment ID", order.razorpay_payment_id]);
  let my = 84;
  doc.setFontSize(9);
  for (const [label, value] of meta) {
    doc.setTextColor(...dim);
    doc.text(label, right - 150, my, { align: "left" });
    doc.setTextColor(...ink);
    doc.text(value, right, my, { align: "right" });
    my += 14;
  }

  // Divider
  let y = Math.max(150, my + 8);
  doc.setDrawColor(...gold);
  doc.setLineWidth(1);
  doc.line(M, y, right, y);
  y += 24;

  // ── Bill To ───────────────────────────────────────────────────────
  const c = order.customer;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...gold);
  doc.text("BILL TO", M, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...ink);
  const billLines: string[] = [];
  if (c.name) billLines.push(c.name);
  if (c.phone) billLines.push(c.phone);
  if (c.email) billLines.push(c.email);
  if (c.address) billLines.push(c.address);
  const cityLine = [c.city, c.state, c.pincode].filter(Boolean).join(", ");
  if (cityLine) billLines.push(cityLine);
  doc.text(billLines.length ? billLines : ["—"], M, y, { lineHeightFactor: 1.5 });
  y += billLines.length * 15 + 20;

  // ── Items table ───────────────────────────────────────────────────
  const colQty = M;
  const colItem = M + 50;
  const colUnit = right - 170;
  const colAmt = right;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...dim);
  doc.text("QTY", colQty, y);
  doc.text("ITEM", colItem, y);
  doc.text("UNIT PRICE", colUnit, y, { align: "right" });
  doc.text("AMOUNT", colAmt, y, { align: "right" });
  y += 8;
  doc.setDrawColor(220, 210, 190);
  doc.setLineWidth(0.5);
  doc.line(M, y, right, y);
  y += 16;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const itemMaxW = colUnit - colItem - 24;
  for (const item of order.items) {
    const nameLines = doc.splitTextToSize(item.name, itemMaxW) as string[];
    doc.setTextColor(...ink);
    doc.text(String(item.qty), colQty, y);
    doc.text(nameLines, colItem, y, { lineHeightFactor: 1.35 });
    doc.text(rs(item.price), colUnit, y, { align: "right" });
    doc.text(rs(item.price * item.qty), colAmt, y, { align: "right" });
    y += Math.max(nameLines.length * 13, 13) + 10;
  }

  // ── Totals ────────────────────────────────────────────────────────
  doc.setDrawColor(220, 210, 190);
  doc.line(colUnit - 40, y, right, y);
  y += 18;

  const totalRow = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 12 : 10);
    doc.setTextColor(...(bold ? ink : dim));
    doc.text(label, colUnit, y, { align: "right" });
    doc.setTextColor(...ink);
    doc.text(value, colAmt, y, { align: "right" });
    y += bold ? 22 : 16;
  };

  totalRow("Subtotal", rs(order.subtotal));
  totalRow("Shipping", order.shipping === 0 ? "Free" : rs(order.shipping));
  y += 4;
  totalRow("Total", rs(order.amount), true);

  // ── Footer ────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight();
  let fy = pageH - 96;
  doc.setDrawColor(...gold);
  doc.setLineWidth(1);
  doc.line(M, fy, right, fy);
  fy += 20;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...dim);
  doc.text(
    [
      "Authentic, Lab Certified Rudraksha.",
      "7-day returns on unused, sealed products.",
      `Thank you for shopping with ${site.name}.`,
    ],
    M,
    fy,
    { lineHeightFactor: 1.6 }
  );

  doc.save(`Amorfos-Invoice-${invNo}.pdf`);
}
