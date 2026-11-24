/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDashboard } from "@/lib/dashboard";
import { computeInsights } from "@/lib/insights";
import { escapeHtml } from "@/lib/notify";
import { inr } from "@/lib/format";
import { site } from "@/lib/site";

/**
 * The morning summary email: yesterday's numbers vs the day before, month to
 * date vs goal, channels, unpaid checkouts, to-dos and insights. Every value
 * that came from a visitor (names, paths) is escaped.
 */

const C = {
  ink: "#221b12",
  dim: "#5c4a2a",
  faint: "#8a7355",
  gold: "#97712f",
  line: "#d4c9b0",
  good: "#2f6b3a",
  bad: "#7a4326",
};

function delta(cur: number, prev: number | undefined | null, lowerIsBetter = false): string {
  if (prev === undefined || prev === null) return "";
  if (!prev) return cur ? `<span style="color:${C.faint}">new</span>` : `<span style="color:${C.faint}">—</span>`;
  const ch = ((cur - prev) / prev) * 100;
  if (Math.abs(ch) < 0.5) return `<span style="color:${C.faint}">no change</span>`;
  const good = lowerIsBetter ? ch < 0 : ch > 0;
  return `<span style="color:${good ? C.good : C.bad}">${ch > 0 ? "▲" : "▼"} ${Math.abs(Math.round(ch))}%</span>`;
}

function tile(label: string, value: string, d: string): string {
  return `<td width="33%" style="padding:10px 12px;border:1px solid ${C.line};background:#f6f1e7;vertical-align:top;">
    <div style="font-family:Arial,sans-serif;font-size:10px;letter-spacing:0.12em;text-transform:uppercase;color:${C.faint};">${label}</div>
    <div style="font-size:22px;color:${C.ink};margin-top:2px;">${value}</div>
    <div style="font-family:Arial,sans-serif;font-size:11px;margin-top:2px;">${d}</div>
  </td>`;
}

function section(title: string): string {
  return `<h2 style="margin:26px 0 8px;font-size:16px;font-weight:normal;color:${C.ink};border-bottom:1px solid ${C.line};padding-bottom:4px;">${title}</h2>`;
}

function para(html: string): string {
  return `<p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:13px;line-height:1.55;color:${C.dim};">${html}</p>`;
}

