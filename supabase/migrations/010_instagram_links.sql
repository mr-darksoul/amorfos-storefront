-- Amorfos — migration 010: Instagram link system
-- Run in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- Instagram doesn't make links in captions/comments clickable, so each post
-- carries a feed number ("No. 07") and a link to the journal article or
-- product it is about. The public /ig page (the bio link) lists published
-- posts by number, each tile linking through with UTM tags. On publish, the
-- publisher also adds a first comment showing the link.

ALTER TABLE instagram_posts
  ADD COLUMN IF NOT EXISTS feed_no          int,
  ADD COLUMN IF NOT EXISTS link_url         text,   -- site path, e.g. /journal/<slug> or /shop/<id>
  ADD COLUMN IF NOT EXISTS link_label       text,   -- e.g. "Read the full guide"
  ADD COLUMN IF NOT EXISTS first_comment    text,   -- comment text posted right after publishing
  ADD COLUMN IF NOT EXISTS comment_id       text,   -- IG comment id once posted
  ADD COLUMN IF NOT EXISTS comment_error    text,   -- why the first comment failed (post itself still live)
  ADD COLUMN IF NOT EXISTS thumbnail_url    text;   -- IG-hosted thumbnail for reels (images use media_urls[0])

-- Feed numbers are unique when set (gaps are fine if a queued post is removed).
CREATE UNIQUE INDEX IF NOT EXISTS instagram_posts_feed_no_key
  ON instagram_posts (feed_no) WHERE feed_no IS NOT NULL;

-- Public /ig page reads published posts newest-first by feed number.
CREATE INDEX IF NOT EXISTS instagram_posts_published_feed_idx
  ON instagram_posts (status, feed_no DESC);
