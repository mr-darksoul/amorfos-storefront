import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import ArticleCard from "@/components/ArticleCard";
import { categoryMeta } from "@/lib/products";
import { collectionHref } from "@/lib/collections";
import { mukhiCollections } from "@/lib/mukhiCollections";
import { buildHomeFaqs } from "@/lib/homeFaqs";
import { getPublishedArticles } from "@/lib/articles";
import { getAdminProducts } from "@/lib/adminProducts";
import { getAllRatingSummaries } from "@/lib/reviews";
import { site } from "@/lib/site";
import { ShieldIcon, TruckIcon, ReturnIcon, LeafIcon, ArrowIcon } from "@/components/icons";
import type { Category } from "@/lib/types";

export const revalidate = 60;

const HOME_TITLE = "Buy Original Rudraksha Online — Lab Certified | Amorfos";
const HOME_DESCRIPTION =
  "Shop original, Lab Certified Rudraksha online — 1 to 14 Mukhi pendants, Gauri Shankar and malas from Nepal & Indonesia, set in silver. Free shipping over ₹999.";

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: HOME_TITLE, description: HOME_DESCRIPTION, url: "/" },
  twitter: { title: HOME_TITLE, description: HOME_DESCRIPTION },
};

const trust = [
  { Icon: ShieldIcon, title: "Lab Certified", text: "Every bead, individually certified." },
  { Icon: TruckIcon, title: "Free shipping", text: "On all orders above ₹999." },
  { Icon: ReturnIcon, title: "7-day returns", text: "On unused, sealed products." },
  { Icon: LeafIcon, title: "5,000+ beads delivered", text: "To homes across India since 2018." },
];

// Homepage lead products. 5 and 7 Mukhi are what most people start with
// (by far the most-bought beads historically), so they front the store.
// Falls back to whatever is live if an id is ever deactivated.
const HERO_ID = "5-mukhi-nepal";
const FEATURED_IDS = ["5-mukhi-nepal", "7-mukhi-nepal", "6-mukhi-nepal", "9-mukhi-indonesia"];

const cats: Category[] = ["pendant", "mala", "combination", "loose"];
const catImage: Record<Category, string> = {
  pendant: "/products/pendant-7-mukhi-1.jpg",
  mala: "/products/mala-5-mukhi-1.jpg",
  combination: "/products/combo-kaalsarp-1.jpg",
  loose: "/products/loose-gauri-1.jpg",
};

