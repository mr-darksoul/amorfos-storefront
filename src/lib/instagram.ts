import { supabase } from "@/lib/supabase";
import { scanBannedPhrases } from "@/lib/articleGenerator";

/**
 * Instagram API with Unified Login (Facebook Login for Business) — connection
 * and content publishing for the @amorfos.in business account.
 *
 * Meta app "Amorfos Social" (owned by the Amorfos business portfolio) has a
 * Facebook Login for Business *configuration* whose token type is a Business
 * Integration System User access token (SUAT) set to never expire, with the
 * Instagram account as its asset and instagram_basic + instagram_content_publish.
 *
 * Flow: admin clicks Connect → /api/admin/instagram/connect sets a one-time
 * state cookie and redirects to the Facebook Login for Business dialog →
 * Meta redirects to the PUBLIC /api/instagram/callback (the admin cookie is
 * SameSite=Strict, so it is not sent on that cross-site redirect; the state
 * cookie — only settable from an admin session — authenticates it instead) →
 * the code is exchanged for the system-user token, the IG account id comes from
 * /me/assigned_instagram_accounts, and both are stored in `social_tokens`.
 * The token is revoked if the IG account leaves the portfolio or the app is
 * removed — then just Connect again.
 *
 * Env: INSTAGRAM_APP_ID (Meta app id), INSTAGRAM_APP_SECRET (Meta app secret),
 * INSTAGRAM_CONFIG_ID (the login configuration id — not a secret).
 */

export const IG_API_VERSION = "v27.0";
const GRAPH = `https://graph.facebook.com/${IG_API_VERSION}`;

/** Expiry recorded for a never-expiring system-user token. */
const NEVER_EXPIRES = "9999-12-31T00:00:00.000Z";

/** One-time OAuth state cookie (see /api/admin/instagram/connect). */
export const IG_STATE_COOKIE = "amorfos_ig_oauth_state";

export const CAPTION_MAX = 2200;
export const CAROUSEL_MAX = 10;

export type IgMediaType = "IMAGE" | "CAROUSEL" | "REELS";
export type IgPostStatus = "queued" | "processing" | "published" | "failed";

export interface IgPost {
  id: string;
  media_type: IgMediaType;
  media_urls: string[];
  caption: string;
  scheduled_for: string;
  status: IgPostStatus;
  container_id: string | null;
  ig_media_id: string | null;
  permalink: string | null;
  error: string | null;
  attempts: number;
  created_at: string;
  published_at: string | null;
  feed_no: number | null;
  link_url: string | null;
  link_label: string | null;
  first_comment: string | null;
  comment_id: string | null;
  comment_error: string | null;
  thumbnail_url: string | null;
}

// ── Links ("From the feed" system) ─────────────────────────────────────────
// Instagram doesn't make links in captions/comments clickable. Each post gets a
// feed number and a site link; the public /ig page (the bio link) lists posts by
// number, and the publisher adds the link as the first comment.

const SITE_HOST = "amorfos.in";
export const IG_LINK_PAGE = `${SITE_HOST}/ig`;
export const DEFAULT_LINK_LABEL = "Read more";

/**
 * Accepts "/journal/x", "journal/x", "amorfos.in/journal/x" or
 * "https://amorfos.in/journal/x?…" and returns a clean site path (no query or
 * hash — UTMs are added at render time). Off-site links are rejected: the link
 * system only ever points to our own pages.
 */
export function normalizeLinkPath(input: string): { path: string } | { error: string } {
  const raw = input.trim();
  if (!raw) return { error: "Link is empty." };
  let url: URL;
  try {
    url = raw.startsWith("/")
      ? new URL(raw, `https://${SITE_HOST}`)
      : new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw.startsWith(SITE_HOST) ? raw : `${SITE_HOST}/${raw}`}`);
  } catch {
    return { error: "Link is not a valid URL or path." };
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host !== SITE_HOST) return { error: `Link must point to ${SITE_HOST}.` };
  const path = url.pathname.replace(/\/+$/, "") || "/";
  return { path };
}

/** Full tracked URL for a post's link (used on /ig). */
export function trackedLink(path: string, feedNo: number | null): string {
  const u = new URL(path, `https://${SITE_HOST}`);
  u.searchParams.set("utm_source", "instagram");
  u.searchParams.set("utm_medium", "social");
  u.searchParams.set("utm_campaign", "ig_feed");
  if (feedNo) u.searchParams.set("utm_content", `no${String(feedNo).padStart(2, "0")}`);
  return u.toString();
}

