-- Amorfos — migration 005: Abandoned-cart recovery
-- Run in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- An "abandoned cart" is simply an order that was created at checkout (status
-- 'pending', with the customer's name/phone/email already captured by
-- api/create-order) but never transitioned to 'paid'. The recovery cron
-- (api/cron/abandoned-cart) sweeps these and sends one WhatsApp/email nudge.
-- recovery_sent_at guarantees we never message the same cart twice.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS recovery_sent_at timestamptz;

-- Partial index: the cron only ever scans pending carts not yet reminded.
CREATE INDEX IF NOT EXISTS orders_recovery_idx
  ON orders (created_at)
  WHERE status = 'pending' AND recovery_sent_at IS NULL;
