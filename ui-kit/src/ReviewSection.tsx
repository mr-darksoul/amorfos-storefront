import { useState } from "react";
import { StarRating } from "./StarRating";

export interface Review {
  id: string | number;
  rating: number;
  title?: string | null;
  body: string;
  reviewer: string;
  review_date?: string | null;
  verified?: boolean;
}

export interface ReviewSummary {
  average: number;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ReviewSectionProps {
  reviews: Review[];
  summary: ReviewSummary;
  pageSize?: number;
}

function DistBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.75rem", color: "var(--color-ink-dim)" }}>
      <span style={{ width: "48px", textAlign: "right", flexShrink: 0 }}>{label} star</span>
      <div style={{ flex: 1, height: "6px", borderRadius: "999px", background: "var(--color-paper-soft)", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: "999px", background: "var(--color-gold)", width: `${pct}%` }} />
      </div>
      <span style={{ width: "24px", textAlign: "right", color: "var(--color-ink-faint)" }}>{count}</span>
    </div>
  );
}

export function ReviewSection({ reviews, summary, pageSize = 6 }: ReviewSectionProps) {
  const [shown, setShown] = useState(pageSize);
  if (summary.total === 0) return null;
  const visible = reviews.slice(0, shown);

  return (
    <section id="reviews" style={{ marginTop: "4rem", borderTop: "1px solid var(--color-line)", paddingTop: "3rem" }}>
      <p className="eyebrow" style={{ marginBottom: "1rem" }}>What customers say</p>

      {/* Summary row */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
          marginBottom: "2.5rem",
        }}
      >
        {/* Average score */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px" }}>
          <span style={{ fontFamily: "var(--font-serif)", fontSize: "3rem", lineHeight: 1, color: "var(--color-ink)" }}>
            {summary.average.toFixed(1)}
          </span>
          <StarRating rating={summary.average} size="lg" />
          <span style={{ fontSize: "0.75rem", color: "var(--color-ink-faint)", marginTop: "2px" }}>
            {summary.total} review{summary.total !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Distribution */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "320px" }}>
          {([5, 4, 3, 2, 1] as const).map((n) => (
            <DistBar key={n} label={String(n)} count={summary.distribution[n]} total={summary.total} />
          ))}
        </div>
      </div>

      {/* Individual reviews */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {visible.map((r) => (
          <div
            key={r.id}
            style={{ borderBottom: "1px solid var(--color-line)", paddingBottom: "2rem" }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", marginBottom: "0.5rem" }}>
              <div>
                <StarRating rating={r.rating} size="sm" />
                {r.title && (
                  <p style={{ marginTop: "6px", fontWeight: 500, color: "var(--color-ink)", fontSize: "0.875rem", lineHeight: 1.3, margin: "6px 0 0" }}>
                    {r.title}
                  </p>
                )}
              </div>
              {r.verified && (
                <span
                  style={{
                    flexShrink: 0,
                    borderRadius: "999px",
                    border: "1px solid var(--color-line)",
                    padding: "2px 10px",
                    fontSize: "0.62rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--color-gold)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  Verified
                </span>
              )}
            </div>
            <p style={{ fontSize: "0.875rem", lineHeight: 1.65, color: "var(--color-ink-dim)", margin: 0 }}>{r.body}</p>
            <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--color-ink-faint)", margin: "8px 0 0" }}>
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
          onClick={() => setShown((n) => n + pageSize)}
          className="btn btn-outline"
          style={{ marginTop: "2rem", fontSize: "0.875rem" }}
        >
          Show more ({reviews.length - shown} remaining)
        </button>
      )}
    </section>
  );
}
