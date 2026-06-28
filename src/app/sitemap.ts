import type { MetadataRoute } from "next";
import { products } from "@/lib/products";
import { collections } from "@/lib/collections";
import { getPublishedArticles } from "@/lib/articles";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const staticRoutes = ["", "/shop", "/collections", "/journal", "/about", "/policies"].map((path) => ({
    url: `${site.url}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  // Category landing pages — the indexable destinations for head terms.
  const collectionRoutes = collections.map((c) => ({
    url: `${site.url}/collections/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const productRoutes = products.map((p) => ({
    url: `${site.url}/shop/${p.id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Journal articles — top-of-funnel SEO content (published only).
  const articles = await getPublishedArticles();
  const articleRoutes = articles.map((a) => ({
    url: `${site.url}/journal/${a.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...collectionRoutes, ...articleRoutes, ...productRoutes];
}
