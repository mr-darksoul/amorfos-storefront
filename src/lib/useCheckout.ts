"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { site } from "@/lib/site";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function useCheckout() {
  const { items, clear } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = useCallback(async () => {
    setError(null);
    if (items.length === 0) return;
    setLoading(true);

    try {
      // 1. Create the order on our server (amount computed server-side).
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, qty: i.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start checkout.");

      // 2. Load Razorpay's checkout script.
      const ok = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      if (!ok || !window.Razorpay) {
        throw new Error("Could not load the payment gateway. Check your connection.");
      }

      // 3. Open the modal.
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: site.name,
        description: `${items.reduce((n, i) => n + i.qty, 0)} item(s)`,
        order_id: data.orderId,
        image: "/brand/logo.png",
        theme: { color: "#c8a35e" },
        notes: { brand: site.name },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // 4. Verify the signature server-side before celebrating.
          const v = await fetch("/api/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const vData = await v.json();
          if (v.ok && vData.verified) {
            clear();
            router.push(`/thank-you?payment=${response.razorpay_payment_id}`);
          } else {
            setError("Payment could not be verified. If you were charged, contact us on WhatsApp.");
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });
      rzp.open();
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setLoading(false);
    }
  }, [items, clear, router]);

  return { checkout, loading, error };
}
