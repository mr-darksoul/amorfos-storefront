import type { MetadataRoute } from "next";
import { products } from "@/lib/products";
import { collections } from "@/lib/collections";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes = ["", "/shop", "/collections", "/about", "/policies"].map((path) => ({
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

  return [...staticRoutes, ...collectionRoutes, ...productRoutes];
}
