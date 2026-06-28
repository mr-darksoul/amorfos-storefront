/**
 * Tiny in-memory, fixed-window rate limiter.
 *
 * NOTE: state lives in the module scope of a single serverless instance, so the
 * limit is per-warm-instance, not strictly global across the fleet. That is good
 * enough to blunt brute-force / enumeration from a single client; a distributed
 * limiter (e.g. Upstash) would be the upgrade if abuse becomes a real problem.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Drop expired buckets so the Map can't grow unbounded as new IPs appear.
// Time-gated to at most once a minute to keep this O(1) on the hot path.
let lastSweep = Date.now();
function sweepExpired(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets (only meaningful when !ok). */
  retryAfter: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweepExpired(now);
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

/**
 * Best-effort client IP from the proxy headers Vercel sets.
 *
 * Prefer `x-real-ip`: on Vercel this is set by the edge to the actual connecting
 * IP and cannot be forged by the caller. `x-forwarded-for` is only a fallback —
 * its *leftmost* value is client-controllable, so trusting it first would let an
 * attacker spoof the header to evade their own rate limit (or exhaust another
 * IP's bucket). We never read XFF[0] as the primary key for that reason.
 */
export function clientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return "unknown";
}
