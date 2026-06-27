"use client";

import { useState } from "react";
import { waLink } from "@/lib/site";
import type { TrackingResult, TrackingEvent } from "@/lib/shiprocket";

// ── Status ordering ────────────────────────────────────────────────────────

const STATUS_STAGES = [
  { key: "order_placed", label: "Order placed" },
  { key: "packed", label: "Packed" },
  { key: "picked_up", label: "Picked up" },
  { key: "in_transit", label: "In transit" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

function inferStageIndex(status: string): number {
  const s = status.toLowerCase();
  if (s.includes("delivered")) return 5;
  if (s.includes("out for delivery")) return 4;
  if (s.includes("transit")) return 3;
  if (s.includes("picked up") || s.includes("pickup")) return 2;
  if (s.includes("packed") || s.includes("manifest")) return 1;
  if (s.includes("synced") || s.includes("order")) return 0;
  return 2; // default to in-transit
}

// ── Components ─────────────────────────────────────────────────────────────

function TrackingTimeline({ result }: { result: TrackingResult }) {
  const currentStage = inferStageIndex(result.currentStatus);

  return (
    <div className="mt-8">
      {/* Stage pipeline */}
      <div className="relative mb-10">
        {/* Connector line */}
        <div className="absolute left-3 top-3 bottom-3 w-px bg-paper-soft" />
        <div className="space-y-0">
          {STATUS_STAGES.map((stage, idx) => {
            const done = idx < currentStage;
            const active = idx === currentStage;
            return (
              <div key={stage.key} className="relative flex items-start gap-4 py-3">
                <div className={`relative z-10 mt-0.5 h-6 w-6 flex-shrink-0 rounded-full border-2 flex items-center justify-center
                  ${active ? "border-gold bg-gold" : done ? "border-gold bg-gold/20" : "border-line bg-paper"}`}
                >
                  {done && (
                    <svg className="h-3 w-3 text-gold" fill="currentColor" viewBox="0 0 12 12">
                      <path d="M10 3L5 8.5 2 5.5 1 6.5 5 10.5 11 4z" />
                    </svg>
                  )}
                  {active && <div className="h-2 w-2 rounded-full bg-paper" />}
                </div>
                <div className="pt-0.5">
                  <p className={`text-sm font-medium ${active ? "text-gold" : done ? "text-ink-dim" : "text-ink-faint"}`}>
                    {stage.label}
                  </p>
                  {active && result.currentStatus && (
                    <p className="mt-0.5 text-xs text-ink-faint">{result.currentStatus}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity log */}
      {result.events.length > 0 && (
        <div>
          <p className="eyebrow mb-4">Activity log</p>
          <div className="space-y-3">
            {result.events.map((ev: TrackingEvent, i: number) => (
              <div key={i} className="flex gap-4 rounded-sm border border-line bg-paper px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{ev.activity}</p>
                  {ev.location && <p className="mt-0.5 text-xs text-ink-faint">{ev.location}</p>}
                </div>
                <p className="shrink-0 text-xs text-ink-faint tabular-nums">{ev.date}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function TrackPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = query.trim();
    if (!val) return;

    setLoading(true);
    setResult(null);
    setError(null);

    // Determine what type of query this is
    const isPhone = /^\d{10}$/.test(val.replace(/\s/g, ""));
    const isAWB = /^\d{12,15}$/.test(val);

    const params = new URLSearchParams(
      isAWB ? { awb: val } : isPhone ? { phone: val } : { orderId: val },
    );

    try {
      const res = await fetch(`/api/track?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not fetch tracking information.");
      } else {
        setResult(data as TrackingResult);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-xl px-5 py-14">
        {/* Heading */}
        <p className="eyebrow mb-2">Track your order</p>
        <h1 className="font-serif text-3xl text-ink sm:text-4xl">Where is my package?</h1>
        <p className="mt-3 text-sm text-ink-dim">
          Enter your AWB tracking number, order reference, or registered phone number.
        </p>

        {/* Search form */}
        <form onSubmit={handleSubmit} className="mt-8 flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="AWB, order ID, or phone"
            className="flex-1 rounded-sm border border-line bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink-faint focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="btn btn-primary px-6 py-3 text-sm disabled:opacity-50"
          >
            {loading ? "…" : "Track"}
          </button>
        </form>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-sm border border-rudra/30 bg-rudra/5 px-4 py-3">
            <p className="text-sm text-rudra">{error}</p>
            <p className="mt-2 text-xs text-ink-faint">
              Need help?{" "}
              <a href={waLink(`Hi, I need help tracking my order.`)} className="text-gold underline">
                WhatsApp us
              </a>
            </p>
          </div>
        )}

        {/* Results */}
        {result && <TrackingTimeline result={result} />}

        {/* Help footer */}
        {!result && !error && (
          <div className="mt-12 border-t border-line pt-8 text-center">
            <p className="text-sm text-ink-faint">
              Having trouble?{" "}
              <a href={waLink("Hi, I need help tracking my order.")} className="text-gold underline">
                Chat with us on WhatsApp
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
