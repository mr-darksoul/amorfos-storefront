"use client";

import { useSearchParams } from "next/navigation";

export default function PaymentRef() {
  const id = useSearchParams().get("payment");
  if (!id) return null;
  return (
    <p className="mt-6 rounded-sm border border-line bg-paper-raised px-5 py-3 text-sm text-ink-dim">
      Payment reference:{" "}
      <span className="font-mono text-gold-soft">{id}</span>
    </p>
  );
}
