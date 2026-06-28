import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getArticle,
  getPublishedArticles,
  CLUSTER_LABELS,
} from "@/lib/articles";
import { getAdminProducts } from "@/lib/adminProducts";
import { getCollection } from "@/lib/collections";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { site } from "@/lib/site";
import type { ArticleBlock } from "@/lib/types";

export const revalidate = 60;

export async function generateStaticParams() {
  const articles = await getPublishedArticles();
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Not found" };
  return {
    title: article.title,
    description: article.metaDescription,
    alternates: { canonical: `/journal/${article.slug}` },
    openGraph: {
      type: "article",
      title: `${article.h1} — ${site.name}`,
      description: article.metaDescription,
      url: `${site.url}/journal/${article.slug}`,
      ...(article.heroImage ? { images: [{ url: article.heroImage }] } : {}),
    },
  };
}

function Block({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <h2 className="display mt-12 mb-4 text-2xl sm:text-3xl">{block.text}</h2>
      );
    case "paragraph":
      return <p className="mb-5 leading-relaxed text-ink-dim">{block.text}</p>;
    case "list":
      return (
        <ul className="mb-6 ml-5 list-disc space-y-2 text-ink-dim marker:text-gold-soft">
          {block.items.map((item, i) => (
            <li key={i} className="leading-relaxed">{item}</li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote className="my-8 border-l-2 border-gold pl-5 font-serif text-xl italic text-ink">
          {block.text}
        </blockquote>
      );
    default:
      return null;
  }
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const url = `${site.url}/journal/${article.slug}`;

  // Resolve related products + collections for the "explore" block.
  const relatedProducts = article.relatedProductIds?.length
    ? (await getAdminProducts()).filter((p) =>
        article.relatedProductIds!.includes(p.id),
      )
    : [];
  const relatedCollections = (article.relatedCollectionSlugs ?? [])
    .map((s) => getCollection(s))
    .filter((c): c is NonNullable<typeof c> => !!c);

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site.url },
        { "@type": "ListItem", position: 2, name: "Journal", item: `${site.url}/journal` },
        { "@type": "ListItem", position: 3, name: article.h1, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.h1,
      description: article.metaDescription,
      url,
      mainEntityOfPage: url,
      ...(article.heroImage ? { image: article.heroImage } : {}),
      author: { "@type": "Organization", name: article.author || site.name },
      publisher: {
        "@type": "Organization",
        name: site.name,
        url: site.url,
        logo: { "@type": "ImageObject", url: `${site.url}/brand/logo-dark.png` },
      },
      isPartOf: { "@type": "Blog", name: `The Journal — ${site.name}`, url: `${site.url}/journal` },
      articleSection: CLUSTER_LABELS[article.cluster],
    },
  ];

  if (article.faqs?.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: article.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    });
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8 md:py-16">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-ink-faint">
          <Link href="/journal" className="hover:text-gold-soft">Journal</Link>
          <span>/</span>
          <span className="text-ink-dim">{CLUSTER_LABELS[article.cluster]}</span>
        </nav>

        {/* Head */}
        <header className="mb-10 border-b border-line pb-8">
          <p className="eyebrow mb-3">{article.eyebrow || CLUSTER_LABELS[article.cluster]}</p>
          <h1 className="display text-4xl leading-tight sm:text-5xl">{article.h1}</h1>
          <p className="mt-5 text-base leading-relaxed text-ink-dim">{article.excerpt}</p>
          <p className="mt-5 text-xs uppercase tracking-[0.18em] text-ink-faint">
            {article.author || site.name}
            {article.readingMinutes ? ` · ${article.readingMinutes} min read` : ""}
          </p>
        </header>

        {/* Body */}
        <div className="text-[1.02rem]">
          {article.body.map((block, i) => (
            <Block key={i} block={block} />
          ))}
        </div>

        {/* FAQ */}
        {article.faqs?.length ? (
          <section className="mt-16 border-t border-line pt-10">
            <p className="eyebrow mb-6">Good to know</p>
            <dl className="divide-y divide-line">
              {article.faqs.map((f) => (
                <div key={f.q} className="py-6">
                  <dt className="font-serif text-xl text-ink">{f.q}</dt>
                  <dd className="mt-2 text-sm leading-relaxed text-ink-dim">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {/* Compliance line, mirroring the footer */}
        <p className="mt-12 rounded-sm bg-paper-raised px-4 py-3 text-xs leading-relaxed text-ink-faint">
          Rudraksha is traditionally worn on the recommendation of astrologers
          and pandits. We make no medical or miraculous claims. Every Amorfos
          bead is Lab Certified for authenticity and origin.
        </p>
      </article>

      {/* Explore — internal links to products & collections */}
      {(relatedProducts.length > 0 || relatedCollections.length > 0) && (
        <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
          <div className="border-t border-line pt-12">
            <Reveal className="mb-8">
              <p className="eyebrow mb-3">From the collection</p>
              <h2 className="display text-3xl sm:text-4xl">Shop what you read about</h2>
            </Reveal>

            {relatedProducts.length > 0 && (
              <div className="mb-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
                {relatedProducts.slice(0, 4).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {relatedCollections.map((c) => (
                <Link
                  key={c.slug}
                  href={`/collections/${c.slug}`}
                  className="rounded-full border border-line px-4 py-2 text-sm text-ink-dim transition-colors hover:border-line-strong hover:text-ink"
                >
                  {c.h1}
                </Link>
              ))}
              <Link
                href="/journal"
                className="rounded-full border border-line px-4 py-2 text-sm text-ink-dim transition-colors hover:border-line-strong hover:text-ink"
              >
                More from the Journal
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
