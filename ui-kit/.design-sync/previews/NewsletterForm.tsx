import { NewsletterForm } from "@amorfos/ui-kit";

export function Default() {
  return (
    <div style={{ maxWidth: "480px", padding: "2rem", background: "var(--color-paper)" }}>
      <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.32em", color: "var(--color-gold)", marginBottom: "0.75rem", fontFamily: "var(--font-sans)" }}>
        Free Guide
      </p>
      <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontWeight: 500, color: "var(--color-ink)", marginBottom: "0.5rem", lineHeight: 1.2 }}>
        How to Choose Your Rudraksha
      </p>
      <p style={{ fontSize: "0.85rem", color: "var(--color-ink-dim)", marginBottom: "1.25rem", lineHeight: 1.6 }}>
        A guide by astrologers — which mukhi, which metal, worn on which day.
      </p>
      <NewsletterForm source="preview" />
    </div>
  );
}

export function Compact() {
  return (
    <div style={{ maxWidth: "480px", padding: "1.5rem", background: "var(--color-paper-raised)", borderTop: "1px solid var(--color-line)" }}>
      <p style={{ fontSize: "0.8rem", color: "var(--color-ink-dim)", marginBottom: "0.75rem" }}>
        Get the free Rudraksha selection guide in your inbox.
      </p>
      <NewsletterForm source="preview-compact" compact />
    </div>
  );
}

export function WithPhone() {
  return (
    <div style={{ maxWidth: "480px", padding: "2rem", background: "var(--color-paper)" }}>
      <NewsletterForm source="preview-phone" showPhone />
    </div>
  );
}
