/**
 * Shared article generation logic — used by both the local generator script
 * (scripts/generate-articles.ts) and the Vercel Cron API route
 * (api/cron/content-draft/route.ts).
 */
import type { Article, ArticleCluster } from "@/lib/types";

export interface CalendarEntry {
  slug: string;
  title: string;
  targetKeyword: string;
  cluster: ArticleCluster;
  eyebrow?: string;
  outline: string;
  relatedProductIds?: string[];
  relatedCollectionSlugs?: string[];
}

// ── compliance ──────────────────────────────────────────────────────
const BANNED = [
  "cure", "cures", "cured", "heal", "heals", "healing", "miracle", "miraculous",
  "magic", "magical", "guarantee", "guaranteed", "scientifically proven",
  "clinically proven", "treats", "treatment", "disease", "remedy for cancer",
  "iit kanpur", "igl", "gem testing laboratory", "rudra centre",
];

// Standard house disclaimer uses "miraculous" in a negated form — strip before scanning.
const ALLOWED_PHRASES = [
  "no medical or miraculous claims",
  "medical or miraculous claims",
  "no miraculous claims",
  "miraculous claims",
  "no medical claims",
  "without making medical or miraculous claims",
];

export function complianceCheck(article: Article): string[] {
  let haystack = [
    article.title, article.h1, article.metaDescription, article.excerpt,
    ...article.body.map((b) =>
      "text" in b ? b.text : "items" in b ? b.items.join(" ") : "",
    ),
    ...(article.faqs ?? []).flatMap((f) => [f.q, f.a]),
  ]
    .join(" ")
    .toLowerCase();
  for (const phrase of ALLOWED_PHRASES) {
    haystack = haystack.split(phrase).join(" ");
  }
  return BANNED.filter((term) => haystack.includes(term));
}

export function validateShape(a: Partial<Article>): string[] {
  const errs: string[] = [];
  if (!a.slug) errs.push("missing slug");
  if (!a.title) errs.push("missing title");
  if (!a.h1) errs.push("missing h1");
  if (!a.metaDescription) errs.push("missing metaDescription");
  if (!a.excerpt) errs.push("missing excerpt");
  if (!a.cluster) errs.push("missing cluster");
  if (!Array.isArray(a.body) || a.body.length === 0) errs.push("body must be a non-empty array");
  return errs;
}

// ── generation ───────────────────────────────────────────────────────
export const SYSTEM_RULES = `You are the editorial voice of Amorfos, a Delhi house selling authentic, Lab Certified Rudraksha. Write calm, premium, knowledgeable copy (think Nicobar / Forest Essentials), distinctly Indian but restrained.
HARD RULES (never break):
- Say "Lab Certified" only. NEVER name a specific testing lab.
- NO medical or miraculous claims. No cure/heal/miracle/magic/guarantee/"scientifically proven". Frame benefits as "traditionally worn on the recommendation of astrologers and pandits".
- 7-day returns on unused sealed products; free shipping above ₹999.
Be accurate about traditional deity/planet associations; never invent facts.`;

export async function generateWithClaude(
  entry: CalendarEntry,
  apiKey: string,
  model = "claude-sonnet-4-6",
): Promise<Article> {
  const schema = `Return ONLY a JSON object (no markdown fence) with this exact shape:
{
  "slug": "${entry.slug}",
  "title": string (<=60 chars, the SEO <title>),
  "h1": string (on-page headline),
  "eyebrow": "${entry.eyebrow ?? ""}",
  "cluster": "${entry.cluster}",
  "metaDescription": string (150-160 chars),
  "excerpt": string (1-2 sentences),
  "readingMinutes": number,
  "body": Array of blocks, each one of:
     {"type":"paragraph","text":string}
     {"type":"heading","text":string}
     {"type":"list","items":string[]}
     {"type":"quote","text":string}
   (aim for 700-1100 words across 4-7 headings),
  "faqs": Array of {"q":string,"a":string} (3 items),
  "relatedProductIds": ${JSON.stringify(entry.relatedProductIds ?? [])},
  "relatedCollectionSlugs": ${JSON.stringify(entry.relatedCollectionSlugs ?? [])},
  "author": "Amorfos"
}`;

  const prompt = `Write a Journal article.
Working title: ${entry.title}
Target search keyword (use naturally, do not stuff): ${entry.targetKeyword}
Outline / brief: ${entry.outline}

${schema}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_RULES,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { content: { type: string; text: string }[] };
  const text = data.content.find((c) => c.type === "text")?.text ?? "";
  const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  return JSON.parse(json) as Article;
}

export function scaffold(entry: CalendarEntry): Article {
  return {
    slug: entry.slug,
    title: entry.title,
    h1: entry.title,
    eyebrow: entry.eyebrow ?? "",
    cluster: entry.cluster,
    metaDescription: `${entry.title} — a guide from Amorfos, a Delhi house of authentic, Lab Certified Rudraksha. Free shipping above ₹999.`,
    excerpt: `${entry.title}. ${entry.outline}`,
    readingMinutes: 4,
    body: [
      { type: "paragraph", text: `${entry.outline}` },
      { type: "heading", text: "About this bead" },
      {
        type: "paragraph",
        text: "Draft scaffold — replace this body with the full article in the admin editor, or set ANTHROPIC_API_KEY and re-run to draft it automatically. Rudraksha is traditionally worn on the recommendation of astrologers and pandits; we make no medical or miraculous claims.",
      },
    ],
    faqs: [
      {
        q: `Is this Rudraksha Lab Certified?`,
        a: "Yes — every Amorfos bead is Lab Certified for authenticity and origin, and the certificate accompanies your piece.",
      },
    ],
    relatedProductIds: entry.relatedProductIds ?? [],
    relatedCollectionSlugs: entry.relatedCollectionSlugs ?? [],
    author: "Amorfos",
  };
}
