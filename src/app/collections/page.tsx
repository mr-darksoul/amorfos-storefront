import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { collections } from "@/lib/collections";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Rudraksha Collections — Pendants, Malas & More",
  description:
    "Browse Amorfos Rudraksha by form — Lab Certified pendants, malas, combination pieces and loose beads, in hand-finished silver.",
  alternates: { canonical: "/collections" },
};

export default function CollectionsIndex() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 md:py-16">
      <div className="mb-10 border-b border-line pb-8">
        <p className="eyebrow mb-3">Find your bead</p>
        <h1 className="display text-4xl sm:text-5xl">Shop by form</h1>
        <p className="mt-3 max-w-xl text-sm text-ink-dim">
          Pendants, malas, combination pieces and loose beads — each one Lab Certified.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {collections.map((c, i) => (
          <Reveal key={c.slug} delay={i * 70}>
            <Link
              href={`/collections/${c.slug}`}
              className="group relative block aspect-[3/4] overflow-hidden rounded-sm"
            >
              <Image
                src={c.image}
                alt={c.h1}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark/95 via-dark/35 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h2 className="font-serif text-2xl text-cream">{c.h1}</h2>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
