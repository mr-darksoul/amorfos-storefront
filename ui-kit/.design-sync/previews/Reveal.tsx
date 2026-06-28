import { Reveal } from "@amorfos/ui-kit";

export function Default() {
  return (
    <div style={{ padding: "2rem" }}>
      <Reveal>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "0.9rem", color: "var(--color-ink-dim)" }}>
          This content fades in and slides up when it enters the viewport.
        </p>
      </Reveal>
    </div>
  );
}

export function WithDelay() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "2rem" }}>
      <Reveal delay={0}>
        <div style={{ padding: "1rem", border: "1px solid var(--color-line)", borderRadius: "2px" }}>
          <p style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.3em", color: "var(--color-gold)", margin: 0 }}>Lab Certified</p>
        </div>
      </Reveal>
      <Reveal delay={100}>
        <div style={{ padding: "1rem", border: "1px solid var(--color-line)", borderRadius: "2px" }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", margin: 0, color: "var(--color-ink)" }}>7 Mukhi Rudraksha</p>
        </div>
      </Reveal>
      <Reveal delay={200}>
        <div style={{ padding: "1rem", border: "1px solid var(--color-line)", borderRadius: "2px" }}>
          <p style={{ fontSize: "0.85rem", color: "var(--color-ink-dim)", margin: 0 }}>Ruled by Mahalakshmi. Recommended for wealth and career.</p>
        </div>
      </Reveal>
    </div>
  );
}
