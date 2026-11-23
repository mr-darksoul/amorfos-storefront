-- Amorfos — migration 009: Instagram API connection + post queue
-- Run in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- social_tokens   : one row per connected platform ('instagram'). Holds the
--                   long-lived Instagram User access token (60 days, refreshed
--                   automatically by the daily cron). Service-role access only.
-- instagram_posts : queue of posts to publish via the Instagram API. The daily
--                   cron publishes the oldest due post; admin can also publish now.

CREATE TABLE IF NOT EXISTS social_tokens (
  provider      text        PRIMARY KEY,          -- 'instagram'
  account_id    text        NOT NULL,             -- IG professional account id (<IG_ID>)
  username      text,
  access_token  text        NOT NULL,
  scopes        text,
  expires_at    timestamptz NOT NULL,
  refreshed_at  timestamptz NOT NULL DEFAULT now(),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE social_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_tokens FORCE  ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS instagram_posts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type    text        NOT NULL CHECK (media_type IN ('IMAGE', 'CAROUSEL', 'REELS')),
  media_urls    text[]      NOT NULL,
  caption       text        NOT NULL DEFAULT '',
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  -- queued → processing (video container still encoding) → published | failed
  status        text        NOT NULL DEFAULT 'queued'
                CHECK (status IN ('queued', 'processing', 'published', 'failed')),
  container_id  text,
  ig_media_id   text,
  permalink     text,
  error         text,
  attempts      int         NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  published_at  timestamptz
);

CREATE INDEX IF NOT EXISTS instagram_posts_due_idx
  ON instagram_posts (status, scheduled_for);

ALTER TABLE instagram_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_posts FORCE  ROW LEVEL SECURITY;
