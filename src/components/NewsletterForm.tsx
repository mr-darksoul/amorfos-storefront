"use client";

import { useState } from "react";
import { trackLead } from "@/lib/analytics";

/**
 * Shared opt-in form. Posts to /api/subscribe and reports a Lead event.
 * Used both in the footer (inline) and the lead-capture modal.
 */
export default function NewsletterForm({
  source,
  showPhone = false,
  onSuccess,
  compact = false,
}: {
  source: string;
  showPhone?: boolean;
  onSuccess?: () => void;
  compact?: boolean;
}) {
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
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone: showPhone ? phone : undefined, source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not subscribe.");
      setStatus("done");
      trackLead(source);
      onSuccess?.();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "done") {
    return (
      <p className={compact ? "text-sm text-ink-dim" : "text-sm leading-relaxed text-ink-dim"}>
        Thank you — your guide is on its way to your inbox. Keep an eye out from{" "}
        <span className="text-gold-soft">care@amorfos.in</span>.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3" noValidate>
      <div className={compact ? "flex gap-2" : "space-y-3"}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          autoComplete="email"
          className="w-full rounded-sm border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-gold focus:outline-none"
        />
        {showPhone && (
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="WhatsApp number (optional)"
            autoComplete="tel"
            className="w-full rounded-sm border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-gold focus:outline-none"
          />
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          className={
            compact
              ? "btn btn-primary shrink-0 disabled:opacity-60"
              : "btn btn-primary w-full disabled:opacity-60"
          }
        >
          {status === "loading" ? "Sending…" : compact ? "Join" : "Send me the guide"}
        </button>
      </div>
      {error && <p className="text-xs text-rudra">{error}</p>}
    </form>
  );
}
