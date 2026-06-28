import { ArrowIcon } from "@amorfos/ui-kit";

export function Default() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "1.5rem", color: "var(--color-ink)" }}>
      <ArrowIcon style={{ width: 16, height: 16 }} />
      <ArrowIcon style={{ width: 20, height: 20 }} />
      <ArrowIcon style={{ width: 24, height: 24 }} />
    </div>
  );
}

export function InButton() {
  return (
    <div style={{ padding: "1.5rem" }}>
      <button className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
        Shop Collection <ArrowIcon style={{ width: 16, height: 16 }} />
      </button>
    </div>
  );
}