export default async function Home() {
  const [products, ratings] = await Promise.all([getAdminProducts(), getAllRatingSummaries()]);
  const heroProduct = products.find((p) => p.id === HERO_ID) ?? products[0];
  // Caption is derived from the hero product so it can never drift from the image.
  const heroSpec = heroProduct.mukhiLabel;
  const heroName =
    heroProduct.mukhi != null
      ? `${heroProduct.mukhi} Mukhi Rudraksha ${heroProduct.categoryLabel}`
      : `Rudraksha ${heroProduct.categoryLabel}`;
  const featured = FEATURED_IDS.map((id) => products.find((p) => p.id === id)).filter(
    (p): p is (typeof products)[number] => !!p,
  );
  const bestsellers = (featured.length >= 2 ? featured : products).slice(0, 4);
  const recentArticles = (await getPublishedArticles()).slice(0, 3);

  // Answer-first Q&A (shared with /llms-full.txt), rendered visibly and as FAQPage JSON-LD.
  const homeFaqs = buildHomeFaqs(products);
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homeFaqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      {/* ───────────────────────── Hero ───────────────────────── */}
      <section className="grain relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-paper via-paper to-paper-raised" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 pt-12 sm:px-8 md:grid-cols-2 md:gap-6 md:pb-24 md:pt-16">
          <div className="order-2 md:order-1">
            <Reveal>
              {/* The h1 carries the search phrase; the display line is the brand voice. */}
              <h1 className="eyebrow mb-6">Original, Lab Certified Rudraksha · Delhi</h1>
            </Reveal>
            <Reveal delay={80}>
              <p className="display text-5xl sm:text-6xl lg:text-7xl">
                The bead that<br />
                <span className="text-gold-soft italic">steadies</span> you.
              </p>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-7 max-w-md text-base leading-relaxed text-ink-dim">
                Authentic, Lab Certified Rudraksha — hand-selected from Nepal and
                Indonesia, finished in silver, strung on red thread. Worn for
                centuries, on the recommendation of astrologers and pandits.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link href="/shop" className="btn btn-primary">
                  Shop the collection <ArrowIcon className="size-4" />
                </Link>
                <Link href="/about" className="btn btn-outline">
                  Our story
                </Link>
              </div>
            </Reveal>
          </div>

          <div className="order-1 md:order-2">
            <Reveal delay={120}>
              <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-sm">
                {heroProduct.images[0] && (
                  <Image
                    src={heroProduct.images[0]}
                    alt={heroProduct.name}
                    fill
                    priority
                    sizes="(max-width: 768px) 90vw, 40vw"
                    className="object-cover"
                  />
                )}
                <div className="absolute inset-0 ring-1 ring-inset ring-line" />
                <div className="absolute bottom-4 left-4 rounded-sm bg-dark/75 px-4 py-3 backdrop-blur-md">
                  <p className="text-[0.6rem] uppercase tracking-[0.2em] text-gold-soft">
                    {heroSpec}
                  </p>
                  <p className="font-serif text-lg text-cream">{heroName}</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ──────────────────────── Trust strip ──────────────────── */}
      <section className="border-y border-line bg-paper-raised">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-5 py-2 sm:px-8 md:grid-cols-4">
          {trust.map(({ Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3 px-2 py-5">
              <Icon className="size-7 shrink-0 text-gold" />
              <div>
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="text-xs text-ink-faint">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──────────────────────── Bestsellers ──────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
        <Reveal className="mb-12 flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow mb-3">Most chosen</p>
            <h2 className="display text-4xl sm:text-5xl">Where most begin</h2>
          </div>
          <Link
            href="/shop"
            className="hidden shrink-0 items-center gap-2 text-sm tracking-[0.16em] uppercase text-ink-dim hover:text-gold-soft sm:flex"
          >
            View all <ArrowIcon className="size-4" />
          </Link>
        </Reveal>

        <div className="grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
          {bestsellers.map((p, i) => (
            <Reveal key={p.id} delay={i * 80}>
              <ProductCard product={p} ratings={ratings} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ──────────────── Editorial: The Rudraksha ─────────────── */}
      <section className="relative overflow-hidden border-y border-line bg-paper-raised">
        <div className="mx-auto grid max-w-7xl items-stretch gap-0 md:grid-cols-2">
          <div className="relative min-h-[360px] bg-white md:min-h-[560px]">
            <Image
              src="/products/pendant-9-mukhi-1.jpg"
              alt="A single Rudraksha bead in silver capping"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain"
            />
          </div>
          <div className="flex flex-col justify-center px-6 py-16 sm:px-12 md:px-16">
            <Reveal>
              <p className="eyebrow mb-5">The seed of Shiva</p>
              <h2 className="display text-4xl sm:text-5xl">
                A teardrop,<br />turned to stone.
              </h2>
              <p className="mt-6 max-w-md leading-relaxed text-ink-dim">
                Born of the <em>Elaeocarpus ganitrus</em> tree, the Rudraksha has
                been worn for millennia for stillness, clarity and resolve. Its
                faces — its <em>mukhi</em> — each carry a ruling deity and planet,
                and a quiet purpose.
              </p>
              <p className="mt-4 max-w-md leading-relaxed text-ink-dim">
                We hand-select each bead, set the finer pieces in silver, and have
                every one Lab Certified before it reaches you.
              </p>
              <Link href="/about" className="btn btn-outline mt-8 self-start">
                Read our story
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─────────────────── Shop by form ──────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
        <Reveal className="mb-12 text-center">
          <p className="eyebrow mb-3">Find your bead</p>
          <h2 className="display text-4xl sm:text-5xl">Shop by form</h2>
        </Reveal>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {cats.map((c, i) => (
            <Reveal key={c} delay={i * 70}>
              <Link
                href={collectionHref(c)}
                className="group relative block aspect-[3/4] overflow-hidden rounded-sm"
              >
                <Image
                  src={catImage[c]}
                  alt={categoryMeta[c].plural}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark/95 via-dark/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <h3 className="font-serif text-2xl text-cream">{categoryMeta[c].plural}</h3>
                  <p className="mt-1 text-xs leading-snug text-cream/75">
                    {categoryMeta[c].blurb}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─────────────────── Shop by Mukhi ──────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 pb-4 sm:px-8">
        <Reveal className="mb-8 text-center">
          <p className="eyebrow mb-3">Know your bead?</p>
          <h2 className="display text-3xl sm:text-4xl">Shop by Mukhi</h2>
        </Reveal>
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2">
          {mukhiCollections.map((c) => (
            <Link
              key={c.slug}
              href={`/collections/${c.slug}`}
              className="rounded-full border border-line px-4 py-2 text-sm text-ink-dim transition-colors hover:border-line-strong hover:text-ink"
            >
              {c.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ──────────────────────── From the Journal ─────────────── */}
      {recentArticles.length > 0 && (
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-28">
          <Reveal className="mb-12 flex items-end justify-between gap-6">
            <div>
              <p className="eyebrow mb-3">Read</p>
              <h2 className="display text-4xl sm:text-5xl">From the Journal</h2>
            </div>
            <Link
              href="/journal"
              className="hidden shrink-0 items-center gap-2 text-sm tracking-[0.16em] uppercase text-ink-dim hover:text-gold-soft sm:flex"
            >
              All guides <ArrowIcon className="size-4" />
            </Link>
          </Reveal>

          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {recentArticles.map((a, i) => (
              <Reveal key={a.slug} delay={i * 80}>
                <ArticleCard article={a} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* ─────────────────── Questions ─────────────────────────── */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 md:py-24">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
        <div className="grid gap-10 md:grid-cols-[1fr_2fr]">
          <Reveal>
            <p className="eyebrow mb-3">Before you choose</p>
            <h2 className="display text-4xl sm:text-5xl">Questions, answered</h2>
            <Link
              href="/journal/how-to-identify-original-rudraksha"
              className="mt-6 inline-block text-sm text-gold-soft underline-offset-4 hover:underline"
            >
              How to identify an original Rudraksha →
            </Link>
          </Reveal>
          <dl className="divide-y divide-line">
            {homeFaqs.map((f) => (
              <div key={f.q} className="py-5 first:pt-0">
                <dt className="font-serif text-xl text-ink">{f.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-dim">{f.a}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─────────────────── Assurance band ────────────────────── */}
      <section className="grain relative overflow-hidden bg-paper">
        <div className="relative mx-auto max-w-4xl px-5 py-20 text-center sm:px-8 md:py-28">
          <Reveal>
            <ShieldIcon className="mx-auto mb-6 size-10 text-gold" />
            <h2 className="display text-3xl sm:text-4xl">
              Certified. Sealed. Sent with care.
            </h2>
            <p className="mx-auto mt-6 max-w-xl leading-relaxed text-ink-dim">
              Every Amorfos piece arrives with its Lab Certificate, sealed for
              authenticity. Should it not be right for you, return any unused,
              sealed product within 7 days. Over 5,000 beads delivered since 2018,
              first through Amazon and Flipkart — the same care now comes to you directly.
            </p>
            <Link href="/policies#authenticity" className="btn btn-outline mt-8">
              How we certify
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
