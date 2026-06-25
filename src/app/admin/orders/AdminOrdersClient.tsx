"use client";

import { useState } from "react";
import { inr } from "@/lib/format";

interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

interface Customer {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface Order {
  id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount: number;
  subtotal: number;
  shipping: number;
  status: "pending" | "paid" | "failed";
  customer: Customer;
  items: OrderItem[];
  created_at: string;
  paid_at: string | null;
}

const STATUS_LABEL: Record<Order["status"], string> = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
};

const STATUS_CLASS: Record<Order["status"], string> = {
  pending: "bg-gold/15 text-gold",
  paid: "bg-green-700/20 text-green-600",
  failed: "bg-rudra/15 text-rudra",
};

export default function AdminOrdersClient({ orders }: { orders: Order[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <div className="py-16 text-center text-bone-faint">
        <p className="font-serif text-2xl">No orders yet.</p>
        <p className="mt-2 text-sm">Orders will appear here once customers complete checkout.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-sm border border-line">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-ink text-left">
            {["Date", "Customer", "Items", "Amount", "Status", ""].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-xs uppercase tracking-[0.16em] text-bone-faint font-normal whitespace-nowrap"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((o) => (
            <>
              <tr
                key={o.id}
                className="hover:bg-ink/50 cursor-pointer"
                onClick={() => setExpanded(expanded === o.id ? null : o.id)}
              >
                <td className="px-4 py-3 text-bone-dim whitespace-nowrap">
                  {new Date(o.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  <p className="text-bone">{o.customer.name || "—"}</p>
                  <p className="text-xs text-bone-faint">{o.customer.phone || ""}</p>
                </td>
                <td className="px-4 py-3 text-bone-dim">
                  {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                </td>
                <td className="px-4 py-3 tabular-nums text-bone whitespace-nowrap">
                  {inr(o.amount)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[0.65rem] uppercase tracking-wide ${STATUS_CLASS[o.status]}`}
                  >
                    {STATUS_LABEL[o.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gold-soft">
                  {expanded === o.id ? "▲" : "▼"}
                </td>
              </tr>

              {expanded === o.id && (
                <tr key={`${o.id}-detail`} className="bg-ink-raised">
                  <td colSpan={6} className="px-6 py-5">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <p className="eyebrow mb-2">Customer</p>
                        <p className="text-bone">{o.customer.name || "—"}</p>
                        <p className="text-bone-dim">{o.customer.phone || "—"}</p>
                        {o.customer.email && <p className="text-bone-dim">{o.customer.email}</p>}
                      </div>
                      {(o.customer.address || o.customer.city) && (
                        <div>
                          <p className="eyebrow mb-2">Shipping address</p>
                          <p className="text-bone-dim">{o.customer.address}</p>
                          <p className="text-bone-dim">
                            {[o.customer.city, o.customer.state, o.customer.pincode]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="eyebrow mb-2">Payment</p>
                        <p className="font-mono text-xs text-bone-dim break-all">
                          {o.razorpay_payment_id || o.razorpay_order_id}
                        </p>
                        {o.paid_at && (
                          <p className="mt-1 text-xs text-bone-faint">
                            Paid {new Date(o.paid_at).toLocaleString("en-IN")}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="eyebrow mb-2">Order breakdown</p>
                        <ul className="space-y-1">
                          {o.items.map((item) => (
                            <li key={item.id} className="flex justify-between text-xs text-bone-dim">
                              <span>{item.qty}× {item.name}</span>
                              <span className="tabular-nums">{inr(item.price * item.qty)}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-2 border-t border-line pt-2 flex justify-between text-xs text-bone-dim">
                          <span>Shipping</span>
                          <span>{o.shipping === 0 ? "Free" : inr(o.shipping)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-bone font-serif mt-1">
                          <span>Total</span>
                          <span className="tabular-nums">{inr(o.amount)}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
