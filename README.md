# Amorfos — D2C storefront

A production-ready Next.js storefront for **Amorfos**, a Delhi house selling
authentic, Lab Certified Rudraksha. Light, warm and considered — a parchment-ivory
palette with espresso type and a single deep antique-gold accent (Forest Essentials
direction). Brand tokens live in `src/app/globals.css`.

- **Framework:** Next.js 15 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4
- **Payments:** Razorpay (UPI / cards / netbanking), order created server-side, modal client-side
- **Cart:** React Context + `localStorage` (no Redux)
- **Deploy target:** Vercel

---

## 1. Run it locally

```bash
cd web
npm install
cp .env.example .env.local   # then fill in your Razorpay TEST keys
npm run dev                  # http://localhost:3000
```

> **Node 22+ note:** newer Node exposes a non-functional global `localStorage`
> that crashes SSR for libraries that feature-detect it. This is handled two
> ways: `src/instrumentation.ts` strips the broken global on boot, and the
> `dev` script passes `--no-experimental-webstorage`. No action needed.

## 2. Configure Razorpay

Get keys from the [Razorpay dashboard → API Keys](https://dashboard.razorpay.com/app/keys).

In `.env.local`:

```
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- `RAZORPAY_KEY_SECRET` is **server-only** — never exposed to the browser.
- The order amount is recomputed server-side in `src/app/api/create-order/route.ts`
  from the catalogue, so a tampered client price can't change what's charged.
- The payment signature is verified in `src/app/api/verify-payment/route.ts`
  (HMAC SHA-256) before the order is treated as paid.

### Test the checkout
With test keys in place, add to cart → **Checkout** → use Razorpay's test
UPI `success@razorpay` or test card `4111 1111 1111 1111`, any future expiry,
any CVV. On success you land on `/thank-you`.

## 3. Deploy to Vercel

The app lives in the **`web/`** subdirectory — set that as the project root.

**Option A — Vercel CLI**
```bash
npm i -g vercel
cd web
vercel            # first run links/creates the project
vercel --prod     # production deploy
```

**Option B — Git + Vercel dashboard**
1. Push this repo to GitHub.
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Set **Root Directory** = `web`.
4. Add the env vars below, then deploy.

**Environment variables to set in Vercel** (Project → Settings → Environment Variables):

| Key | Value |
| --- | --- |
| `RAZORPAY_KEY_ID` | `rzp_test_…` (or live) |
| `RAZORPAY_KEY_SECRET` | server secret |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | same as `RAZORPAY_KEY_ID` |
| `NEXT_PUBLIC_SITE_URL` | `https://amorfos.in` (your domain) |

## 4. Going live (Razorpay live keys)

1. Complete Razorpay KYC / activation.
2. Generate **live** keys (`rzp_live_…`).
3. Replace all three key env vars in Vercel with the live values.
4. Redeploy. That's the only change needed — no code edits.

---

## Project map

```
web/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx                 Homepage
│  │  ├─ shop/page.tsx            Catalogue (filters via ShopClient)
│  │  ├─ shop/[id]/page.tsx       Product detail (+ JSON-LD)
│  │  ├─ about/page.tsx           Brand story + contact
│  │  ├─ policies/page.tsx        Shipping / returns / certification
│  │  ├─ thank-you/page.tsx       Post-payment confirmation
│  │  ├─ api/create-order/        Razorpay order (server)
│  │  ├─ api/verify-payment/      Signature verification (server)
│  │  ├─ sitemap.ts / robots.ts   SEO
│  │  └─ instrumentation.ts       Node localStorage shim
│  ├─ components/                 Header, Footer, CartDrawer, ProductCard, …
│  ├─ context/CartContext.tsx     Cart state + persistence
│  └─ lib/                        products, site config, formatting, checkout hook
└─ public/
   ├─ brand/                      logo (original + transparent mark)
   └─ products/                   product photography
```

## Editing the catalogue
All products live in **`src/lib/products.ts`** — one typed object each
(price, MRP, mukhi, origin, deity, planet, benefits, images). Add or edit there;
the shop, filters, product pages, sitemap and related-products all update
automatically.

## Copy rules (baked in)
"Lab Certified" only (never a lab name) · no medical/miraculous claims ·
"worn on the recommendation of astrologers and pandits" · 7-day returns on
unused sealed products · free shipping above ₹999.
