import { ShieldIcon } from "@amorfos/ui-kit";

export function Default() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "1.5rem", color: "var(--color-ink)" }}>
      <ShieldIcon style={{ width: 20, height: 20 }} />
      <ShieldIcon style={{ width: 24, height: 24 }} />
      <ShieldIcon style={{ width: 32, height: 32 }} />
    </div>
  );
}

export function TrustBadge() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "1rem" }}>
      <ShieldIcon style={{ width: 18, height: 18, color: "var(--color-gold)" }} />
      <span style={{ fontSize: "0.75rem", color: "var(--color-ink-dim)", fontFamily: "var(--font-sans)" }}>Lab Certified & Authentic</span>
    </div>
  );
}
