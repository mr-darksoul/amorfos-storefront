import { ReturnIcon } from "@amorfos/ui-kit";

export function Default() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "1.5rem", color: "var(--color-ink)" }}>
      <ReturnIcon style={{ width: 20, height: 20 }} />
      <ReturnIcon style={{ width: 24, height: 24 }} />
    </div>
  );
}

export function ReturnBadge() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "1rem" }}>
      <ReturnIcon style={{ width: 18, height: 18, color: "var(--color-gold)" }} />
      <span style={{ fontSize: "0.75rem", color: "var(--color-ink-dim)", fontFamily: "var(--font-sans)" }}>7-day returns on unused items</span>
    </div>
  );
}
