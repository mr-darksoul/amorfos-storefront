import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getDashboard, RANGES, type RangeKey } from "@/lib/dashboard";

// Auth: /api/admin/* is gated by middleware.ts.
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  const param = req.nextUrl.searchParams.get("range") ?? "today";
  const range = (RANGES as readonly string[]).includes(param) ? (param as RangeKey) : "today";
  try {
    const data = await getDashboard(range);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[admin/dashboard]", err);
    return NextResponse.json({ error: "Could not load dashboard." }, { status: 500 });
  }
}
