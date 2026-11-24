/**
 * First-party visit tracking for the admin dashboard (browser side).
 *
 * A visitor is a random UUID kept in localStorage; a session is a run of
 * activity with no gap over 30 minutes (or a fresh ad/UTM click). Both ids are
 * mirrored into first-party cookies (`amf_vid`, `amf_sid`) so checkout can
 * stamp the order with the session that placed it — that is how revenue gets
 * attributed to a traffic source. Nothing personal is sent: only the page path,
 * the referrer host, campaign tags and (for cart events) a product id + value.
 *
 * Every call is a safe no-op on the server, in admin browsers, and when storage
 * is blocked. Admin browsers opt out permanently the first time they open
 * /admin (or any page with `?notrack=1`; `?notrack=0` opts back in).
 */

const ENDPOINT = "/api/collect";
const SESSION_IDLE_MS = 30 * 60 * 1000;
const VID_KEY = "amf_vid";
const SESSION_KEY = "amf_session";
const OPTOUT_KEY = "amf_notrack";

const CAMPAIGN_PARAMS = [
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "gclid", "gbraid", "wbraid", "fbclid",
] as const;

export type TrackType =
  | "pageview" | "ping" | "view_item" | "add_to_cart" | "begin_checkout" | "subscribe";

interface StoredSession {
  id: string;
  last: number;
  attrKey: string;
  /** Attribution captured on the session's first page (sent with every hit). */
  ref?: string;
  utm?: Record<string, string>;
}

function safeGet(key: string): string | null {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string): void {
  try { window.localStorage.setItem(key, value); } catch { /* storage blocked */ }
}
function safeRemove(key: string): void {
  try { window.localStorage.removeItem(key); } catch { /* storage blocked */ }
}

function uuid(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // RFC 4122 v4 fallback for old browsers.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function setCookie(name: string, value: string, maxAgeSec: number): void {
  try {
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax${secure}`;
  } catch { /* ignore */ }
}

/** True when this browser should never be recorded (admin, explicit opt-out, bots). */
export function isTrackingDisabled(): boolean {
  if (typeof window === "undefined") return true;
  const params = new URLSearchParams(window.location.search);
  if (params.get("notrack") === "1") safeSet(OPTOUT_KEY, "1");
  if (params.get("notrack") === "0") safeRemove(OPTOUT_KEY);
  if (window.location.pathname.startsWith("/admin")) safeSet(OPTOUT_KEY, "1");
  if (safeGet(OPTOUT_KEY) === "1") return true;
  if ((navigator as Navigator & { webdriver?: boolean }).webdriver) return true;
  return false;
}

function visitorId(): string {
  let vid = safeGet(VID_KEY);
  if (!vid || !/^[0-9a-f-]{36}$/i.test(vid)) {
    vid = uuid();
    safeSet(VID_KEY, vid);
  }
  setCookie("amf_vid", vid, 60 * 60 * 24 * 365);
  return vid;
}

function campaignFromUrl(): Record<string, string> {
  const out: Record<string, string> = {};
  const params = new URLSearchParams(window.location.search);
  for (const key of CAMPAIGN_PARAMS) {
    const v = params.get(key);
    if (v) out[key] = v.slice(0, 200);
  }
  return out;
}

function externalReferrer(): string | undefined {
  const ref = document.referrer;
  if (!ref) return undefined;
  try {
    const host = new URL(ref).host;
    if (host === window.location.host) return undefined;
  } catch {
    // android-app://com.instagram.android etc. — keep as-is
  }
  return ref.slice(0, 300);
}

/**
 * Returns the live session, starting a new one when the old one went idle or
 * the visitor arrived through a different campaign/ad click.
 */
function currentSession(now: number, allowNew = true): StoredSession | null {
  const utm = campaignFromUrl();
  const attrKey = Object.keys(utm).length ? JSON.stringify(utm) : "";
  let sess: StoredSession | null = null;
  try {
    const raw = safeGet(SESSION_KEY);
    sess = raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch { sess = null; }

  const expired = !sess || now - sess.last > SESSION_IDLE_MS;
  const newCampaign = !!attrKey && sess?.attrKey !== attrKey;
  if (!sess || expired || newCampaign) {
    if (!allowNew) return null;
    sess = { id: uuid(), last: now, attrKey, ref: externalReferrer(), utm };
  }
  sess.last = now;
  safeSet(SESSION_KEY, JSON.stringify(sess));
  setCookie("amf_sid", sess.id, 60 * 60 * 24);
  return sess;
}

/** Path only (never the query string), with secret-bearing segments masked. */
function cleanPath(path: string): string {
  return path
    .replace(/^\/reviews\/[^/]+/, "/reviews/[token]")
    .slice(0, 200);
}

let lastActivity = Date.now();

/** Note user interaction so heartbeats stop when a tab is left open idle. */
export function markActivity(): void {
  lastActivity = Date.now();
}

export function isRecentlyActive(withinMs: number): boolean {
  return Date.now() - lastActivity < withinMs;
}

export function sendHit(
  type: TrackType,
  extra: { productId?: string; value?: number; path?: string } = {},
): void {
  if (isTrackingDisabled()) return;
  try {
    const now = Date.now();
    // A heartbeat never starts a session — an idle tab coming back to life
    // gets a fresh session on its next real pageview instead.
    const sess = currentSession(now, type !== "ping");
    if (!sess) return;
    const body = JSON.stringify({
      t: type,
      sid: sess.id,
      vid: visitorId(),
      p: cleanPath(extra.path ?? window.location.pathname),
      pid: extra.productId,
      v: extra.value,
      ...(type === "ping" ? {} : { ref: sess.ref, utm: sess.utm }),
    });
    const blob = new Blob([body], { type: "text/plain" });
    if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, blob)) return;
    void fetch(ENDPOINT, { method: "POST", body, keepalive: true, credentials: "same-origin" })
      .catch(() => {});
  } catch {
    /* tracking must never break the page */
  }
}
