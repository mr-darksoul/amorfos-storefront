/**
 * Amorfos Journal — local draft generator (runs via `npm run content:draft`).
 *
 * Reads scripts/content-calendar.json, finds the next entries not yet in the
 * Supabase `articles` table, drafts each one, validates it, and inserts it
 * with status = 'draft'. Nothing is published — Manav reviews and publishes
 * from /admin/journal.
 *
 * The cloud equivalent is /api/cron/content-draft (called by Vercel Cron).
 * Both share the generation logic in src/lib/articleGenerator.ts.
 *
 *   npm run content:draft              # draft the next BATCH (default 2)
 *   BATCH=4 npm run content:draft      # draft the next 4
 *   DRY_RUN=1 npm run content:draft    # validate all entries, no DB writes
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import type { CalendarEntry } from "../src/lib/articleGenerator";
import {
  complianceCheck,
  validateShape,
  generateWithClaude,
  scaffold,
} from "../src/lib/articleGenerator";

const here = dirname(fileURLToPath(import.meta.url));

// ── env ─────────────────────────────────────────────────────────────
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

// ── main ─────────────────────────────────────────────────────────────
async function main() {
  loadEnvLocal();
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.CONTENT_MODEL || "claude-sonnet-4-6";
  console.log(`Drafting ${todo.length} article(s) via ${apiKey ? `Claude (${model})` : "offline scaffold"}…`);

  let inserted = 0;
  for (const entry of todo) {
    try {
      const article = apiKey ? await generateWithClaude(entry, apiKey, model) : scaffold(entry);
      article.slug = entry.slug;
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
  console.log(`\nDone. ${inserted} draft(s) added. Review & publish at ${siteUrl}/admin/journal`);
}

main();
