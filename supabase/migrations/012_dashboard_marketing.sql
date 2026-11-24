-- Amorfos — migration 012: dashboard v2 — ad spend / ROAS, monthly goal,
-- visit journeys, recovery, exit pages, hour-of-day, keyword + product detail.

-- ── Ad spend, entered by hand in the dashboard (one row per day per channel) ─
-- channel uses the dashboard's traffic channel names ('Google Ads', 'Meta Ads',
-- 'Influencers', 'Other Paid') so spend lines up with the visits it bought.
CREATE TABLE IF NOT EXISTS marketing_spend (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  spend_date  date        NOT NULL,
  channel     text        NOT NULL,
  amount      integer     NOT NULL CHECK (amount >= 0),
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (spend_date, channel)
);
ALTER TABLE marketing_spend ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_spend FORCE  ROW LEVEL SECURITY;

-- ── Small key/value store for admin preferences (e.g. monthly revenue goal) ─
CREATE TABLE IF NOT EXISTS admin_settings (
  key         text        PRIMARY KEY,
  value       jsonb       NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings FORCE  ROW LEVEL SECURITY;

-- ── analytics_dashboard v2 ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION analytics_dashboard(
  p_from timestamptz, p_to timestamptz, p_bucket text DEFAULT 'day', p_test_max int DEFAULT 100
) RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
WITH
s AS (
  SELECT *, GREATEST(EXTRACT(EPOCH FROM (last_seen_at - started_at)), 0)::int AS dur
    FROM analytics_sessions
   WHERE started_at >= p_from AND started_at < p_to
),
o_all AS (SELECT * FROM orders WHERE amount >= p_test_max),
o_created AS (SELECT * FROM o_all WHERE created_at >= p_from AND created_at < p_to),
o_paid AS (
  SELECT * FROM o_all
   WHERE status = 'paid' AND COALESCE(paid_at, created_at) >= p_from AND COALESCE(paid_at, created_at) < p_to
),
s_orders AS (
  SELECT s.id,
         bool_or(o.id IS NOT NULL) AS placed_order,
         bool_or(o.status = 'paid') AS paid,
         COALESCE(sum(o.amount) FILTER (WHERE o.status = 'paid'), 0) AS revenue
    FROM s LEFT JOIN o_all o ON o.client_context->>'analyticsSid' = s.id::text
   GROUP BY s.id
),
sx AS (
  SELECT s.*, COALESCE(so.placed_order, false) AS placed_order, COALESCE(so.paid, false) AS paid, so.revenue
    FROM s JOIN s_orders so USING (id)
),
ev AS (SELECT * FROM analytics_events WHERE created_at >= p_from AND created_at < p_to),
sp AS (
  SELECT * FROM marketing_spend
   WHERE spend_date >= (p_from AT TIME ZONE 'Asia/Kolkata')::date
     AND spend_date <= ((p_to - interval '1 second') AT TIME ZONE 'Asia/Kolkata')::date
),
-- Abandoned checkouts in range that got the recovery reminder, and what came back.
rec AS (
  SELECT o.id,
         CASE WHEN o.status = 'paid' THEN o.amount ELSE (
           SELECT p.amount FROM o_all p
            WHERE p.status = 'paid' AND p.created_at >= o.recovery_sent_at
              AND (p.customer->>'phone' = o.customer->>'phone'
                   OR lower(p.customer->>'email') = lower(o.customer->>'email'))
            ORDER BY p.created_at LIMIT 1) END AS recovered_amount
    FROM o_created o
   WHERE o.recovery_sent_at IS NOT NULL
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
      'visitors',           count(DISTINCT visitor_id),
      'new_visitors',       count(DISTINCT visitor_id) FILTER (WHERE NOT is_returning),
      'sessions',           count(*),
      'paid_sessions',      count(*) FILTER (WHERE channel IN ('Google Ads', 'Meta Ads', 'Other Paid')),
      'pageviews',          COALESCE(sum(pageviews), 0),
      'avg_session_sec',    COALESCE(round(avg(dur)), 0),
      'median_session_sec', COALESCE(percentile_cont(0.5) WITHIN GROUP (ORDER BY dur), 0),
      'bounce_rate',        CASE WHEN count(*) = 0 THEN 0
                                 ELSE round(100.0 * count(*) FILTER (WHERE pageviews <= 1 AND dur < 10) / count(*), 1) END,
      'pages_per_session',  CASE WHEN count(*) = 0 THEN 0 ELSE round(sum(pageviews)::numeric / count(*), 2) END,
      'revenue',            (SELECT COALESCE(sum(amount), 0) FROM o_paid),
      'orders',             (SELECT count(*) FROM o_paid),
      'aov',                (SELECT COALESCE(round(avg(amount)), 0) FROM o_paid),
      'spend',              (SELECT COALESCE(sum(amount), 0) FROM sp),
      'checkouts_started',  (SELECT count(*) FROM o_created),
      'abandoned_checkouts',(SELECT count(*) FROM o_created WHERE status <> 'paid'),
      'abandoned_value',    (SELECT COALESCE(sum(amount), 0) FROM o_created WHERE status <> 'paid'),
      'reminders_sent',     (SELECT count(*) FROM rec),
      'recovered',          (SELECT count(*) FROM rec WHERE recovered_amount IS NOT NULL),
      'recovered_value',    (SELECT COALESCE(sum(recovered_amount), 0) FROM rec),
      'carts',              count(*) FILTER (WHERE added_to_cart),
      'carts_abandoned',    count(*) FILTER (WHERE added_to_cart AND NOT paid),
      'cart_abandon_value', COALESCE(sum(cart_value) FILTER (WHERE added_to_cart AND NOT paid), 0),
      'subscribers_new',    (SELECT count(*) FROM subscribers WHERE created_at >= p_from AND created_at < p_to),
      'subscribers_confirmed_new', (SELECT count(*) FROM subscribers WHERE confirmed AND created_at >= p_from AND created_at < p_to),
      'conversion_rate',    CASE WHEN count(*) = 0 THEN 0
                                 ELSE round(100.0 * count(*) FILTER (WHERE paid) / count(*), 2) END
    ) FROM sx
  ),
  'funnel', (
    SELECT jsonb_build_array(
      jsonb_build_object('step', 'Visited',          'n', count(*)),
      jsonb_build_object('step', 'Viewed a product', 'n', count(*) FILTER (WHERE viewed_product)),
      jsonb_build_object('step', 'Added to cart',    'n', count(*) FILTER (WHERE added_to_cart)),
      jsonb_build_object('step', 'Reached checkout', 'n', count(*) FILTER (WHERE began_checkout)),
      jsonb_build_object('step', 'Filled details',   'n', count(*) FILTER (WHERE placed_order)),
      jsonb_build_object('step', 'Paid',             'n', count(*) FILTER (WHERE paid))
    ) FROM sx
  ),
  'series', (
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
             'bucket',   to_char(b.b, 'YYYY-MM-DD"T"HH24:MI'),
             'visitors', COALESCE(v.visitors, 0),
             'sessions', COALESCE(v.sessions, 0),
             'orders',   COALESCE(r.orders, 0),
             'revenue',  COALESCE(r.revenue, 0),
             'spend',    COALESCE(x.spend, 0)
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
      LEFT JOIN (
        SELECT date_trunc(p_bucket, spend_date::timestamp) AS b, sum(amount) AS spend
          FROM sp GROUP BY 1
      ) x ON x.b = b.b
  ),
  'channels', (
    SELECT COALESCE(jsonb_agg(x ORDER BY x.sessions DESC, x.spend DESC), '[]'::jsonb) FROM (
      SELECT channel,
             COALESCE(c.sessions, 0) AS sessions, COALESCE(c.visitors, 0) AS visitors,
             c.avg_sec, c.bounce,
             COALESCE(c.carts, 0) AS carts, COALESCE(c.checkouts, 0) AS checkouts,
             COALESCE(c.orders, 0) AS orders, COALESCE(c.revenue, 0) AS revenue,
             COALESCE(spc.spend, 0) AS spend
        FROM (
          SELECT channel,
                 count(*) AS sessions,
                 count(DISTINCT visitor_id) AS visitors,
                 round(avg(dur)) AS avg_sec,
                 round(100.0 * count(*) FILTER (WHERE pageviews <= 1 AND dur < 10) / count(*), 1) AS bounce,
                 count(*) FILTER (WHERE added_to_cart) AS carts,
                 count(*) FILTER (WHERE placed_order) AS checkouts,
                 count(*) FILTER (WHERE paid) AS orders,
                 COALESCE(sum(revenue), 0) AS revenue
            FROM sx GROUP BY channel
        ) c
        FULL JOIN (SELECT channel, sum(amount) AS spend FROM sp GROUP BY channel) spc USING (channel)
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
  'keywords', (
    SELECT COALESCE(jsonb_agg(x ORDER BY x.sessions DESC), '[]'::jsonb) FROM (
      SELECT lower(term) AS term, count(*) AS sessions, round(avg(dur)) AS avg_sec,
             count(*) FILTER (WHERE added_to_cart) AS carts, count(*) FILTER (WHERE paid) AS orders
        FROM sx WHERE term IS NOT NULL AND term <> ''
       GROUP BY 1 ORDER BY 2 DESC LIMIT 20
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
             count(*) FILTER (WHERE added_to_cart) AS carts,
             count(*) FILTER (WHERE paid) AS orders
        FROM sx GROUP BY 1 ORDER BY 2 DESC LIMIT 12
    ) x
  ),
  'exit_pages', (
    SELECT COALESCE(jsonb_agg(x ORDER BY x.exits DESC), '[]'::jsonb) FROM (
      SELECT current_path AS path, count(*) AS exits, round(avg(dur)) AS avg_sec
        FROM sx
       WHERE last_seen_at < now() - interval '5 minutes' AND NOT paid
       GROUP BY 1 ORDER BY 2 DESC LIMIT 12
    ) x
  ),
  'pages', (
    SELECT COALESCE(jsonb_agg(x ORDER BY x.views DESC), '[]'::jsonb) FROM (
      SELECT path, count(*) AS views, count(DISTINCT visitor_id) AS visitors
        FROM ev WHERE type = 'pageview'
       GROUP BY 1 ORDER BY 2 DESC LIMIT 12
    ) x
  ),
  'hours', (
    SELECT jsonb_agg(jsonb_build_object('hour', h, 'sessions', COALESCE(a.n, 0), 'orders', COALESCE(b.n, 0)) ORDER BY h)
      FROM generate_series(0, 23) h
      LEFT JOIN (SELECT extract(hour FROM started_at AT TIME ZONE 'Asia/Kolkata')::int AS hh, count(*) AS n
                   FROM s GROUP BY 1) a ON a.hh = h
      LEFT JOIN (SELECT extract(hour FROM COALESCE(paid_at, created_at) AT TIME ZONE 'Asia/Kolkata')::int AS hh, count(*) AS n
                   FROM o_paid GROUP BY 1) b ON b.hh = h
  ),
  'products', (
    SELECT COALESCE(jsonb_agg(x ORDER BY x.views DESC, x.revenue DESC), '[]'::jsonb) FROM (
      SELECT product_id,
             COALESCE(pr.data->>'name', product_id) AS name,
             CASE WHEN (pr.data->>'price') ~ '^[0-9.]+$' THEN round((pr.data->>'price')::numeric) END AS price,
             COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(pr.data->'images') = 'array'
                                              THEN pr.data->'images' END), 0) AS images,
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
        LEFT JOIN products pr ON pr.id = product_id
       ORDER BY COALESCE(p.views, 0) DESC, COALESCE(sold.revenue, 0) DESC LIMIT 20
    ) x
  ),
  'devices', (
    SELECT COALESCE(jsonb_agg(x ORDER BY x.sessions DESC), '[]'::jsonb) FROM (
      SELECT COALESCE(device, 'unknown') AS label, count(*) AS sessions,
             count(*) FILTER (WHERE added_to_cart) AS carts, count(*) FILTER (WHERE paid) AS orders
        FROM sx GROUP BY 1
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
             ss.channel,
             ss.id AS session_id
        FROM o_created o
        LEFT JOIN analytics_sessions ss ON ss.id::text = o.client_context->>'analyticsSid'
       WHERE o.status <> 'paid'
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

-- ── analytics_overview v2: adds month-to-date + goal, live session ids ─────
-- The 2-arg v1 (timestamptz, int) is kept so the previous deploy keeps working
-- during rollout; PostgREST picks the overload by the named args sent.
CREATE OR REPLACE FUNCTION analytics_overview(
  p_today timestamptz, p_month_start timestamptz, p_test_max int DEFAULT 100
) RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
SELECT jsonb_build_object(
  'live', (
    SELECT jsonb_build_object(
      'count', count(DISTINCT visitor_id),
      'sessions', COALESCE(jsonb_agg(jsonb_build_object(
          'id', id, 'path', current_path, 'channel', channel, 'device', device, 'city', city,
          'country', country, 'started_at', started_at, 'last_seen_at', last_seen_at, 'pageviews', pageviews,
          'added_to_cart', added_to_cart, 'began_checkout', began_checkout,
          'is_returning', is_returning
        ) ORDER BY last_seen_at DESC), '[]'::jsonb)
    ) FROM analytics_sessions WHERE last_seen_at > now() - interval '5 minutes'
  ),
  'month', jsonb_build_object(
    'revenue', (SELECT COALESCE(sum(amount), 0) FROM orders
                 WHERE status = 'paid' AND amount >= p_test_max AND COALESCE(paid_at, created_at) >= p_month_start),
    'orders',  (SELECT count(*) FROM orders
                 WHERE status = 'paid' AND amount >= p_test_max AND COALESCE(paid_at, created_at) >= p_month_start),
    'spend',   (SELECT COALESCE(sum(amount), 0) FROM marketing_spend
                 WHERE spend_date >= (p_month_start AT TIME ZONE 'Asia/Kolkata')::date),
    'goal',    (SELECT value FROM admin_settings WHERE key = 'monthly_revenue_goal')
  ),
  'visitors_all_time', (SELECT count(DISTINCT visitor_id) FROM analytics_sessions),
  'sessions_all_time', (SELECT count(*) FROM analytics_sessions),
  'tracking_since',    (SELECT min(started_at) FROM analytics_sessions),
  'visitors_today',    (SELECT count(DISTINCT visitor_id) FROM analytics_sessions WHERE started_at >= p_today),
  'revenue_all_time',  (SELECT COALESCE(sum(amount), 0) FROM orders WHERE status = 'paid' AND amount >= p_test_max),
  'orders_all_time',   (SELECT count(*) FROM orders WHERE status = 'paid' AND amount >= p_test_max),
  'spend_all_time',    (SELECT COALESCE(sum(amount), 0) FROM marketing_spend),
  'customers',         (SELECT count(DISTINCT COALESCE(NULLIF(customer->>'phone', ''), lower(customer->>'email')))
                          FROM orders WHERE status = 'paid' AND amount >= p_test_max),
  'repeat_customers',  (SELECT count(*) FROM (
                          SELECT COALESCE(NULLIF(customer->>'phone', ''), lower(customer->>'email')) k
                            FROM orders WHERE status = 'paid' AND amount >= p_test_max
                           GROUP BY 1 HAVING count(*) > 1) r),
  'to_ship',           (SELECT count(*) FROM orders WHERE status = 'paid' AND amount >= p_test_max
                          AND fulfillment_status IN ('unfulfilled', 'synced', 'failed')),
  'sync_failed',       (SELECT count(*) FROM orders WHERE status = 'paid' AND amount >= p_test_max AND fulfillment_status = 'failed'),
  'in_transit',        (SELECT count(*) FROM orders WHERE status = 'paid' AND amount >= p_test_max
                          AND fulfillment_status IN ('processing', 'shipped', 'out_for_delivery')),
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

-- ── analytics_visits: individual visits with their page-by-page journey ────
CREATE OR REPLACE FUNCTION analytics_visits(
  p_from timestamptz, p_to timestamptz,
  p_channel text DEFAULT NULL, p_filter text DEFAULT 'all',
  p_limit int DEFAULT 40, p_session uuid DEFAULT NULL, p_test_max int DEFAULT 100
) RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
SELECT COALESCE(jsonb_agg(v ORDER BY v.started_at DESC), '[]'::jsonb) FROM (
  SELECT s.id, s.started_at, s.last_seen_at, s.channel, s.source, s.medium, s.campaign, s.term,
         s.referrer_host, s.landing_path, s.device, s.browser, s.os, s.city, s.region, s.country,
         s.is_returning, s.pageviews, s.added_to_cart, s.cart_value, s.began_checkout, s.subscribed,
         GREATEST(EXTRACT(EPOCH FROM (s.last_seen_at - s.started_at)), 0)::int AS dur,
         (SELECT count(*) FROM analytics_sessions o2 WHERE o2.visitor_id = s.visitor_id) AS visits_total,
         (SELECT jsonb_build_object('amount', o.amount, 'status', o.status)
            FROM orders o
           WHERE o.client_context->>'analyticsSid' = s.id::text AND o.amount >= p_test_max
           ORDER BY (o.status = 'paid') DESC, o.created_at DESC LIMIT 1) AS ord,
         (SELECT COALESCE(jsonb_agg(jsonb_build_object(
                    't', e.type, 'p', e.path, 'pid', e.product_id, 'v', e.value, 'at', e.created_at
                  ) ORDER BY e.id), '[]'::jsonb)
            FROM (SELECT * FROM analytics_events WHERE session_id = s.id ORDER BY id LIMIT 100) e) AS events
    FROM analytics_sessions s
   WHERE (p_session IS NOT NULL AND s.id = p_session)
      OR (p_session IS NULL
          AND s.started_at >= p_from AND s.started_at < p_to
          AND (p_channel IS NULL OR s.channel = p_channel)
          AND CASE p_filter
                WHEN 'engaged'  THEN s.pageviews > 1 OR s.last_seen_at - s.started_at >= interval '30 seconds'
                WHEN 'bounced'  THEN s.pageviews <= 1 AND s.last_seen_at - s.started_at < interval '10 seconds'
                WHEN 'cart'     THEN s.added_to_cart OR s.began_checkout
                WHEN 'paid_ads' THEN s.channel IN ('Google Ads', 'Meta Ads', 'Other Paid')
                ELSE true
              END)
   ORDER BY s.started_at DESC
   LIMIT LEAST(GREATEST(p_limit, 1), 200)
) v;
$$;

REVOKE EXECUTE ON FUNCTION analytics_dashboard(timestamptz, timestamptz, text, int) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION analytics_dashboard(timestamptz, timestamptz, text, int) TO service_role;
REVOKE EXECUTE ON FUNCTION analytics_overview(timestamptz, timestamptz, int) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION analytics_overview(timestamptz, timestamptz, int) TO service_role;
REVOKE EXECUTE ON FUNCTION analytics_visits(timestamptz, timestamptz, text, text, int, uuid, int) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION analytics_visits(timestamptz, timestamptz, text, text, int, uuid, int) TO service_role;
