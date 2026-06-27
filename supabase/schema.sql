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
