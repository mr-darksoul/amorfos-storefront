import { MinusIcon } from "@amorfos/ui-kit";

export function Default() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "1.5rem", color: "var(--color-ink)" }}>
      <MinusIcon style={{ width: 16, height: 16 }} />
      <MinusIcon style={{ width: 20, height: 20 }} />
      <MinusIcon style={{ width: 24, height: 24 }} />
    </div>
  );
}
