-- Amorfos — Supabase schema
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query)

-- ── Products ──────────────────────────────────────────────────────
-- Stores each product as a JSON blob; mirrors the Product type in src/lib/types.ts.
-- Falls back to the hardcoded catalogue when no rows exist.
CREATE TABLE IF NOT EXISTS products (
  id          text        PRIMARY KEY,
  data        jsonb       NOT NULL,
  active      boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ── Orders ────────────────────────────────────────────────────────
-- One row per Razorpay order. Customer info is stored inline as JSON.
CREATE TABLE IF NOT EXISTS orders (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_order_id    text        UNIQUE NOT NULL,
  razorpay_payment_id  text,
  amount               integer     NOT NULL,   -- INR (total charged)
  subtotal             integer     NOT NULL,
  shipping             integer     NOT NULL DEFAULT 0,
  status               text        NOT NULL DEFAULT 'pending',  -- pending | paid | failed
  customer             jsonb       NOT NULL DEFAULT '{}',
  items                jsonb       NOT NULL DEFAULT '[]',
  created_at           timestamptz NOT NULL DEFAULT now(),
  paid_at              timestamptz
);

-- Index for fast admin lookups
CREATE INDEX IF NOT EXISTS orders_status_idx    ON orders (status);
CREATE INDEX IF NOT EXISTS orders_created_idx   ON orders (created_at DESC);

-- ── Shiprocket fulfilment (migration 001) ─────────────────────────────────
-- Run supabase/migrations/001_shiprocket.sql to add these columns to an
-- existing database; they are included here for new installs.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id    text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_shipment_id  text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_awb          text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_label_url    text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status      text NOT NULL DEFAULT 'unfulfilled';
-- fulfillment_status: unfulfilled | synced | processing | shipped | out_for_delivery | delivered | failed

CREATE INDEX IF NOT EXISTS orders_awb_idx ON orders (shiprocket_awb);

-- ── Row Level Security + inventory (migration 002) ─────────────────────────
-- See supabase/migrations/002_rls_and_stock.sql for the rationale. Included
-- here so a fresh install is locked down and stock-aware out of the box.
ALTER TABLE orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders   FORCE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION decrement_stock(p_items jsonb)
RETURNS void
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  item jsonb;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    UPDATE public.products
    SET data = jsonb_set(
      data,
      '{stock}',
      to_jsonb(
        GREATEST(
          COALESCE((data->>'stock')::int, 0) - COALESCE((item->>'qty')::int, 0),
          0
        )
      )
    )
    WHERE id = (item->>'id')
      AND (data->>'stock') IS NOT NULL;
  END LOOP;
END;
$$;

-- ── Journal articles (migration 003) ───────────────────────────────────────
-- See supabase/migrations/003_articles.sql. Content-marketing articles stored
-- as a JSON blob mirroring the Article type in src/lib/types.ts. Nothing is
-- public until status = 'published'.
CREATE TABLE IF NOT EXISTS articles (
  slug         text        PRIMARY KEY,
  data         jsonb       NOT NULL,
  status       text        NOT NULL DEFAULT 'draft',  -- draft | published
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE INDEX IF NOT EXISTS articles_status_published_idx
  ON articles (status, published_at DESC);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles FORCE  ROW LEVEL SECURITY;

-- ── Lead capture / subscribers (migration 004) ─────────────────────────────
-- Opt-in emails from the lead-capture modal + footer form.
CREATE TABLE IF NOT EXISTS subscribers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        UNIQUE NOT NULL,
  phone       text,
  source      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscribers_created_idx ON subscribers (created_at DESC);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers FORCE  ROW LEVEL SECURITY;

-- ── Abandoned-cart recovery (migration 005) ────────────────────────────────
-- A pending order that never became paid is an abandoned cart; the recovery
-- cron nudges it once and stamps recovery_sent_at so it's never messaged twice.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS recovery_sent_at timestamptz;

CREATE INDEX IF NOT EXISTS orders_recovery_idx
  ON orders (created_at)
  WHERE status = 'pending' AND recovery_sent_at IS NULL;
