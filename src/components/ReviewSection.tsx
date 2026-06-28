"use client";

import { useState } from "react";
import type { Review, ReviewSummary } from "@/lib/reviews";

function StarFill({ filled, half }: { filled: boolean; half?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0" aria-hidden>
      <defs>
        {half && (
          <linearGradient id="half-star">
            <stop offset="50%" stopColor="var(--color-gold)" />
            <stop offset="50%" stopColor="var(--color-paper-soft)" />
          </linearGradient>
        )}
      </defs>
      <path
        d="M10 1l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.3l-5.2 2.7 1-5.8L1.6 7.1l5.8-.8z"
        fill={half ? "url(#half-star)" : filled ? "var(--color-gold)" : "var(--color-paper-soft)"}
        stroke="var(--color-gold)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const sizeClass = size === "lg" ? "size-5" : "size-3.5";
  return (
    <span className={`flex items-center gap-0.5 ${size === "lg" ? "gap-1" : ""}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} viewBox="0 0 20 20" className={`${sizeClass} shrink-0`} aria-hidden>
          <path
            d="M10 1l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.3l-5.2 2.7 1-5.8L1.6 7.1l5.8-.8z"
            fill={rating >= n ? "var(--color-gold)" : rating >= n - 0.5 ? "var(--color-gold-soft)" : "var(--color-paper-soft)"}
            stroke="var(--color-gold)"
            strokeWidth="0.6"
          />
        </svg>
      ))}
    </span>
  );
}

function DistBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2 text-xs text-ink-dim">
      <span className="w-12 shrink-0 text-right">{label} star</span>
      <div className="flex-1 h-1.5 rounded-full bg-paper-soft overflow-hidden">
        <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-ink-faint">{count}</span>
    </div>
  );
}

const PAGE_SIZE = 6;

export default function ReviewSection({
  reviews,
  summary,
}: {
  reviews: Review[];
  summary: ReviewSummary;
}) {
  const [shown, setShown] = useState(PAGE_SIZE);

  if (summary.total === 0) return null;

  const visible = reviews.slice(0, shown);

  return (
    <section className="mt-16 border-t border-line pt-12">
      <p className="eyebrow mb-4">What customers say</p>

      {/* Summary row */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-12 mb-10">
        {/* Average */}
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <span className="font-serif text-5xl leading-none text-ink">{summary.average.toFixed(1)}</span>
          <StarRow rating={summary.average} size="lg" />
          <span className="text-xs text-ink-faint mt-1">{summary.total} review{summary.total !== 1 ? "s" : ""}</span>
        </div>

        {/* Distribution bars */}
        <div className="flex-1 space-y-2 min-w-0">
          {([5, 4, 3, 2, 1] as const).map((n) => (
            <DistBar
              key={n}
              label={String(n)}
              count={summary.distribution[n]}
              total={summary.total}
            />
          ))}
        </div>
      </div>

      {/* Individual reviews */}
      <div className="space-y-8">
        {visible.map((r) => (
          <div key={r.id} className="border-b border-line pb-8 last:border-none last:pb-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <StarRow rating={r.rating} size="sm" />
                {r.title && (
                  <p className="mt-1.5 font-medium text-ink text-sm leading-snug">{r.title}</p>
                )}
              </div>
              {r.verified && (
                <span className="shrink-0 rounded-full border border-line px-2.5 py-0.5 text-[0.62rem] uppercase tracking-wide text-gold">
                  Verified
                </span>
              )}
            </div>
            <p className="text-sm leading-relaxed text-ink-dim">{r.body}</p>
            <p className="mt-2 text-xs text-ink-faint">
              {r.reviewer}
              {r.review_date && (
                <> · {new Date(r.review_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</>
              )}
            </p>
          </div>
        ))}
      </div>

      {shown < reviews.length && (
        <button
          onClick={() => setShown((n) => n + PAGE_SIZE)}
          className="mt-8 btn btn-outline text-sm"
        >
          Show more reviews ({reviews.length - shown} remaining)
        </button>
      )}
    </section>
  );
}
