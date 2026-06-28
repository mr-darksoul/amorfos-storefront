-- Amorfos — migration 006: double opt-in for subscribers
-- Run in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- Adds confirmed opt-in to the subscribers table. A new signup is stored
-- UNCONFIRMED and emailed a single, cheap confirmation link (no attachment).
-- The lead-magnet PDF is only sent once the link is clicked. This means a
-- competitor stuffing the form with fake/random addresses can never make us
-- email a 5 MB PDF to anyone, and never pollutes the *confirmed* audience:
-- unconfirmed junk rows are trivially pruned.

ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS confirmed      boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS confirm_token  text,
  ADD COLUMN IF NOT EXISTS confirmed_at   timestamptz;

-- Tokens are looked up on the confirm endpoint; keep it unique + indexed.
CREATE UNIQUE INDEX IF NOT EXISTS subscribers_confirm_token_idx
  ON subscribers (confirm_token)
  WHERE confirm_token IS NOT NULL;

-- The 38 (or however many) rows that predate this migration were captured under
-- the old single opt-in flow — treat them as already confirmed so they aren't
-- orphaned. New rows default to false via the column default above.
UPDATE subscribers SET confirmed = true, confirmed_at = created_at
  WHERE confirmed = false AND created_at < now();

-- Prune unconfirmed junk later with:
--   DELETE FROM subscribers WHERE confirmed = false AND created_at < now() - interval '30 days';
