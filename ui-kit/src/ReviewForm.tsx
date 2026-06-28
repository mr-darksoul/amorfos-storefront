import { useState } from "react";

export interface ReviewFormProps {
  productName: string;
  mukhi?: number;
  apiUrl?: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ productName, mukhi, apiUrl = "/api/reviews", onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating || !name.trim() || !body.trim()) return;
    setState("submitting");
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mukhi, reviewer: name.trim(), rating, title: title.trim(), body: body.trim() }),
      });
      if (res.ok) { setState("done"); onSubmitted?.(); }
      else setState("error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div
        style={{
          borderRadius: "2px",
          border: "1px solid var(--color-line)",
          background: "var(--color-paper-raised)",
          padding: "2rem 1.5rem",
          textAlign: "center",
        }}
      >
        <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", color: "var(--color-ink)", margin: 0 }}>
          Thank you for your review
        </p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "var(--color-ink-faint)" }}>
          It will appear once verified.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        borderTop: "1px solid var(--color-line)",
        paddingTop: "2.5rem",
        marginTop: "2.5rem",
      }}
    >
      <p className="eyebrow" style={{ marginBottom: "1rem" }}>Write a review</p>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Star selector */}
        <div>
          <label className="amf-label">Your rating</label>
          <div style={{ display: "flex", gap: "4px" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                style={{ padding: "2px", background: "none", border: "none", cursor: "pointer" }}
                aria-label={`${n} star`}
              >
                <svg viewBox="0 0 20 20" width={28} height={28}>
                  <path
                    d="M10 1l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.3l-5.2 2.7 1-5.8L1.6 7.1l5.8-.8z"
                    fill={(hover || rating) >= n ? "var(--color-gold)" : "var(--color-paper-soft)"}
                    stroke="var(--color-gold)"
                    strokeWidth="0.6"
                  />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="amf-label">
            Your name <span style={{ color: "var(--color-rudra)" }}>*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Rahul S."
            className="amf-input"
          />
        </div>

        <div>
          <label className="amf-label">Review title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Beautiful bead, very authentic"
            className="amf-input"
          />
        </div>

        <div>
          <label className="amf-label">
            Your review <span style={{ color: "var(--color-rudra)" }}>*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={4}
            placeholder={`Share your experience with ${productName}…`}
            className="amf-textarea"
          />
        </div>

        {state === "error" && (
          <p style={{ fontSize: "0.875rem", color: "var(--color-rudra)", margin: 0 }}>
            Something went wrong. Please try again.
          </p>
        )}

        <button
          type="submit"
          disabled={!rating || !name.trim() || !body.trim() || state === "submitting"}
          className="btn btn-primary"
          style={{ opacity: (!rating || !name.trim() || !body.trim()) ? 0.4 : 1 }}
        >
          {state === "submitting" ? "Submitting…" : "Submit review"}
        </button>
      </form>
    </div>
  );
}
