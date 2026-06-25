# Amorfos — Project Handoff & Developer Guide

A living brief for continuing development. Read this first in any new session.
Last updated after: admin portal + policy pages (session 2025-06-25).

---

## 1. What this is

A production-ready **D2C storefront for Amorfos** — a Delhi house selling
authentic, Lab Certified Rudraksha (pendants, malas, combination pendants, loose
beads). Founder: **Manav Bansal**, Rohini Sector-1, Delhi. Brand WhatsApp:
**+91 83684 69332**. Previously sold on Amazon/Flipkart; now going direct.

**Stack**
- Next.js 15.3.3 (App Router) + TypeScript
- Tailwind CSS v4 (CSS-first `@theme` tokens — no `tailwind.config`)
- React Context cart (+ `localStorage`), no Redux
- Razorpay payments (order created server-side, modal client-side, HMAC verify)
- Target deploy: Vercel (app lives in the **`web/`** subdirectory)

Local machine runs **Node 25** (matters — see Gotchas).

---

## 2. Run it

```bash
cd web
npm install
npm run dev            # http://localhost:3000   (dev script sets a Node flag, see Gotchas)
npm run build          # production build (do NOT run while `dev` is live — see Gotchas)
```

Env (`web/.env.local`, currently placeholders):
```
RAZORPAY_KEY_ID=rzp_test_REPLACE_ME
RAZORPAY_KEY_SECRET=REPLACE_ME_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_REPLACE_ME
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 3. File map

```
web/
├─ src/app/
│  ├─ layout.tsx              Root: fonts (Cormorant + Inter), SEO metadata, providers, shell
│  ├─ page.tsx                Homepage (hero, trust, bestsellers, editorial, categories, assurance)
│  ├─ shop/page.tsx           Catalogue shell (server, SEO) → renders <ShopClient/> in <Suspense>
│  ├─ shop/[id]/page.tsx      Product detail (SSG via generateStaticParams) + JSON-LD
│  ├─ about/page.tsx          Brand story + contact
│  ├─ policies/page.tsx       Shipping / 7-day returns / authenticity (anchors #shipping etc.)
│  ├─ thank-you/page.tsx      Post-payment confirmation (noindex)
│  ├─ not-found.tsx           404
│  ├─ globals.css             Design tokens (@theme) + base + button/utility classes
│  ├─ sitemap.ts / robots.ts  SEO
│  ├─ icon.svg                Favicon (gold "A")
│  ├─ instrumentation.ts      Node localStorage shim (see Gotchas)
│  └─ api/
│     ├─ create-order/route.ts    Razorpay order; amount recomputed server-side (anti-tamper)
│     └─ verify-payment/route.ts  HMAC SHA-256 signature verification
├─ src/components/
│  ├─ Header.tsx              Sticky header, scroll state, mobile drawer, cart button
│  ├─ Footer.tsx              Footer (links, contact, disclaimer)
│  ├─ CartDrawer.tsx          Slide-in cart + free-shipping meter + Checkout
│  ├─ WhatsAppButton.tsx      Floating WhatsApp (bottom-right)
│  ├─ Logo.tsx                Uses /brand/logo-dark.png (see Theme)
│  ├─ icons.tsx               Inline SVG icon set
│  ├─ Reveal.tsx              IntersectionObserver scroll-reveal wrapper
│  ├─ ProductCard.tsx         Grid card (white tile, badges, quick-add, hover image swap)
│  ├─ ProductGallery.tsx      PDP gallery (thumbnails + main, white tiles)
│  ├─ ProductPurchase.tsx     PDP qty + Add to cart + Buy now
│  ├─ ShopClient.tsx          Filters (form/origin/mukhi), sort, mobile filter sheet
│  └─ PaymentRef.tsx          Shows Razorpay payment id on thank-you
├─ src/context/CartContext.tsx   Cart state, reducer, localStorage persistence, drawer open state
├─ src/lib/
│  ├─ products.ts             THE CATALOGUE (13 products) + categoryMeta + helpers
│  ├─ types.ts                Product / Category / CartLine types
│  ├─ site.ts                 Brand constants (name, whatsapp, email, address, freeShippingThreshold)
│  ├─ format.ts               inr(), discountPct()
│  └─ useCheckout.ts          Client hook: create-order → load Razorpay → modal → verify → /thank-you
└─ public/
   ├─ brand/  logo.png (orig black-on-white) · logo-mark.png (transparent cream, unused now) · logo-dark.png (transparent espresso, CURRENT)
   └─ products/  24 square product images (1200×1200)

Repo root (../) also holds raw assets: `Pendant Catalogue/` (all 1500×1500 white-bg
Amazon-style shots), `logo.png`, `ASINS_updated.csv` (Amazon sales — used to set prices).
```

---

## 4. Conventions you must keep

### Design tokens (Tailwind v4 `@theme` in `globals.css`)
The site is a **light warm-cream** theme. Naming is intentional but can confuse:
- **`ink` family = the light GROUND** (`bg-ink` #F6F1E7, `bg-ink-raised`, `bg-ink-soft`).
- **`bone` family = the dark TEXT** (`text-bone` #221B12, `text-bone-dim`, `text-bone-faint`).
- **`gold` family** = accents (`gold` deep, `gold-soft` brighter, `gold-deep`).
- **`dark` + `cream`** = the ONLY dark elements: chips/badges/gradients that sit
  on top of white product photos (e.g. `bg-dark/85 text-cream`). Use these when you
  need a dark element on a light page; do not reach for `bg-bone`.
- `line` / `line-strong` = dark translucent hairlines.
- Reusable classes in globals: `.btn .btn-primary .btn-outline`, `.eyebrow`,
  `.display`, `.font-serif`, `.reveal`, `.grain`.

To change the whole look, edit the `@theme` block — everything reads from it.

### Logo
- Light theme uses **`/brand/logo-dark.png`** (transparent espresso wordmark).
- The transparent logos were generated from `logo.png` with Pillow (alpha = 255−luminance,
  tinted). If you retheme dark again, switch `Logo.tsx` to `logo-mark.png` (cream).
- Razorpay modal still uses `/brand/logo.png` (black on white) — correct on its white modal.

### Product imagery
- All catalogue shots are **1500×1500, product centered on white**.
- Display them on **`bg-white` + `object-contain` + `aspect-square`** (full product,
  no crop — "fit to image"). Non-square sources must be padded to square white first.
- Don't use tall/`object-cover` frames for product photos (crops the bead → looks wrong).

### Copy rules (house style — enforce everywhere)
- Say **"Lab Certified"** only — never a lab name (no "GRTL", etc.).
- **No medical or miraculous claims.** Benefits are framed as *traditional associations*.
- Products are **"worn on the recommendation of astrologers and pandits."**
- **7-day returns** on unused, sealed products. **Free shipping above ₹999.**

### Data model — adding/editing products
Today everything lives in `src/lib/products.ts` (one typed `Product` per object).
**Planned change:** this hardcoded file moves into a CMS/DB so products can be managed
through an admin portal — see the ⭐ request in §7. Keep the `Product` type as the contract.
Fields:
`id` (slug), `name`, `category`, `categoryLabel`, `mukhi`, `mukhiLabel`, `origin`,
`beadSize`, `deity`, `planet`, `price`, `mrp`, `images[]`, `tagline`, `description`,
`benefits[]`, optional `bestseller`/`newArrival`. Add the image to `public/products/`
(square, white bg). Shop, filters, PDP, sitemap, related — all update automatically.

---

## 5. Gotchas (real bugs we already hit)

1. **Node 22+/25 ships a broken global `localStorage`** (its methods are `undefined`)
   that crashes SSR. Handled by `src/instrumentation.ts` (strips it on boot) **and**
   `NODE_OPTIONS=--no-experimental-webstorage` in the `dev` script. Don't remove either.
   No-op on Vercel's older Node.
2. **Never run `npm run build` while `npm run dev` is running** — it overwrites `.next`
   and the dev server starts 500-ing with `Cannot find module './###.js'`. Fix:
   stop dev, `rm -rf .next`, restart dev.
3. **Cart `localStorage` access is guarded** via `getStore()` in `CartContext.tsx`
   (returns null unless a real browser `window.localStorage` exists). Keep that guard.
4. **Order amount is always recomputed server-side** in `create-order/route.ts` from
   the catalogue. Never trust client-sent prices.
5. **Hydration warning from extensions** (ColorZilla `cz-shortcut-listen`, Grammarly):
   silenced with `suppressHydrationWarning` on `<body>` in `layout.tsx`.

---

## 6. Status — done vs. pending

**Done & verified (in Chrome):** all pages render; cart add/remove/qty + persistence;
free-shipping meter; checkout calls create-order; mobile responsive; WhatsApp button;
SEO metadata + JSON-LD + sitemap/robots; light cream theme; Amazon-style square imagery;
Privacy Policy + Terms pages; Admin portal (products CRUD at `/admin`).

**Admin portal — how it works:**
- `/admin` → redirects to `/admin/products` (the product list)
- `/admin/login` — password gate; set `ADMIN_PASSWORD` env var
- Products stored in **Vercel Blob** (`amorfos-products.json`) when `BLOB_READ_WRITE_TOKEN` is set.
  Without it (local dev): admin shows all products read-only from `products.ts`; storefront works fine.
- Storefront pages (`/`, `/shop`, `/shop/[id]`) read from blob with 60s ISR; fall back to `products.ts`.
- On admin save, Next.js `revalidatePath` is called so the storefront refreshes immediately.
- Image upload: the form lets you upload directly to Vercel Blob (requires the same `BLOB_READ_WRITE_TOKEN`).
  Without it, enter image paths manually (e.g. `/products/image.jpg`).

**New env vars needed (add to `.env.local` + Vercel project settings):**
```
ADMIN_PASSWORD=choose-a-strong-password
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...   # from Vercel → Storage → Blob → Connect
```

**Gated on you (not code):**
- [ ] **Razorpay keys** — add real **test** keys to `.env.local`, run the modal end-to-end
      (test UPI `success@razorpay` / card `4111 1111 1111 1111`). Then **live** keys = swap
      the 3 env vars, no code change.
- [ ] **Vercel Blob** — go to Vercel → Storage → Create Blob store → connect to your project.
      Adds `BLOB_READ_WRITE_TOKEN` automatically to the project env. Then set the same token in
      `.env.local` for local admin use.
- [ ] **Deploy to Vercel** — set **Root Directory = `web`**, add all env vars. No git repo
      initialized yet. (Steps in `README.md`.)

---

## 7. Suggested next features (rough priority)

> **⭐ Explicit owner request — Admin portal for product listings (CRUD).**
> Manav wants a portal to **create / update / delete products** (not edit
> `products.ts` by hand). This is a real architecture change:
> - **Move the catalogue out of `src/lib/products.ts` into a data store.** Two paths:
>   - *Build it ourselves:* DB (Vercel Postgres / Supabase) + a `/admin` area (auth-gated)
>     with a product form (all `Product` fields), image upload (Vercel Blob / S3), and
>     list/edit/delete. Add admin auth (e.g. NextAuth / a single-owner password) — the
>     `/admin` routes and the write APIs MUST be protected.
>   - *Use a CMS (recommended, faster):* **Sanity** (or Shopify headless) gives the
>     create/update/delete UI, media handling, and roles for free; the site reads via
>     its API. Least code to maintain for a solo founder.
> - Keep `Product`/`Category` types as the contract; swap `getProduct`/`products` to
>   read from the store (ideally cached/ISR so the storefront stays fast).
> - Image pipeline must enforce the **square white** rule (resize/pad on upload) so new
>   uploads match the catalogue automatically.
> - Suggested first step: pick CMS-vs-DB, then migrate the existing 13 products into it.

**A. Make checkout real & safe**
1. Razorpay **webhook** endpoint (`payment.captured`) — don't rely on the client handler alone.
2. **Persist orders** (Vercel Postgres / Supabase): order id, items, amount, payment id, status, address.
3. **Order confirmation email** (Resend) to customer + you.
4. **COD flow** — Razorpay has no native COD; implement as "place order without online
   payment" → status `cod_pending` → manual confirmation. (PDP copy already mentions COD.)

**B. Razorpay activation prerequisites (needed for live KYC)**
5. Add explicit **Privacy Policy**, **Terms & Conditions**, **Refund/Cancellation**, and
   **Shipping** pages (we have `/policies` + `/about`; Razorpay wants these as named pages).

**C. Catalogue depth**
6. **Variants** — let one product carry mukhi/size/origin options instead of separate SKUs.
7. **Stock / availability** flags; "notify me" for out-of-stock.
8. **(See ⭐ above)** Move products out of `products.ts` into a CMS/DB so they're
   manageable via the admin portal.

**D. Conversion & trust**
9. **Reviews/ratings** (they had strong Amazon reviews — import/showcase).
10. **Coupon codes** (Razorpay supports; or app-level discount on subtotal).
11. **Mukhi guide / education** content + blog (SEO; "which mukhi for X").
12. **Wishlist**; recently-viewed.

**E. Ops & growth**
13. **Shipping integration** (Shiprocket/Delhivery) + **pincode serviceability** check.
14. **Analytics**: GA4 / Plausible + Meta Pixel; basic funnel events (add_to_cart, checkout).
15. **Abandoned cart** (needs server-side cart or captured email).
16. Accessibility pass + Lighthouse/perf budget.

**Quick polish ideas mentioned but not done:**
- Warm the product-tile background from pure `#fff` to a faint ivory so tiles blend softer.
- Give hero / "Shop by form" tiles the same white fit-to-image treatment (currently atmospheric `object-cover`).

---

## 8. How we verify changes
- Dev server via the preview tooling or `npm run dev`.
- Drive the real browser to click through cart → checkout; check console for errors.
- `npm run build` must pass before deploy (run it only when dev is stopped).
