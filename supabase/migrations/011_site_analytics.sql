-- Amorfos — migration 011: first-party site analytics (admin dashboard)
--
-- A tiny, cookieless-ish tracker (components/SiteTracker.tsx → POST /api/collect)
-- records one row per visit (session) and one row per meaningful event, so the
-- admin dashboard can show live visitors, unique visitors, session length,
-- traffic sources and the purchase funnel without depending on GA4.
--
-- Privacy: no IP address, name, email or phone is stored here. A visitor is a
-- random UUID kept in the browser; location is the country/region/city Vercel
-- derives at the edge. Admin browsers are never recorded.
--
-- Orders link back to the session that placed them through
-- orders.client_context->>'analyticsSid' (set at checkout from the amf_sid
-- cookie), which is how revenue is attributed to a traffic source.

CREATE TABLE IF NOT EXISTS analytics_sessions (
  id             uuid        PRIMARY KEY,
  visitor_id     uuid        NOT NULL,
  started_at     timestamptz NOT NULL DEFAULT now(),
  last_seen_at   timestamptz NOT NULL DEFAULT now(),
  pageviews      integer     NOT NULL DEFAULT 0,
  landing_path   text,
  current_path   text,
  referrer_host  text,
  channel        text        NOT NULL DEFAULT 'Direct',
  source         text,
  medium         text,
  campaign       text,
  term           text,
  device         text,       -- mobile | tablet | desktop
  browser        text,
  os             text,
  country        text,
  region         text,
  city           text,
  is_returning   boolean     NOT NULL DEFAULT false,
  viewed_product boolean     NOT NULL DEFAULT false,
  added_to_cart  boolean     NOT NULL DEFAULT false,
  cart_value     integer     NOT NULL DEFAULT 0,
  began_checkout boolean     NOT NULL DEFAULT false,
  subscribed     boolean     NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS analytics_sessions_started_idx   ON analytics_sessions (started_at DESC);
CREATE INDEX IF NOT EXISTS analytics_sessions_last_seen_idx ON analytics_sessions (last_seen_at DESC);
CREATE INDEX IF NOT EXISTS analytics_sessions_visitor_idx   ON analytics_sessions (visitor_id);

CREATE TABLE IF NOT EXISTS analytics_events (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id  uuid        NOT NULL REFERENCES analytics_sessions (id) ON DELETE CASCADE,
  visitor_id  uuid        NOT NULL,
  type        text        NOT NULL,   -- pageview | view_item | add_to_cart | begin_checkout | subscribe
  path        text,
  product_id  text,
  value       integer,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_created_idx ON analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_session_idx ON analytics_events (session_id);
CREATE INDEX IF NOT EXISTS analytics_events_type_idx    ON analytics_events (type, created_at DESC);

-- Orders → session attribution lookup.
CREATE INDEX IF NOT EXISTS orders_analytics_sid_idx
  ON orders ((client_context->>'analyticsSid'));

ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions FORCE  ROW LEVEL SECURITY;
ALTER TABLE analytics_events   ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events   FORCE  ROW LEVEL SECURITY;

-- ── track_hit: one round trip per tracker call ─────────────────────────────
-- p_type 'ping' only extends the session (heartbeat while the tab is visible).
-- Any other type upserts the session (attribution is fixed by the first hit),
-- raises the funnel flags and appends an event row.
CREATE OR REPLACE FUNCTION track_hit(
  p_sid uuid, p_vid uuid, p_type text, p_path text,
  p_product_id text, p_value int, p_session jsonb
) RETURNS void
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  v_now timestamptz := now();
BEGIN
  IF p_type = 'ping' THEN
    -- Heartbeats can only extend a session that is still live (30 min idle
    -- gap) and never beyond 4 hours, so a forgotten tab can't inflate time.
    UPDATE analytics_sessions
       SET last_seen_at = v_now,
           current_path = COALESCE(p_path, current_path)
     WHERE id = p_sid
       AND visitor_id = p_vid
       AND last_seen_at > v_now - interval '30 minutes'
       AND started_at   > v_now - interval '4 hours';
    RETURN;
  END IF;

  INSERT INTO analytics_sessions AS s (
    id, visitor_id, started_at, last_seen_at, pageviews, landing_path, current_path,
    referrer_host, channel, source, medium, campaign, term,
    device, browser, os, country, region, city, is_returning
  ) VALUES (
    p_sid, p_vid, v_now, v_now, 0, p_path, p_path,
    p_session->>'referrer_host', COALESCE(p_session->>'channel', 'Direct'),
    p_session->>'source', p_session->>'medium', p_session->>'campaign', p_session->>'term',
    p_session->>'device', p_session->>'browser', p_session->>'os',
    p_session->>'country', p_session->>'region', p_session->>'city',
    EXISTS (SELECT 1 FROM analytics_sessions o WHERE o.visitor_id = p_vid AND o.id <> p_sid)
  )
  ON CONFLICT (id) DO NOTHING;

  UPDATE analytics_sessions SET
    last_seen_at   = v_now,
    current_path   = COALESCE(p_path, current_path),
    pageviews      = pageviews + CASE WHEN p_type = 'pageview' THEN 1 ELSE 0 END,
    viewed_product = viewed_product OR p_type = 'view_item',
    added_to_cart  = added_to_cart  OR p_type = 'add_to_cart',
    cart_value     = cart_value + CASE WHEN p_type = 'add_to_cart' THEN COALESCE(p_value, 0) ELSE 0 END,
    began_checkout = began_checkout OR p_type = 'begin_checkout'
                     OR (p_type = 'pageview' AND p_path = '/checkout'),
    subscribed     = subscribed     OR p_type = 'subscribe'
  WHERE id = p_sid AND visitor_id = p_vid;

  -- A session id belonging to another visitor is ignored (no event written).
  IF NOT FOUND THEN RETURN; END IF;

  INSERT INTO analytics_events (session_id, visitor_id, type, path, product_id, value)
  VALUES (p_sid, p_vid, p_type, p_path, p_product_id, p_value);
END;
$$;

REVOKE EXECUTE ON FUNCTION track_hit(uuid, uuid, text, text, text, int, jsonb) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION track_hit(uuid, uuid, text, text, text, int, jsonb) TO service_role;

-- ── analytics_dashboard: every metric for one date range, as one JSON doc ───
-- Sessions are counted in the range by started_at; orders by created_at (paid
-- orders by paid_at). Orders under p_test_max rupees are test orders and are
-- excluded everywhere (no product sells for less than ₹599).
CREATE OR REPLACE FUNCTION analytics_dashboard(
  p_from timestamptz, p_to timestamptz, p_bucket text DEFAULT 'day', p_test_max int DEFAULT 100
) RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
WITH
s AS (
  SELECT *,
         GREATEST(EXTRACT(EPOCH FROM (last_seen_at - started_at)), 0)::int AS dur
    FROM analytics_sessions
   WHERE started_at >= p_from AND started_at < p_to
),
o_all AS (
  SELECT * FROM orders WHERE amount >= p_test_max
),
o_created AS (
  SELECT * FROM o_all WHERE created_at >= p_from AND created_at < p_to
),
o_paid AS (
  SELECT * FROM o_all
   WHERE status = 'paid' AND COALESCE(paid_at, created_at) >= p_from AND COALESCE(paid_at, created_at) < p_to
),
-- Session-level order outcome (any order the session placed, ever).
s_orders AS (
  SELECT s.id,
         bool_or(o.id IS NOT NULL)                       AS placed_order,
         bool_or(o.status = 'paid')                      AS paid,
         COALESCE(sum(o.amount) FILTER (WHERE o.status = 'paid'), 0) AS revenue
    FROM s
    LEFT JOIN o_all o ON o.client_context->>'analyticsSid' = s.id::text
   GROUP BY s.id
),
sx AS (
  SELECT s.*, COALESCE(so.placed_order, false) AS placed_order, COALESCE(so.paid, false) AS paid, so.revenue
    FROM s JOIN s_orders so USING (id)
),
ev AS (
  SELECT * FROM analytics_events WHERE created_at >= p_from AND created_at < p_to
),
buckets AS (
  SELECT g AS b
    FROM generate_series(
           date_trunc(p_bucket, p_from AT TIME ZONE 'Asia/Kolkata'),
           date_trunc(p_bucket, (LEAST(p_to, now()) - interval '1 second') AT TIME ZONE 'Asia/Kolkata'),
           ('1 ' || p_bucket)::interval
         ) g
)
SELECT jsonb_build_object(
  'kpis', (
    SELECT jsonb_build_object(
      'visitors',          count(DISTINCT visitor_id),
      'new_visitors',      count(DISTINCT visitor_id) FILTER (WHERE NOT is_returning),
      'sessions',          count(*),
      'pageviews',         COALESCE(sum(pageviews), 0),
      'avg_session_sec',   COALESCE(round(avg(dur)), 0),
      'median_session_sec',COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY dur), 0),
      'bounce_rate',       CASE WHEN count(*) = 0 THEN 0
                                ELSE round(100.0 * count(*) FILTER (WHERE pageviews <= 1 AND dur < 10) / count(*), 1) END,
      'pages_per_session', CASE WHEN count(*) = 0 THEN 0 ELSE round(sum(pageviews)::numeric / count(*), 2) END,
      'revenue',           (SELECT COALESCE(sum(amount), 0) FROM o_paid),
      'orders',            (SELECT count(*) FROM o_paid),
      'aov',               (SELECT COALESCE(round(avg(amount)), 0) FROM o_paid),
      'checkouts_started', (SELECT count(*) FROM o_created),
      'abandoned_checkouts',(SELECT count(*) FROM o_created WHERE status <> 'paid'),
      'abandoned_value',   (SELECT COALESCE(sum(amount), 0) FROM o_created WHERE status <> 'paid'),
      'carts',             count(*) FILTER (WHERE added_to_cart),
      'carts_abandoned',   count(*) FILTER (WHERE added_to_cart AND NOT paid),
      'cart_abandon_value',COALESCE(sum(cart_value) FILTER (WHERE added_to_cart AND NOT paid), 0),
      'subscribers_new',   (SELECT count(*) FROM subscribers WHERE created_at >= p_from AND created_at < p_to),
      'subscribers_confirmed_new', (SELECT count(*) FROM subscribers WHERE confirmed AND created_at >= p_from AND created_at < p_to),
      'conversion_rate',   CASE WHEN count(*) = 0 THEN 0
                                ELSE round(100.0 * count(*) FILTER (WHERE paid) / count(*), 2) END
    ) FROM sx
  ),
  'funnel', (
    SELECT jsonb_build_array(
      jsonb_build_object('step', 'Visited',           'n', count(*)),
      jsonb_build_object('step', 'Viewed a product',  'n', count(*) FILTER (WHERE viewed_product)),
      jsonb_build_object('step', 'Added to cart',     'n', count(*) FILTER (WHERE added_to_cart)),
      jsonb_build_object('step', 'Reached checkout',  'n', count(*) FILTER (WHERE began_checkout)),
      jsonb_build_object('step', 'Filled details',    'n', count(*) FILTER (WHERE placed_order)),
      jsonb_build_object('step', 'Paid',              'n', count(*) FILTER (WHERE paid))
    ) FROM sx
  ),
  'series', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'bucket',   to_char(b.b, 'YYYY-MM-DD"T"HH24:MI'),
             'visitors', COALESCE(v.visitors, 0),
             'sessions', COALESCE(v.sessions, 0),
             'orders',   COALESCE(r.orders, 0),
             'revenue',  COALESCE(r.revenue, 0)
           ) ORDER BY b.b), '[]'::jsonb)
      FROM buckets b
      LEFT JOIN (
        SELECT date_trunc(p_bucket, started_at AT TIME ZONE 'Asia/Kolkata') AS b,
               count(DISTINCT visitor_id) AS visitors, count(*) AS sessions
          FROM s GROUP BY 1
      ) v ON v.b = b.b
      LEFT JOIN (
        SELECT date_trunc(p_bucket, COALESCE(paid_at, created_at) AT TIME ZONE 'Asia/Kolkata') AS b,
               count(*) AS orders, sum(amount) AS revenue
          FROM o_paid GROUP BY 1
      ) r ON r.b = b.b
  ),
  'channels', (
    SELECT COALESCE(jsonb_agg(x ORDER BY x.sessions DESC), '[]'::jsonb) FROM (
      SELECT channel,
             count(*)                                   AS sessions,
             count(DISTINCT visitor_id)                 AS visitors,
             round(avg(dur))                            AS avg_sec,
             round(100.0 * count(*) FILTER (WHERE pageviews <= 1 AND dur < 10) / count(*), 1) AS bounce,
             count(*) FILTER (WHERE added_to_cart)      AS carts,
             count(*) FILTER (WHERE placed_order)       AS checkouts,
             count(*) FILTER (WHERE paid)               AS orders,
             COALESCE(sum(revenue), 0)                  AS revenue
        FROM sx GROUP BY channel
    ) x
  ),
  'campaigns', (
    SELECT COALESCE(jsonb_agg(x ORDER BY x.sessions DESC), '[]'::jsonb) FROM (
      SELECT COALESCE(source, '—') AS source, COALESCE(medium, '—') AS medium, COALESCE(campaign, '—') AS campaign,
             count(*) AS sessions, count(*) FILTER (WHERE added_to_cart) AS carts,
             count(*) FILTER (WHERE paid) AS orders, COALESCE(sum(revenue), 0) AS revenue,
             round(avg(dur)) AS avg_sec
        FROM sx WHERE source IS NOT NULL OR campaign IS NOT NULL
       GROUP BY 1, 2, 3 ORDER BY count(*) DESC LIMIT 15
    ) x
  ),
  'referrers', (
    SELECT COALESCE(jsonb_agg(x ORDER BY x.sessions DESC), '[]'::jsonb) FROM (
      SELECT referrer_host AS host, count(*) AS sessions
        FROM s WHERE referrer_host IS NOT NULL
       GROUP BY 1 ORDER BY 2 DESC LIMIT 10
    ) x
  ),
  'landing_pages', (
    SELECT COALESCE(jsonb_agg(x ORDER BY x.sessions DESC), '[]'::jsonb) FROM (
      SELECT landing_path AS path, count(*) AS sessions,
             round(100.0 * count(*) FILTER (WHERE pageviews <= 1 AND dur < 10) / count(*), 1) AS bounce,
             round(avg(dur)) AS avg_sec,
             count(*) FILTER (WHERE added_to_cart) AS carts
        FROM s GROUP BY 1 ORDER BY 2 DESC LIMIT 12
    ) x
  ),
  'pages', (
    SELECT COALESCE(jsonb_agg(x ORDER BY x.views DESC), '[]'::jsonb) FROM (
      SELECT path, count(*) AS views, count(DISTINCT visitor_id) AS visitors
        FROM ev WHERE type = 'pageview'
       GROUP BY 1 ORDER BY 2 DESC LIMIT 12
    ) x
  ),
  'products', (
    SELECT COALESCE(jsonb_agg(x ORDER BY x.views DESC, x.carts DESC), '[]'::jsonb) FROM (
      SELECT product_id,
             COALESCE(p.views, 0) AS views,
             COALESCE(p.carts, 0) AS carts,
             COALESCE(sold.units, 0) AS units,
             COALESCE(sold.revenue, 0) AS revenue
        FROM (
          SELECT product_id,
                 count(DISTINCT session_id) FILTER (WHERE type = 'view_item')   AS views,
                 count(DISTINCT session_id) FILTER (WHERE type = 'add_to_cart') AS carts
            FROM ev WHERE product_id IS NOT NULL GROUP BY 1
        ) p
        FULL JOIN (
          SELECT i->>'id' AS product_id,
                 sum((i->>'qty')::int) AS units,
                 sum((i->>'qty')::int * (i->>'price')::int) AS revenue
            FROM o_paid, jsonb_array_elements(items) i GROUP BY 1
        ) sold USING (product_id)
       ORDER BY 2 DESC, 5 DESC LIMIT 15
    ) x
  ),
  'devices', (
    SELECT COALESCE(jsonb_agg(x ORDER BY x.sessions DESC), '[]'::jsonb) FROM (
      SELECT COALESCE(device, 'unknown') AS label, count(*) AS sessions FROM s GROUP BY 1
    ) x
  ),
  'browsers', (
    SELECT COALESCE(jsonb_agg(x ORDER BY x.sessions DESC), '[]'::jsonb) FROM (
      SELECT COALESCE(browser, 'unknown') AS label, count(*) AS sessions FROM s GROUP BY 1 ORDER BY 2 DESC LIMIT 8
    ) x
  ),
  'locations', (
    SELECT COALESCE(jsonb_agg(x ORDER BY x.sessions DESC), '[]'::jsonb) FROM (
      SELECT COALESCE(city, '—') AS city, COALESCE(region, '') AS region, COALESCE(country, '—') AS country,
             count(*) AS sessions
        FROM s GROUP BY 1, 2, 3 ORDER BY 4 DESC LIMIT 12
    ) x
  ),
  'abandoned', (
    SELECT COALESCE(jsonb_agg(x ORDER BY x.created_at DESC), '[]'::jsonb) FROM (
      SELECT o.id, o.razorpay_order_id, o.amount, o.status, o.created_at, o.recovery_sent_at,
             o.customer->>'name'  AS name,
             o.customer->>'phone' AS phone,
             o.customer->>'email' AS email,
             o.customer->>'city'  AS city,
             o.items,
             ss.channel
        FROM o_created o
        LEFT JOIN analytics_sessions ss ON ss.id::text = o.client_context->>'analyticsSid'
       WHERE o.status <> 'paid'
         -- the same customer may retry and pay with a new order; don't nag them
         AND NOT EXISTS (
           SELECT 1 FROM o_all p
            WHERE p.status = 'paid' AND p.created_at >= o.created_at
              AND (p.customer->>'phone' = o.customer->>'phone' OR lower(p.customer->>'email') = lower(o.customer->>'email'))
         )
       ORDER BY o.created_at DESC LIMIT 30
    ) x
  )
);
$$;

