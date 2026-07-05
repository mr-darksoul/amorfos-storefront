export type Category = "mala" | "pendant" | "combination" | "loose";

export type Origin = "Nepal" | "Indonesia" | "India" | "Mixed";

// A single physical bead is always from one place — never "Mixed".
export type BeadOrigin = "Nepal" | "Indonesia" | "India";

// One bead within a combination piece. Combinations can have any number.
export interface Bead {
  mukhi: number; // face count of this bead
  origin: BeadOrigin; // where this individual bead is from
  note?: string; // optional one-line benefit / description
}

export interface Product {
  id: string; // slug, used in /shop/[id]
  name: string;
  category: Category;
  categoryLabel: string;
  mukhi: number | null; // null for multi-bead combinations
  mukhiLabel: string;
  origin: Origin; // "Mixed" for multi-origin combinations
  beads?: Bead[]; // per-bead composition; combinations only
  beadSize: string; // e.g. "18–22 mm"
  deity: string;
  planet: string;
  price: number; // INR, what the customer pays
  mrp: number; // INR, struck-through reference price
  images: string[];
  tagline: string; // short one-liner for cards / hero
  description: string; // 1–2 paragraphs
  benefits: string[];
  bestseller?: boolean;
  newArrival?: boolean;
  /**
   * Units in stock. Inventory is opt-in per product:
   *   - undefined / null → untracked (treated as always available)
   *   - a number         → tracked; 0 means sold out
   * Decremented atomically on confirmed payment (see verify-payment + the
   * decrement_stock SQL function).
   */
  stock?: number | null;
}

export interface CartLine {
  id: string;
  qty: number;
}

// ── Journal (content marketing) ────────────────────────────────────
// Articles are stored in Supabase as a JSON blob (mirrors the Product
// pattern). Body is a list of typed blocks rather than raw HTML so the
// renderer stays XSS-safe and the brand styling is applied per block.

export type ArticleCluster =
  | "mukhi"
  | "authenticity"
  | "care"
  | "remedies"
  | "mala";

export type ArticleStatus = "draft" | "published";

export type ArticleBlock =
  | { type: "heading"; text: string } // rendered as <h2>
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string };

export interface Article {
  slug: string; // used in /journal/[slug]
  title: string; // <title> head — layout appends " — Amorfos"
  h1: string;
  metaDescription: string;
  eyebrow: string; // small label above the h1 (usually the cluster name)
  cluster: ArticleCluster;
  excerpt: string; // 1–2 sentences for cards + OG description
  heroImage?: string; // optional; falls back to a brand image
  body: ArticleBlock[];
  faqs?: { q: string; a: string }[];
  relatedProductIds?: string[]; // ids from products.ts / Supabase
  relatedCollectionSlugs?: string[]; // slugs from collections.ts
  author?: string; // defaults to "Amorfos"
  readingMinutes?: number;
}
