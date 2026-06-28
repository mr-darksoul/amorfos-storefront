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
  const next = entries.find((e) => !existingSlugs.has(e.slug));

  if (!next) {
    return NextResponse.json({
      ok: true,
      drafted: null,
      message: "Content calendar exhausted — add more entries to scripts/content-calendar.json",
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.CONTENT_MODEL || "claude-sonnet-4-6";

  try {
    const article = apiKey ? await generateWithClaude(next, apiKey, model) : scaffold(next);
    article.slug = next.slug;
    article.cluster = next.cluster;

    const shapeErrs = validateShape(article);
    if (shapeErrs.length) {
      return NextResponse.json({ error: `Invalid shape: ${shapeErrs.join(", ")}` }, { status: 500 });
    }
    const violations = complianceCheck(article);
    if (violations.length) {
      return NextResponse.json(
        { error: `Compliance violation: "${violations.join('", "')}"` },
        { status: 500 },
      );
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

    return NextResponse.json({
      ok: true,
      drafted: { slug: article.slug, title: article.title },
      via: apiKey ? `Claude (${model})` : "scaffold",
      reviewAt: "https://amorfos.in/admin/journal",
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
