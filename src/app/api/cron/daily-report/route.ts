import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { dailyReportRecipient } from "@/lib/dashboard";
import { buildDailyReport } from "@/lib/dailyReport";
import { sendInternalEmail } from "@/lib/notify";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

/**
 * Vercel Cron, 03:30 UTC = 9:00 AM IST: emails yesterday's summary to
 * DAILY_REPORT_TO. Does nothing while that env var is unset.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const to = dailyReportRecipient();
  if (!to) return NextResponse.json({ skipped: "DAILY_REPORT_TO is not set" });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });

  try {
    const { subject, html } = await buildDailyReport();
    await sendInternalEmail(to, subject, html);
    return NextResponse.json({ sent: true, subject });
  } catch (err) {
    console.error("[cron/daily-report]", err);
    return NextResponse.json({ error: "Report failed" }, { status: 500 });
  }
}
