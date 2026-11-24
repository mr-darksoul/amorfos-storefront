import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { rateLimit, clientIp } from "@/lib/ratelimit";

/**
 * Ad spend pushed in automatically — today by a Google Ads Script that runs
 * hourly inside the Amorfos Ads account (see docs/google-ads-spend-sync.md).
 *
 * POST { source: "google_ads", rows: [{ date: "YYYY-MM-DD", campaign, cost }] }
 * Header x-ingest-key: AD_SPEND_INGEST_KEY
 *
 * Costs are summed per day and upserted into marketing_spend as channel
 * "Google Ads", overwriting that day's figure (so partial days self-correct
 * on the next run). Days with zero cost are skipped.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const CHANNELS: Record<string, string> = { google_ads: "Google Ads", meta_ads: "Meta Ads" };

function keyOk(given: string | null): boolean {
  const expected = process.env.AD_SPEND_INGEST_KEY;
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function inrPart(n: number): string {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}

export async function POST(req: NextRequest) {
  if (!rateLimit(`ingest:${clientIp(req)}`, 30, 60 * 60 * 1000).ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  if (!keyOk(req.headers.get("x-ingest-key"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  let body: { source?: unknown; rows?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const channel = CHANNELS[String(body.source)];
  if (!channel) return NextResponse.json({ error: "Unknown source" }, { status: 400 });
  if (!Array.isArray(body.rows) || body.rows.length > 5000) {
    return NextResponse.json({ error: "rows must be an array" }, { status: 400 });
  }

  // Accept only the last 60 days (and not the future, allowing for timezones).
  const now = Date.now();
  const oldest = new Date(now - 60 * 864e5).toISOString().slice(0, 10);
  const newest = new Date(now + 864e5).toISOString().slice(0, 10);

  const byDay = new Map<string, { total: number; parts: Map<string, number> }>();
  for (const raw of body.rows as Record<string, unknown>[]) {
    const date = String(raw?.date ?? "");
    const cost = Number(raw?.cost);
    const campaign = String(raw?.campaign ?? "Campaign").slice(0, 80);
    if (!DATE_RE.test(date) || date < oldest || date > newest) continue;
    if (!Number.isFinite(cost) || cost < 0 || cost > 10_000_000) continue;
    const day = byDay.get(date) ?? { total: 0, parts: new Map<string, number>() };
    day.total += cost;
    day.parts.set(campaign, (day.parts.get(campaign) ?? 0) + cost);
    byDay.set(date, day);
  }

  const syncedAt = new Date().toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata", hour: "numeric", minute: "2-digit",
  });
  const upserts = [...byDay.entries()]
    .filter(([, d]) => d.total > 0)
    .map(([date, d]) => ({
      spend_date: date,
      channel,
      amount: Math.round(d.total),
      note: `Auto-synced ${syncedAt} IST: ` +
        [...d.parts.entries()].filter(([, v]) => v > 0)
          .map(([name, v]) => `${name.replace(/^AMF \| /, "")} ${inrPart(v)}`).join(" + "),
    }));

  const db = supabase();
  if (upserts.length) {
    const { error } = await db.from("marketing_spend").upsert(upserts, { onConflict: "spend_date,channel" });
    if (error) {
      console.error("[ingest/ad-spend]", error.message);
      return NextResponse.json({ error: "Could not save" }, { status: 500 });
    }
  }

  await db.from("admin_settings").upsert({
    key: `spend_sync_${String(body.source)}`,
    value: { at: new Date().toISOString(), days: upserts.length, rows: (body.rows as unknown[]).length },
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, days: upserts.map((u) => ({ date: u.spend_date, amount: u.amount })) });
}
