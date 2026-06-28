"use client";

import { useState } from "react";

export default function ReviewForm({
  mukhi,
  productName,
}: {
  mukhi: number;
  productName: string;
}) {
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
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mukhi, reviewer: name.trim(), rating, title: title.trim(), body: body.trim() }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-sm border border-line bg-paper-raised px-6 py-8 text-center">
        <p className="font-serif text-xl text-ink">Thank you for your review</p>
        <p className="mt-2 text-sm text-ink-faint">It will appear here once we've verified it.</p>
      </div>
    );
  }

  return (
    <div className="mt-10 border-t border-line pt-10">
      <p className="eyebrow mb-4">Write a review</p>
      <form onSubmit={submit} className="space-y-5">
        {/* Star selector */}
        <div>
          <label className="mb-2 block text-xs uppercase tracking-widest text-ink-faint">Your rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className="p-0.5"
                aria-label={`${n} star`}
              >
                <svg viewBox="0 0 20 20" className="size-7">
                  <path
                    d="M10 1l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.3l-5.2 2.7 1-5.8L1.6 7.1l5.8-.8z"
                    fill={(hover || rating) >= n ? "var(--color-gold)" : "var(--color-paper-soft)"}
                    stroke="var(--color-gold)"
                    strokeWidth="0.6"
                    className="transition-colors"
                  />
                </svg>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-widest text-ink-faint">
            Your name <span className="text-rudra">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g. Rahul S."
            className="w-full rounded-sm border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-widest text-ink-faint">Review title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Beautiful bead, very authentic"
            className="w-full rounded-sm border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-gold"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-widest text-ink-faint">
            Your review <span className="text-rudra">*</span>
          </label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={4}
            placeholder={`Share your experience with the ${productName}…`}
            className="w-full rounded-sm border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-gold resize-none"
          />
        </div>

        {state === "error" && (
          <p className="text-sm text-rudra">Something went wrong. Please try again.</p>
        )}

        <button
          type="submit"
          disabled={!rating || !name.trim() || !body.trim() || state === "submitting"}
          className="btn btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {state === "submitting" ? "Submitting…" : "Submit review"}
        </button>
      </form>
    </div>
  );
}