export async function buildDailyReport(): Promise<{ subject: string; html: string }> {
  const data = await getDashboard("yesterday");
  const k = data.current?.kpis ?? {};
  const p = data.previous ?? {};
  const ov = data.overview ?? {};
  const dateLabel = new Date(data.range.from).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata", weekday: "short", day: "numeric", month: "short",
  });

  const roas = k.spend ? `${(k.revenue / k.spend).toFixed(1)}×` : "—";
  const prevRoas = p.spend ? p.revenue / p.spend : null;

  let body = para(`Here's how ${escapeHtml(dateLabel)} went, compared with the day before.`);

  body += `<table width="100%" cellpadding="0" cellspacing="6" style="border-collapse:separate;">
    <tr>${tile("Revenue", inr(k.revenue ?? 0), delta(k.revenue ?? 0, p.revenue))}
        ${tile("Paid orders", String(k.orders ?? 0), delta(k.orders ?? 0, p.orders))}
        ${tile("Conversion", `${Number(k.conversion_rate ?? 0).toFixed(2)}%`, delta(k.conversion_rate ?? 0, p.conversion_rate))}</tr>
    <tr>${tile("Visitors", String(k.visitors ?? 0), delta(k.visitors ?? 0, p.visitors))}
        ${tile("Ad spend", inr(k.spend ?? 0), delta(k.spend ?? 0, p.spend, true))}
        ${tile("ROAS", roas, prevRoas !== null && k.spend ? delta(k.revenue / k.spend, prevRoas) : "")}</tr>
    <tr>${tile("Added to cart", String(k.carts ?? 0), delta(k.carts ?? 0, p.carts))}
        ${tile("Unpaid checkouts", String(k.abandoned_checkouts ?? 0), `<span style="color:${C.faint}">${inr(k.abandoned_value ?? 0)}</span>`)}
        ${tile("New subscribers", String(k.subscribers_new ?? 0), delta(k.subscribers_new ?? 0, p.subscribers_new))}</tr>
  </table>`;

  // Month to date
  const mtd = Number(ov.month?.revenue ?? 0);
  const goal = Number(ov.month?.goal ?? 0);
  const pace = data.month.elapsedDays > 0 ? (mtd / data.month.elapsedDays) * data.month.daysInMonth : 0;
  body += section(`${escapeHtml(data.month.label)} so far`);
  body += para(
    `<strong style="color:${C.ink}">${inr(mtd)}</strong> from ${ov.month?.orders ?? 0} orders` +
      (ov.month?.spend ? ` on ${inr(ov.month.spend)} ad spend` : "") +
      (goal ? ` — ${Math.round((100 * mtd) / goal)}% of the ${inr(goal)} goal, on pace for ${inr(Math.round(pace))}.` : `. On pace for ${inr(Math.round(pace))}.`),
  );

  // Insights
  const insights = computeInsights(data);
  if (insights.length) {
    body += section("Worth a look");
    body += insights
      .map((i) => para(`<span style="color:${i.tone === "warn" ? C.bad : i.tone === "good" ? C.good : C.gold}">●</span> ${escapeHtml(i.text)}`))
      .join("");
  }

  // Channels
  const channels = ((data.current?.channels ?? []) as any[]).slice(0, 6);
  if (channels.length) {
    body += section("Where visitors came from");
    body += `<table width="100%" cellpadding="4" cellspacing="0" style="font-family:Arial,sans-serif;font-size:12px;color:${C.dim};">
      <tr style="color:${C.faint};text-align:left;"><th align="left">Channel</th><th align="right">Visits</th><th align="right">Carts</th><th align="right">Orders</th><th align="right">Revenue</th><th align="right">Spend</th></tr>
      ${channels.map((ch) => `<tr style="border-top:1px solid ${C.line};">
        <td>${escapeHtml(ch.channel)}</td><td align="right">${ch.sessions}</td><td align="right">${ch.carts}</td>
        <td align="right">${ch.orders}</td><td align="right">${inr(ch.revenue)}</td><td align="right">${ch.spend ? inr(ch.spend) : "—"}</td></tr>`).join("")}
    </table>`;
  }

  // Unpaid checkouts
  const abandoned = ((data.current?.abandoned ?? []) as any[]).slice(0, 8);
  if (abandoned.length) {
    body += section("Unpaid checkouts");
    body += abandoned
      .map((o) => para(`${escapeHtml(o.name || "—")} · ${escapeHtml(o.city || "")} · <strong style="color:${C.ink}">${inr(o.amount)}</strong>` +
        `${o.recovery_sent_at ? " · reminder sent" : ""}`))
      .join("");
  }

  // To-dos
  const todos: string[] = [];
  if (ov.to_ship) todos.push(`${ov.to_ship} paid order${ov.to_ship === 1 ? "" : "s"} waiting to ship`);
  if (ov.sync_failed) todos.push(`${ov.sync_failed} Shiprocket sync failed`);
  if (ov.pending_reviews) todos.push(`${ov.pending_reviews} review${ov.pending_reviews === 1 ? "" : "s"} to moderate`);
  if (todos.length) {
    body += section("To do");
    body += todos.map((t) => para(`☐ ${escapeHtml(t)}`)).join("");
  }

  body += `<p style="margin:24px 0 0;"><a href="${site.url}/admin/dashboard" style="display:inline-block;background:${C.gold};color:#f6f1e7;text-decoration:none;padding:10px 18px;font-family:Arial,sans-serif;font-size:13px;letter-spacing:0.08em;">Open the live dashboard</a></p>`;

  const subject = `${site.name} · ${dateLabel}: ${inr(k.revenue ?? 0)} · ${k.orders ?? 0} order${k.orders === 1 ? "" : "s"} · ${k.visitors ?? 0} visitors`;
  return { subject, html: body };
}
