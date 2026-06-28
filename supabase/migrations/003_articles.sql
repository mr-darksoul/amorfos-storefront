-- Amorfos — migration 003: Journal articles (content marketing)
-- Run in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- Stores each Journal article as a JSON blob mirroring the Article type in
-- src/lib/types.ts. Drafts are generated automatically by
-- scripts/generate-articles.ts; nothing is public until status = 'published'.

CREATE TABLE IF NOT EXISTS articles (
  slug         text        PRIMARY KEY,
  data         jsonb       NOT NULL,
  status       text        NOT NULL DEFAULT 'draft',  -- draft | published
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

-- Public listing reads order by published_at; admin reads order by created_at.
CREATE INDEX IF NOT EXISTS articles_status_published_idx
  ON articles (status, published_at DESC);

-- Lock down like products/orders: service-role key only, no anon access.
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles FORCE  ROW LEVEL SECURITY;
