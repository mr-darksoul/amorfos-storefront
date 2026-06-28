import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { site, waLink } from "@/lib/site";

export const metadata: Metadata = {
  title: "Subscription confirmed",
  description: "Your Amorfos guide is on its way.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/newsletter/confirmed" },
};

type State = "confirmed" | "already" | "invalid" | "expired";

const COPY: Record<State, { eyebrow: string; heading: string; body: string; showCheck: boolean }> = {
  confirmed: {
    eyebrow: "You're in",
    heading: "Your guide is on its way.",
    body:
      "Thank you for confirming. The Complete Guide to Choosing Your Rudraksha Mukhi is landing in your inbox right now — keep an eye out from care@amorfos.in.",
    showCheck: true,
  },
  already: {
    eyebrow: "Already confirmed",
    heading: "You're already on the list.",
    body:
      "This link was already used — your guide was sent when you first confirmed. Check your inbox (and spam) for an email from care@amorfos.in, or message us and we'll resend it.",
    showCheck: true,
  },
  expired: {
    eyebrow: "Link expired",
    heading: "This confirmation link has expired.",
    body:
      "For your security, confirmation links last seven days. Pop your email into the form again and we'll send a fresh one.",
    showCheck: false,
  },
  invalid: {
    eyebrow: "Link not found",
    heading: "We couldn't confirm that link.",
    body:
      "This confirmation link is invalid or has already been used. Try subscribing again, or message us on WhatsApp and we'll sort it out.",
    showCheck: false,
  },
};

export default async function NewsletterConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const key: State = (["confirmed", "already", "invalid", "expired"] as const).includes(
    state as State,
  )
    ? (state as State)
    : "invalid";
  const copy = COPY[key];

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-5 py-20 text-center sm:px-8">
      {copy.showCheck && (
        <div className="grid size-16 place-items-center rounded-full border border-gold text-gold">
          <CheckIcon className="size-8" />
        </div>
      )}
      <p className="eyebrow mt-8 mb-3">{copy.eyebrow}</p>
      <h1 className="display text-4xl sm:text-5xl">{copy.heading}</h1>
      <p className="mx-auto mt-5 max-w-md leading-relaxed text-ink-dim">{copy.body}</p>

      <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
        <Link href="/shop" className="btn btn-primary">
          Explore the collection
        </Link>
        <a
          href={waLink("Hi Amorfos, I have a question about the mukhi guide.")}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          Message us on WhatsApp
        </a>
      </div>

      <p className="mt-10 text-xs text-ink-faint">
        {site.name} · {site.address}
      </p>
    </div>
  );
}
