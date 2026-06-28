import { BagIcon } from "@amorfos/ui-kit";

export function Sizes() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "1.5rem", color: "var(--color-ink)" }}>
      <BagIcon style={{ width: 16, height: 16 }} />
      <BagIcon style={{ width: 20, height: 20 }} />
      <BagIcon style={{ width: 24, height: 24 }} />
      <BagIcon style={{ width: 32, height: 32 }} />
    </div>
  );
}

export function Colors() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "1.5rem" }}>
      <BagIcon style={{ width: 24, height: 24, color: "var(--color-ink)" }} />
      <BagIcon style={{ width: 24, height: 24, color: "var(--color-gold)" }} />
      <BagIcon style={{ width: 24, height: 24, color: "var(--color-ink-dim)" }} />
    </div>
  );
}
