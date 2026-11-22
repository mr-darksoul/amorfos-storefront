import { getAdminProducts } from "@/lib/adminProducts";
import { site } from "@/lib/site";
import type { Category, Product } from "@/lib/types";

// Google Merchant Center product feed (RSS 2.0 + g: namespace), fetched on a
// schedule by Merchant Center. Shipping and returns are set at account level.
export const revalidate = 3600;

// Health-outcome names breach Google's health-claims policy and put a new
// Merchant Center account at risk of suspension; keep them out of Shopping.
const EXCLUDED_NAME_TERMS = /health|immunity|pain|dard|hriday|fitness|arogya/i;

const GOOGLE_CATEGORY: Record<Category, string> = {
  pendant: "Apparel & Accessories > Jewelry > Charms & Pendants",
  combination: "Apparel & Accessories > Jewelry > Charms & Pendants",
  mala: "Religious & Ceremonial > Religious Items > Prayer Beads",
  loose: "Religious & Ceremonial > Religious Items",
};

function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absoluteUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${site.url}${path.startsWith("/") ? "" : "/"}${path}`;
}

const isImagePath = (s: string) => /^(https?:\/\/|\/)\S+$/.test(s.trim());

function item(p: Product): string {
  const [image, ...more] = p.images.filter(isImagePath).map((s) => absoluteUrl(s.trim()));
  const description = (p.description || p.tagline || p.name).replace(/\s+/g, " ").trim();
  const availability = p.stock === 0 ? "out_of_stock" : "in_stock";
  return [
    "<item>",
    `<g:id>${xml(p.id)}</g:id>`,
    `<g:title>${xml(p.name.slice(0, 150))}</g:title>`,
    `<g:description>${xml(description.slice(0, 5000))}</g:description>`,
    `<g:link>${xml(`${site.url}/shop/${p.id}`)}</g:link>`,
    `<g:image_link>${xml(image)}</g:image_link>`,
    ...more.slice(0, 10).map((u) => `<g:additional_image_link>${xml(u)}</g:additional_image_link>`),
    `<g:price>${p.price.toFixed(2)} INR</g:price>`,
    `<g:availability>${availability}</g:availability>`,
    "<g:condition>new</g:condition>",
    `<g:brand>${xml(site.name)}</g:brand>`,
    "<g:identifier_exists>no</g:identifier_exists>",
    `<g:google_product_category>${xml(GOOGLE_CATEGORY[p.category])}</g:google_product_category>`,
    `<g:product_type>${xml(`Rudraksha > ${p.categoryLabel}`)}</g:product_type>`,
    "</item>",
  ].join("");
}

export async function GET() {
  const products = (await getAdminProducts()).filter(
    (p) => p.images?.some(isImagePath) && p.price > 0 && !EXCLUDED_NAME_TERMS.test(p.name),
  );

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>` +
    `<title>${xml(site.name)}</title><link>${xml(site.url)}</link>` +
    `<description>${xml(site.tagline)}</description>` +
    products.map(item).join("") +
    `</channel></rss>`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
