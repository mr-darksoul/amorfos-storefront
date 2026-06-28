# CLAUDE.md — Amorfos storefront

Guidance for Claude (and collaborators) working in this repo. Read this first.

## What Amorfos is

**Amorfos** is a Delhi-based D2C brand selling authentic, **Lab Certified**
Rudraksha — pendants, malas, combination pieces and loose beads, in
hand-finished silver. Founded by **Manav Bansal** (Rohini, Sector-1, Delhi).
Previously sold on Amazon/Flipkart; now going direct-to-consumer. Real business,
LIVE as of mid-2026. Brand WhatsApp: +91 83684 69332 · care@amorfos.in.

This `web/` directory is the production storefront.

## Brand style (current — source of truth is `src/app/globals.css`)

The aesthetic is **premium, spiritual, distinctly Indian but restrained** —
references are **Nicobar** and **Forest Essentials**. A dark theme was tried
early and rejected as "too dark"; the brand is now **light, warm and airy**.

**Palette** (`@theme` tokens in `globals.css`):
- `--color-paper` `#f6f1e7` — warm ivory, primary background (the page's light *ground*)
- `--color-paper-raised` `#efe7d5`, `--color-paper-soft` `#e7dcc6` — raised/inset surfaces
- `--color-ink` `#221b12` — primary text (espresso); `ink-dim` / `ink-faint` for secondary/tertiary
- `--color-gold` `#97712f` — single deep antique-gold accent (`gold-soft`, `gold-deep` variants)
- `--color-rudra` `#7a4326` — rudraksha brown
- `--color-dark` / `--color-cream` — only for chips/gradients that sit over product photography
  (dark ground / light text respectively)

Naming is intuitive: **paper = light ground, ink = dark text**. Utility classes
follow (`bg-paper`, `text-ink`, `border-paper-soft`, …).

**Type:** Cormorant Garamond (`--font-serif`, headings/display) + Inter
(`--font-sans`, body). Helpers: `.display`, `.eyebrow` (uppercase, wide-tracked,
gold), `.font-serif`.

**Components/effects:** `.btn` / `.btn-primary` (gold) / `.btn-outline`;
`.reveal` scroll-in animation; `.grain` subtle film-grain overlay.

**Logo:** dark calligraphic artwork used directly on the light page —
`public/brand/logo-dark.png` via `src/components/Logo.tsx`. No CSS inversion.

**Product photography:** Amazon-style — full product, centered, on white,
fit-to-image (never cropped into rectangles).

Keep changes light/airy. Do not reintroduce a dark theme.

## Copy rules (baked in — do not violate)

- Say **"Lab Certified"** only — never name a specific lab.
- **No medical or miraculous claims.** Frame as "worn on the recommendation of
  astrologers and pandits."
- 7-day returns on unused, sealed products.
- Free shipping above ₹999 (`site.freeShippingThreshold`); flat **₹79** below it
  (`SHIPPING_FLAT` in `api/create-order`).

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **Checkout:** dedicated `/checkout` page collects customer info (name, phone,
  email, full address — all required, validated client + server via
  `lib/validateCustomer.ts`), then opens the Razorpay modal via `lib/useCheckout.ts`.
  "Buy it now" on a product routes straight here.
- **Payments:** Razorpay (live keys) — order created server-side (`api/create-order`,
  amount recomputed from catalogue + shipping so a tampered client price can't change the
  charge), HMAC SHA-256 signature verified (`api/verify-payment`). If keys are
  missing/placeholder, both routes return `503` and checkout is disabled.
- **Cart:** React Context + `localStorage` (`context/CartContext.tsx`). No Redux.
- **Database:** **Supabase** (`lib/supabase.ts`, server-only `SUPABASE_SERVICE_ROLE_KEY`).
  Seven tables: `orders`, `products`, `articles`, `reviews`, `review_tokens`,
  `subscribers`, `abandoned_cart`. All have RLS enabled (service-role only). When
  Supabase is unconfigured, products fall back to the hardcoded `products.ts`; the
  journal and reviews render empty.
- **Fulfillment:** Shiprocket (`lib/shiprocket.ts`) — JWT token cached module-level;
  `api/verify-payment` auto-syncs paid orders using Next 15 `after()` (keeps the
  serverless function alive post-response so the sync completes; plain fire-and-forget
  is killed by Vercel before the first `await`). Sync creates a Shiprocket order +
  assigns AWB + requests pickup + generates label, then writes `shiprocket_*` cols +
  sets `fulfillment_status = 'synced'`. Admin "Ready to Ship" (`api/admin/orders/[id]/ship`)
  requires `shiprocket_shipment_id` to exist first.
- **Notifications:** `lib/notify.ts` — order-confirmation email (GoDaddy SMTP/nodemailer)
  + WhatsApp Cloud API. Confirmation email includes a "Leave a Review" button when a
  review token was generated. Shipping-status updates via webhook at
  `/api/webhooks/delivery-status` (not `/shiprocket` — Shiprocket blocks URLs containing
  "shiprocket"/"sr"/"kr").
- **Newsletter lead-magnet (double opt-in):** `NewsletterForm` (footer + lead modal) →
  `POST /api/subscribe` (rate-limited 5/hr/IP). A new signup is stored **unconfirmed**
  with a single-use `confirm_token` and emailed only a lightweight confirmation link
  (`sendConfirmationEmail`, no attachment) — sent via `after()`, new-insert only so a
  re-signup never re-mails an existing subscriber. Clicking the link hits
  `GET /api/subscribe/confirm?token=…`, which validates the token (7-day expiry), flips
  `confirmed = true` and burns the token (race-guarded against double-click), then sends
  the 5 MB guide PDF (`sendLeadMagnetEmail`) via `after()` and redirects to
  `/newsletter/confirmed?state=…` (confirmed | already | expired | invalid). **Why this
  shape:** the PDF is never sent until a human clicks a link in that inbox, so a
  competitor flooding the form with fake/random addresses can't trigger a PDF send and
  can't pollute the confirmed list (unconfirmed junk rows are pruned with
  `DELETE FROM subscribers WHERE confirmed = false AND created_at < now() - interval '30 days'`).
  The PDF lives outside `/public` (so it isn't hotlinkable) and is bundled into the
  subscribe/confirm functions via `outputFileTracingIncludes` in `next.config.mjs`.
- **Reviews:** `lib/reviews.ts` — keyed by `mukhi` integer so all variants (mala/bead/pendant)
  of the same mukhi share reviews. `getAllRatingSummaries()` runs one query and aggregates
  in JS — single DB call for shop/collections pages. Reviews have `status = pending | approved`.
  - **Star ratings** shown on product cards (shop, collections, homepage bestsellers) and inline
    below the `<h1>` on product detail pages (clickable → `#reviews` anchor). `aggregateRating`
    JSON-LD emitted for Google rich snippets.
  - **ReviewSection** (`components/ReviewSection.tsx`) — paginated approved reviews, distribution
    bars, Verified Purchase badge. Returns null when no reviews.
  - **Option A — open form** (`components/ReviewForm.tsx`): any visitor submits name/rating/title/body
    on the product page → `POST /api/reviews` (rate-limited 3/hr/IP) → `status=pending, verified=false`.
  - **Option B — post-purchase verified** (`app/reviews/[token]/page.tsx`): after payment,
    `verify-payment` generates a `review_tokens` row (60-day expiry, one token per order, tracks
    which mukhi have been reviewed). Token URL inserted into confirmation email. Customer clicks →
    `/reviews/[token]` page → `POST /api/reviews/[token]` → `status=pending, verified=true`.
  - **Admin moderation** (`/admin/reviews`): lists all pending reviews with Approve / Reject.
    Approve sets `status=approved` (goes live). Reject deletes the row.
  - **Seeded data:** 38 Amazon reviews imported (scrapped 2026-06-28) for mukhi 4, 6, 7, 9, 11, 12, 13
    — all `status=approved, source=amazon`.
  - **Admin auth note:** `/admin/*` is protected entirely by `middleware.ts`. Admin sub-pages must NOT
    re-implement their own auth check — the middleware already handles it.
- **Admin:** `/admin` (cookie/HMAC gate via `ADMIN_PASSWORD` + `middleware.ts`, fails
  closed) → product CRUD (`/admin/products`), orders view with Ship action + PDF invoice
  download (`/admin/orders`), Journal CRUD (`/admin/journal` — list/edit/publish/unpublish/
  delete drafts), Reviews moderation (`/admin/reviews`). Product data layer `lib/adminProducts.ts`;
  journal data layer `lib/articles.ts`. Image uploads go to **Vercel Blob** (`BLOB_READ_WRITE_TOKEN`);
  without the token uploads return `503`.
- **Journal (SEO content engine):** `/journal` hub + `/journal/[slug]` article pages.
  Data stored in Supabase `articles` table (`status = draft | published`). Article body
  is typed blocks (paragraph/heading/list/quote) — no raw HTML. Each page emits
  Article + BreadcrumbList + FAQPage JSON-LD. `revalidate = 60`.
- **Content automation:** `vercel.json` schedules a daily Vercel Cron at **04:00 UTC
  (9:30 AM IST)** → hits `api/cron/content-draft` → reads `scripts/content-calendar.json`
  → generates next article via Claude API (`ANTHROPIC_API_KEY`) → validates compliance
  (banned-phrase check) → inserts as draft. Nothing auto-publishes — Manav reviews at
  `/admin/journal`. Generator logic shared in `lib/articleGenerator.ts`. Local equivalent:
  `npm run content:draft`. Content calendar has 8 entries (add more from
  `docs/content-marketing-strategy.md` §4–5 before they run out).
- **Deploy target:** Vercel (project `web`, org `manavmba24-1516`) — **Root Directory = `web`**.
  GitHub→Vercel auto-deploy is **not** wired; deploy manually: `vercel --prod --yes` from `/web`.

> Middleware **fails closed** (`src/middleware.ts`): a request is authorized only
> when `ADMIN_PASSWORD` is set **and** the cookie carries the matching HMAC token.
> If the password is unset, every protected admin route is denied — pages redirect
> to `/admin/login`, APIs return `503`; an unauthenticated API call returns `401`.

## Project map

```
web/src/
├─ app/
│  ├─ page.tsx              Homepage (hero, bestsellers, editorial)
│  ├─ shop/page.tsx         Catalogue (filters + sort via ShopClient)
│  ├─ shop/[id]/page.tsx    Product detail (+ Product JSON-LD)
│  ├─ collections/ · collections/[slug]/   Category landing pages (SEO)
│  ├─ checkout/             Customer-info form → Razorpay modal
│  ├─ thank-you/            Post-payment confirmation
│  ├─ track/                Public order tracking page
│  ├─ about/ · policies/ · privacy-policy/ · terms/   Brand + legal
│  ├─ journal/page.tsx       Journal hub (published articles, grouped by cluster)
│  ├─ journal/[slug]/       Article page (JSON-LD, revalidate 60)
│  ├─ admin/                Gated: products CRUD + orders view + journal CRUD + reviews
│  ├─ admin/reviews/        Pending reviews moderation (approve / reject)
│  ├─ reviews/[token]/      Post-purchase verified review page (public, token-gated)
│  ├─ newsletter/confirmed/ Double opt-in landing (confirmed|already|expired|invalid)
│  ├─ api/create-order/ · api/verify-payment/          Razorpay (server)
│  ├─ api/track/                                       Shiprocket tracking (server)
│  ├─ api/admin/{login,logout,products,upload}/        Admin API
│  ├─ api/admin/journal/[slug]/publish/                Publish/unpublish gate
│  ├─ api/admin/orders/[id]/ship/                      Assign AWB + pickup + label
│  ├─ api/admin/reviews/                               GET pending reviews
│  ├─ api/admin/reviews/[id]/                          PATCH approve | reject
│  ├─ api/reviews/                                     POST open review submission
│  ├─ api/reviews/[token]/                             GET token info · POST verified review
│  ├─ api/subscribe/ · api/subscribe/confirm/          Newsletter double opt-in (lead-magnet)
│  ├─ api/cron/content-draft/                          Vercel Cron endpoint (CRON_SECRET)
│  ├─ api/webhooks/delivery-status/                    Shiprocket status webhook
│  ├─ sitemap.ts · robots.ts                           SEO (includes /journal + articles)
│  └─ globals.css           ← brand design tokens (source of truth)
├─ components/              Header, Footer, CartDrawer, ProductCard,
│                          ProductGallery, ProductPurchase, ShopClient, ArticleCard,
│                          ReviewSection, ReviewForm, …
├─ context/CartContext.tsx  Cart state + localStorage persistence
├─ middleware.ts            Admin cookie/HMAC gate (fails closed)
├─ instrumentation.ts       Node localStorage shim (see gotcha)
└─ lib/                     products, collections, site, format, types,
                           useCheckout, supabase, adminProducts, articles,
                           articleGenerator, validateCustomer,
                           shiprocket, notify, invoice, reviews, ratelimit
```

**AI / LLM discovery:** `public/llms.txt` (concise brand brief + key links) and
`public/llms-full.txt` (inlined brand story, catalogue overview, mukhi reference,
policies, FAQs) follow the llms.txt convention so AI crawlers get an accurate,
on-brand summary. Keep them in sync with the brand copy rules above (say "Lab
Certified" only, no medical/miraculous claims). They are static files — edit by
hand; nothing generates them.

## Editing the catalogue

All products live in **`src/lib/products.ts`** — one typed object each (price,
MRP, mukhi, origin, deity, planet, benefits, images). The shop, filters, product
pages, sitemap and related-products all derive from it. Source assets (logo,
photos, `Pendant Catalogue/`, `ASINS_updated.csv` of Amazon prices) live in the
repo root one level up (`../`).

## Gotcha — Node 22+ `localStorage`

Node 22+/25 exposes a non-functional global `localStorage` that crashes SSR for
libraries that feature-detect it. Handled two ways, no action needed:
`src/instrumentation.ts` strips the broken global on boot, and the `dev` script
passes `--no-experimental-webstorage`.

## Status (as of 2026-06-28) — LIVE

**https://amorfos.in** is live and processing real orders.

All env vars are set in Vercel production:
- **Supabase** project `amorfos` (ap-south-1 / Mumbai, ref `qxdgqebjbwzwionwfnmg`) —
  confirmed active. `supabase/migrations/`: 001 (shiprocket cols), 002 (RLS + stock),
  003 (articles), 004 (subscribers), 005 (abandoned_cart), 006 (subscriber double opt-in
  — `confirmed`/`confirm_token`/`confirmed_at`) all applied. The `reviews` + `review_tokens`
  tables were applied directly via the Supabase MCP (no numbered file).
- **Razorpay live keys** — smoke-tested + multiple real payments processed.
- **Shiprocket** (`care@amorfos.in`, company 599101) — end-to-end fulfillment confirmed.
- **SMTP** (GoDaddy) + **WhatsApp Cloud API** — configured for notifications.
- `ADMIN_PASSWORD`, `ANTHROPIC_API_KEY`, `CRON_SECRET`, `BLOB_READ_WRITE_TOKEN` all set.

**Shiprocket webhook** at `https://amorfos.in/api/webhooks/delivery-status`
(Auth: `x-api-key` = `SHIPROCKET_WEBHOOK_TOKEN`). Do not rename this path.

**Reviews system** (live as of 2026-06-28):
- 38 seed reviews from Amazon for 7 mukhi types (4, 6, 7, 9, 11, 12, 13) — `status=approved`
- Star ratings visible on product cards, collection pages, homepage bestsellers, and product detail
- Open form (Option A) on every product page → pending, admin approves at `/admin/reviews`
- Post-purchase token (Option B) generated in `verify-payment` → emailed in confirmation → 60-day link
- Review tokens are per-order, track which mukhi the customer has already reviewed, expire after 60 days

**Journal content pipeline:**
- Vercel Cron fires daily at 04:00 UTC (9:30 AM IST) → `api/cron/content-draft`
- Drafts land at `/admin/journal` — Manav reviews and publishes manually
- Content calendar: `scripts/content-calendar.json` (8 entries as of 2026-06-28;
  add more before they run out — see `docs/content-marketing-strategy.md` §4–5)
- Google Search Console: verified (manav.mba24@gmail.com), sitemap submitted 2026-06-28

**Remaining gaps:**
- **~101 of 181 products have no images** — render placeholder glyphs. Add photos
  before promoting widely.
- No COD (prepaid Razorpay only).
- No product search, no analytics pixel.
- No admin UI to retry a failed Shiprocket sync (manual DB fix needed).
- Content calendar needs weeks 5–12 added (16 more articles).

**Inventory:** opt-in per product via `Product.stock` (`undefined`/`null` =
unlimited; a number = tracked, `0` = sold out). Checkout rejects qty over stock;
payments decrement atomically via `decrement_stock` Postgres function
(`supabase/migrations/002_rls_and_stock.sql`). Oversell window exists between
cart-add and payment — acceptable for low-volume one-of-a-kind beads.

See setup/deploy details in `README.md`.
