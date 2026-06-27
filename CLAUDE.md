# CLAUDE.md — Amorfos storefront

Guidance for Claude (and collaborators) working in this repo. Read this first.

## What Amorfos is

**Amorfos** is a Delhi-based D2C brand selling authentic, **Lab Certified**
Rudraksha — pendants, malas, combination pieces and loose beads, in
hand-finished silver. Founded by **Manav Bansal** (Rohini, Sector-1, Delhi).
Previously sold on Amazon/Flipkart; now going direct-to-consumer. Real business,
launching ~mid-2026. Brand WhatsApp: +91 83684 69332 · care@amorfos.in.

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
- **Checkout:** dedicated `/checkout` page collects customer info (name + 10-digit
  phone required; email/address optional), then opens the Razorpay modal via
  `lib/useCheckout.ts`. "Buy it now" on a product routes straight here.
- **Payments:** Razorpay (live keys) — order created server-side (`api/create-order`,
  amount recomputed from catalogue + shipping so a tampered client price can't change the
  charge), HMAC SHA-256 signature verified (`api/verify-payment`). If keys are
  missing/placeholder, both routes return `503` and checkout is disabled.
- **Cart:** React Context + `localStorage` (`context/CartContext.tsx`). No Redux.
- **Database:** **Supabase** (`lib/supabase.ts`, server-only `SUPABASE_SERVICE_ROLE_KEY`).
  Two tables (`supabase/schema.sql`): `orders` (written pending → paid/failed across
  the create/verify routes, holds customer PII + line items) and `products`. When
  Supabase is unconfigured, everything **falls back to the hardcoded `products.ts`**.
- **Fulfillment:** Shiprocket (`lib/shiprocket.ts`) — JWT token cached module-level;
  `api/verify-payment` auto-syncs paid orders using Next 15 `after()` (keeps the
  serverless function alive post-response so the sync completes; plain fire-and-forget
  is killed by Vercel before the first `await`). Sync creates a Shiprocket order +
  assigns AWB + requests pickup + generates label, then writes `shiprocket_*` cols +
  sets `fulfillment_status = 'synced'`. Admin "Ready to Ship" (`api/admin/orders/[id]/ship`)
  requires `shiprocket_shipment_id` to exist first.
- **Notifications:** `lib/notify.ts` — order-confirmation email (GoDaddy SMTP/nodemailer)
  + WhatsApp Cloud API. Shipping-status updates via webhook at `/api/webhooks/delivery-status`
  (not `/shiprocket` — Shiprocket blocks URLs containing "shiprocket"/"sr"/"kr").
- **Admin:** `/admin` (cookie/HMAC gate via `ADMIN_PASSWORD` + `middleware.ts`, fails
  closed) → product CRUD (`/admin/products`), orders view with Ship action + PDF invoice
  download (`/admin/orders`). Product data layer `lib/adminProducts.ts` reads Supabase
  when configured, else `products.ts`. Image uploads go to **Vercel Blob**
  (`BLOB_READ_WRITE_TOKEN`); without the token uploads return `503`.
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
│  ├─ admin/                Gated: products CRUD + orders view
│  ├─ api/create-order/ · api/verify-payment/          Razorpay (server)
│  ├─ api/track/                                       Shiprocket tracking (server)
│  ├─ api/admin/{login,logout,products,upload}/        Admin API
│  ├─ api/admin/orders/[id]/ship/                      Assign AWB + pickup + label
│  ├─ api/webhooks/delivery-status/                    Shiprocket status webhook
│  ├─ sitemap.ts · robots.ts                           SEO
│  └─ globals.css           ← brand design tokens (source of truth)
├─ components/              Header, Footer, CartDrawer, ProductCard,
│                          ProductGallery, ProductPurchase, ShopClient, …
├─ context/CartContext.tsx  Cart state + localStorage persistence
├─ middleware.ts            Admin cookie/HMAC gate (fails closed)
├─ instrumentation.ts       Node localStorage shim (see gotcha)
└─ lib/                     products, collections, site, format, types,
                           useCheckout, supabase, adminProducts,
                           shiprocket, notify, invoice
```

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

## Status (as of 2026-06-27) — LIVE

**https://amorfos.in** is live and processing real orders.

All env vars are set in Vercel production:
- **Supabase** project `amorfos` (ap-south-1 / Mumbai) — confirmed active.
- **Razorpay live keys** — smoke-tested + multiple real payments processed.
- **Shiprocket** (`care@amorfos.in`, company 599101) — credentials smoke-tested;
  end-to-end fulfillment confirmed: order → paid → Shiprocket order created → AWB
  assigned (Shadowfax Surface) → pickup requested → label generated, all via `after()`.
- **SMTP** (GoDaddy) + **WhatsApp Cloud API** — configured for notifications.
- `ADMIN_PASSWORD` set. `BLOB_READ_WRITE_TOKEN` status: check Vercel dashboard.

**Shiprocket webhook** configured at `https://amorfos.in/api/webhooks/delivery-status`
(Auth: `x-api-key` header = `SHIPROCKET_WEBHOOK_TOKEN`). Do not rename this path.

**Remaining gaps (not yet built):**
- **~101 of 181 products have no images** (`images: []`) — render placeholder glyphs.
  Add photos before promoting the store widely.
- No order-placement email/SMS (Shiprocket notify covers *shipping* events only).
- No COD (checkout is prepaid Razorpay only).
- No product search, inventory/stock tracking, analytics pixel.
- No admin UI to retry a failed Shiprocket sync (manual DB fix needed if `after()` errors).

See setup/deploy details in `README.md`.
