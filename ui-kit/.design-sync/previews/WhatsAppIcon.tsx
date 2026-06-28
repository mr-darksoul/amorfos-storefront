import { WhatsAppIcon } from "@amorfos/ui-kit";

export function Sizes() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "16px", padding: "1.5rem", color: "#25D366" }}>
      <WhatsAppIcon style={{ width: 20, height: 20 }} />
      <WhatsAppIcon style={{ width: 24, height: 24 }} />
      <WhatsAppIcon style={{ width: 32, height: 32 }} />
    </div>
  );
}

export function InContext() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "1rem" }}>
      <span style={{ display: "grid", placeItems: "center", width: "36px", height: "36px", borderRadius: "999px", background: "#25D366", color: "#fff" }}>
        <WhatsAppIcon style={{ width: 18, height: 18 }} />
      </span>
      <span style={{ fontSize: "0.85rem", color: "var(--color-ink-dim)", fontFamily: "var(--font-sans)" }}>Chat with us on WhatsApp</span>
    </div>
  );
}