export function feedLabel(feedNo: number): string {
  return `No. ${String(feedNo).padStart(2, "0")}`;
}

/** The caption line that points readers to the bio link page. */
export function captionLinkLine(feedNo: number, label: string): string {
  return `${feedLabel(feedNo)} · ${label} at ${IG_LINK_PAGE}`;
}

/**
 * Inserts the link line before a trailing all-hashtag paragraph (so hashtags
 * stay last), otherwise appends it. No-op if the caption already mentions
 * amorfos.in/ig.
 */
export function withLinkLine(caption: string, line: string): string {
  if (caption.includes(IG_LINK_PAGE)) return caption;
  const paras = caption.trim().split(/\n\s*\n/);
  const last = paras[paras.length - 1] ?? "";
  const isHashtags = /^(\s*#[\p{L}\p{N}_]+\s*)+$/u.test(last);
  if (isHashtags && paras.length > 1) {
    return [...paras.slice(0, -1), line, last].join("\n\n");
  }
  return caption.trim() ? `${caption.trim()}\n\n${line}` : line;
}

/** Default first comment: the readable (not clickable) link. */
export function defaultFirstComment(label: string, path: string): string {
  return `📖 ${label}: ${SITE_HOST}${path === "/" ? "" : path}`;
}

/** Next free feed number (max + 1). */
export async function nextFeedNo(): Promise<number> {
  const { data, error } = await supabase()
    .from("instagram_posts")
    .select("feed_no")
    .not("feed_no", "is", null)
    .order("feed_no", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return ((data?.[0]?.feed_no as number | undefined) ?? 0) + 1;
}

/** Published posts for the public /ig page, newest first. */
export async function listFeedPosts(): Promise<IgPost[]> {
  const { data, error } = await supabase()
    .from("instagram_posts")
    .select("*")
    .eq("status", "published")
    .order("feed_no", { ascending: false, nullsFirst: false })
    .order("published_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as IgPost[];
}

export interface IgConnection {
  account_id: string;
  username: string | null;
  access_token: string;
  scopes: string | null;
  expires_at: string;
  refreshed_at: string;
}

export function isInstagramConfigured(): boolean {
  return !!(
    process.env.INSTAGRAM_APP_ID &&
    process.env.INSTAGRAM_APP_SECRET &&
    process.env.INSTAGRAM_CONFIG_ID
  );
}

function appCreds() {
  const id = process.env.INSTAGRAM_APP_ID;
  const secret = process.env.INSTAGRAM_APP_SECRET;
  const configId = process.env.INSTAGRAM_CONFIG_ID;
  if (!id || !secret || !configId) {
    throw new Error(
      "Instagram is not configured. Set INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET and INSTAGRAM_CONFIG_ID.",
    );
  }
  return { id, secret, configId };
}

/** True when the stored token never expires (system-user token). */
export function neverExpires(expiresAt: string): boolean {
  return Date.parse(expiresAt) > Date.now() + 50 * 365 * 86_400_000;
}

export function redirectUri(): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://amorfos.in").replace(/\/$/, "");
  return `${base}/api/instagram/callback`;
}

export function authorizeUrl(state: string): string {
  const { id, configId } = appCreds();
  // Same shape as the Login URL the Meta dashboard generates for the configuration.
  const u = new URL("https://www.facebook.com/dialog/oauth");
  u.searchParams.set("client_id", id);
  // config_id replaces scope for Facebook Login for Business.
  u.searchParams.set("config_id", configId);
  u.searchParams.set("redirect_uri", redirectUri());
  u.searchParams.set("response_type", "code");
  // Required for system-user-token configurations.
  u.searchParams.set("override_default_response_type", "true");
  u.searchParams.set("state", state);
  return u.toString();
}

/** Graph API error → readable message. Never includes the access token. */
async function graphError(res: Response, what: string): Promise<Error> {
  let detail = `${res.status}`;
  try {
    const body = await res.json();
    const e = body?.error;
    if (e) detail = `${e.message ?? e.type ?? "error"}${e.code ? ` (code ${e.code}${e.error_subcode ? `/${e.error_subcode}` : ""})` : ""}`;
    else if (body?.error_message) detail = body.error_message;
  } catch {
    /* non-JSON body */
  }
  return new Error(`Instagram ${what} failed: ${detail}`);
}

async function graphGet<T>(path: string, token: string, fields: string, what: string): Promise<T> {
  const u = new URL(`${GRAPH}/${path}`);
  u.searchParams.set("fields", fields);
  const res = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw await graphError(res, what);
  return (await res.json()) as T;
}

// ── Connection / tokens ────────────────────────────────────────────────────

/** OAuth code → system-user token → IG account → stored connection. */
export async function completeOAuth(code: string): Promise<IgConnection> {
  const { id, secret } = appCreds();

  const tokenUrl = new URL(`${GRAPH}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", id);
  tokenUrl.searchParams.set("client_secret", secret);
  tokenUrl.searchParams.set("redirect_uri", redirectUri());
  tokenUrl.searchParams.set("code", code);
  const tokenRes = await fetch(tokenUrl);
  if (!tokenRes.ok) throw await graphError(tokenRes, "code exchange");
  const tok = (await tokenRes.json()) as { access_token?: string; expires_in?: number };
  if (!tok.access_token) throw new Error("Instagram code exchange returned no token.");

  // With a system-user token, /me is the integration user, not the IG account.
  const assigned = await graphGet<{ data?: { id: string; username?: string }[] }>(
    "me/assigned_instagram_accounts",
    tok.access_token,
    "id,username",
    "Instagram account lookup",
  );
  const accounts = assigned.data ?? [];
  if (accounts.length === 0) {
    throw new Error("No Instagram account was shared during login. Connect again and select @amorfos.in.");
  }
  const preferred = process.env.INSTAGRAM_USERNAME?.replace(/^@/, "");
  const account = accounts.find((a) => a.username === preferred) ?? accounts[0];

  const now = new Date();
  const conn: IgConnection = {
    account_id: account.id,
    username: account.username ?? null,
    access_token: tok.access_token,
    scopes: "instagram_basic,instagram_content_publish",
    // SUAT set to "Never" usually omits expires_in (or returns 0).
    expires_at: tok.expires_in ? new Date(now.getTime() + tok.expires_in * 1000).toISOString() : NEVER_EXPIRES,
    refreshed_at: now.toISOString(),
  };

  const { error } = await supabase()
    .from("social_tokens")
    .upsert({ provider: "instagram", ...conn }, { onConflict: "provider" });
  if (error) throw new Error(`Saving Instagram token failed: ${error.message}`);
  return conn;
}

export async function getConnection(): Promise<IgConnection | null> {
  const { data, error } = await supabase()
    .from("social_tokens")
    .select("account_id, username, access_token, scopes, expires_at, refreshed_at")
    .eq("provider", "instagram")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as IgConnection | null) ?? null;
}

/**
 * Returns the stored connection after checking it still works. System-user
 * tokens don't expire, but are revoked if the IG account leaves the business
 * portfolio or the app is removed — this surfaces that as a clear error.
 */
export async function getFreshConnection(): Promise<IgConnection> {
  const conn = await getConnection();
  if (!conn) throw new Error("Instagram is not connected. Connect it at /admin/instagram.");
  if (Date.parse(conn.expires_at) <= Date.now()) {
    throw new Error("Instagram token has expired. Reconnect at /admin/instagram.");
  }
  return conn;
}

/** Lightweight live check used by the cron so a revoked token shows up in logs. */
export async function checkConnection(conn: IgConnection): Promise<string | null> {
  try {
    await graphGet(conn.account_id, conn.access_token, "id,username", "connection check");
    return null;
  } catch (err) {
    return (err as Error).message;
  }
}

export async function disconnect(): Promise<void> {
  const { error } = await supabase().from("social_tokens").delete().eq("provider", "instagram");
  if (error) throw new Error(error.message);
}

/** Posts published via the API in the last 24h vs the account's quota. */
export async function publishingQuota(conn: IgConnection): Promise<{ used: number; total: number } | null> {
  const u = new URL(`${GRAPH}/${conn.account_id}/content_publishing_limit`);
  u.searchParams.set("fields", "quota_usage,config");
  const res = await fetch(u, { headers: { Authorization: `Bearer ${conn.access_token}` } });
  if (!res.ok) return null;
  const body = await res.json();
  const row = body?.data?.[0];
  if (!row) return null;
  return { used: row.quota_usage ?? 0, total: row.config?.quota_total ?? 50 };
}

// ── Validation ─────────────────────────────────────────────────────────────

/**
 * Checks a post before it is queued. Instagram fetches media itself, so URLs
 * must be public https, and images must be JPEG (the only format the API takes).
 */
export async function validatePost(input: {
  media_type: IgMediaType;
  media_urls: string[];
  caption: string;
}): Promise<string[]> {
  const errors: string[] = [];
  const { media_type, media_urls, caption } = input;

  if (!["IMAGE", "CAROUSEL", "REELS"].includes(media_type)) errors.push("Unknown media type.");
  if (media_type === "IMAGE" && media_urls.length !== 1) errors.push("A single-image post needs exactly 1 image.");
  if (media_type === "REELS" && media_urls.length !== 1) errors.push("A reel needs exactly 1 video.");
  if (media_type === "CAROUSEL" && (media_urls.length < 2 || media_urls.length > CAROUSEL_MAX)) {
    errors.push(`A carousel needs 2–${CAROUSEL_MAX} images.`);
  }
  if (caption.length > CAPTION_MAX) errors.push(`Caption is over ${CAPTION_MAX} characters.`);
  if ((caption.match(/#[\p{L}\p{N}_]+/gu) ?? []).length > 30) errors.push("Caption has more than 30 hashtags.");

  // Same compliance gate as the journal and product copy: no medical/miraculous claims.
  const banned = scanBannedPhrases([caption]);
  if (banned.length) errors.push(`Caption contains banned phrases: ${banned.join(", ")}.`);

  const wantVideo = media_type === "REELS";
  await Promise.all(
    media_urls.map(async (url, i) => {
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        errors.push(`Media ${i + 1} is not a valid URL.`);
        return;
      }
      if (parsed.protocol !== "https:") {
        errors.push(`Media ${i + 1} must be an https URL.`);
        return;
      }
      try {
        const res = await fetch(url, { method: "HEAD", redirect: "follow" });
        const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
        if (!res.ok) errors.push(`Media ${i + 1} is not publicly reachable (${res.status}).`);
        else if (!wantVideo && type !== "image/jpeg") errors.push(`Media ${i + 1} must be a JPEG (got ${type || "unknown"}).`);
        else if (wantVideo && !["video/mp4", "video/quicktime"].includes(type)) {
          errors.push(`Media ${i + 1} must be an MP4 or MOV video (got ${type || "unknown"}).`);
        }
      } catch {
        errors.push(`Media ${i + 1} could not be fetched.`);
      }
    }),
  );

  return errors;
}

// ── Publishing ─────────────────────────────────────────────────────────────

async function igPost(conn: IgConnection, path: string, params: Record<string, string>, what: string) {
  const res = await fetch(`${GRAPH}/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${conn.access_token}` },
    body: new URLSearchParams(params),
  });
  if (!res.ok) throw await graphError(res, what);
  return (await res.json()) as { id: string };
}

async function containerStatus(conn: IgConnection, id: string): Promise<string> {
  const u = new URL(`${GRAPH}/${id}`);
  u.searchParams.set("fields", "status_code");
  const res = await fetch(u, { headers: { Authorization: `Bearer ${conn.access_token}` } });
  if (!res.ok) throw await graphError(res, "container status");
  const body = (await res.json()) as { status_code?: string };
  return body.status_code ?? "IN_PROGRESS";
}

/** Poll until FINISHED, an error state, or the deadline. */
async function waitForContainer(conn: IgConnection, id: string, deadline: number): Promise<string> {
  for (;;) {
    const status = await containerStatus(conn, id);
    if (status !== "IN_PROGRESS") return status;
    if (Date.now() + 5000 > deadline) return status;
    await new Promise((r) => setTimeout(r, 4000));
  }
}

async function createContainer(conn: IgConnection, post: IgPost): Promise<string> {
  const caption = post.caption;
  if (post.media_type === "IMAGE") {
    return (await igPost(conn, `${conn.account_id}/media`, { image_url: post.media_urls[0], caption }, "create image container")).id;
  }
  if (post.media_type === "REELS") {
    return (
      await igPost(
        conn,
        `${conn.account_id}/media`,
        { media_type: "REELS", video_url: post.media_urls[0], caption, share_to_feed: "true" },
        "create reel container",
      )
    ).id;
  }
  // Carousel: one child container per image, then the parent.
  const children: string[] = [];
  for (const url of post.media_urls) {
    const child = await igPost(
      conn,
      `${conn.account_id}/media`,
      { image_url: url, is_carousel_item: "true" },
      "create carousel item",
    );
    children.push(child.id);
  }
  return (
    await igPost(
      conn,
      `${conn.account_id}/media`,
      { media_type: "CAROUSEL", children: children.join(","), caption },
      "create carousel container",
    )
  ).id;
}

async function updatePost(id: string, patch: Partial<IgPost>) {
  const { error } = await supabase().from("instagram_posts").update(patch).eq("id", id);
  if (error) console.error(`[instagram] updating post ${id} failed: ${error.message}`);
}

/**
 * Publish one queued/processing post. Safe to call repeatedly: a reel whose
 * video is still encoding is left as `processing` with its container id and
 * picked up on the next call. Returns the post's resulting status.
 *
 * `budgetMs` keeps us inside the serverless time limit (60s on Vercel Hobby).
 */
export async function publishPost(post: IgPost, budgetMs = 45_000): Promise<IgPost> {
  const deadline = Date.now() + budgetMs;
  const conn = await getFreshConnection();
  const attempts = post.attempts + 1;
  let publishedPost: IgPost;

  try {
    let containerId = post.container_id;
    if (!containerId) {
      containerId = await createContainer(conn, post);
      await updatePost(post.id, { container_id: containerId, attempts });
    }

    const status = await waitForContainer(conn, containerId, deadline);
    if (status === "IN_PROGRESS") {
      const next = { ...post, container_id: containerId, attempts, status: "processing" as const, error: null };
      await updatePost(post.id, { status: "processing", attempts, error: null });
      return next;
    }
    if (status === "EXPIRED") {
      // Containers expire after 24h unpublished — start over next time.
      await updatePost(post.id, { container_id: null, status: "queued", attempts, error: "Container expired; will recreate." });
      return { ...post, container_id: null, status: "queued", attempts };
    }
    if (status !== "FINISHED") throw new Error(`Instagram could not process the media (status ${status}).`);

    const published = await igPost(conn, `${conn.account_id}/media_publish`, { creation_id: containerId }, "publish");

    let permalink: string | null = null;
    let thumbnail_url: string | null = null;
    try {
      const u = new URL(`${GRAPH}/${published.id}`);
      u.searchParams.set("fields", "permalink,thumbnail_url");
      const r = await fetch(u, { headers: { Authorization: `Bearer ${conn.access_token}` } });
      if (r.ok) {
        const meta = (await r.json()) as { permalink?: string; thumbnail_url?: string };
        permalink = meta.permalink ?? null;
        thumbnail_url = meta.thumbnail_url ?? null; // reels only
      }
    } catch {
      /* permalink/thumbnail are nice-to-have */
    }

    const patch = {
      status: "published" as const,
      ig_media_id: published.id,
      permalink,
      thumbnail_url,
      published_at: new Date().toISOString(),
      attempts,
      error: null,
    };
    await updatePost(post.id, patch);
    publishedPost = { ...post, container_id: containerId, ...patch };
  } catch (err) {
    const message = (err as Error).message.slice(0, 500);
    await updatePost(post.id, { status: "failed", error: message, attempts });
    return { ...post, status: "failed", error: message, attempts };
  }

  // Outside the try above on purpose: the post is already live, so a comment
  // failure must never mark it failed (a retry would publish it twice).
  return await postFirstComment(publishedPost, conn);
}

/**
 * Adds the post's first comment (its link) once it is published. Never throws;
 * failures are recorded in comment_error. Skips if there's no comment text or
 * one was already posted. Also used by the admin "Add link comment" action.
 */
export async function postFirstComment(post: IgPost, existingConn?: IgConnection): Promise<IgPost> {
  if (post.status !== "published" || !post.ig_media_id || !post.first_comment || post.comment_id) return post;
  try {
    const conn = existingConn ?? (await getFreshConnection());
    const c = await igPost(conn, `${post.ig_media_id}/comments`, { message: post.first_comment }, "first comment");
    await updatePost(post.id, { comment_id: c.id, comment_error: null, first_comment: post.first_comment });
    return { ...post, comment_id: c.id, comment_error: null };
  } catch (err) {
    const message = (err as Error).message.slice(0, 300);
    console.error(`[instagram] first comment on post ${post.id} failed: ${message}`);
    await updatePost(post.id, { comment_error: message });
    return { ...post, comment_error: message };
  }
}

export async function listPosts(limit = 50): Promise<IgPost[]> {
  const { data, error } = await supabase()
    .from("instagram_posts")
    .select("*")
    .order("scheduled_for", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as IgPost[];
}

export async function getPost(id: string): Promise<IgPost | null> {
  const { data, error } = await supabase().from("instagram_posts").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as IgPost | null) ?? null;
}

/** Oldest post that is due now: a processing reel first, else the earliest queued. */
export async function nextDuePost(): Promise<IgPost | null> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase()
    .from("instagram_posts")
    .select("*")
    .in("status", ["processing", "queued"])
    .lte("scheduled_for", nowIso)
    .order("status", { ascending: true }) // 'processing' < 'queued' → a half-done reel finishes first
    .order("scheduled_for", { ascending: true })
    .limit(1);
  if (error) throw new Error(error.message);
  return ((data ?? [])[0] as IgPost | undefined) ?? null;
}
