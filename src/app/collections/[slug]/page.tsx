import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProducts } from "@/lib/adminProducts";
import { collections, getCollection } from "@/lib/collections";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { site } from "@/lib/site";

export const revalidate = 60;

export function generateStaticParams() {
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) return { title: "Not found" };
  return {
    title: collection.title,
    description: collection.metaDescription,
    alternates: { canonical: `/collections/${collection.slug}` },
    openGraph: {
      title: `${collection.h1} — ${site.name}`,
      description: collection.metaDescription,
      url: `${site.url}/collections/${collection.slug}`,
      images: [{ url: collection.image }],
    },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();

  const all = await getAdminProducts();
  const items = all
    .filter((p) => p.category === collection.category)
    .sort((a, b) => Number(!!b.bestseller) - Number(!!a.bestseller));

  const others = collections.filter((c) => c.slug !== collection.slug);
  const url = `${site.url}/collections/${collection.slug}`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site.url },
        { "@type": "ListItem", position: 2, name: "Shop", item: `${site.url}/shop` },
        { "@type": "ListItem", position: 3, name: collection.h1, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: collection.h1,
      description: collection.metaDescription,
      url,
      isPartOf: { "@type": "WebSite", name: site.name, url: site.url },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: items.length,
        itemListElement: items.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          url: `${site.url}/shop/${p.id}`,
          name: p.name,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: collection.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 md:py-16">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink-faint">
          <Link href="/shop" className="hover:text-gold-soft">Shop</Link>
          <span>/</span>
          <span className="text-ink-dim">{collection.h1}</span>
        </nav>

        {/* Page head */}
        <div className="mb-10 border-b border-line pb-8">
          <p className="eyebrow mb-3">{collection.eyebrow}</p>
          <h1 className="display text-4xl sm:text-5xl">{collection.h1}</h1>
          <div className="mt-5 max-w-2xl space-y-4 text-sm leading-relaxed text-ink-dim">
            {collection.intro.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
          <p className="mt-5 text-xs uppercase tracking-[0.18em] text-ink-faint">
            {items.length} {items.length === 1 ? "piece" : "pieces"} ·{" "}
            <Link href={`/shop?category=${collection.category}`} className="text-gold-soft hover:text-gold">
              Filter by origin &amp; mukhi
            </Link>
          </p>
        </div>

        {/* Grid */}
        {items.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-2xl text-ink-dim">Pieces coming soon.</p>
            <Link href="/shop" className="btn btn-outline mt-6">
              Browse all Rudraksha
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-3">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* FAQ — also emitted as FAQPage JSON-LD above */}
        <section className="mt-24 border-t border-line pt-12">
          <Reveal className="mb-8">
            <p className="eyebrow mb-3">Good to know</p>
            <h2 className="display text-3xl sm:text-4xl">Questions, answered</h2>
          </Reveal>
          <dl className="max-w-3xl divide-y divide-line">
            {collection.faqs.map((f) => (
              <div key={f.q} className="py-6">
                <dt className="font-serif text-xl text-ink">{f.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-ink-dim">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Explore other collections — internal linking */}
        <section className="mt-20">
          <p className="eyebrow mb-6">Explore more</p>
          <div className="flex flex-wrap gap-3">
            {others.map((c) => (
              <Link
                key={c.slug}
                href={`/collections/${c.slug}`}
                className="rounded-full border border-line px-4 py-2 text-sm text-ink-dim transition-colors hover:border-line-strong hover:text-ink"
              >
                {c.h1}
              </Link>
            ))}
            <Link
              href="/shop"
              className="rounded-full border border-line px-4 py-2 text-sm text-ink-dim transition-colors hover:border-line-strong hover:text-ink"
            >
              All Rudraksha
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
