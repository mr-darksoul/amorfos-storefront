/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DashboardData } from "@/lib/dashboard";
import { inr } from "@/lib/format";

/**
 * Plain-English findings computed from dashboard data — shown at the top of
 * the dashboard and in the daily summary email. Pure function, no I/O.
 * Every rule needs a minimum sample so one stray visit can't raise an alarm.
 */

export interface Insight {
  tone: "warn" | "good" | "info";
  text: string;
  /** Optional in-page anchor or admin link for the "see more" target. */
  href?: string;
}

const PAID = new Set(["Google Ads", "Meta Ads", "Other Paid", "Influencers"]);

function pctChange(cur: number, prev: number): number | null {
  if (!prev) return null;
  return ((cur - prev) / prev) * 100;
}

function shortName(name: string): string {
  return name.replace(/^Amorfos®?\s*(Certified\s*)?/i, "").replace(/\s*\((Brown|Natural)\)\s*$/i, "").slice(0, 60);
}

export function computeInsights(data: DashboardData): Insight[] {
  const out: Insight[] = [];
  const c = data.current ?? {};
  const k = c.kpis ?? {};
  const p = data.previous;
  const ov = data.overview ?? {};

  // ── Paid channels: is the spend coming back? ──────────────────────────────
  for (const ch of (c.channels ?? []) as any[]) {
    const spend = Number(ch.spend ?? 0);
    if (spend > 0) {
      const roas = ch.revenue / spend;
      if (ch.orders === 0 && spend >= 500) {
        out.push({
          tone: "warn",
          text: `${ch.channel}: ${inr(spend)} spent, ${ch.sessions} visit${ch.sessions === 1 ? "" : "s"}, ${ch.carts} add-to-cart, 0 orders` +
            (ch.sessions ? ` (avg visit ${Math.round(ch.avg_sec ?? 0)}s, ${ch.bounce ?? 0}% bounce).` : "."),
          href: "#channels",
        });
      } else if (ch.orders > 0) {
        out.push({
          tone: roas >= 2 ? "good" : roas >= 1 ? "info" : "warn",
          text: `${ch.channel} returned ${inr(ch.revenue)} on ${inr(spend)} spent — ROAS ${roas.toFixed(1)}×, ` +
            `${inr(Math.round(spend / ch.orders))} per order.`,
          href: "#channels",
        });
      }
    } else if (PAID.has(ch.channel) && ch.sessions >= 5) {
      out.push({
        tone: "info",
        text: `${ch.channel} brought ${ch.sessions} visits but no spend is logged for this period — add it under Ad spend to see ROAS.`,
        href: "#spend",
      });
    }
  }

  // ── Top earning channel ───────────────────────────────────────────────────
  const top = [...((c.channels ?? []) as any[])].sort((a, b) => b.revenue - a.revenue)[0];
  if (top && top.revenue > 0) {
    out.push({
      tone: "good",
      text: `${top.channel} drove the most revenue: ${inr(top.revenue)} from ${top.orders} order${top.orders === 1 ? "" : "s"}.`,
      href: "#channels",
    });
  }

  // ── Landing pages people leave immediately ────────────────────────────────
  for (const lp of ((c.landing_pages ?? []) as any[]).slice(0, 6)) {
    if (lp.sessions >= 8 && lp.bounce >= 70) {
      out.push({
        tone: "warn",
        text: `${lp.path}: ${Math.round(lp.bounce)}% of ${lp.sessions} visitors who landed here left within 10 seconds.`,
        href: "#pages",
      });
    }
  }

  // ── Products: interest without action, or no photos ───────────────────────
  for (const pr of (c.products ?? []) as any[]) {
    if (pr.views >= 5 && pr.carts === 0) {
      out.push({
        tone: "warn",
        text: `${shortName(pr.name)} was viewed ${pr.views} times but never added to cart — check price, photos and copy.`,
        href: "#products",
      });
    } else if (pr.images === 0 && pr.views >= 2) {
      out.push({
        tone: "warn",
        text: `${shortName(pr.name)} has no photos but got ${pr.views} views.`,
        href: "#products",
      });
    }
  }

  // ── Funnel blockages ──────────────────────────────────────────────────────
  const f = Object.fromEntries(((c.funnel ?? []) as any[]).map((s) => [s.step, s.n]));
  if ((f["Reached checkout"] ?? 0) >= 3 && (f["Filled details"] ?? 0) === 0) {
    out.push({
      tone: "warn",
      text: `${f["Reached checkout"]} visitors reached checkout but none submitted their details — test the checkout form on a phone.`,
      href: "#funnel",
    });
  }
  if ((f["Filled details"] ?? 0) >= 3 && (f["Paid"] ?? 0) === 0) {
    out.push({
      tone: "warn",
      text: `${f["Filled details"]} visitors filled in their details but none paid — check the Razorpay step.`,
      href: "#funnel",
    });
  }

  // ── Mobile vs desktop add-to-cart ─────────────────────────────────────────
  const dev = Object.fromEntries(((c.devices ?? []) as any[]).map((d) => [d.label, d]));
  const m = dev.mobile, d = dev.desktop;
  if (m && d && m.sessions >= 15 && d.sessions >= 10) {
    const mr = m.carts / m.sessions, dr = d.carts / d.sessions;
    if (dr > 0 && mr < dr / 2) {
      out.push({
        tone: "warn",
        text: `Phones add to cart ${Math.round(mr * 100)}% of the time vs ${Math.round(dr * 100)}% on desktop — the mobile product page may be the problem.`,
      });
    }
  }

  // ── Money left on the table ───────────────────────────────────────────────
  if ((k.abandoned_checkouts ?? 0) > 0) {
    out.push({
      tone: "info",
      text: `${k.abandoned_checkouts} checkout${k.abandoned_checkouts === 1 ? "" : "s"} worth ${inr(k.abandoned_value)} ` +
        `were left unpaid — a personal WhatsApp often recovers these.`,
      href: "#abandoned",
    });
  }

  // ── Trend vs previous period ──────────────────────────────────────────────
  if (p && (p.sessions ?? 0) >= 20) {
    const dv = pctChange(k.visitors ?? 0, p.visitors ?? 0);
    if (dv !== null && Math.abs(dv) >= 30) {
      out.push({
        tone: dv > 0 ? "good" : "warn",
        text: `Visitors ${dv > 0 ? "up" : "down"} ${Math.abs(Math.round(dv))}% on the previous period (${k.visitors} vs ${p.visitors}).`,
      });
    }
    const dc = pctChange(k.conversion_rate ?? 0, p.conversion_rate ?? 0);
    if (dc !== null && dc <= -30 && (p.orders ?? 0) >= 2) {
      out.push({
        tone: "warn",
        text: `Conversion fell to ${Number(k.conversion_rate).toFixed(2)}% from ${Number(p.conversion_rate).toFixed(2)}%.`,
      });
    }
  }

  // ── Goal pace (month-to-date, independent of the selected range) ──────────
  const goal = Number(ov.month?.goal ?? 0);
  if (goal > 0 && data.month) {
    const mtd = Number(ov.month?.revenue ?? 0);
    const pace = data.month.elapsedDays > 0 ? (mtd / data.month.elapsedDays) * data.month.daysInMonth : 0;
    const daysLeft = Math.max(data.month.daysInMonth - data.month.elapsedDays, 0);
    if (mtd >= goal) {
      out.push({ tone: "good", text: `${data.month.label} goal of ${inr(goal)} reached — ${inr(mtd)} so far.` });
    } else if (pace < goal && daysLeft >= 0.5) {
      out.push({
        tone: "warn",
        text: `On pace for ${inr(Math.round(pace))} against the ${inr(goal)} ${data.month.label} goal — ` +
          `${inr(Math.ceil((goal - mtd) / Math.max(daysLeft, 1)))}/day needed from here.`,
      });
    }
  }

  // ── Stock ─────────────────────────────────────────────────────────────────
  for (const s of (ov.low_stock ?? []) as any[]) {
    if (s.stock <= 0) out.push({ tone: "warn", text: `${shortName(s.name)} is sold out.`, href: `/admin/products/${s.id}` });
  }

  const rank = { warn: 0, good: 1, info: 2 } as const;
  return out.sort((a, b) => rank[a.tone] - rank[b.tone]).slice(0, 8);
}
