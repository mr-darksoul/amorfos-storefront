import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import { site, waLink } from "@/lib/site";
import { ShieldIcon, LeafIcon, CheckIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Our Story & Contact",
  description:
    "Amorfos is a Delhi house for authentic, Lab Certified Rudraksha, founded by Manav Bansal. From thousands of beads sold on Amazon and Flipkart — now direct to you.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    Icon: ShieldIcon,
    title: "Certified, always",
    text: "Every bead is Lab Certified and sealed before it ships. Authenticity is not a claim — it's documented.",
  },
  {
    Icon: LeafIcon,
    title: "Hand-selected at source",
    text: "We choose each bead from Nepal and Indonesia for face, form and finish. The better pieces are set in silver.",
  },
  {
    Icon: CheckIcon,
    title: "Honest counsel",
    text: "Rudraksha is worn on the recommendation of astrologers and pandits. We share tradition, never miracles.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="grain relative overflow-hidden border-b border-line">
        <div className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 md:py-28">
          <Reveal>
            <p className="eyebrow mb-5">Our story</p>
            <h1 className="display text-4xl sm:text-6xl">
              A quieter way to wear<br />something ancient.
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-ink-dim">
              Amorfos began with a simple belief — that a sacred bead deserves to
              be sourced honestly, certified properly, and presented with the care
              of a fine object. Not a bazaar. A house.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Founder story */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 md:grid-cols-2 md:py-28">
        <Reveal>
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm">
            <Image
              src="/products/mala-9-mukhi-1.jpg"
              alt="Rudraksha mala"
              fill
              sizes="(max-width: 768px) 90vw, 45vw"
              className="object-cover"
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-line" />
          </div>
        </Reveal>
        <Reveal delay={120}>
          <p className="eyebrow mb-4">From {site.address}</p>
          <h2 className="display text-3xl sm:text-4xl">
            Built by {site.founder}, in Delhi.
          </h2>
          <div className="mt-6 space-y-4 leading-relaxed text-ink-dim">
            <p>
              For years, we sold Rudraksha to thousands of customers across India
              on Amazon and Flipkart — learning, with every order, what people
              truly wanted: certainty about what they were wearing.
            </p>
            <p>
              Going direct lets us do that properly. No relabelled middle-market
              beads, no inflated promises. Each piece is hand-selected, set with a
              jeweller&apos;s care, Lab Certified, and sent sealed — with a way to
              reach a real person on the other end.
            </p>
            <p>
              Whether it&apos;s a single five-faced bead or a combination pendant
              recommended by your pandit, we want it to feel like it was chosen for
              you. Because it was.
            </p>
          </div>
          <Link href="/shop" className="btn btn-primary mt-8">
            Explore the collection
          </Link>
        </Reveal>
      </section>

      {/* Values */}
      <section className="border-y border-line bg-paper-raised">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-3 md:py-20">
          {values.map(({ Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 90}>
              <Icon className="mb-5 size-9 text-gold" />
              <h3 className="font-serif text-2xl">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-dim">{text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-3xl px-5 py-20 text-center sm:px-8 md:py-28">
        <Reveal>
          <p className="eyebrow mb-4">Reach us</p>
          <h2 className="display text-3xl sm:text-4xl">We&apos;re a message away.</h2>
          <p className="mx-auto mt-5 max-w-md leading-relaxed text-ink-dim">
            Questions about a bead, your order, or which mukhi to choose? Message
            us on WhatsApp — we usually reply the same day.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={waLink("Hello Amorfos — I'd like some help choosing a Rudraksha.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              WhatsApp · {site.whatsappDisplay}
            </a>
            <a href={`mailto:${site.email}`} className="btn btn-outline">
              {site.email}
            </a>
          </div>

          <p className="mt-10 text-sm text-ink-faint">
            {site.name} · {site.address}
          </p>
        </Reveal>
      </section>
    </>
  );
}
