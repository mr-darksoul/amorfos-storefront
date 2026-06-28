"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import NewsletterForm from "./NewsletterForm";

const STORAGE_KEY = "amorfos.lead.v1";
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000; // re-ask after 14 days
const SHOW_DELAY_MS = 14_000; // quiet: only after a real visit

// Never interrupt a purchase or the admin/journal flows.
const SUPPRESSED = ["/checkout", "/thank-you", "/admin", "/reviews"];

function recentlyHandled(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (raw === "subscribed") return true;
    return Number.isFinite(ts) && Date.now() - ts < SNOOZE_MS;
  } catch {
    return false;
  }
}

function mark(value: "snoozed" | "subscribed"): void {
  try {
    localStorage.setItem(STORAGE_KEY, value === "subscribed" ? "subscribed" : String(Date.now()));
  } catch {
    /* ignore */
  }
}

export default function LeadCapture() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const suppressed = SUPPRESSED.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (suppressed || recentlyHandled()) return;

    let done = false;
    const trigger = () => {
      if (done) return;
      done = true;
      setOpen(true);
    };

    const timer = setTimeout(trigger, SHOW_DELAY_MS);

    // Exit-intent: pointer leaves toward the top of the viewport (desktop).
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) trigger();
    };
    document.addEventListener("mouseleave", onLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [suppressed]);

  // Esc to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    mark("snoozed");
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Get our guide to choosing a mukhi"
    >
      <div
        className="absolute inset-0 bg-dark/50 backdrop-blur-sm"
        onClick={close}
        aria-hidden
      />
      <div className="grain relative w-full max-w-md overflow-hidden rounded-sm border border-line bg-paper p-7 shadow-xl sm:p-9">
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-4 top-4 text-ink-faint transition-colors hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>

        <p className="eyebrow mb-3">Find your bead</p>
        <h2 className="display text-3xl">Choosing your mukhi?</h2>
        <p className="mt-4 text-sm leading-relaxed text-ink-dim">
          A short, honest guide to the Rudraksha mukhi — their ruling deity and
          planet, and who traditionally wears each. Leave your email and we&rsquo;ll
          send it over.
        </p>

        <div className="mt-6">
          <NewsletterForm
            source="modal"
            showPhone
            onSuccess={() => {
              mark("subscribed");
              setTimeout(() => setOpen(false), 2500);
            }}
          />
        </div>

        <p className="mt-4 text-[0.7rem] leading-relaxed text-ink-faint">
          No spam, ever. Unsubscribe anytime. We share tradition, not miracles.
        </p>
      </div>
    </div>
  );
}
