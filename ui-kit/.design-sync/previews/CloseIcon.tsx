import { CloseIcon } from "@amorfos/ui-kit";

export function Default() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "1.5rem", color: "var(--color-ink)" }}>
      <CloseIcon style={{ width: 16, height: 16 }} />
      <CloseIcon style={{ width: 20, height: 20 }} />
      <CloseIcon style={{ width: 24, height: 24 }} />
    </div>
  );
}
