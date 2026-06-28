"use client";

import { useState } from "react";

interface PendingReview {
  id: string;
  mukhi: number;
  reviewer: string;
  rating: number;
  title: string | null;
  body: string;
  verified: boolean;
  review_date: string | null;
  source: string;
  created_at: string;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-px">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 20 20" className="size-3.5" aria-hidden>
          <path
            d="M10 1l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.3l-5.2 2.7 1-5.8L1.6 7.1l5.8-.8z"
            fill={rating >= n ? "var(--color-gold)" : "var(--color-paper-soft)"}
            stroke="var(--color-gold)"
            strokeWidth="0.6"
          />
        </svg>
      ))}
    </span>
  );
}

export default function AdminReviewsClient({ reviews }: { reviews: PendingReview[] }) {
  const [items, setItems] = useState(reviews);
  const [busy, setBusy] = useState<string | null>(null);

  async function act(id: string, action: "approve" | "reject") {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) setItems((prev) => prev.filter((r) => r.id !== id));
    } finally {
      setBusy(null);
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-sm border border-line bg-paper-raised px-8 py-12 text-center">
        <p className="font-serif text-xl text-ink">All clear</p>
        <p className="mt-2 text-sm text-ink-faint">No reviews waiting for approval.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-faint">{items.length} review{items.length !== 1 ? "s" : ""} pending</p>
      {items.map((r) => (
        <div key={r.id} className="rounded-sm border border-line bg-paper-raised p-6">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <Stars rating={r.rating} />
              <span className="text-xs text-ink-faint">{r.mukhi} Mukhi</span>
              {r.verified && (
                <span className="rounded-full border border-line px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-gold">
                  Verified Purchase
                </span>
              )}
              <span className="rounded-full bg-paper-soft px-2 py-0.5 text-[0.6rem] uppercase tracking-wide text-ink-faint">
                {r.source}
              </span>
            </div>
            <span className="shrink-0 text-xs text-ink-faint">
              {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          {r.title && <p className="font-medium text-sm text-ink mb-1">{r.title}</p>}
          <p className="text-sm text-ink-dim leading-relaxed mb-1">{r.body}</p>
          <p className="text-xs text-ink-faint">— {r.reviewer}</p>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => act(r.id, "approve")}
              disabled={busy === r.id}
              className="btn btn-primary text-sm disabled:opacity-40"
            >
              {busy === r.id ? "…" : "Approve"}
            </button>
            <button
              onClick={() => act(r.id, "reject")}
              disabled={busy === r.id}
              className="btn btn-outline text-sm disabled:opacity-40"
            >
              {busy === r.id ? "…" : "Reject"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
