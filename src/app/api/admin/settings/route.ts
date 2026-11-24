import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

/**
 * Admin preferences. Currently only the monthly revenue goal shown on the
 * dashboard. Auth: /api/admin/* is gated by middleware.ts.
 */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const goal = Number(body.monthlyRevenueGoal);
  if (!Number.isFinite(goal) || goal < 0 || goal > 1_000_000_000) {
    return NextResponse.json({ error: "Enter the goal in rupees." }, { status: 400 });
  }

  const db = supabase().from("admin_settings");
  const { error } = goal === 0
    ? await db.delete().eq("key", "monthly_revenue_goal")
    : await db.upsert({ key: "monthly_revenue_goal", value: Math.round(goal), updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
