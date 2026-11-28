import type { MetadataRoute } from "next";
import { getAdminProducts } from "@/lib/adminProducts";
import { collections } from "@/lib/collections";
import { mukhiCollections, primaryProductsFor } from "@/lib/mukhiCollections";
import { getPublishedArticles } from "@/lib/articles";
import { site } from "@/lib/site";

// Rebuilt hourly so new listings and articles appear without a deploy.
export const revalidate = 3600;

const abs = (u: string) => (/^https?:\/\//.test(u) ? u : `${site.url}${u}`);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // The LIVE catalogue (Supabase, active only) — not the static products.ts,
  // which still lists ~130 retired ids that now redirect.
  const [products, articles] = await Promise.all([getAdminProducts(), getPublishedArticles()]);

  const latestArticle = articles
    .map((a) => a.updatedAt || a.publishedAt)
    .filter((d): d is string => !!d)
    .sort()
    .at(-1);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/shop`, changeFrequency: "daily", priority: 0.9 },
    { url: `${site.url}/collections`, changeFrequency: "weekly", priority: 0.8 },
    {
      url: `${site.url}/journal`,
      changeFrequency: "weekly",
      priority: 0.7,
      ...(latestArticle ? { lastModified: new Date(latestArticle) } : {}),
    },
    { url: `${site.url}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site.url}/policies`, changeFrequency: "monthly", priority: 0.4 },
  ];

  // Form collections + per-Mukhi pages — the indexable destinations for head terms.
  // Empty collections render "coming soon" — keep them out until stocked.
  const collectionRoutes: MetadataRoute.Sitemap = collections
    .filter((c) => products.some((p) => p.category === c.category))
    .map((c) => ({
    url: `${site.url}/collections/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.9,
    images: products
      .filter((p) => p.category === c.category && p.images[0])
      .slice(0, 5)
      .map((p) => abs(p.images[0])),
  }));

  const mukhiRoutes: MetadataRoute.Sitemap = mukhiCollections
    .map((c) => ({ c, items: primaryProductsFor(c, products) }))
    .filter(({ items }) => items.length > 0)
    .map(({ c, items }) => ({
      url: `${site.url}/collections/${c.slug}`,
      changeFrequency: "weekly",
      priority: 0.9,
      images: items.filter((p) => p.images[0]).slice(0, 5).map((p) => abs(p.images[0])),
    }));

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${site.url}/shop/${p.id}`,
    changeFrequency: "weekly",
    priority: 0.7,
    ...(p.images.length ? { images: p.images.slice(0, 5).map(abs) } : {}),
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => {
    const modified = a.updatedAt || a.publishedAt;
    return {
      url: `${site.url}/journal/${a.slug}`,
      changeFrequency: "monthly",
      priority: 0.6,
      ...(modified ? { lastModified: new Date(modified) } : {}),
      ...(a.heroImage ? { images: [abs(a.heroImage)] } : {}),
    };
  });

  return [...staticRoutes, ...collectionRoutes, ...mukhiRoutes, ...productRoutes, ...articleRoutes];
}
