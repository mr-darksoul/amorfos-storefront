-- Migration 002 — Row Level Security + inventory decrement
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query

-- ── Row Level Security ─────────────────────────────────────────────────────
-- The app only ever touches these tables with the service-role key (server
-- side), which BYPASSES RLS. Enabling RLS with no policies therefore changes
-- nothing for the app, but denies all access to the anon/public key — so if it
-- ever leaks or is used client-side, the orders table (customer PII) and the
-- products table stay locked down. Defense in depth.
ALTER TABLE orders   ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- Force RLS even for the table owner, so no role except service-role (which is
-- explicitly exempt from RLS) can read/write through PostgREST.
ALTER TABLE orders   FORCE ROW LEVEL SECURITY;
ALTER TABLE products FORCE ROW LEVEL SECURITY;

-- ── Inventory decrement ────────────────────────────────────────────────────
-- Atomically decrement stock for each line item in a paid order. Only products
-- that opt into stock tracking (data has a non-null "stock" key) are touched;
-- everything else is left untouched (untracked = unlimited). Stock is clamped
-- at 0 so it can never go negative.
-- search_path is pinned empty (Supabase linter 0011) to prevent hijacking;
-- built-ins resolve via pg_catalog, so the table is schema-qualified.
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
      AND (data->>'stock') IS NOT NULL;  -- only tracked products
  END LOOP;
END;
$$;
