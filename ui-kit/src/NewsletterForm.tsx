import { useState } from "react";

export interface NewsletterFormProps {
  source?: string;
  showPhone?: boolean;
  onSuccess?: () => void;
  compact?: boolean;
  apiUrl?: string;
}

export function NewsletterForm({
  source = "ui-kit",
  showPhone = false,
  onSuccess,
  compact = false,
  apiUrl = "/api/subscribe",
}: NewsletterFormProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone: showPhone ? phone : undefined, source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as { error?: string }).error || "Could not subscribe.");
      setStatus("done");
      onSuccess?.();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "done") {
    return (
      <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "var(--color-ink-dim)", margin: 0 }}>
        Thank you — your guide is on its way.{" "}
        <span style={{ color: "var(--color-gold-soft)" }}>care@amorfos.in</span>
      </p>
    );
  }

  const inputStyle: React.CSSProperties = {
    flex: compact ? "1 1 auto" : undefined,
  };

  return (
    <form onSubmit={submit} noValidate style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div
        style={{
          display: "flex",
          flexDirection: compact ? "row" : "column",
          gap: "12px",
          alignItems: compact ? "center" : undefined,
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          autoComplete="email"
          className="amf-input"
          style={inputStyle}
        />
        {showPhone && (
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="WhatsApp number (optional)"
            autoComplete="tel"
            className="amf-input"
          />
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn btn-primary"
          style={compact ? { flexShrink: 0 } : { width: "100%", opacity: status === "loading" ? 0.6 : 1 }}
        >
          {status === "loading" ? "Sending…" : compact ? "Join" : "Send me the guide"}
        </button>
      </div>
      {error && (
        <p style={{ fontSize: "0.75rem", color: "var(--color-rudra)", margin: 0 }}>{error}</p>
      )}
    </form>
  );
}
