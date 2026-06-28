export interface StarRatingProps {
  rating: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  count?: number;
  className?: string;
}

export function StarRating({ rating, size = "sm", showValue = false, count, className = "" }: StarRatingProps) {
  const px = size === "lg" ? 20 : size === "md" ? 16 : 14;
  const gap = size === "lg" ? 4 : 2;
  return (
    <span
      className={className}
      style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: `${gap}px` }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <svg key={n} viewBox="0 0 20 20" width={px} height={px} aria-hidden>
            <path
              d="M10 1l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.3l-5.2 2.7 1-5.8L1.6 7.1l5.8-.8z"
              fill={
                rating >= n
                  ? "var(--color-gold)"
                  : rating >= n - 0.5
                  ? "var(--color-gold-soft)"
                  : "var(--color-paper-soft)"
              }
              stroke="var(--color-gold)"
              strokeWidth="0.6"
            />
          </svg>
        ))}
      </span>
      {showValue && (
        <span
          style={{
            fontSize: "0.75rem",
            color: "var(--color-ink-faint)",
            fontFamily: "var(--font-sans)",
          }}
        >
          {rating.toFixed(1)}
          {count !== undefined ? ` (${count})` : ""}
        </span>
      )}
    </span>
  );
}
