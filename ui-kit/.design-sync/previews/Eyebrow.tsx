import { Eyebrow } from "@amorfos/ui-kit";

export function Default() {
  return <Eyebrow>Bestsellers</Eyebrow>;
}

export function AsSpan() {
  return <Eyebrow as="span">Lab Certified Rudraksha</Eyebrow>;
}

export function AsH2() {
  return <Eyebrow as="h2">The collection</Eyebrow>;
}

export function InContext() {
  return (
    <div style={{ padding: "2rem", background: "var(--color-paper)" }}>
      <Eyebrow>Featured Piece</Eyebrow>
      <p style={{ marginTop: "0.75rem", fontFamily: "var(--font-serif)", fontSize: "2rem", fontWeight: 500, lineHeight: 1.1, color: "var(--color-ink)", margin: "12px 0 0" }}>
        21 Mukhi Rudraksha Pendant
      </p>
      <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "var(--color-ink-dim)", lineHeight: 1.6, margin: "8px 0 0" }}>
        Worn on the recommendation of astrologers. Hand-finished in sterling silver.
      </p>
    </div>
  );
}
