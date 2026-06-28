-- Amorfos — migration 004: Email / WhatsApp lead capture
-- Run in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- Stores opt-in subscribers from the on-site lead-capture modal and footer
-- form ("Get our guide to choosing a mukhi"). One row per email. Used to build
-- the owned audience the Journal content engine feeds (newsletter / WhatsApp
-- broadcast — see docs/content-marketing-strategy.md §9).

CREATE TABLE IF NOT EXISTS subscribers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        UNIQUE NOT NULL,
  phone       text,
  source      text,        -- where they signed up: 'modal' | 'footer' | ...
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscribers_created_idx ON subscribers (created_at DESC);

-- Lock down like every other table: service-role key only, no anon access.
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers FORCE  ROW LEVEL SECURITY;
