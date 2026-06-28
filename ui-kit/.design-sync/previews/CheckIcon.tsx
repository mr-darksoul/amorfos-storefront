import { CheckIcon } from "@amorfos/ui-kit";

export function Default() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "1.5rem", color: "var(--color-ink)" }}>
      <CheckIcon style={{ width: 16, height: 16 }} />
      <CheckIcon style={{ width: 20, height: 20 }} />
      <CheckIcon style={{ width: 24, height: 24 }} />
    </div>
  );
}

export function GoldCheck() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "1rem" }}>
      <CheckIcon style={{ width: 18, height: 18, color: "var(--color-gold)" }} />
      <span style={{ fontSize: "0.85rem", color: "var(--color-ink-dim)", fontFamily: "var(--font-sans)" }}>Lab Certified Authentic</span>
    </div>
  );
}
