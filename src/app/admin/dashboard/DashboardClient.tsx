"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardData, RangeKey } from "@/lib/dashboard";
import { inr } from "@/lib/format";
import { site } from "@/lib/site";
import { computeInsights, type Insight } from "@/lib/insights";

const REFRESH_MS = 15_000;

const RANGE_LABELS: { key: RangeKey; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "all", label: "All time" },
];

const PREV_LABEL: Record<RangeKey, string> = {
  today: "vs yesterday, same time",
  yesterday: "vs day before",
  "7d": "vs previous 7 days",
  "30d": "vs previous 30 days",
  "90d": "vs previous 90 days",
  all: "",
};

// ── formatting ──────────────────────────────────────────────────────────────
const num = (n: number | null | undefined) => (n ?? 0).toLocaleString("en-IN");
const pct = (n: number | null | undefined, digits = 1) => `${Number(n ?? 0).toFixed(digits)}%`;

function duration(sec: number | null | undefined): string {
  const s = Math.round(Number(sec ?? 0));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function ago(iso: string | null | undefined, now: number): string {
  if (!iso) return "—";
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function istDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function bucketLabel(bucket: string, kind: string): string {
  // bucket is IST wall-clock "YYYY-MM-DDTHH:MM"
  const [d, t] = bucket.split("T");
  const [, mo, da] = d.split("-").map(Number);
  const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][mo - 1];
  if (kind === "hour") {
    const h = Number(t.slice(0, 2));
    return `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "am" : "pm"}`;
  }
  return kind === "week" ? `wk of ${da} ${month}` : `${da} ${month}`;
}

function waLink(phone?: string, text?: string): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** "Amorfos® Certified 5 Mukhi Nepali Rudraksha Pendant, Nepal (Brown)" → "5 Mukhi Nepali Rudraksha Pendant" */
function shortItemName(name: string): string {
  return name
    .replace(/^\s*Amorfos®?\s*/i, "")
    .replace(/^(Lab\s+)?Certified\s+/i, "")
    .replace(/,.*$/, "")
    .trim();
}

/** "earlier today" / "yesterday" / "a few days ago", by IST calendar day. */
function whenPhrase(iso: string): string {
  const day = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const diff = Math.round((Date.parse(day(new Date())) - Date.parse(day(new Date(iso)))) / 86_400_000);
  return diff <= 0 ? "earlier today" : diff === 1 ? "yesterday" : "a few days ago";
}

/** Pre-filled WhatsApp text for an abandoned checkout, in the brand's support voice. */
function recoveryMessage(o: any): string {
  const first = String(o.name ?? "").trim().split(/\s+/)[0] ?? "";
  const greeting = first ? `Namaste ${first[0].toUpperCase()}${first.slice(1).toLowerCase()},` : "Namaste,";
  const items: any[] = o.items ?? [];
  const lead = items[0];
  const extra = items.length - 1;
  const what = lead
    ? `the ${shortItemName(String(lead.name ?? "piece"))}${extra > 0 ? ` and ${extra} more piece${extra > 1 ? "s" : ""}` : ""}`
    : "your order";
  const link = lead?.id ? `${site.url}/shop/${lead.id}` : `${site.url}/shop`;
  return [
    `${greeting} this is Manav from Amorfos.`,
    `I saw you were ordering ${what} (${inr(o.amount)}) ${whenPhrase(o.created_at)}, but the payment didn't go through.`,
    "Did something go wrong with the payment, or is there anything about the bead I can help with?",
    `You can complete the order here whenever you're ready: ${link}`,
  ].join("\n\n");
}

// ── data fetching ───────────────────────────────────────────────────────────
export default function DashboardClient({ initial }: { initial: DashboardData | null }) {
  const [range, setRange] = useState<RangeKey>("today");
  const [data, setData] = useState<DashboardData | null>(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Clock starts on the client only, so server and browser render the same text.
  const [clock, setClock] = useState<number | null>(null);
  const reqId = useRef(0);
  const firstRun = useRef(true);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [visitChannel, setVisitChannel] = useState<string | null>(null);

  const focusVisit = useCallback((id: string) => {
    setFocusId(id);
    scrollToId("visits");
  }, []);

  const load = useCallback(async (r: RangeKey) => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/dashboard?range=${r}`, { cache: "no-store" });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not load dashboard.");
      if (id === reqId.current) {
        setData(json);
        setError(null);
      }
    } catch (e) {
      if (id === reqId.current) setError(e instanceof Error ? e.message : "Could not load dashboard.");
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  // Reload on range change, then keep refreshing while the tab is visible.
  useEffect(() => {
    // The server already rendered "today" on first paint; any later range
    // switch (including back to today) fetches immediately.
    if (!(firstRun.current && range === "today" && initial)) void load(range);
    firstRun.current = false;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(range);
    }, REFRESH_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load(range);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, load]);

  useEffect(() => {
    setClock(Date.now());
    const t = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  if (!data) {
    return (
      <div className="rounded-sm border border-line bg-paper px-4 py-6 text-sm text-ink-dim">
        {error ?? "Loading dashboard…"}
      </div>
    );
  }

  const now = clock ?? new Date(data.generatedAt).getTime();
  const k = data.current.kpis ?? {};
  const p = data.previous;
  const ov = data.overview ?? {};
  const live = ov.live ?? { count: 0, sessions: [] };
  const bucket = data.range.bucket;
  const showSpendChart = bucket !== "hour" && (data.current.series ?? []).some((r: any) => r.spend > 0);

  return (
    <div className={`space-y-6 transition-opacity ${loading ? "opacity-90" : ""}`}>
      {/* Filters + live status — one row above everything they scope */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Date range">
          {RANGE_LABELS.map((r) => (
            <button
              key={r.key}
              role="tab"
              aria-selected={range === r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-full border px-3.5 py-1.5 text-xs tracking-wide transition-colors ${
                range === r.key
                  ? "border-ink bg-ink text-cream"
                  : "border-line-strong bg-paper text-ink-dim hover:border-gold hover:text-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-ink-faint">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1.5 text-sm text-ink">
            <span className="relative flex h-2.5 w-2.5">
              {live.count > 0 && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-600 opacity-60" />
              )}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${live.count > 0 ? "bg-green-600" : "bg-ink-faint"}`} />
            </span>
            <strong className="font-medium">{live.count}</strong> on site now
          </span>
          <span title={`Refreshes every ${REFRESH_MS / 1000}s while this tab is open`}>
            {error ? <span className="text-rudra">Refresh failed — retrying</span> : <>Updated {ago(data.generatedAt, now)}</>}
          </span>
        </div>
      </div>

      <Attention ov={ov} k={k} />

      <GoalStrip month={data.month} m={ov.month ?? {}} onSaved={() => load(range)} />

      <Insights items={computeInsights(data)} />

      {/* Headline KPIs */}
      <section>
        <SectionHead title="Sales & marketing" note={PREV_LABEL[data.range.key]} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label="Revenue" value={inr(k.revenue)} cur={k.revenue} prev={p?.revenue} />
          <Kpi label="Paid orders" value={num(k.orders)} cur={k.orders} prev={p?.orders} />
          <Kpi label="Conversion rate" value={pct(k.conversion_rate, 2)} cur={k.conversion_rate} prev={p?.conversion_rate}
            hint="Visits that ended in a paid order" />
          <Kpi label="Avg order value" value={inr(k.aov)} cur={k.aov} prev={p?.aov} />
          <Kpi label="Ad spend" value={inr(k.spend)} cur={k.spend} prev={p?.spend}
            sub={k.spend ? undefined : "log it under Ad spend"} hint="Entered by you under Ad spend" />
          <Kpi label="ROAS" value={k.spend ? `${(k.revenue / k.spend).toFixed(2)}×` : "—"}
            cur={k.spend ? k.revenue / k.spend : undefined} prev={p?.spend ? p.revenue / p.spend : undefined}
            hint="Revenue ÷ ad spend (all revenue, all spend)" sub={k.spend ? (k.revenue >= k.spend ? "spend is paying back" : "spend not yet paying back") : undefined} />
          <Kpi label="Cost per order" value={k.spend && k.orders ? inr(Math.round(k.spend / k.orders)) : "—"}
            cur={k.spend && k.orders ? k.spend / k.orders : undefined} prev={p?.spend && p?.orders ? p.spend / p.orders : undefined}
            lowerIsBetter hint="Ad spend ÷ paid orders" />
          <Kpi label="Cost per paid visit" value={k.spend && k.paid_sessions ? inr(Math.round(k.spend / k.paid_sessions)) : "—"}
            cur={k.spend && k.paid_sessions ? k.spend / k.paid_sessions : undefined}
            prev={p?.spend && p?.paid_sessions ? p.spend / p.paid_sessions : undefined} lowerIsBetter
            sub={`${num(k.paid_sessions)} visits from ads`} hint="Ad spend ÷ visits from Google/Meta ads" />
        </div>
      </section>

      <section>
        <SectionHead title="Traffic" note={PREV_LABEL[data.range.key]} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label="Unique visitors" value={num(k.visitors)} cur={k.visitors} prev={p?.visitors}
            sub={`${num(k.new_visitors)} new · ${num(Math.max(0, (k.visitors ?? 0) - (k.new_visitors ?? 0)))} returning`} />
          <Kpi label="Sessions" value={num(k.sessions)} cur={k.sessions} prev={p?.sessions}
            sub={`${num(k.pageviews)} pageviews · ${Number(k.pages_per_session ?? 0).toFixed(1)}/visit`} />
          <Kpi label="Avg session length" value={duration(k.avg_session_sec)} cur={k.avg_session_sec} prev={p?.avg_session_sec}
            sub={`median ${duration(k.median_session_sec)}`} />
          <Kpi label="Bounce rate" value={pct(k.bounce_rate)} cur={k.bounce_rate} prev={p?.bounce_rate} lowerIsBetter
            hint="One page and under 10 seconds" />
        </div>
      </section>

      <section>
        <SectionHead title="Carts & leads" note={PREV_LABEL[data.range.key]} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label="Added to cart" value={num(k.carts)} cur={k.carts} prev={p?.carts}
            sub={`${num(k.carts_abandoned)} didn't buy · ${inr(k.cart_abandon_value)}`} />
          <Kpi label="Checkouts started" value={num(k.checkouts_started)} cur={k.checkouts_started} prev={p?.checkouts_started}
            hint="Customer filled name, phone & address" />
          <Kpi label="Abandoned checkouts" value={num(k.abandoned_checkouts)} cur={k.abandoned_checkouts}
            prev={p?.abandoned_checkouts} lowerIsBetter
            sub={`${inr(k.abandoned_value)} unpaid${k.reminders_sent ? ` · ${num(k.recovered)} of ${num(k.reminders_sent)} won back by reminder (${inr(k.recovered_value)})` : ""}`} />
          <Kpi label="New subscribers" value={num(k.subscribers_new)} cur={k.subscribers_new} prev={p?.subscribers_new}
            sub={`${num(k.subscribers_confirmed_new)} confirmed`} />
        </div>
      </section>

      {/* Trend charts — separate charts, never two scales on one axis */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Visitors" subtitle={bucket === "hour" ? "Unique visitors per hour (IST)" : `Unique visitors per ${bucket}`}>
          <BarChart
            rows={data.current.series ?? []}
            series={[{ key: "visitors", label: "Visitors", color: "#a87a2a", value: (r) => r.visitors }]}
            label={(r) => bucketLabel(r.bucket, bucket)}
            readout={(r) => `${num(r.visitors)} visitor${r.visitors === 1 ? "" : "s"} · ${num(r.sessions)} session${r.sessions === 1 ? "" : "s"}`}
          />
        </Card>
        <Card
          title={showSpendChart ? "Revenue vs ad spend" : "Revenue"}
          subtitle={bucket === "hour" ? "Paid revenue per hour (IST)" : `Paid revenue${showSpendChart ? " and ad spend" : ""} per ${bucket}`}
        >
          <BarChart
            rows={data.current.series ?? []}
            series={[
              { key: "revenue", label: "Revenue", color: "#a87a2a", value: (r) => r.revenue },
              ...(showSpendChart ? [{ key: "spend", label: "Ad spend", color: "#2f72a8", value: (r: any) => r.spend }] : []),
            ]}
            label={(r) => bucketLabel(r.bucket, bucket)}
            readout={(r) => `${inr(r.revenue)} revenue · ${num(r.orders)} order${r.orders === 1 ? "" : "s"}` +
              (showSpendChart ? ` · ${inr(r.spend)} spend` : "")}
            money
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card id="funnel" className="lg:col-span-3" title="Purchase funnel" subtitle="Where visitors drop off">
          <Funnel steps={data.current.funnel ?? []} />
        </Card>
        <Card className="lg:col-span-2" title="On site now" subtitle="Active in the last 5 minutes · tap one to follow their journey">
          <LiveList sessions={live.sessions ?? []} now={now} onPick={focusVisit} />
        </Card>
      </div>

      <Card id="channels" title="Traffic sources" subtitle="Which channels bring visitors — and which ones pay back">
        <Table
          empty="No visits recorded in this range yet."
          head={["Channel", "Sessions", "Avg time", "Bounce", "Carts", "Checkouts", "Orders", "Revenue", "Conv.", "Spend", "ROAS", "Cost/visit"]}
          rows={(data.current.channels ?? []).map((c: any) => [
            <button key="c" type="button" onClick={() => { setVisitChannel(c.channel); scrollToId("visits"); }}
              className="text-left font-medium text-ink hover:text-gold" title="See these visits">{c.channel}</button>,
            num(c.sessions), c.sessions ? duration(c.avg_sec) : "—", c.sessions ? pct(c.bounce) : "—", num(c.carts),
            num(c.checkouts), num(c.orders), inr(c.revenue),
            pct(c.sessions ? (100 * c.orders) / c.sessions : 0, 2),
            c.spend ? inr(c.spend) : "—",
            c.spend ? <RoasCell key="r" revenue={c.revenue} spend={c.spend} /> : "—",
            c.spend && c.sessions ? inr(Math.round(c.spend / c.sessions)) : "—",
          ])}
          numeric
        />
      </Card>

      <Card id="spend" title="Ad spend" subtitle="Google Ads spend syncs automatically every hour. Log other channels here — saving the same day and channel again overwrites it.">
        <SpendManager onChange={() => load(range)} refreshKey={data.generatedAt} />
      </Card>

      <Card id="visits" title="Visit journeys" subtitle="Every visit, page by page — see exactly what ad visitors did before they left">
        <Journeys
          range={range}
          refreshKey={data.generatedAt}
          channel={visitChannel}
          setChannel={setVisitChannel}
          channels={(data.current.channels ?? []).filter((c: any) => c.sessions > 0).map((c: any) => c.channel)}
          focus={focusId}
          clearFocus={() => setFocusId(null)}
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Campaigns" subtitle="UTM-tagged & ad-click visits">
          <Table
            empty="No tagged visits yet. Google Ads clicks and links with utm_ tags show up here."
            head={["Source / medium", "Campaign", "Sessions", "Avg time", "Carts", "Orders", "Revenue"]}
            rows={(data.current.campaigns ?? []).map((c: any) => [
              `${c.source} / ${c.medium}`, c.campaign, num(c.sessions), duration(c.avg_sec), num(c.carts), num(c.orders), inr(c.revenue),
            ])}
            numeric
          />
        </Card>
        <Card title="Referring sites" subtitle="Where untagged visits came from">
          <BarList rows={(data.current.referrers ?? []).map((r: any) => ({ label: r.host, value: r.sessions }))}
            empty="No referrals yet." />
        </Card>
      </div>

      <Card title="Search keywords" subtitle="The Google search behind each ad click (needs utm_term in the ad's tracking template)">
        {(data.current.keywords ?? []).length ? (
          <Table
            empty=""
            head={["Keyword", "Visits", "Avg time", "Carts", "Orders"]}
            rows={(data.current.keywords ?? []).map((w: any) => [w.term, num(w.sessions), duration(w.avg_sec), num(w.carts), num(w.orders)])}
            numeric
          />
        ) : (
          <p className="text-sm text-ink-dim">
            No keywords yet. In Google Ads → Campaign settings → Campaign URL options, set the final URL suffix to{" "}
            <code className="rounded bg-paper-raised px-1 font-mono text-[12px] text-ink">utm_source=google&amp;utm_medium=cpc&amp;utm_campaign={"{campaignid}"}&amp;utm_term={"{keyword}"}</code>{" "}
            and every ad visit will show the keyword that triggered it.
          </p>
        )}
      </Card>

      <div id="pages" className="grid gap-4 lg:grid-cols-2">
        <Card title="Landing pages" subtitle="First page of each visit">
          <Table
            empty="No visits yet."
            head={["Page", "Sessions", "Bounce", "Avg time", "Carts", "Orders"]}
            rows={(data.current.landing_pages ?? []).map((l: any) => [
              <PathCell key="p" path={l.path} />, num(l.sessions), pct(l.bounce), duration(l.avg_sec), num(l.carts), num(l.orders),
            ])}
            numeric
          />
        </Card>
        <Card title="Exit pages" subtitle="Last page seen before a visitor left without buying">
          <Table
            empty="No finished visits yet."
            head={["Page", "Exits", "Avg visit"]}
            rows={(data.current.exit_pages ?? []).map((l: any) => [<PathCell key="p" path={l.path} />, num(l.exits), duration(l.avg_sec)])}
            numeric
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Most viewed pages">
          <Table
            empty="No pageviews yet."
            head={["Page", "Views", "Visitors"]}
            rows={(data.current.pages ?? []).map((l: any) => [<PathCell key="p" path={l.path} />, num(l.views), num(l.visitors)])}
            numeric
          />
        </Card>
        <Card title="Busiest hours" subtitle="Visits by hour of day (IST) — useful for ad scheduling and posting times">
          <BarChart
            rows={(data.current.hours ?? []).map((h: any) => ({ ...h, bucket: String(h.hour) }))}
            series={[{ key: "sessions", label: "Visits", color: "#a87a2a", value: (r) => r.sessions }]}
            label={(r) => hourLabel(r.hour)}
            readout={(r) => `${num(r.sessions)} visit${r.sessions === 1 ? "" : "s"} · ${num(r.orders)} order${r.orders === 1 ? "" : "s"}`}
          />
        </Card>
      </div>

      <Card id="products" title="Products" subtitle="Views and add-to-carts count visits; units & revenue are paid orders">
        <Table
          empty="No product activity in this range."
          head={["Product", "Price", "Views", "Add to cart", "Cart rate", "Units sold", "Revenue"]}
          rows={(data.current.products ?? []).map((pr: any) => [
            <span key="n" className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link href={`/shop/${pr.product_id}`} target="_blank" className="text-ink hover:text-gold">{pr.name}</Link>
              {pr.images === 0 && <Flag text="no photos" />}
              {pr.views >= 5 && pr.carts === 0 && <Flag text="views, no carts" />}
              <Link href={`/admin/products/${pr.product_id}`} className="text-[11px] text-gold-soft hover:underline">edit</Link>
            </span>,
            pr.price ? inr(pr.price) : "—",
            num(pr.views), num(pr.carts), pr.views ? pct((100 * pr.carts) / pr.views) : "—", num(pr.units), inr(pr.revenue),
          ])}
          numeric
        />
      </Card>

      <Card
        title="Abandoned checkouts"
        subtitle="Filled in their details but didn't pay (customers who later paid are hidden). The daily recovery cron nudges each one once."
      >
        <Abandoned rows={data.current.abandoned ?? []} onVisit={focusVisit} />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Email list" subtitle="Newsletter sign-ups (double opt-in)">
          <EmailList subs={ov.subscribers} customers={ov.customers} />
        </Card>
        <Card title="Customers" subtitle="All time, paid orders">
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Revenue (all time)" value={inr(ov.revenue_all_time)} />
            <MiniStat label="Paid orders" value={num(ov.orders_all_time)} />
            <MiniStat label="Customers" value={num(ov.customers)} />
            <MiniStat label="Repeat customers" value={`${num(ov.repeat_customers)}${ov.customers ? ` · ${pct((100 * ov.repeat_customers) / ov.customers, 0)}` : ""}`} />
            <MiniStat label="Ad spend (all time)" value={inr(ov.spend_all_time)} />
            <MiniStat label="Blended ROAS" value={ov.spend_all_time ? `${(ov.revenue_all_time / ov.spend_all_time).toFixed(2)}×` : "—"} />
            <MiniStat label="Visitors (all time)" value={num(ov.visitors_all_time)} />
            <MiniStat label="Visitors today" value={num(ov.visitors_today)} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Devices">
          <BarList capitalize rows={(data.current.devices ?? []).map((d: any) => ({
            label: d.label, value: d.sessions,
            note: d.sessions ? `${pct((100 * d.carts) / d.sessions, 0)} carted` : undefined,
          }))} empty="—" />
        </Card>
        <Card title="Browsers">
          <BarList rows={(data.current.browsers ?? []).map((d: any) => ({ label: d.label, value: d.sessions }))} empty="—" />
        </Card>
        <Card title="Locations">
          <BarList
            rows={(data.current.locations ?? []).map((d: any) => ({
              label: [d.city, d.region, d.country !== "IN" ? d.country : ""].filter((x: string) => x && x !== "—").join(", ") || "Unknown",
              value: d.sessions,
            }))}
            empty="—"
          />
        </Card>
      </div>

      <Card title="Daily summary email" subtitle="Yesterday's numbers, month-to-date vs goal, unpaid checkouts and these insights — every morning at 9 AM IST">
        <DailyEmail to={data.report?.to ?? null} />
      </Card>

      <p className="pb-6 text-xs leading-relaxed text-ink-faint">
        Visitor tracking is first-party and started{" "}
        {ov.tracking_since ? istDateTime(ov.tracking_since) : "with this release"} — earlier traffic lives in GA4 only.
        Your own browser is excluded once you open admin on it (or visit any page with <code>?notrack=1</code>).
        Orders under ₹100 are treated as test payments and left out. Ad-blockers hide a small share of visits;
        orders and revenue come straight from the orders table and are always complete. ROAS uses the spend you log
        here. Refreshes every {REFRESH_MS / 1000}s.
      </p>
    </div>
  );
}

// ── building blocks ─────────────────────────────────────────────────────────
function SectionHead({ title, note }: { title: string; note?: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <h2 className="text-xs uppercase tracking-[0.18em] text-ink-dim">{title}</h2>
      {note && <span className="text-xs text-ink-faint">{note}</span>}
    </div>
  );
}

function Card({ id, title, subtitle, children, className = "" }: {
  id?: string; title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <section id={id} className={`min-w-0 scroll-mt-6 rounded-sm border border-line bg-paper px-4 py-4 sm:px-5 ${className}`}>
      <h2 className="font-serif text-xl text-ink">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-ink-faint">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Kpi({ label, value, cur, prev, sub, hint, lowerIsBetter }: {
  label: string; value: string; cur?: number; prev?: number | null; sub?: string; hint?: string; lowerIsBetter?: boolean;
}) {
  let delta: React.ReactNode = null;
  if (prev !== undefined && prev !== null) {
    const c = Number(cur ?? 0);
    const pv = Number(prev);
    if (pv === 0 && c === 0) delta = <span className="text-ink-faint">no change</span>;
    else if (pv === 0) delta = <span className="text-ink-faint">new · was 0</span>;
    else {
      const change = ((c - pv) / pv) * 100;
      const up = change > 0;
      const good = lowerIsBetter ? !up : up;
      delta = Math.abs(change) < 0.5
        ? <span className="text-ink-faint">no change</span>
        : (
          <span className={good ? "text-green-700" : "text-rudra"}>
            {up ? "▲" : "▼"} {Math.abs(change).toFixed(0)}%
          </span>
        );
    }
  }
  return (
    <div className="rounded-sm border border-line bg-paper px-4 py-3.5" title={hint}>
      <p className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{label}</p>
      <p className="mt-1 font-serif text-[1.75rem] leading-tight text-ink tabular-nums">{value}</p>
      <div className="mt-1 flex flex-wrap items-baseline gap-x-2 text-xs">
        {delta}
        {sub && <span className="text-ink-faint">{sub}</span>}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm bg-paper-raised px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <p className="mt-0.5 font-serif text-xl text-ink tabular-nums">{value}</p>
    </div>
  );
}

function Attention({ ov, k }: { ov: any; k: any }) {
  const items: { label: string; href: string; tone: "warn" | "info" }[] = [];
  if (ov.sync_failed > 0) items.push({ label: `${ov.sync_failed} Shiprocket sync failed`, href: "/admin/orders", tone: "warn" });
  if (ov.to_ship > 0) items.push({ label: `${ov.to_ship} paid order${ov.to_ship === 1 ? "" : "s"} to ship`, href: "/admin/orders", tone: "warn" });
  if (k.abandoned_checkouts > 0)
    items.push({ label: `${k.abandoned_checkouts} abandoned checkout${k.abandoned_checkouts === 1 ? "" : "s"} (${inr(k.abandoned_value)})`, href: "#abandoned", tone: "info" });
  if (ov.pending_reviews > 0) items.push({ label: `${ov.pending_reviews} review${ov.pending_reviews === 1 ? "" : "s"} to moderate`, href: "/admin/reviews", tone: "info" });
  for (const s of ov.low_stock ?? [])
    items.push({ label: `${s.name}: ${s.stock <= 0 ? "sold out" : `${s.stock} left`}`, href: `/admin/products/${s.id}`, tone: "warn" });
  if (ov.in_transit > 0) items.push({ label: `${ov.in_transit} in transit`, href: "/admin/orders", tone: "info" });
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-[0.16em] text-ink-faint">Needs attention</span>
      {items.map((i) => (
        <Link
          key={i.label}
          href={i.href}
          className={`rounded-full border px-3 py-1 text-xs ${
            i.tone === "warn" ? "border-gold/50 bg-gold/10 text-gold-deep" : "border-line bg-paper text-ink-dim"
          } hover:border-gold`}
        >
          {i.tone === "warn" ? "! " : ""}{i.label}
        </Link>
      ))}
    </div>
  );
}

interface ChartSeries {
  key: string;
  label: string;
  color: string;
  value: (r: any) => number;
}

/**
 * Bar chart (one series, or grouped bars for 2 series sharing one unit/axis)
 * with a hover/focus readout per bucket. Colours validated for CVD.
 */
function BarChart({ rows, series, label, readout, money }: {
  rows: any[]; series: ChartSeries[]; label: (r: any) => string; readout: (r: any) => string; money?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (!rows.length) return <p className="text-sm text-ink-faint">No data.</p>;
  const H = 140;
  const vals = rows.map((r) => series.map((s) => Number(s.value(r) ?? 0)));
  const max = Math.max(1, ...vals.flat());
  const total = vals.flat().reduce((a, b) => a + b, 0);
  const tickEvery = Math.max(1, Math.ceil(rows.length / 8));
  const fmt = (v: number) => (money ? inr(v) : num(v));
  const totals = series.map((_, si) => vals.reduce((a, v) => a + v[si], 0));

  return (
    <div className="relative">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 text-xs text-ink-faint">
        {series.length > 1 ? (
          <span className="flex flex-wrap gap-3">
            {series.map((s, si) => (
              <span key={s.key} className="inline-flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-[2px]" style={{ background: s.color }} />
                {s.label} <span className="tabular-nums text-ink">{fmt(totals[si])}</span>
              </span>
            ))}
          </span>
        ) : (
          <span>total <span className="tabular-nums text-ink">{fmt(totals[0])}</span> · peak {fmt(max)}</span>
        )}
        <span className="min-h-[1rem] text-ink">
          {hover !== null ? <><strong className="font-medium">{readout(rows[hover])}</strong> · {label(rows[hover])}</> : null}
        </span>
      </div>
      <div className="flex items-end gap-[2px]" style={{ height: H }} onMouseLeave={() => setHover(null)}>
        {rows.map((r, i) => (
          <button
            key={r.bucket ?? i}
            type="button"
            className={`flex h-full min-w-0 flex-1 items-end gap-[2px] rounded-t-[4px] focus:outline-none ${
              hover === i ? "bg-paper-soft/70" : ""
            }`}
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            aria-label={`${label(r)}: ${readout(r)}`}
          >
            {series.map((s, si) => {
              const v = vals[i][si];
              const h = v === 0 ? 0 : Math.max(3, (v / max) * H);
              return (
                <span
                  key={s.key}
                  className="block min-w-0 flex-1 rounded-t-[4px] transition-opacity"
                  style={{ height: h, background: s.color, opacity: hover === null || hover === i ? 1 : 0.55 }}
                />
              );
            })}
          </button>
        ))}
      </div>
      <div className="mt-1 h-px bg-line-strong" />
      <div className="mt-1.5 flex gap-[2px] text-[10px] text-ink-faint">
        {rows.map((r, i) => (
          <span key={r.bucket ?? i} className="min-w-0 flex-1 overflow-visible whitespace-nowrap">
            {i % tickEvery === 0 ? label(r) : ""}
          </span>
        ))}
      </div>
      {total === 0 && <p className="mt-2 text-xs text-ink-faint">Nothing recorded yet for this range.</p>}
    </div>
  );
}

function Funnel({ steps }: { steps: { step: string; n: number }[] }) {
  const top = steps[0]?.n ?? 0;
  if (!top) return <p className="text-sm text-ink-faint">No visits recorded in this range yet.</p>;
  return (
    <ol className="space-y-2.5">
      {steps.map((s, i) => {
        const prev = i === 0 ? s.n : steps[i - 1].n;
        const ofPrev = prev ? (100 * s.n) / prev : 0;
        const width = top ? Math.max((100 * s.n) / top, s.n ? 1.5 : 0) : 0;
        return (
          <li key={s.step}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
              <span className="text-ink">{s.step}</span>
              <span className="tabular-nums text-ink">
                <strong className="font-medium">{num(s.n)}</strong>
                <span className="ml-2 text-xs text-ink-faint">
                  {i === 0 ? "100%" : `${pct((100 * s.n) / top)} of visits · ${pct(ofPrev, 0)} of previous`}
                </span>
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-paper-soft">
              <div className="h-full rounded-full bg-gold" style={{ width: `${width}%` }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function LiveList({ sessions, now, onPick }: { sessions: any[]; now: number; onPick: (id: string) => void }) {
  if (!sessions.length) return <p className="text-sm text-ink-faint">Nobody on the site right now.</p>;
  return (
    <ul className="max-h-80 divide-y divide-line overflow-y-auto">
      {sessions.map((s) => (
        <li key={s.id}>
          <button type="button" onClick={() => onPick(s.id)} className="block w-full py-2 text-left text-sm hover:bg-paper-raised/60">
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate font-mono text-[12px] text-ink">{s.path || "/"}</span>
              <span className="shrink-0 text-xs text-ink-faint">{duration((now - new Date(s.started_at).getTime()) / 1000)}</span>
            </div>
            <p className="mt-0.5 text-xs text-ink-faint">
              {s.channel} · {s.device}{s.city ? ` · ${s.city}` : ""} · {s.pageviews} page{s.pageviews === 1 ? "" : "s"}
              {s.is_returning ? " · returning" : ""}
              {s.began_checkout ? <span className="text-gold-deep"> · at checkout</span> : s.added_to_cart ? <span className="text-gold-deep"> · has cart</span> : null}
            </p>
          </button>
        </li>
      ))}
    </ul>
  );
}

function PathCell({ path }: { path?: string | null }) {
  const p = path || "/";
  return (
    <Link href={p} target="_blank" className="block min-w-0 truncate font-mono text-[12px] text-ink hover:text-gold" title={p}>
      {p}
    </Link>
  );
}

function BarList({ rows, empty, capitalize }: {
  rows: { label: string; value: number; note?: string }[]; empty: string; capitalize?: boolean;
}) {
  if (!rows.length) return <p className="text-sm text-ink-faint">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const total = rows.reduce((a, r) => a + r.value, 0);
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <span className={`min-w-0 truncate text-ink ${capitalize ? "capitalize" : ""}`} title={r.label}>{r.label}</span>
            <span className="shrink-0 tabular-nums text-ink">
              {num(r.value)} <span className="text-xs text-ink-faint">{pct((100 * r.value) / total, 0)}{r.note ? ` · ${r.note}` : ""}</span>
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-paper-soft">
            <div className="h-full rounded-full bg-gold" style={{ width: `${(100 * r.value) / max}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Table({ head, rows, empty, numeric }: {
  head: string[]; rows: React.ReactNode[][]; empty: string; numeric?: boolean;
}) {
  if (!rows.length) return <p className="text-sm text-ink-faint">{empty}</p>;
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line-strong text-left text-[11px] uppercase tracking-[0.12em] text-ink-faint">
            {head.map((h, i) => (
              <th key={h} className={`whitespace-nowrap pb-2 pr-4 font-normal ${numeric && i > 0 ? "text-right" : ""}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci} className={`py-2 pr-4 tabular-nums text-ink ${numeric && ci > 0 ? "whitespace-nowrap text-right" : "max-w-[18rem]"}`}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Abandoned({ rows, onVisit }: { rows: any[]; onVisit: (id: string) => void }) {
  if (!rows.length) return <p id="abandoned" className="text-sm text-ink-faint">No abandoned checkouts in this range.</p>;
  return (
    <ul id="abandoned" className="divide-y divide-line">
      {rows.map((o) => {
        const wa = waLink(o.phone, recoveryMessage(o));
        const items = (o.items ?? []).map((i: any) => `${i.qty}× ${i.name}`).join(", ");
        return (
          <li key={o.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-ink">
                <strong className="font-medium">{o.name || "—"}</strong>
                <span className="text-ink-faint"> · {o.city || "—"} · {istDateTime(o.created_at)}</span>
                {o.channel && <span className="text-ink-faint"> · via {o.channel}</span>}
              </p>
              <p className="truncate text-xs text-ink-dim" title={items}>{items}</p>
              <p className="text-xs text-ink-faint">
                {o.phone} · {o.email}
                {o.recovery_sent_at ? ` · reminder sent ${istDateTime(o.recovery_sent_at)}` : " · no reminder yet"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="font-serif text-lg text-ink tabular-nums">{inr(o.amount)}</span>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-outline px-3 py-1.5 text-xs">
                  WhatsApp
                </a>
              )}
              {o.email && (
                <a href={`mailto:${o.email}`} className="text-xs text-gold-soft hover:underline">Email</a>
              )}
              {o.session_id && (
                <button type="button" onClick={() => onVisit(o.session_id)} className="text-xs text-gold-soft hover:underline">
                  Their visit
                </button>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function EmailList({ subs, customers }: { subs: any; customers: number }) {
  const s = subs ?? { total: 0, confirmed: 0, unconfirmed: 0, recent: [] };
  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Confirmed" value={num(s.confirmed)} />
        <MiniStat label="Awaiting confirm" value={num(s.unconfirmed)} />
        <MiniStat label="Customers" value={num(customers)} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href="/api/admin/email-list?list=subscribers" className="btn btn-outline px-3 py-1.5 text-xs">Export subscribers CSV</a>
        <a href="/api/admin/email-list?list=customers" className="btn btn-outline px-3 py-1.5 text-xs">Export customers CSV</a>
      </div>
      {s.recent?.length ? (
        <ul className="mt-4 max-h-64 divide-y divide-line overflow-y-auto text-sm">
          {s.recent.map((r: any) => (
            <li key={r.email} className="flex items-baseline justify-between gap-3 py-1.5">
              <span className="min-w-0 truncate text-ink" title={r.email}>{r.email}</span>
              <span className="shrink-0 text-xs text-ink-faint">
                {r.confirmed ? "confirmed" : "unconfirmed"} · {r.source ?? "—"} · {istDateTime(r.created_at)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-ink-faint">No sign-ups yet.</p>
      )}
    </div>
  );
}

// ── v2 building blocks ──────────────────────────────────────────────────────
function scrollToId(id: string) {
  if (typeof document === "undefined") return;
  requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
}

function hourLabel(h: number): string {
  if (h === 0) return "12am";
  if (h === 12) return "12pm";
  return h < 12 ? `${h}am` : `${h - 12}pm`;
}

function todayIST(): string {
  return new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}

function Flag({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-gold/50 bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold-deep">
      {text}
    </span>
  );
}

function RoasCell({ revenue, spend }: { revenue: number; spend: number }) {
  const r = revenue / spend;
  return (
    <span className={r >= 1 ? "text-green-700" : "text-rudra"} title={r >= 1 ? "Paying back" : "Not yet paying back"}>
      {r.toFixed(2)}× {r >= 1 ? "▲" : "▼"}
    </span>
  );
}

function GoalStrip({ month, m, onSaved }: {
  month: { label: string; daysInMonth: number; elapsedDays: number };
  m: any;
  onSaved: () => void;
}) {
  const goal = Number(m.goal ?? 0);
  const mtd = Number(m.revenue ?? 0);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(goal ? String(goal) : "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const elapsed = Math.max(month.elapsedDays, 0.01);
  const pace = (mtd / elapsed) * month.daysInMonth;
  const daysLeft = Math.max(month.daysInMonth - month.elapsedDays, 0);
  const pctDone = goal ? Math.min(100, (100 * mtd) / goal) : 0;
  const expected = Math.min(100, (100 * month.elapsedDays) / month.daysInMonth);

  async function save() {
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyRevenueGoal: Number(value || 0) }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not save.");
      setEditing(false);
      onSaved();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-sm border border-line bg-paper px-4 py-3.5 sm:px-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm text-ink">
          <span className="text-[11px] uppercase tracking-[0.14em] text-ink-faint">{month.label} so far </span>
          <strong className="ml-1 font-serif text-xl font-normal tabular-nums">{inr(mtd)}</strong>
          {goal ? <span className="text-ink-faint"> of {inr(goal)} goal · {pctDone.toFixed(0)}%</span> : null}
          <span className="text-ink-faint">
            {" "}· {num(m.orders)} order{m.orders === 1 ? "" : "s"}
            {m.spend ? ` · ${inr(m.spend)} ad spend` : ""}
          </span>
        </p>
        <p className="text-xs text-ink-faint">
          On pace for <span className="text-ink">{inr(Math.round(pace))}</span>
          {goal && mtd < goal && daysLeft > 0 ? (
            <> · need <span className="text-ink">{inr(Math.ceil((goal - mtd) / Math.max(daysLeft, 1)))}</span>/day for {Math.ceil(daysLeft)} day{Math.ceil(daysLeft) === 1 ? "" : "s"}</>
          ) : null}
          {" · "}
          <button type="button" onClick={() => { setValue(goal ? String(goal) : ""); setEditing((v) => !v); }} className="text-gold-soft hover:underline">
            {goal ? "edit goal" : "set a monthly goal"}
          </button>
        </p>
      </div>
      {goal > 0 && (
        <div className="relative mt-2 h-2.5 rounded-full bg-paper-soft" aria-label={`${pctDone.toFixed(0)}% of monthly goal`}>
          <div className={`h-full rounded-full ${pctDone >= expected ? "bg-green-700" : "bg-gold"}`} style={{ width: `${pctDone}%` }} />
          <span className="absolute -top-1 h-4.5 w-px bg-ink" style={{ left: `${expected}%`, height: 18 }} title="Where you'd be on an even pace today" />
        </div>
      )}
      {editing && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="text-xs text-ink-dim" htmlFor="goal-input">Monthly revenue goal ₹</label>
          <input
            id="goal-input"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
            className="w-32 rounded-sm border border-line-strong bg-paper px-2 py-1 text-sm text-ink"
            placeholder="50000"
          />
          <button type="button" onClick={save} disabled={saving} className="btn btn-primary px-3 py-1.5 text-xs">
            {saving ? "Saving…" : "Save"}
          </button>
          <span className="text-xs text-ink-faint">0 removes the goal.</span>
          {err && <span className="text-xs text-rudra">{err}</span>}
        </div>
      )}
    </div>
  );
}

function Insights({ items }: { items: Insight[] }) {
  if (!items.length) return null;
  const dot = { warn: "bg-rudra", good: "bg-green-700", info: "bg-gold" } as const;
  const word = { warn: "Fix", good: "Working", info: "Note" } as const;
  return (
    <section className="rounded-sm border border-line bg-paper px-4 py-3.5 sm:px-5">
      <h2 className="text-xs uppercase tracking-[0.18em] text-ink-dim">Worth a look</h2>
      <ul className="mt-2 space-y-1.5">
        {items.map((i) => (
          <li key={i.text} className="flex items-start gap-2 text-sm text-ink">
            <span className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${dot[i.tone]}`} aria-hidden />
            <span>
              <span className="mr-1 text-[10px] uppercase tracking-wider text-ink-faint">{word[i.tone]}</span>
              {i.text}
              {i.href && (
                <a href={i.href} className="ml-1.5 text-xs text-gold-soft hover:underline">see</a>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

const SPEND_CHANNEL_OPTIONS = ["Google Ads", "Meta Ads", "Influencers", "Other Paid"];

function SpendManager({ onChange, refreshKey }: { onChange: () => void; refreshKey: string }) {
  const [entries, setEntries] = useState<any[] | null>(null);
  const [sync, setSync] = useState<{ at: string } | null>(null);
  const [date, setDate] = useState(todayIST());
  const [channel, setChannel] = useState(SPEND_CHANNEL_OPTIONS[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/spend", { cache: "no-store" });
      const j = await res.json();
      if (res.ok) {
        setEntries(j.entries ?? []);
        setSync(j.googleAdsSync ?? null);
      }
    } catch { /* keep last list */ }
  }, []);

  useEffect(() => { void refresh(); }, [refresh, refreshKey]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, channel, amount: Number(amount), note }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not save.");
      setMsg({ ok: true, text: `Saved ${inr(Number(amount))} for ${channel} on ${date}.` });
      setAmount("");
      setNote("");
      await refresh();
      onChange();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Could not save." });
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this spend entry?")) return;
    await fetch(`/api/admin/spend?id=${id}`, { method: "DELETE" });
    await refresh();
    onChange();
  }

  const input = "rounded-sm border border-line-strong bg-paper px-2 py-1.5 text-sm text-ink";
  const last7 = (entries ?? []).filter((e) => e.spend_date > new Date(Date.now() + 5.5 * 3600e3 - 7 * 864e5).toISOString().slice(0, 10))
    .reduce((a, e) => a + e.amount, 0);

  return (
    <div>
      <form onSubmit={save} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1 text-xs text-ink-dim">
          Date
          <input type="date" value={date} max={todayIST()} onChange={(e) => setDate(e.target.value)} className={input} required />
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-dim">
          Channel
          <select value={channel} onChange={(e) => setChannel(e.target.value)} className={input}>
            {SPEND_CHANNEL_OPTIONS.map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs text-ink-dim">
          Amount ₹
          <input inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
            className={`${input} w-28`} placeholder="600" required />
        </label>
        <label className="flex min-w-[10rem] flex-1 flex-col gap-1 text-xs text-ink-dim">
          Note (optional)
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} className={input} placeholder="Search + Shopping" />
        </label>
        <button type="submit" disabled={busy || !amount} className="btn btn-primary px-4 py-2 text-xs">
          {busy ? "Saving…" : "Save spend"}
        </button>
      </form>
      {msg && <p className={`mt-2 text-xs ${msg.ok ? "text-green-700" : "text-rudra"}`}>{msg.text}</p>}
      <p className="mt-3 text-xs text-ink-faint">
        {sync?.at ? (
          <>
            Google Ads auto-sync: last run <span className="text-ink">{istDateTime(sync.at)}</span>
            {Date.now() - new Date(sync.at).getTime() > 3 * 3600e3 && (
              <span className="text-rudra"> · overdue — check Google Ads → Tools → Scripts</span>
            )}
          </>
        ) : (
          "Google Ads auto-sync hasn't run yet."
        )}
      </p>

      {entries === null ? (
        <p className="mt-4 text-sm text-ink-faint">Loading…</p>
      ) : entries.length === 0 ? (
        <p className="mt-4 text-sm text-ink-faint">No spend logged yet. Add yesterday&apos;s Google Ads cost to start seeing ROAS.</p>
      ) : (
        <>
          <p className="mt-4 text-xs text-ink-faint">Last 7 days: <span className="text-ink">{inr(last7)}</span></p>
          <ul className="mt-2 max-h-56 divide-y divide-line overflow-y-auto text-sm">
            {entries.map((e) => (
              <li key={e.id} className="flex items-baseline justify-between gap-3 py-1.5">
                <span className="min-w-0 truncate text-ink">
                  <span className="tabular-nums">{e.spend_date}</span>
                  <span className="text-ink-faint"> · {e.channel}{e.note ? ` · ${e.note}` : ""}</span>
                </span>
                <span className="flex shrink-0 items-baseline gap-3">
                  <span className="tabular-nums text-ink">{inr(e.amount)}</span>
                  <button type="button" onClick={() => remove(e.id)} className="text-xs text-ink-faint hover:text-rudra" aria-label={`Delete ${e.channel} ${e.spend_date}`}>
                    delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

const VISIT_FILTER_LABELS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "paid_ads", label: "From ads" },
  { key: "engaged", label: "Engaged" },
  { key: "cart", label: "Added to cart" },
  { key: "bounced", label: "Bounced" },
];

function outcome(v: any): { text: string; tone: "good" | "warm" | "plain" } {
  if (v.ord?.status === "paid") return { text: `Paid ${inr(v.ord.amount)}`, tone: "good" };
  if (v.ord) return { text: `Checkout ${inr(v.ord.amount)} · unpaid`, tone: "warm" };
  if (v.began_checkout) return { text: "Reached checkout", tone: "warm" };
  if (v.added_to_cart) return { text: `Cart ${inr(v.cart_value)}`, tone: "warm" };
  if (v.subscribed) return { text: "Joined list", tone: "warm" };
  if (v.pageviews <= 1 && v.dur < 10) return { text: "Bounced", tone: "plain" };
  return { text: "Browsed", tone: "plain" };
}

function Journeys({ range, refreshKey, channel, setChannel, channels, focus, clearFocus }: {
  range: RangeKey; refreshKey: string; channel: string | null; setChannel: (c: string | null) => void;
  channels: string[]; focus: string | null; clearFocus: () => void;
}) {
  const [filter, setFilter] = useState("all");
  const [visits, setVisits] = useState<any[] | null>(null);
  const [focused, setFocused] = useState<any | null>(null);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [limit, setLimit] = useState(30);

  useEffect(() => {
    let alive = true;
    const qs = new URLSearchParams({ range, filter, limit: String(limit) });
    if (channel) qs.set("channel", channel);
    fetch(`/api/admin/visits?${qs}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { if (alive && Array.isArray(j.visits)) setVisits(j.visits); })
      .catch(() => {});
    return () => { alive = false; };
  }, [range, filter, channel, limit, refreshKey]);

  useEffect(() => {
    if (!focus) { setFocused(null); return; }
    let alive = true;
    fetch(`/api/admin/visits?session=${focus}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => { if (alive) setFocused(j.visits?.[0] ?? null); })
      .catch(() => {});
    return () => { alive = false; };
  }, [focus, refreshKey]);

  const toggle = (id: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs ${active ? "border-ink bg-ink text-cream" : "border-line-strong bg-paper text-ink-dim hover:border-gold"}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {VISIT_FILTER_LABELS.map((f) => (
          <button key={f.key} type="button" className={chip(filter === f.key)} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
        <select
          value={channel ?? ""}
          onChange={(e) => setChannel(e.target.value || null)}
          className="ml-auto rounded-sm border border-line-strong bg-paper px-2 py-1 text-xs text-ink"
          aria-label="Channel"
        >
          <option value="">All channels</option>
          {Array.from(new Set([...(channel ? [channel] : []), ...channels])).map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {focused && (
        <div className="mt-4 rounded-sm border border-gold/50 bg-gold/5 p-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.14em] text-gold-deep">Following this visit</span>
            <button type="button" onClick={clearFocus} className="text-xs text-ink-faint hover:text-ink">close</button>
          </div>
          <VisitRow v={focused} open onToggle={() => {}} />
        </div>
      )}

      {visits === null ? (
        <p className="mt-4 text-sm text-ink-faint">Loading visits…</p>
      ) : visits.length === 0 ? (
        <p className="mt-4 text-sm text-ink-faint">No visits match in this range.</p>
      ) : (
        <>
          <ul className="mt-3 divide-y divide-line">
            {visits.map((v) => (
              <li key={v.id}><VisitRow v={v} open={open.has(v.id)} onToggle={() => toggle(v.id)} /></li>
            ))}
          </ul>
          {visits.length >= limit && limit < 200 && (
            <button type="button" onClick={() => setLimit((l) => Math.min(l + 40, 200))} className="mt-3 text-xs text-gold-soft hover:underline">
              Show more visits
            </button>
          )}
        </>
      )}
    </div>
  );
}

function VisitRow({ v, open, onToggle }: { v: any; open: boolean; onToggle: () => void }) {
  const o = outcome(v);
  const toneCls = o.tone === "good" ? "border-green-700/40 bg-green-700/10 text-green-800"
    : o.tone === "warm" ? "border-gold/50 bg-gold/10 text-gold-deep" : "border-line bg-paper-raised text-ink-dim";
  const events: any[] = v.events ?? [];
  const start = new Date(v.started_at).getTime();
  const end = new Date(v.last_seen_at).getTime();
  const pageIdx = events.map((e, i) => (e.t === "pageview" ? i : -1)).filter((i) => i >= 0);

  const steps = events.filter((e) => e.t !== "view_item").map((e) => {
    const at = new Date(e.at).getTime();
    let stay: number | null = null;
    if (e.t === "pageview") {
      const i = events.indexOf(e);
      const nextIdx = pageIdx.find((j) => j > i);
      const next = nextIdx !== undefined ? new Date(events[nextIdx].at).getTime() : end;
      stay = Math.max(0, (next - at) / 1000);
    }
    return { ...e, offset: (at - start) / 1000, stay };
  });

  return (
    <div className="py-2.5">
      <button type="button" onClick={onToggle} className="flex w-full flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-left" aria-expanded={open}>
        <span className="min-w-0 text-sm text-ink">
          <span className="text-ink-faint tabular-nums">{istDateTime(v.started_at)}</span>
          <span className="mx-1.5 font-medium">{v.channel}</span>
          <span className="font-mono text-[12px] text-ink-dim">{v.landing_path}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs text-ink-faint">
          <span>{duration(v.dur)} · {v.pageviews} page{v.pageviews === 1 ? "" : "s"} · {v.device}{v.city ? ` · ${v.city}` : ""}</span>
          {v.visits_total > 1 && <span title="Total visits from this browser">{v.visits_total} visits</span>}
          <span className={`rounded-full border px-2 py-0.5 text-[11px] ${toneCls}`}>{o.text}</span>
          <span aria-hidden>{open ? "▴" : "▾"}</span>
        </span>
      </button>
      {open && (
        <div className="mt-2 rounded-sm bg-paper-raised/60 px-3 py-2">
          <p className="mb-2 text-xs text-ink-faint">
            {[
              v.referrer_host && `from ${v.referrer_host}`,
              v.source && `${v.source}/${v.medium ?? "—"}`,
              v.campaign && `campaign ${v.campaign}`,
              v.term && `keyword “${v.term}”`,
              [v.browser, v.os].filter(Boolean).join(" on "),
              [v.city, v.region, v.country].filter(Boolean).join(", "),
              v.is_returning ? "returning visitor" : "first visit",
            ].filter(Boolean).join(" · ")}
          </p>
          <ol className="space-y-1">
            {steps.map((s, i) => (
              <li key={i} className="flex items-baseline gap-3 text-sm">
                <span className="w-12 shrink-0 text-right font-mono text-[11px] text-ink-faint">+{duration(s.offset)}</span>
                {s.t === "pageview" ? (
                  <span className="min-w-0 flex-1">
                    <a href={s.p} target="_blank" rel="noreferrer" className="font-mono text-[12px] text-ink hover:text-gold">{s.p}</a>
                    <span className="ml-2 text-xs text-ink-faint">{s.stay !== null ? `stayed ${duration(s.stay)}` : ""}</span>
                  </span>
                ) : (
                  <span className="min-w-0 flex-1 text-gold-deep">
                    {s.t === "add_to_cart" ? `Added to cart${s.pid ? ` · ${s.pid}` : ""}${s.v ? ` · ${inr(s.v)}` : ""}`
                      : s.t === "begin_checkout" ? `Clicked pay${s.v ? ` · ${inr(s.v)}` : ""}`
                      : s.t === "subscribe" ? "Joined the email list" : s.t}
                  </span>
                )}
              </li>
            ))}
            <li className="flex items-baseline gap-3 text-xs text-ink-faint">
              <span className="w-12 shrink-0 text-right font-mono text-[11px]">+{duration(v.dur)}</span>
              <span>{Date.now() - end < 5 * 60e3 ? "still on the site" : v.ord?.status === "paid" ? "order paid" : "left"}</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}

function DailyEmail({ to }: { to: string | null }) {
  const [state, setState] = useState<{ busy: boolean; msg?: string; ok?: boolean }>({ busy: false });
  async function sendNow() {
    setState({ busy: true });
    try {
      const res = await fetch("/api/admin/daily-report", { method: "POST" });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Could not send.");
      setState({ busy: false, ok: true, msg: `Sent to ${j.to}.` });
    } catch (e) {
      setState({ busy: false, ok: false, msg: e instanceof Error ? e.message : "Could not send." });
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      {to ? (
        <span className="text-ink">On — goes to <strong className="font-medium">{to}</strong> every morning.</span>
      ) : (
        <span className="text-ink-dim">
          Off. To turn it on, add <code className="rounded bg-paper-raised px-1 font-mono text-[12px]">DAILY_REPORT_TO</code> (the
          email to send it to) in Vercel → Settings → Environment Variables, then redeploy.
        </span>
      )}
      <a href="/api/admin/daily-report" target="_blank" className="btn btn-outline px-3 py-1.5 text-xs">Preview email</a>
      {to && (
        <button type="button" onClick={sendNow} disabled={state.busy} className="btn btn-outline px-3 py-1.5 text-xs">
          {state.busy ? "Sending…" : "Send it now"}
        </button>
      )}
      {state.msg && <span className={`text-xs ${state.ok ? "text-green-700" : "text-rudra"}`}>{state.msg}</span>}
    </div>
  );
}
