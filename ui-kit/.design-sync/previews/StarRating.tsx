import { StarRating } from "@amorfos/ui-kit";

export function Sizes() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "1rem" }}>
      <StarRating rating={4.7} size="sm" />
      <StarRating rating={4.7} size="md" />
      <StarRating rating={4.7} size="lg" />
    </div>
  );
}

export function WithValue() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "1rem" }}>
      <StarRating rating={4.8} size="sm" showValue count={124} />
      <StarRating rating={4.2} size="md" showValue count={38} />
      <StarRating rating={3.5} size="lg" showValue count={7} />
    </div>
  );
}

export function HalfStars() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "1rem" }}>
      {[5, 4.5, 4, 3.5, 3, 2.5, 2, 1].map((r) => (
        <div key={r} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <StarRating rating={r} size="sm" />
          <span style={{ fontSize: "0.75rem", color: "var(--color-ink-faint)", fontFamily: "var(--font-sans)" }}>{r}</span>
        </div>
      ))}
    </div>
  );
}
