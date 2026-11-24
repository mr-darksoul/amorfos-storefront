import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { SPEND_CHANNELS } from "@/lib/dashboard";

/**
 * Ad spend entered by hand on the dashboard — one row per day per channel
 * (saving the same day + channel again overwrites it).
 * Auth: /api/admin/* is gated by middleware.ts.
 */
export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function unconfigured() {
  return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
}

export async function GET() {
  if (!isSupabaseConfigured()) return unconfigured();
  const { data, error } = await supabase()
    .from("marketing_spend")
    .select("id, spend_date, channel, amount, note")
    .order("spend_date", { ascending: false })
    .order("channel")
    .limit(60);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) return unconfigured();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const date = typeof body.date === "string" ? body.date : "";
  const channel = typeof body.channel === "string" ? body.channel : "";
  const amount = Number(body.amount);
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 200) : "";

  if (!DATE_RE.test(date) || Number.isNaN(Date.parse(`${date}T00:00:00Z`))) {
    return NextResponse.json({ error: "Pick a valid date." }, { status: 400 });
  }
  if (!(SPEND_CHANNELS as readonly string[]).includes(channel)) {
    return NextResponse.json({ error: "Pick a channel." }, { status: 400 });
  }
  if (!Number.isFinite(amount) || amount < 0 || amount > 10_000_000) {
    return NextResponse.json({ error: "Enter the amount in rupees." }, { status: 400 });
  }

  const { data, error } = await supabase()
    .from("marketing_spend")
    .upsert(
      { spend_date: date, channel, amount: Math.round(amount), note: note || null },
      { onConflict: "spend_date,channel" },
    )
    .select("id, spend_date, channel, amount, note")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data });
}

export async function DELETE(req: NextRequest) {
  if (!isSupabaseConfigured()) return unconfigured();
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Missing id." }, { status: 400 });
  }
  const { error } = await supabase().from("marketing_spend").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
