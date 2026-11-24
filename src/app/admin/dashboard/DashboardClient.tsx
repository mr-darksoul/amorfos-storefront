"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DashboardData, RangeKey } from "@/lib/dashboard";
import { inr } from "@/lib/format";

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

function waLink(phone?: string): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 10) return null;
  const full = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${full}`;
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

      {/* Headline KPIs */}
      <section>
        <SectionHead title="Sales" note={PREV_LABEL[data.range.key]} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi label="Revenue" value={inr(k.revenue)} cur={k.revenue} prev={p?.revenue} />
          <Kpi label="Paid orders" value={num(k.orders)} cur={k.orders} prev={p?.orders} />
          <Kpi label="Conversion rate" value={pct(k.conversion_rate, 2)} cur={k.conversion_rate} prev={p?.conversion_rate}
            hint="Visits that ended in a paid order" />
          <Kpi label="Avg order value" value={inr(k.aov)} cur={k.aov} prev={p?.aov} />
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
            prev={p?.abandoned_checkouts} lowerIsBetter sub={`${inr(k.abandoned_value)} left unpaid`} />
          <Kpi label="New subscribers" value={num(k.subscribers_new)} cur={k.subscribers_new} prev={p?.subscribers_new}
            sub={`${num(k.subscribers_confirmed_new)} confirmed`} />
        </div>
      </section>

      {/* Trend charts — separate charts, never two scales on one axis */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Visitors" subtitle={bucket === "hour" ? "Unique visitors per hour (IST)" : `Unique visitors per ${bucket}`}>
          <BarChart
            rows={data.current.series ?? []}
            value={(r) => r.visitors}
            label={(r) => bucketLabel(r.bucket, bucket)}
            format={(v, r) => `${num(v)} visitor${v === 1 ? "" : "s"} · ${num(r.sessions)} session${r.sessions === 1 ? "" : "s"}`}
          />
        </Card>
        <Card title="Revenue" subtitle={bucket === "hour" ? "Paid revenue per hour (IST)" : `Paid revenue per ${bucket}`}>
          <BarChart
            rows={data.current.series ?? []}
            value={(r) => r.revenue}
            label={(r) => bucketLabel(r.bucket, bucket)}
            format={(v, r) => `${inr(v)} · ${num(r.orders)} order${r.orders === 1 ? "" : "s"}`}
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3" title="Purchase funnel" subtitle="Where visitors drop off">
          <Funnel steps={data.current.funnel ?? []} />
        </Card>
        <Card className="lg:col-span-2" title="On site now" subtitle="Active in the last 5 minutes">
          <LiveList sessions={live.sessions ?? []} now={now} />
        </Card>
      </div>

      <Card title="Traffic sources" subtitle="Which channels bring visitors — and which ones buy">
        <Table
          empty="No visits recorded in this range yet."
          head={["Channel", "Sessions", "Visitors", "Avg time", "Bounce", "Carts", "Checkouts", "Orders", "Revenue", "Conv."]}
          rows={(data.current.channels ?? []).map((c: any) => [
            <span key="c" className="font-medium text-ink">{c.channel}</span>,
            num(c.sessions), num(c.visitors), duration(c.avg_sec), pct(c.bounce), num(c.carts),
            num(c.checkouts), num(c.orders), inr(c.revenue),
            pct(c.sessions ? (100 * c.orders) / c.sessions : 0, 2),
          ])}
          numeric
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Campaigns" subtitle="UTM-tagged & ad-click visits">
          <Table
            empty="No tagged visits yet. Google Ads clicks and links with utm_ tags show up here."
            head={["Source / medium", "Campaign", "Sessions", "Carts", "Orders", "Revenue"]}
            rows={(data.current.campaigns ?? []).map((c: any) => [
              `${c.source} / ${c.medium}`, c.campaign, num(c.sessions), num(c.carts), num(c.orders), inr(c.revenue),
            ])}
            numeric
          />
        </Card>
        <Card title="Referring sites" subtitle="Where untagged visits came from">
          <BarList rows={(data.current.referrers ?? []).map((r: any) => ({ label: r.host, value: r.sessions }))}
            empty="No referrals yet." />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Landing pages" subtitle="First page of each visit">
          <Table
            empty="No visits yet."
            head={["Page", "Sessions", "Bounce", "Avg time", "Carts"]}
            rows={(data.current.landing_pages ?? []).map((l: any) => [
              <PathCell key="p" path={l.path} />, num(l.sessions), pct(l.bounce), duration(l.avg_sec), num(l.carts),
            ])}
            numeric
          />
        </Card>
        <Card title="Most viewed pages">
          <Table
            empty="No pageviews yet."
            head={["Page", "Views", "Visitors"]}
            rows={(data.current.pages ?? []).map((l: any) => [<PathCell key="p" path={l.path} />, num(l.views), num(l.visitors)])}
            numeric
          />
        </Card>
      </div>

      <Card title="Products" subtitle="Views and add-to-carts count visits; units & revenue are paid orders">
        <Table
          empty="No product activity in this range."
          head={["Product", "Views", "Add to cart", "Cart rate", "Units sold", "Revenue"]}
          rows={(data.current.products ?? []).map((pr: any) => [
            <Link key="n" href={`/shop/${pr.product_id}`} target="_blank" className="text-ink hover:text-gold">{pr.name}</Link>,
            num(pr.views), num(pr.carts), pr.views ? pct((100 * pr.carts) / pr.views) : "—", num(pr.units), inr(pr.revenue),
          ])}
          numeric
        />
      </Card>

      <Card
        title="Abandoned checkouts"
        subtitle="Filled in their details but didn't pay (customers who later paid are hidden). The daily recovery cron nudges each one once."
      >
        <Abandoned rows={data.current.abandoned ?? []} />
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
            <MiniStat label="Visitors (all time)" value={num(ov.visitors_all_time)} />
            <MiniStat label="Visitors today" value={num(ov.visitors_today)} />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Devices">
          <BarList capitalize rows={(data.current.devices ?? []).map((d: any) => ({ label: d.label, value: d.sessions }))} empty="—" />
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

      <p className="pb-6 text-xs leading-relaxed text-ink-faint">
        Visitor tracking is first-party and started{" "}
        {ov.tracking_since ? istDateTime(ov.tracking_since) : "with this release"} — earlier traffic lives in GA4 only.
        Your own browser is excluded once you open admin on it (or visit any page with <code>?notrack=1</code>).
        Orders under ₹100 are treated as test payments and left out. Ad-blockers hide a small share of visits;
        orders and revenue come straight from the orders table and are always complete. Refreshes every{" "}
        {REFRESH_MS / 1000}s.
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

function Card({ title, subtitle, children, className = "" }: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <section className={`min-w-0 rounded-sm border border-line bg-paper px-4 py-4 sm:px-5 ${className}`}>
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

/** Single-series bar chart with a per-bar hover/focus tooltip. */
function BarChart({ rows, value, label, format }: {
  rows: any[]; value: (r: any) => number; label: (r: any) => string; format: (v: number, r: any) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  if (!rows.length) return <p className="text-sm text-ink-faint">No data.</p>;
  const values = rows.map((r) => Number(value(r) ?? 0));
  const max = Math.max(...values, 1);
  const total = values.reduce((a, b) => a + b, 0);
  const H = 140;
  const tickEvery = Math.max(1, Math.ceil(rows.length / 8));
  const active = hover ?? null;
  const peakIdx = Math.max(0, values.indexOf(Math.max(...values)));

  return (
    <div className="relative">
      <div className="mb-2 flex items-baseline justify-between text-xs text-ink-faint">
        <span>peak {format(values[peakIdx], rows[peakIdx]).split(" · ")[0]}</span>
        <span className="min-h-[1rem] text-ink">
          {active !== null ? <><strong className="font-medium">{format(values[active], rows[active])}</strong> · {label(rows[active])}</> : null}
        </span>
      </div>
      <div className="flex items-end gap-[2px]" style={{ height: H }} onMouseLeave={() => setHover(null)}>
        {rows.map((r, i) => {
          const h = values[i] === 0 ? 0 : Math.max(3, (values[i] / max) * H);
          return (
            <button
              key={r.bucket}
              type="button"
              className="group flex h-full min-w-0 flex-1 items-end focus:outline-none"
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${label(r)}: ${format(values[i], r)}`}
            >
              <span
                className={`block w-full rounded-t-[4px] transition-colors ${
                  active === i ? "bg-gold-deep" : "bg-gold group-hover:bg-gold-deep"
                }`}
                style={{ height: h }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-1 h-px bg-line-strong" />
      <div className="mt-1.5 flex gap-[2px] text-[10px] text-ink-faint">
        {rows.map((r, i) => (
          <span key={r.bucket} className="min-w-0 flex-1 overflow-visible whitespace-nowrap">
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

function LiveList({ sessions, now }: { sessions: any[]; now: number }) {
  if (!sessions.length) return <p className="text-sm text-ink-faint">Nobody on the site right now.</p>;
  return (
    <ul className="max-h-80 divide-y divide-line overflow-y-auto">
      {sessions.map((s, i) => (
        <li key={i} className="py-2 text-sm">
          <div className="flex items-baseline justify-between gap-2">
            <PathCell path={s.path} />
            <span className="shrink-0 text-xs text-ink-faint">{duration((now - new Date(s.started_at).getTime()) / 1000)}</span>
          </div>
          <p className="mt-0.5 text-xs text-ink-faint">
            {s.channel} · {s.device}{s.city ? ` · ${s.city}` : ""} · {s.pageviews} page{s.pageviews === 1 ? "" : "s"}
            {s.is_returning ? " · returning" : ""}
            {s.began_checkout ? <span className="text-gold-deep"> · at checkout</span> : s.added_to_cart ? <span className="text-gold-deep"> · has cart</span> : null}
          </p>
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

function BarList({ rows, empty, capitalize }: { rows: { label: string; value: number }[]; empty: string; capitalize?: boolean }) {
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
              {num(r.value)} <span className="text-xs text-ink-faint">{pct((100 * r.value) / total, 0)}</span>
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

function Abandoned({ rows }: { rows: any[] }) {
  if (!rows.length) return <p id="abandoned" className="text-sm text-ink-faint">No abandoned checkouts in this range.</p>;
  return (
    <ul id="abandoned" className="divide-y divide-line">
      {rows.map((o) => {
        const wa = waLink(o.phone);
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