-- ── analytics_overview: range-independent numbers (live, all-time, ops) ─────
CREATE OR REPLACE FUNCTION analytics_overview(p_today timestamptz, p_test_max int DEFAULT 100)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
SELECT jsonb_build_object(
  'live', (
    SELECT jsonb_build_object(
      'count', count(DISTINCT visitor_id),
      'sessions', COALESCE(jsonb_agg(jsonb_build_object(
          'path', current_path, 'channel', channel, 'device', device, 'city', city,
          'country', country, 'started_at', started_at, 'last_seen_at', last_seen_at, 'pageviews', pageviews,
          'added_to_cart', added_to_cart, 'began_checkout', began_checkout,
          'is_returning', is_returning
        ) ORDER BY last_seen_at DESC), '[]'::jsonb)
    ) FROM analytics_sessions WHERE last_seen_at > now() - interval '5 minutes'
  ),
  'visitors_all_time', (SELECT count(DISTINCT visitor_id) FROM analytics_sessions),
  'sessions_all_time', (SELECT count(*) FROM analytics_sessions),
  'tracking_since',    (SELECT min(started_at) FROM analytics_sessions),
  'visitors_today',    (SELECT count(DISTINCT visitor_id) FROM analytics_sessions WHERE started_at >= p_today),
  'revenue_all_time',  (SELECT COALESCE(sum(amount), 0) FROM orders WHERE status = 'paid' AND amount >= p_test_max),
  'orders_all_time',   (SELECT count(*) FROM orders WHERE status = 'paid' AND amount >= p_test_max),
  'customers',         (SELECT count(DISTINCT COALESCE(NULLIF(customer->>'phone', ''), lower(customer->>'email')))
                          FROM orders WHERE status = 'paid' AND amount >= p_test_max),
  'repeat_customers',  (SELECT count(*) FROM (
                          SELECT COALESCE(NULLIF(customer->>'phone', ''), lower(customer->>'email')) k
                            FROM orders WHERE status = 'paid' AND amount >= p_test_max
                           GROUP BY 1 HAVING count(*) > 1) r),
  'to_ship',           (SELECT count(*) FROM orders WHERE status = 'paid' AND amount >= p_test_max
                          AND fulfillment_status IN ('unfulfilled', 'synced', 'failed')),
  'sync_failed',       (SELECT count(*) FROM orders WHERE status = 'paid' AND amount >= p_test_max AND fulfillment_status = 'failed'),
  'in_transit',        (SELECT count(*) FROM orders WHERE status = 'paid' AND amount >= p_test_max AND fulfillment_status IN ('processing', 'shipped', 'out_for_delivery')),
  'pending_reviews',   (SELECT count(*) FROM reviews WHERE status = 'pending'),
  'subscribers',       (SELECT jsonb_build_object(
                          'total', count(*),
                          'confirmed', count(*) FILTER (WHERE confirmed),
                          'unconfirmed', count(*) FILTER (WHERE NOT confirmed),
                          'recent', COALESCE((SELECT jsonb_agg(r ORDER BY r.created_at DESC) FROM (
                              SELECT email, phone, source, confirmed, created_at
                                FROM subscribers ORDER BY created_at DESC LIMIT 15) r), '[]'::jsonb)
                        ) FROM subscribers),
  'low_stock',         (SELECT COALESCE(jsonb_agg(jsonb_build_object('id', id, 'name', data->>'name', 'stock', (data->>'stock')::int)
                          ORDER BY (data->>'stock')::int), '[]'::jsonb)
                          FROM products
                         WHERE active AND (data->>'stock') ~ '^-?[0-9]+$' AND (data->>'stock')::int <= 2)
);
$$;

REVOKE EXECUTE ON FUNCTION analytics_dashboard(timestamptz, timestamptz, text, int) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION analytics_dashboard(timestamptz, timestamptz, text, int) TO service_role;
REVOKE EXECUTE ON FUNCTION analytics_overview(timestamptz, int) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION analytics_overview(timestamptz, int) TO service_role;
