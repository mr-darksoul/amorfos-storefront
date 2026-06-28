import type { ReactNode } from "react";

export type BadgeVariant = "default" | "gold" | "dark" | "rudra";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const styles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    background: "var(--color-paper-raised)",
    color: "var(--color-ink-dim)",
    border: "1px solid var(--color-line)",
  },
  gold: {
    background: "transparent",
    color: "var(--color-gold)",
    border: "1px solid var(--color-gold)",
  },
  dark: {
    background: "var(--color-dark)",
    color: "var(--color-cream)",
    border: "none",
  },
  rudra: {
    background: "var(--color-rudra)",
    color: "var(--color-cream)",
    border: "none",
  },
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "0.2rem 0.6rem",
        borderRadius: "999px",
        fontSize: "0.62rem",
        fontFamily: "var(--font-sans)",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        fontWeight: 500,
        lineHeight: 1.6,
        ...styles[variant],
      }}
    >
      {children}
    </span>
  );
}
