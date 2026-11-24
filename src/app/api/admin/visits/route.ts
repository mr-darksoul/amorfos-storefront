import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getVisits, RANGES, VISIT_FILTERS, type RangeKey, type VisitFilter } from "@/lib/dashboard";

/**
 * Individual visits with their page-by-page journey.
 *   ?range=today|…  &filter=all|paid_ads|engaged|cart|bounced  &channel=Google%20Ads
 *   ?session=<uuid>  → just that one visit (any date)
 * Auth: /api/admin/* is gated by middleware.ts.
 */
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  const q = req.nextUrl.searchParams;
  const range = (RANGES as readonly string[]).includes(q.get("range") ?? "") ? (q.get("range") as RangeKey) : "today";
  const filter = (VISIT_FILTERS as readonly string[]).includes(q.get("filter") ?? "")
    ? (q.get("filter") as VisitFilter)
    : "all";
  const session = q.get("session");
  if (session && !UUID_RE.test(session)) {
    return NextResponse.json({ error: "Bad session id." }, { status: 400 });
  }
  const channel = q.get("channel")?.slice(0, 40) || null;
  const limit = Math.min(Math.max(Number(q.get("limit")) || 40, 1), 200);

  try {
    const visits = await getVisits({ range, filter, channel, session, limit });
    return NextResponse.json({ visits }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[admin/visits]", err);
    return NextResponse.json({ error: "Could not load visits." }, { status: 500 });
  }
}
