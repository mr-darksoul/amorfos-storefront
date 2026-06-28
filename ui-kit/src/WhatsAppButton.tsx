import { WhatsAppIcon } from "./Icons";

export interface WhatsAppButtonProps {
  phone: string;
  message?: string;
}

export function WhatsAppButton({
  phone,
  message = "Hello — I have a question about your Rudraksha.",
}: WhatsAppButtonProps) {
  const href = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0,
        overflow: "hidden",
        borderRadius: "999px",
        background: "#25D366",
        color: "#fff",
        boxShadow: "0 10px 30px -8px rgba(0,0,0,0.6)",
        transition: "gap 0.3s",
        textDecoration: "none",
        fontFamily: "var(--font-sans)",
        fontSize: "0.875rem",
        fontWeight: 500,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        const span = e.currentTarget.querySelector<HTMLSpanElement>("[data-label]");
        if (span) { span.style.maxWidth = "140px"; span.style.opacity = "1"; span.style.paddingRight = "20px"; }
      }}
      onMouseLeave={(e) => {
        const span = e.currentTarget.querySelector<HTMLSpanElement>("[data-label]");
        if (span) { span.style.maxWidth = "0"; span.style.opacity = "0"; span.style.paddingRight = "0"; }
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: "56px",
          height: "56px",
          flexShrink: 0,
        }}
      >
        <WhatsAppIcon style={{ width: "28px", height: "28px" }} />
      </span>
      <span
        data-label=""
        style={{
          maxWidth: 0,
          opacity: 0,
          overflow: "hidden",
          transition: "max-width 0.3s, opacity 0.3s, padding 0.3s",
        }}
      >
        Chat with us
      </span>
    </a>
  );
}
