import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase";
import { dailyReportRecipient } from "@/lib/dashboard";
import { buildDailyReport } from "@/lib/dailyReport";
import { renderBrandEmail, sendInternalEmail } from "@/lib/notify";

/**
 * GET  → preview the daily summary email as a web page (sends nothing).
 * POST → send it now to DAILY_REPORT_TO.
 * Auth: /api/admin/* is gated by middleware.ts.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  const { subject, html } = await buildDailyReport();
  return new NextResponse(renderBrandEmail(subject, html), {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function POST() {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  const to = dailyReportRecipient();
  if (!to) {
    return NextResponse.json(
      { error: "Set DAILY_REPORT_TO in Vercel to choose who receives the daily email." },
      { status: 400 },
    );
  }
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: "Email (SMTP) is not configured." }, { status: 503 });
  }
  try {
    const { subject, html } = await buildDailyReport();
    await sendInternalEmail(to, subject, html);
    return NextResponse.json({ sent: true, to });
  } catch (err) {
    console.error("[admin/daily-report]", err);
    return NextResponse.json({ error: "Sending failed — check SMTP settings." }, { status: 500 });
  }
}
