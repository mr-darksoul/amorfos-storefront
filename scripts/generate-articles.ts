/**
 * Amorfos Journal — automated draft generator.
 *
 * Reads scripts/content-calendar.json, finds the next entries that are NOT yet
 * in the Supabase `articles` table, drafts each one, validates it (schema +
 * brand/compliance banned-phrase check), and inserts it with status = 'draft'.
 * Nothing is published — Manav reviews and publishes from /admin/journal.
 *
 *   npm run content:draft              # draft the next BATCH (default 2)
 *   BATCH=4 npm run content:draft      # draft the next 4
 *
 * Generation:
 *   - If ANTHROPIC_API_KEY is set, the draft is written by the Claude API
 *     (model from CONTENT_MODEL, default claude-sonnet-4-6) using a prompt that
 *     embeds the Article schema + the house copy rules.
 *   - Otherwise it falls back to a compliant skeleton scaffolded from the
 *     calendar outline, so the pipeline still works end-to-end and the draft can
 *     be filled in via the admin editor.
 *
 * Env (from .env.local or the ambient environment): SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY (required); ANTHROPIC_API_KEY, CONTENT_MODEL (opt).
 *
 * This is the unit a scheduled Claude Code routine runs each week — see
 * docs/content-marketing-strategy.md §7.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import type { Article, ArticleCluster } from "../src/lib/types";

const here = dirname(fileURLToPath(import.meta.url));

interface CalendarEntry {
  slug: string;
  title: string;
  targetKeyword: string;
  cluster: ArticleCluster;
  eyebrow?: string;
  outline: string;
  relatedProductIds?: string[];
  relatedCollectionSlugs?: string[];
}

// ── env ────────────────────────────────────────────────────────────
function loadEnvLocal() {
  try {
    const raw = readFileSync(join(here, "..", ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      const key = t.slice(0, eq).trim();
      let val = t.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch {
    /* no .env.local — use ambient env */
  }
}

// ── compliance ─────────────────────────────────────────────────────
// Carried from CLAUDE.md / the strategy doc. A draft containing any of these is
// rejected before insert — the second gate after the LLM prompt.
const BANNED = [
  "cure", "cures", "cured", "heal", "heals", "healing", "miracle", "miraculous",
  "magic", "magical", "guarantee", "guaranteed", "scientifically proven",
  "clinically proven", "treats", "treatment", "disease", "remedy for cancer",
  // never name a specific lab (we say "Lab Certified" only):
  "iit kanpur", "igl", "gem testing laboratory", "rudra centre",
];

// The standard house disclaimer legitimately contains "miraculous"/"medical"
// in a *negated* form ("we make no medical or miraculous claims"). Strip those
// allowed phrasings before scanning so the disclaimer can't trip the check.
const ALLOWED_PHRASES = [
  "no medical or miraculous claims",
  "medical or miraculous claims",
  "no miraculous claims",
  "miraculous claims",
  "no medical claims",
  "without making medical or miraculous claims",
];

function complianceCheck(article: Article): string[] {
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

function validateShape(a: Partial<Article>): string[] {
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

// ── generation ─────────────────────────────────────────────────────
const SYSTEM_RULES = `You are the editorial voice of Amorfos, a Delhi house selling authentic, Lab Certified Rudraksha. Write calm, premium, knowledgeable copy (think Nicobar / Forest Essentials), distinctly Indian but restrained.
HARD RULES (never break):
- Say "Lab Certified" only. NEVER name a specific testing lab.
- NO medical or miraculous claims. No cure/heal/miracle/magic/guarantee/"scientifically proven". Frame benefits as "traditionally worn on the recommendation of astrologers and pandits".
- 7-day returns on unused sealed products; free shipping above ₹999.
Be accurate about traditional deity/planet associations; never invent facts.`;

async function generateWithClaude(entry: CalendarEntry): Promise<Article> {
  const model = process.env.CONTENT_MODEL || "claude-sonnet-4-6";
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
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
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

/** Dependency-free fallback when no API key is present: a compliant skeleton. */
function scaffold(entry: CalendarEntry): Article {
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

// ── main ───────────────────────────────────────────────────────────
async function main() {
  loadEnvLocal();
  // DRY_RUN validates generation + the gates without reading or writing the DB.
  const dryRun = !!process.env.DRY_RUN;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!dryRun && (!url || !key)) {
    console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }
  const supabase = dryRun ? null : createClient(url!, key!, { auth: { persistSession: false } });

  const calendarRaw = readFileSync(join(here, "content-calendar.json"), "utf8");
  const calendar = JSON.parse(calendarRaw) as { entries: CalendarEntry[] };

  // Which slugs already exist (any status)? Skip them — idempotent.
  let existingSlugs = new Set<string>();
  if (supabase) {
    const { data: existing, error: exErr } = await supabase.from("articles").select("slug");
    if (exErr) {
      console.error("Could not read existing articles:", exErr.message);
      process.exit(1);
    }
    existingSlugs = new Set((existing ?? []).map((r) => r.slug as string));
  }

  const batch = dryRun ? calendar.entries.length : Number(process.env.BATCH || 2);
  const todo = calendar.entries.filter((e) => !existingSlugs.has(e.slug)).slice(0, batch);

  if (todo.length === 0) {
    console.log("Nothing to draft — every calendar entry already exists. Add more to content-calendar.json.");
    return;
  }

  const useApi = !!process.env.ANTHROPIC_API_KEY;
  console.log(
    `Drafting ${todo.length} article(s) via ${useApi ? `Claude (${process.env.CONTENT_MODEL || "claude-sonnet-4-6"})` : "offline scaffold"}…`,
  );

  let inserted = 0;
  for (const entry of todo) {
    try {
      const article = useApi ? await generateWithClaude(entry) : scaffold(entry);
      article.slug = entry.slug; // never trust the model for the key
      article.cluster = entry.cluster;

      const shapeErrs = validateShape(article);
      if (shapeErrs.length) {
        console.warn(`  ✗ ${entry.slug}: invalid shape — ${shapeErrs.join(", ")} (skipped)`);
        continue;
      }
      const violations = complianceCheck(article);
      if (violations.length) {
        console.warn(`  ✗ ${entry.slug}: compliance violation — "${violations.join('", "')}" (skipped)`);
        continue;
      }

      if (!supabase) {
        console.log(`  ✓ ${entry.slug} OK (dry run — not inserted)`);
        inserted++;
        continue;
      }

      const { error } = await supabase.from("articles").insert({
        slug: article.slug,
        data: article,
        status: "draft",
        published_at: null,
      });
      if (error) {
        console.warn(`  ✗ ${entry.slug}: insert failed — ${error.message}`);
        continue;
      }
      console.log(`  ✓ ${entry.slug} drafted`);
      inserted++;
    } catch (err) {
      console.warn(`  ✗ ${entry.slug}: ${(err as Error).message}`);
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://amorfos.in";
  console.log(
    `\nDone. ${inserted} draft(s) added. Review & publish at ${siteUrl}/admin/journal`,
  );
}

main();
