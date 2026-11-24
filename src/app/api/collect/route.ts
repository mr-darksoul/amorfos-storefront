import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { rateLimit } from "@/lib/ratelimit";
import { classifyTraffic, isBot, parseUserAgent } from "@/lib/trafficSource";

/**
 * First-party analytics intake (see lib/siteTracker.ts). Always answers 204 so
 * a tracking problem can never surface to a shopper. Drops bots, admin
 * browsers (anyone holding the admin cookie) and malformed payloads.
 */

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TYPES = new Set(["pageview", "ping", "view_item", "add_to_cart", "begin_checkout", "subscribe"]);
const UTM_KEYS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "gclid", "gbraid", "wbraid", "fbclid",
] as const;

const done = () => new NextResponse(null, { status: 204 });

function str(v: unknown, max: number): string | undefined {
  return typeof v === "string" && v.length > 0 ? v.slice(0, max) : undefined;
}

function header(req: NextRequest, name: string): string | undefined {
  const v = req.headers.get(name);
  if (!v) return undefined;
  try { return decodeURIComponent(v).slice(0, 80); } catch { return v.slice(0, 80); }
}

export async function POST(req: NextRequest) {
  if (!isSupabaseConfigured()) return done();
  if (req.cookies.get("amorfos_admin")) return done();

  const ua = req.headers.get("user-agent") ?? "";
  if (isBot(ua)) return done();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`collect:${ip}`, 240, 60_000).ok) return done();

  let body: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > 4000) return done();
    body = JSON.parse(text);
  } catch {
    return done();
  }

  const type = str(body.t, 20);
  const sid = str(body.sid, 36);
  const vid = str(body.vid, 36);
  const path = str(body.p, 200);
  if (!type || !TYPES.has(type) || !sid || !vid || !UUID_RE.test(sid) || !UUID_RE.test(vid)) {
    return done();
  }
  if (path && (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api"))) {
    return done();
  }

  let session: Record<string, string | undefined> = {};
  if (type !== "ping") {
    const rawUtm = (body.utm && typeof body.utm === "object" ? body.utm : {}) as Record<string, unknown>;
    const utm: Partial<Record<(typeof UTM_KEYS)[number], string>> = {};
    for (const k of UTM_KEYS) {
      const v = str(rawUtm[k], 200);
      if (v) utm[k] = v;
    }
    const attribution = classifyTraffic(utm, str(body.ref, 300), ua);
    session = {
      ...attribution,
      ...parseUserAgent(ua),
      country: header(req, "x-vercel-ip-country"),
      region: header(req, "x-vercel-ip-country-region"),
      city: header(req, "x-vercel-ip-city"),
    };
  }

  const value = typeof body.v === "number" && Number.isFinite(body.v)
    ? Math.max(0, Math.min(Math.round(body.v), 10_000_000))
    : null;

  const { error } = await supabase().rpc("track_hit", {
    p_sid: sid,
    p_vid: vid,
    p_type: type,
    p_path: path ?? null,
    p_product_id: str(body.pid, 120) ?? null,
    p_value: value,
    p_session: session,
  });
  if (error) console.error("[collect] track_hit failed:", error.message);

  return done();
}
