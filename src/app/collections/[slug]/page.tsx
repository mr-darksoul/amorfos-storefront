import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProducts } from "@/lib/adminProducts";
import { collections, getCollection } from "@/lib/collections";
import {
  mukhiCollections,
  getMukhiCollection,
  primaryProductsFor,
  combinationsFeaturing,
  mukhiMetaDescription,
  mukhiFaqs,
} from "@/lib/mukhiCollections";
import ProductCard from "@/components/ProductCard";
import { getAllRatingSummaries } from "@/lib/reviews";
import Reveal from "@/components/Reveal";
import { site } from "@/lib/site";
import type { Product } from "@/lib/types";

export const revalidate = 60;

export function generateStaticParams() {
  return [...collections, ...mukhiCollections].map((c) => ({ slug: c.slug }));
}

/** Everything the page renders, resolved for either a form or a Mukhi collection. */
interface View {
  slug: string;
  title: string;
  h1: string;
  eyebrow: string;
  aka?: string;
  metaDescription: string;
  intro: string[];
  facts?: [string, string][];
  items: Product[];
  extra: { heading: string; items: Product[] } | null;
  faqs: { q: string; a: string }[];
  filterHref: string;
  guide?: { href: string; label: string };
  image?: string;
}

async function resolve(slug: string): Promise<View | null> {
  const form = getCollection(slug);
  const mukhi = form ? undefined : getMukhiCollection(slug);
  if (!form && !mukhi) return null;

  const all = await getAdminProducts();

  if (form) {
    const items = all
      .filter((p) => p.category === form.category)
      .sort((a, b) => Number(!!b.bestseller) - Number(!!a.bestseller));
    return {
      slug: form.slug,
      title: form.title,
      h1: form.h1,
      eyebrow: form.eyebrow,
      metaDescription: form.metaDescription,
      intro: form.intro,
      items,
      extra: null,
      faqs: form.faqs,
      filterHref: `/shop?category=${form.category}`,
      image: form.image,
    };
  }

  const c = mukhi!;
  const items = primaryProductsFor(c, all);
  const combos = combinationsFeaturing(c, all);
  const forms = [...new Set(items.map((p) => p.categoryLabel))];
  const origins = [...new Set(items.map((p) => p.origin))];
  return {
    slug: c.slug,
    title: c.title,
    h1: c.label,
    eyebrow: "Shop by Mukhi",
    aka: c.aka,
    metaDescription: mukhiMetaDescription(c, items),
    intro: c.intro,
    facts: [
      ["Ruling deity", c.deity],
      ["Ruling planet", c.planet],
      ...(origins.length ? [["Origins", origins.join(" · ")] as [string, string]] : []),
      ...(forms.length ? [["Available as", forms.join(" · ")] as [string, string]] : []),
      ["Certification", "Lab Certified"],
    ],
    items,
    extra: combos.length
      ? { heading: `Combinations with ${c.label.replace(" Rudraksha", "")}`, items: combos }
      : null,
    faqs: mukhiFaqs(c, items),
    filterHref: "/shop",
    guide: c.journalSlug
      ? { href: `/journal/${c.journalSlug}`, label: `Read the ${c.label} guide` }
      : undefined,
    image: items.find((p) => p.images[0])?.images[0],
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const v = await resolve(slug);
  if (!v) return { title: "Not found" };
  return {
    title: v.title,
    description: v.metaDescription,
    alternates: { canonical: `/collections/${v.slug}` },
    // An empty collection is thin content — don't let it be indexed until stocked.
    ...(v.items.length === 0 ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title: `${v.h1} — ${site.name}`,
      description: v.metaDescription,
      url: `${site.url}/collections/${v.slug}`,
      ...(v.image ? { images: [{ url: v.image }] } : {}),
    },
  };
}

const abs = (u: string) => (/^https?:\/\//.test(u) ? u : `${site.url}${u}`);

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const v = await resolve(slug);
  if (!v) notFound();

  const ratings = await getAllRatingSummaries();
  const url = `${site.url}/collections/${v.slug}`;
  const isMukhi = !!v.facts;
  const listed = [...v.items, ...(v.extra?.items ?? [])];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site.url },
        {
          "@type": "ListItem",
          position: 2,
          name: isMukhi ? "Collections" : "Shop",
          item: isMukhi ? `${site.url}/collections` : `${site.url}/shop`,
        },
        { "@type": "ListItem", position: 3, name: v.h1, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: v.h1,
      description: v.metaDescription,
      url,
      isPartOf: { "@id": `${site.url}/#website` },
      ...(v.facts ? { about: { "@type": "Thing", name: v.h1, alternateName: v.aka } } : {}),
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: listed.length,
        itemListElement: listed.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${site.url}/shop/${p.id}`,
          name: p.name,
          ...(p.images[0] ? { image: abs(p.images[0]) } : {}),
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: v.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  const pill =
    "rounded-full border border-line px-4 py-2 text-sm text-ink-dim transition-colors hover:border-line-strong hover:text-ink";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 md:py-16">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink-faint">
          {isMukhi ? (
            <Link href="/collections" className="hover:text-gold-soft">Collections</Link>
          ) : (
            <Link href="/shop" className="hover:text-gold-soft">Shop</Link>
          )}
          <span>/</span>
          <span className="text-ink-dim">{v.h1}</span>
        </nav>

        {/* Page head */}
        <div className="mb-10 border-b border-line pb-8">
          <p className="eyebrow mb-3">{v.eyebrow}</p>
          <h1 className="display text-4xl sm:text-5xl">{v.h1}</h1>
          {v.aka && (
            <p className="mt-2 font-serif text-lg italic text-ink-dim">Also called {v.aka}</p>
          )}
          <div className="mt-5 grid gap-8 md:grid-cols-[1.5fr_1fr]">
            <div className="max-w-2xl space-y-4 text-sm leading-relaxed text-ink-dim">
              {v.intro.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {v.guide && (
                <p>
                  <Link href={v.guide.href} className="text-gold-soft underline-offset-4 hover:underline">
                    {v.guide.label} →
                  </Link>
                </p>
              )}
            </div>
            {v.facts && (
              <dl className="h-fit divide-y divide-line self-start rounded-sm border border-line text-sm">
                {v.facts.map(([k, val]) => (
                  <div key={k} className="flex justify-between gap-4 px-4 py-3">
                    <dt className="text-ink-faint">{k}</dt>
                    <dd className="text-right text-ink">{val}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
          <p className="mt-5 text-xs uppercase tracking-[0.18em] text-ink-faint">
            {v.items.length} {v.items.length === 1 ? "piece" : "pieces"} ·{" "}
            <Link href={v.filterHref} className="text-gold-soft hover:text-gold">
              {isMukhi ? "Browse all Rudraksha" : "Filter by origin & mukhi"}
            </Link>
          </p>
        </div>

        {/* Grid */}
        {v.items.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-2xl text-ink-dim">Pieces coming soon.</p>
            <Link href="/shop" className="btn btn-outline mt-6">
              Browse all Rudraksha
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
            {v.items.map((p) => (
              <ProductCard key={p.id} product={p} ratings={ratings} />
            ))}
          </div>
        )}

        {v.extra && (
          <section className="mt-20">
            <Reveal className="mb-8">
              <p className="eyebrow mb-3">Also in a set</p>
              <h2 className="display text-3xl sm:text-4xl">{v.extra.heading}</h2>
            </Reveal>
            <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
              {v.extra.items.map((p) => (
                <ProductCard key={p.id} product={p} ratings={ratings} />
              ))}
            </div>
          </section>
        )}

        {/* FAQ — also emitted as FAQPage JSON-LD above */}
        <section className="mt-24 border-t border-line pt-12">
          <Reveal className="mb-8">
            <p className="eyebrow mb-3">Good to know</p>
            <h2 className="display text-3xl sm:text-4xl">
              {isMukhi ? `${v.h1}, answered` : "Questions, answered"}
            </h2>
          </Reveal>
          <dl className="max-w-3xl divide-y divide-line">
            {v.faqs.map((f) => (
              <div key={f.q} className="py-6">
                <dt className="font-serif text-xl text-ink">{f.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-dim">{f.a}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 max-w-3xl text-xs leading-relaxed text-ink-faint">
            Rudraksha is worn on the recommendation of astrologers and pandits. We
            make no medical or miraculous claims.
          </p>
        </section>

        {/* Internal linking — every Mukhi and form page links to its siblings */}
        <section className="mt-20 space-y-8">
          <div>
            <p className="eyebrow mb-4">Shop by Mukhi</p>
            <div className="flex flex-wrap gap-2">
              {mukhiCollections
                .filter((c) => c.slug !== v.slug)
                .map((c) => (
                  <Link key={c.slug} href={`/collections/${c.slug}`} className={pill}>
                    {c.label.replace(" Rudraksha", "")}
                  </Link>
                ))}
            </div>
          </div>
          <div>
            <p className="eyebrow mb-4">Shop by form</p>
            <div className="flex flex-wrap gap-2">
              {collections
                .filter((c) => c.slug !== v.slug)
                .map((c) => (
                  <Link key={c.slug} href={`/collections/${c.slug}`} className={pill}>
                    {c.h1}
                  </Link>
                ))}
              <Link href="/shop" className={pill}>
                All Rudraksha
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
