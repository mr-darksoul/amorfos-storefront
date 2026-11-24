import { supabase } from "@/lib/supabase";

/**
 * Admin dashboard data: wraps the analytics_dashboard / analytics_overview
 * Postgres functions (migration 011) with IST date ranges and a
 * previous-period comparison.
 */

export const RANGES = ["today", "yesterday", "7d", "30d", "90d", "all"] as const;
export type RangeKey = (typeof RANGES)[number];

/** Orders below this are internal test payments (no product sells under ₹599). */
export const TEST_ORDER_MAX = 100;

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
/** Store launch — the "All time" range starts here. */
const LAUNCH = new Date("2026-06-25T00:00:00+05:30");

function istMidnight(d: Date): Date {
  const ist = new Date(d.getTime() + IST_OFFSET_MS);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - IST_OFFSET_MS);
}

export interface ResolvedRange {
  key: RangeKey;
  from: Date;
  to: Date;
  bucket: "hour" | "day" | "week";
  prev?: { from: Date; to: Date };
}

export function resolveRange(key: RangeKey, now = new Date()): ResolvedRange {
  const today = istMidnight(now);
  const shift = (from: Date, to: Date) => {
    const len = to.getTime() - from.getTime();
    return { from: new Date(from.getTime() - len), to: new Date(to.getTime() - len) };
  };
  switch (key) {
    case "today": {
      // Compare with yesterday up to the same time of day.
      return { key, from: today, to: now, bucket: "hour",
        prev: { from: new Date(today.getTime() - DAY_MS), to: new Date(now.getTime() - DAY_MS) } };
    }
    case "yesterday": {
      const from = new Date(today.getTime() - DAY_MS);
      return { key, from, to: today, bucket: "hour", prev: shift(from, today) };
    }
    case "7d":
    case "30d":
    case "90d": {
      const days = key === "7d" ? 7 : key === "30d" ? 30 : 90;
      const from = new Date(today.getTime() - (days - 1) * DAY_MS);
      return { key, from, to: now, bucket: "day", prev: shift(from, now) };
    }
    case "all":
    default:
      return { key: "all", from: LAUNCH, to: now, bucket: "week" };
  }
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase().rpc(fn, args);
  if (error) throw new Error(`${fn}: ${error.message}`);
  return data as T;
}

/** IST calendar facts for the month-to-date goal strip. */
function istMonth(now = new Date()) {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = ist.getUTCMonth();
  const start = new Date(Date.UTC(y, m, 1) - IST_OFFSET_MS);
  const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  // Fraction of the month elapsed, counting today's elapsed hours.
  const elapsedDays = (now.getTime() - start.getTime()) / DAY_MS;
  const label = ist.toLocaleString("en-IN", { month: "long", timeZone: "UTC" });
  return { start, daysInMonth, elapsedDays, label };
}

/** Channels ad spend can be entered against (match traffic channel names). */
export const SPEND_CHANNELS = ["Google Ads", "Meta Ads", "Influencers", "Other Paid"] as const;

/** Where the daily summary email goes; unset = the daily email is off. */
export function dailyReportRecipient(): string | null {
  const to = process.env.DAILY_REPORT_TO?.trim();
  return to ? to : null;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getDashboard(key: RangeKey) {
  const r = resolveRange(key);
  const month = istMonth();
  const args = (from: Date, to: Date) => ({
    p_from: from.toISOString(),
    p_to: to.toISOString(),
    p_bucket: r.bucket,
    p_test_max: TEST_ORDER_MAX,
  });

  const [current, previous, overview] = await Promise.all([
    rpc<any>("analytics_dashboard", args(r.from, r.to)),
    r.prev ? rpc<any>("analytics_dashboard", args(r.prev.from, r.prev.to)) : Promise.resolve(null),
    rpc<any>("analytics_overview", {
      p_today: istMidnight(new Date()).toISOString(),
      p_month_start: month.start.toISOString(),
      p_test_max: TEST_ORDER_MAX,
    }),
  ]);

  return {
    range: { key: r.key, from: r.from.toISOString(), to: r.to.toISOString(), bucket: r.bucket },
    current,
    previous: previous?.kpis ?? null,
    overview,
    month: {
      label: month.label,
      daysInMonth: month.daysInMonth,
      elapsedDays: month.elapsedDays,
    },
    report: { to: dailyReportRecipient() },
    generatedAt: new Date().toISOString(),
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;

export const VISIT_FILTERS = ["all", "paid_ads", "engaged", "cart", "bounced"] as const;
export type VisitFilter = (typeof VISIT_FILTERS)[number];

/** Individual visits with their page-by-page journey (newest first). */
export async function getVisits(opts: {
  range: RangeKey;
  filter?: VisitFilter;
  channel?: string | null;
  session?: string | null;
  limit?: number;
}) {
  const r = resolveRange(opts.range);
  return rpc<any[]>("analytics_visits", {
    p_from: r.from.toISOString(),
    p_to: r.to.toISOString(),
    p_channel: opts.channel || null,
    p_filter: opts.filter ?? "all",
    p_limit: opts.limit ?? 40,
    p_session: opts.session || null,
    p_test_max: TEST_ORDER_MAX,
  });
}
