"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

type PageState =
  | { phase: "loading" }
  | { phase: "error"; message: string }
  | { phase: "form"; customerName: string; mukhiList: number[]; usedMukhi: number[] }
  | { phase: "done" };

function StarPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          aria-label={`${n} star`}
          className="p-0.5"
        >
          <svg viewBox="0 0 20 20" className="size-8">
            <path
              d="M10 1l2.6 5.3 5.8.8-4.2 4.1 1 5.8L10 14.3l-5.2 2.7 1-5.8L1.6 7.1l5.8-.8z"
              fill={(hover || value) >= n ? "var(--color-gold)" : "var(--color-paper-soft)"}
              stroke="var(--color-gold)"
              strokeWidth="0.6"
              className="transition-colors"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ReviewTokenPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, setState] = useState<PageState>({ phase: "loading" });
  const [selectedMukhi, setSelectedMukhi] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/reviews/${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setState({ phase: "error", message: data.error });
        } else {
          setState({
            phase: "form",
            customerName: data.customerName,
            mukhiList: data.mukhiList,
            usedMukhi: data.usedMukhi,
          });
          if (data.mukhiList.length === 1) setSelectedMukhi(data.mukhiList[0]);
        }
      })
      .catch(() => setState({ phase: "error", message: "Failed to load review link." }));
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMukhi || !rating || !body.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mukhi: selectedMukhi, rating, title: title.trim(), body: body.trim() }),
      });
      if (res.ok) {
        // If more products remain, reload state
        const remaining = state.phase === "form"
          ? state.mukhiList.filter((m) => m !== selectedMukhi && !state.usedMukhi.includes(m))
          : [];
        if (remaining.length > 0) {
          setState((s) => s.phase === "form"
            ? { ...s, usedMukhi: [...s.usedMukhi, selectedMukhi] }
            : s
          );
          setSelectedMukhi(remaining[0]);
          setRating(0); setTitle(""); setBody("");
        } else {
          setState({ phase: "done" });
        }
      } else {
        const d = await res.json();
        alert(d.error ?? "Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper px-5 py-12">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="mb-10 block w-fit">
          <Logo className="h-8" />
        </Link>

        {state.phase === "loading" && (
          <p className="text-ink-faint text-sm">Loading…</p>
        )}

        {state.phase === "error" && (
          <div className="rounded-sm border border-line bg-paper-raised p-8 text-center">
            <p className="font-serif text-2xl text-ink mb-2">Link unavailable</p>
            <p className="text-sm text-ink-faint">{state.message}</p>
            <Link href="/" className="mt-6 inline-block text-sm text-gold-soft underline-offset-4 hover:underline">
              Back to Amorfos →
            </Link>
          </div>
        )}

        {state.phase === "form" && (
          <>
            <p className="eyebrow mb-2">Verified Purchase Review</p>
            <h1 className="display text-3xl text-ink mb-2">
              Hi {state.customerName?.split(" ")[0] || "there"} 👋
            </h1>
            <p className="text-sm text-ink-faint mb-8">
              Thank you for your order. Your honest review helps other seekers choose the right Rudraksha.
            </p>

            {state.mukhiList.length > 1 && (
              <div className="mb-6">
                <label className="mb-2 block text-xs uppercase tracking-widest text-ink-faint">
                  Which product would you like to review?
                </label>
                <div className="flex flex-wrap gap-2">
                  {state.mukhiList.map((m) => {
                    const done = state.usedMukhi.includes(m);
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => !done && setSelectedMukhi(m)}
                        disabled={done}
                        className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                          selectedMukhi === m
                            ? "border-gold bg-gold text-paper"
                            : done
                              ? "border-line text-ink-faint line-through cursor-default"
                              : "border-line text-ink hover:border-gold"
                        }`}
                      >
                        {m} Mukhi {done ? "✓" : ""}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedMukhi && (
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-widest text-ink-faint">
                    Rating for {selectedMukhi} Mukhi <span className="text-rudra">*</span>
                  </label>
                  <StarPicker value={rating} onChange={setRating} />
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
                    rows={5}
                    placeholder="Share your experience — quality, packaging, how it feels to wear…"
                    className="w-full rounded-sm border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:ring-1 focus:ring-gold resize-none"
                  />
                </div>

                <p className="text-xs text-ink-faint">
                  Submitting as <strong>{state.customerName}</strong> · Verified Purchase
                </p>

                <button
                  type="submit"
                  disabled={!rating || !body.trim() || submitting}
                  className="btn btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting…" : "Submit review"}
                </button>
              </form>
            )}
          </>
        )}

        {state.phase === "done" && (
          <div className="rounded-sm border border-line bg-paper-raised p-10 text-center">
            <p className="font-serif text-3xl text-ink mb-3">Thank you</p>
            <p className="text-sm text-ink-faint mb-6">
              Your review has been submitted and will appear on the site once verified.
            </p>
            <Link href="/" className="btn btn-primary">
              Back to Amorfos
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
