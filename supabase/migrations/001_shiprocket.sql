-- Shiprocket fulfillment columns on orders table
-- Run in Supabase SQL Editor: Dashboard → SQL Editor → New query

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id    text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_shipment_id  text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_awb          text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_label_url    text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status      text NOT NULL DEFAULT 'unfulfilled';
-- fulfillment_status values: unfulfilled | synced | processing | shipped | out_for_delivery | delivered | failed

CREATE INDEX IF NOT EXISTS orders_awb_idx ON orders (shiprocket_awb);
