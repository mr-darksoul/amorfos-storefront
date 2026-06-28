import { LeafIcon } from "@amorfos/ui-kit";

export function Default() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "1.5rem", color: "var(--color-ink)" }}>
      <LeafIcon style={{ width: 20, height: 20 }} />
      <LeafIcon style={{ width: 24, height: 24 }} />
    </div>
  );
}

export function NaturalBadge() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "1rem" }}>
      <LeafIcon style={{ width: 18, height: 18, color: "var(--color-rudra)" }} />
      <span style={{ fontSize: "0.75rem", color: "var(--color-ink-dim)", fontFamily: "var(--font-sans)" }}>Natural, unprocessed Rudraksha</span>
    </div>
  );
}
