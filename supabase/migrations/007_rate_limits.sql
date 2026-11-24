-- Amorfos — migration 007: distributed rate limiting
--
-- The in-memory limiter in src/lib/ratelimit.ts is per-warm-serverless-instance,
-- so on Vercel a burst that fans out across instances (or forces cold starts)
-- sidesteps it. This table + function give the sensitive endpoints
-- (admin login, order tracking, subscribe, reviews) a single global counter.
-- The in-memory check still runs first so the DB is only hit by traffic that
-- passed it.

CREATE TABLE IF NOT EXISTS rate_limit_hits (
  key      text PRIMARY KEY,
  count    integer     NOT NULL DEFAULT 1,
  reset_at timestamptz NOT NULL
);

-- Service-role only, like every other table (no policies on purpose).
ALTER TABLE rate_limit_hits ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_hits FORCE ROW LEVEL SECURITY;

-- Atomic fixed-window hit counter. One statement per request: inserts the
-- bucket, or increments it, or resets it when the window has lapsed.
-- Returns whether the request is allowed and, if not, seconds until reset.
CREATE OR REPLACE FUNCTION rate_limit_hit(p_key text, p_limit int, p_window_ms int)
RETURNS TABLE (allowed boolean, retry_after int)
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now timestamptz := now();
  v_row public.rate_limit_hits;
BEGIN
  -- Probabilistic garbage collection: ~1 in 100 calls sweeps buckets whose
  -- window lapsed over a day ago, so the table can't grow unbounded.
  IF random() < 0.01 THEN
    DELETE FROM rate_limit_hits WHERE reset_at < v_now - interval '1 day';
  END IF;

  INSERT INTO rate_limit_hits AS r (key, count, reset_at)
  VALUES (p_key, 1, v_now + make_interval(secs => p_window_ms / 1000.0))
  ON CONFLICT (key) DO UPDATE SET
    count    = CASE WHEN r.reset_at <= v_now THEN 1 ELSE r.count + 1 END,
    reset_at = CASE WHEN r.reset_at <= v_now
                    THEN v_now + make_interval(secs => p_window_ms / 1000.0)
                    ELSE r.reset_at END
  RETURNING * INTO v_row;

  allowed := v_row.count <= p_limit;
  retry_after := CASE WHEN allowed THEN 0
                      ELSE CEIL(EXTRACT(EPOCH FROM (v_row.reset_at - v_now)))::int END;
  RETURN NEXT;
END;
$$;

-- Only the server (service role) calls this; the public API roles never should.
REVOKE EXECUTE ON FUNCTION rate_limit_hit(text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION rate_limit_hit(text, int, int) TO service_role;
