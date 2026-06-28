import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedArticles, CLUSTER_LABELS } from "@/lib/articles";
import ArticleCard from "@/components/ArticleCard";
import Reveal from "@/components/Reveal";
import { site } from "@/lib/site";
import type { ArticleCluster } from "@/lib/types";

export const revalidate = 60;

const title = "The Journal — Rudraksha Guides & Wisdom";
const metaDescription =
  "Guides to Rudraksha — mukhi meanings, how to tell an original bead, care, and the traditions behind each piece. From Amorfos, a Delhi house of Lab Certified Rudraksha.";

export const metadata: Metadata = {
  title,
  description: metaDescription,
  alternates: { canonical: "/journal" },
  openGraph: {
    title: `The Journal — ${site.name}`,
    description: metaDescription,
    url: `${site.url}/journal`,
  },
};

// Order clusters consistently in the grouped view.
const CLUSTER_ORDER: ArticleCluster[] = [
  "mukhi",
  "authenticity",
  "care",
  "remedies",
  "mala",
];

export default async function JournalPage() {
  const articles = await getPublishedArticles();
  const url = `${site.url}/journal`;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: `The Journal — ${site.name}`,
      description: metaDescription,
      url,
      publisher: { "@type": "Organization", name: site.name, url: site.url },
      blogPost: articles.map((a) => ({
        "@type": "BlogPosting",
        headline: a.h1,
        url: `${site.url}/journal/${a.slug}`,
        description: a.excerpt,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site.url },
        { "@type": "ListItem", position: 2, name: "Journal", item: url },
      ],
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
          <Link href="/" className="hover:text-gold-soft">Home</Link>
          <span>/</span>
          <span className="text-ink-dim">Journal</span>
        </nav>

        {/* Page head */}
        <div className="mb-14 border-b border-line pb-8">
          <p className="eyebrow mb-3">The Journal</p>
          <h1 className="display text-4xl sm:text-5xl">Rudraksha, explained</h1>
          <p className="mt-5 max-w-2xl text-sm leading-relaxed text-ink-dim">
            Guides to the bead — the meaning of each mukhi, how to tell an
            original Rudraksha, how to wear and care for one, and the traditions
            behind every piece. Written by the Amorfos house; nothing here is a
            medical or miraculous claim — Rudraksha is worn on the recommendation
            of astrologers and pandits.
          </p>
        </div>

        {articles.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-2xl text-ink-dim">
              The first guides are on their way.
            </p>
            <Link href="/shop" className="btn btn-outline mt-6">
              Browse the collection
            </Link>
          </div>
        ) : (
          CLUSTER_ORDER.filter((c) => articles.some((a) => a.cluster === c)).map(
            (cluster) => {
              const inCluster = articles.filter((a) => a.cluster === cluster);
              return (
                <section key={cluster} className="mb-16">
                  <Reveal className="mb-7">
                    <h2 className="font-serif text-2xl text-ink">
                      {CLUSTER_LABELS[cluster]}
                    </h2>
                  </Reveal>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                    {inCluster.map((a, i) => (
                      <Reveal key={a.slug} delay={i * 60}>
                        <ArticleCard article={a} />
                      </Reveal>
                    ))}
                  </div>
                </section>
              );
            },
          )
        )}
      </div>
    </>
  );
}
