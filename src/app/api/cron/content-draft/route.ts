import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { complianceCheck, validateShape, generateWithClaude, scaffold } from "@/lib/articleGenerator";
import type { CalendarEntry } from "@/lib/articleGenerator";
import calendar from "../../../../../scripts/content-calendar.json";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  // Vercel Cron sends Authorization: Bearer <CRON_SECRET> automatically.
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });

  // Find which calendar entries are not yet in the DB.
  const { data: existing, error: fetchErr } = await supabase.from("articles").select("slug");
  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }
  const existingSlugs = new Set((existing ?? []).map((r) => r.slug as string));
  const entries = (calendar as { entries: CalendarEntry[] }).entries;
  const pending = entries.filter((e) => !existingSlugs.has(e.slug));

  if (pending.length === 0) {
    return NextResponse.json({
      ok: true,
      drafted: null,
      message: "Content calendar exhausted — add more entries to scripts/content-calendar.json",
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.CONTENT_MODEL || "claude-sonnet-4-6";
  // Retries per ENTRY (not entries per run): a compliance/shape failure is fed
  // back to the model up to 3 times before the entry is skipped. The time
  // budget below means a successful run still drafts only ~1 article.
  const MAX_ATTEMPTS = 3;

  // Each Claude generation takes ~30-45s and the function is hard-capped at
  // `maxDuration` (60s on Vercel Hobby). Never START a generation that couldn't
  // finish before the cap, or the whole invocation 504s and inserts nothing.
  // We only begin an attempt if a worst-case generation still fits with margin
  // for the DB insert. On Hobby this means ~1 generation per run; anything left
  // undrafted is picked up by the next cron run (or a manual `npm run
  // content:draft`, which has no time limit and can retry freely).
  const startedAt = Date.now();
  const GEN_WORST_CASE_MS = 45_000;
  const DEADLINE_MS = (maxDuration - 5) * 1000;
  const outOfTime = () => Date.now() - startedAt + GEN_WORST_CASE_MS > DEADLINE_MS;

  // Walk the pending entries in order. For each, retry generation a few times,
  // feeding any compliance violations back to the model so it can self-correct.
  // If an entry can't be made compliant, skip to the next one so a single hard
  // topic never permanently blocks the rest of the calendar. Skipped entries stay
  // absent from the DB, so they're retried on the next run.
  const skipped: { slug: string; reason: string }[] = [];

  outer: for (const next of pending) {
    let violations: string[] = [];
    let lastReason = "";

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      // Stop before we'd overrun the function budget; whatever's undrafted is
      // retried on the next cron run.
      if (apiKey && outOfTime()) {
        lastReason = lastReason || "Ran out of time budget";
        skipped.push({ slug: next.slug, reason: lastReason });
        break outer;
      }
      try {
        const article = apiKey
          ? await generateWithClaude(next, apiKey, model, violations)
          : scaffold(next);
        article.slug = next.slug;
        article.cluster = next.cluster;

        const shapeErrs = validateShape(article);
        if (shapeErrs.length) {
          lastReason = `Invalid shape: ${shapeErrs.join(", ")}`;
          continue;
        }
        violations = complianceCheck(article);
        if (violations.length) {
          lastReason = `Compliance violation: "${violations.join('", "')}"`;
          continue;
        }

        const { error: insertErr } = await supabase.from("articles").insert({
          slug: article.slug,
          data: article,
          status: "draft",
          published_at: null,
        });
        if (insertErr) {
          return NextResponse.json({ error: insertErr.message }, { status: 500 });
        }

        // Stop after the first successful draft — a second generation would
        // not fit inside the function's time budget anyway.
        return NextResponse.json({
          ok: true,
          drafted: { slug: article.slug, title: article.title },
          attempts: attempt,
          skipped,
          via: apiKey ? `Claude (${model})` : "scaffold",
          reviewAt: "https://amorfos.in/admin/journal",
        });
      } catch (err) {
        // Log the real error (Vercel logs); keep provider details out of the response.
        console.error(`[content-draft] ${next.slug} attempt ${attempt} failed:`, err);
        lastReason = "Generation error";
      }
    }

    // Exhausted retries for this entry — record it and move on to the next.
    console.warn(`[content-draft] skipping ${next.slug} after ${MAX_ATTEMPTS} attempts: ${lastReason}`);
    skipped.push({ slug: next.slug, reason: lastReason });
  }

  // Nothing in the calendar could be drafted this run. Still a 200: the run
  // itself worked (a 500 would make Vercel's cron dashboard flag/retry it),
  // the per-entry reasons are in `skipped`, and every skipped entry is
  // automatically retried on the next daily run.
  return NextResponse.json({ ok: true, drafted: null, skipped });
}
