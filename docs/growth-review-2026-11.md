# Amorfos — Full Review & Sales Plan (23 Nov 2026)

> **Superseded 25 Nov 2026** for sales & marketing by [`sales-marketing-plan.md`](./sales-marketing-plan.md). The tech/ops risk list in §3.4 is still current.

> Scope: what is built today, what is broken or missing, and the order to do things in to
> grow D2C sales. Based on the code in `web/`, live Supabase data (pulled 23 Nov), the docs in
> `web/docs/`, and the Amazon sales export `ASINS_updated.csv`.

---

## 1. Bottom line

1. **The site is well built; it just hasn't been sold yet.** Checkout, payments, shipping,
   tracking, reviews, the Merchant feed and conversion tracking all work end to end. But in
   five months there have been **3 real orders, all ₹599 pendants (₹678 with shipping) =
   ₹2,034**. Every other order was a ₹9/₹49 test. Until 22 Nov there was **no paid traffic**,
   so the store has never really been tested on shoppers.
2. **The biggest sales blockers are trust and payment options, not features.** First-time
   buyers at a brand they don't know want **COD**, **reviews of this product**, and **proof of
   the certificate**. Amorfos has none of COD, a coupon, or reviews from D2C buyers (all 30 live
   reviews are Amazon imports).
3. **The numbers don't work at ₹678 per order yet.** At about ₹10 a click and 1.5% of clicks
   buying, an order costs about ₹670 in ads, which is the whole order value. **Order value has
   to go up** (bundles, a cart add-on to reach the ₹999 free-shipping line, more 7/9 Mukhi and
   malas) and **conversion has to go up** (COD, trust, a sticky Add to cart button on phones).
4. **The premium price isn't shown to be worth it on the page.** *(Corrected 24 Nov: Amorfos no
   longer sells on any marketplace; the Amazon prices below are from 2020; today's beads are a
   higher grade than both the old Amazon stock and current competitors.)* The price is
   intentional, but shoppers comparing against cheaper sellers can't see the quality difference.
   The product page has to prove it: size, mukhi clarity, silver, certificate, side-by-side.
5. **Content and email have gone quiet.** The daily article generator ran out of calendar
   entries around 30 Jul (28 published, nothing new since 5 Aug). The email list has **8
   sign-ups, 3 confirmed**.

---

## 2. Where things stand (live data, 23 Nov)

| Area | Number |
|---|---|
| Real paid orders | **3** (30 Jun, 16 Nov, 22 Nov), all one ₹599 pendant + ₹79 shipping |
| Test orders | 10 paid at ₹9–49, plus 7 unpaid "pending" |
| Abandoned carts that got a recovery message | 1 of 7 |
| Products live | **49 of 180** (131 inactive) — 27 pendants, 12 combinations, 10 malas |
| Live products without photos | **8 of the 10 malas** |
| Stock tracked | None (stock is blank on every live product) |
| Reviews | 30, all imported from Amazon, keyed by mukhi; 0 from D2C buyers |
| Email subscribers | 8 (3 confirmed) |
| Journal | 28 published, 2 drafts; nothing new since 5 Aug |
| Google Search ads | Live since 22 Nov, ₹600/day, 12 ad groups |
| Google Shopping | Feed of 37 products under review; Shopping campaign drafted, not live |
| Meta ads | Blocked by an account issue |

**What Amazon says sells** (from `ASINS_updated.csv`, 5,098 units, ₹43.1 lakh; **2020 prices, older and lower-grade stock — use for demand, not price**):

| Product | Units | Avg price on Amazon | D2C price now |
|---|---|---|---|
| 5 Mukhi pendant | 638 | ₹294 | ₹599 |
| 7 Mukhi pendant | 414 | ₹483 | ₹599 (Indonesia) / ₹999 (Nepal) |
| 8 Mukhi Indonesia | 225 | — | ₹999 |
| 9 Mukhi Indonesia | 214 | — | ₹999 |
| 3 Mukhi pendant | 205 | ₹496 | ₹599 (India) / ₹1,349 (Nepal) |
| 7 Mukhi Lakshmi mala | 157 | ₹962 | ₹4,499 |
| 14 Mukhi Indonesia | 112 | ₹2,731 | ₹16,499 |
| 12 Mukhi Indonesia | 110 | ₹1,437 | ₹2,999 |
| Gauri Shankar (wooden cap) | 98 | ₹1,897 | ₹4,499 |

Volume comes from **5 and 7 Mukhi**. Revenue per sale comes from **14 Mukhi, Gauri Shankar and
12 Mukhi**. Combinations sold little on Amazon (Study Success: 59 units). The price gap is not
like for like: those are 2020 prices for lower-grade beads, and the current range is a higher grade.

---

## 3. Review of what is built

### 3.1 Strong — keep as is
- **Payments:** server-side price check, signature check, and a Razorpay webhook so paid orders
  complete even if the browser closes (verified 22 Nov).
- **Fulfilment:** paid orders sync to Shiprocket automatically, AWB and label are generated,
  delivery updates come back by webhook, public `/track` page.
- **Tracking:** GA4, Meta Pixel + server-side Purchase (CAPI), Google Ads purchase conversion
  with enhanced conversions.
- **SEO base:** product structured data with ratings, shipping and returns; collection and
  journal FAQ markup; Merchant feed; `llms.txt`.
- **Brand:** the look, voice and "no medical claims" guardrails are clear and consistently
  applied (docs in `web/docs/`, banned-phrase check in the AI writers).

### 3.2 Hurting sales now (fix first)

| # | Problem | Where | Why it matters |
|---|---|---|---|
| 1 | **No cash on delivery** | checkout | Most first orders from unknown Indian D2C brands are COD. Prepaid-only loses a large share of willing buyers. |
| 2 | **No coupon / first-order offer** | checkout, popup | Nothing to close a hesitant buyer; the popup offers a PDF, not a reason to buy now. |
| 3 | **No sticky Add to cart on phones; "Quick add" only shows on hover** | `ProductPurchase.tsx`, `ProductCard.tsx:93` | Ads traffic is mostly mobile. The buy button scrolls away; Quick add is invisible on touch. |
| 4 | **Reviews are per mukhi, not per product; none on the homepage** | `shop/[id]/page.tsx:93`, `page.tsx` | A mala shows pendant reviews; combinations show none. Social proof is buried. |
| 5 | **Card star ratings count unapproved reviews** | `lib/reviews.ts:25–27` | Cards and product pages can show different ratings. Small bug, trust cost. |
| 6 | **No certificate proof on the page** | product page | "Lab Certified" is the core promise but there's no sample certificate image or "how to check it". |
| 7 | **Abandoned-cart recovery is slow and thin** | `vercel.json` (daily cron), `notify.ts:347` | Runs once a day, so a nudge can arrive ~24h late; links to the product, not the cart. Contact details are only saved at "Pay". |
| 8 | **Popup can interrupt buyers on product pages** | `LeadCapture.tsx:12` | 14-second popup over the page you paid a click to bring someone to. |
| 9 | **Four health-named combinations still live** | Dard Nivarak, Arogya, Fitness, Hriday Raksha | Conflicts with the brand's no-medical-claims rule and Google/Meta ad policies. Already kept out of the feed. |
| 10 | **8 of 10 malas have no photo** | catalogue | Blocks the "rudraksha mala" keyword (10K–100K searches a month) and Shopping. |

### 3.3 Weak — fix in the next month
- **Order value:** no bundles, no "frequently bought together", no add-on in the cart drawer
  even though it already shows a free-shipping progress bar.
- **Product search and filters:** no search box; no price or "purpose" filter (wealth, career,
  peace). Only Featured / price sort.
- **Checkout form:** no pincode → city/state autofill; email required; no payment-failure
  handling (closing the Razorpay window clears the error silently).
- **Analytics gaps:** `begin_checkout` fires at "Pay" rather than when checkout opens, so you
  can't see checkout drop-off. Missing `view_cart`, `view_item_list`, `add_shipping_info`,
  payment failure.
- **Post-purchase:** the review request goes out before delivery; nothing after delivery;
  no reorder, referral or gifting.
- **Performance:** the whole 199 KB `products.ts` ships to every page via `CartContext`, and
  the cart refetches the full catalogue on every page load.
- **Sitemap** lists the static product file, so products added in admin are missing.
- **Stock:** not tracked, so "Only N left" never shows and you can oversell.

### 3.4 Operations and tech risk (ranked by business risk)

| # | Issue | Where | Risk |
|---|---|---|---|
| 1 | **Delivery-status bug:** `includes("delivered")` also matches "UNDELIVERED" and "RTO DELIVERED", so failed or returned parcels are marked *delivered* and locked there. Cancelled/RTO/lost all fall to "shipped". | `api/webhooks/delivery-status/route.ts:12–15` | Wrong order state; you won't notice returns. Gets worse with COD. |
| 2 | **Shipping-update emails/WhatsApp are fire-and-forget** (`void Promise.allSettled`), the pattern Vercel kills. They probably never send. | same file, `:87` | Customers get no "shipped / out for delivery" messages. Use `after()`. |
| 3 | **WhatsApp looks switched off in production** (no `WHATSAPP_*` vars in the 22 Nov env pull) and confirmation-email failures are never logged. | `lib/notify.ts:267`, `lib/paidOrder.ts:181` | Buyers may get no confirmation at all. Check Vercel env. |
| 4 | **Lead-magnet PDF isn't bundled into the route that sends it** (only `/api/subscribe` is traced; `/api/subscribe/confirm` sends it). | `next.config.mjs:6–8` | Confirmed subscribers likely never get the guide. |
| 5 | **Checkout endpoint has no rate limit**, and the abandoned-cart job messages whatever phone/email was entered. | `api/create-order` | Can be abused to spam people in your brand's name. |
| 6 | **No alerting or monitoring.** The one ops alert goes through the same SMTP it would report on; no Sentry/uptime check. | — | The Nov email outage went unnoticed for weeks for this reason. |
| 7 | **Auto-sync only creates the Shiprocket order;** AWB, pickup and label happen when you click Ship (CLAUDE.md says otherwise). Those three steps aren't atomic. | `lib/paidOrder.ts:189`, `admin/orders/[id]/ship` | Manual step per order; a partial failure can double-assign an AWB. |
| 8 | **No admin refund/cancel/resend/search;** orders page shows the latest 200 only; no reconciliation of Razorpay payments vs pending orders. | `/admin/orders` | Fine at 3 orders, painful at 30/week. |
| 9 | **No tests, no CI, manual deploys** on a live payments flow. | — | Regressions ship silently. |
| 10 | **Product copy:** besides the 4 health-named combinations, "Healing" malas, "said to protect from illness" benefits, wrong brand names ("SSG Collection", "Amorfos® Enterprises"), typos, and gemstones/Shivlings tagged "Nepal / Shiva". Mostly on inactive products, but they'll go live if reactivated. | `src/lib/products.ts` | Brand and ad-policy risk. |
| 11 | **Merchant feed exclusion regex** has no word boundaries: "Stan**dard**" matches `dard`, wrongly excluding a 7 Mukhi product; "Healing" items aren't excluded. | `feeds/google.xml/route.ts:12` | Small loss of Shopping coverage. |
| 12 | **Content calendar ran out silently** (cron returns 200 "exhausted", no alert); banned-phrase check is a substring match ("cure" hits "secure") and misses "pain", "immunity", "stress". | `api/cron/content-draft`, `lib/articleGenerator.ts:20` | SEO engine stopped in July without anyone noticing. |
| 13 | **Smaller:** single shared admin password with fixed cookie; Graph API v18; no GST on invoice; 4 plaintext copies of prod env files in `web/` (gitignored); unescaped names in email HTML; the whole product file in the client bundle. | various | Housekeeping. |

---

## 4. Unit economics (needs your product cost)

Neither ads plan has a break-even target because product cost isn't written down anywhere.
Fill this in once and every budget decision gets easier:

```
Break-even ad cost per order = order value − product cost − silver/packing − Shiprocket cost
                               − ~2% payment fee − (COD: + RTO losses)
```

Worked example at today's typical order (assumed costs — replace with yours):

| | ₹599 pendant | ₹999 7 Mukhi | ₹1,198 two pendants |
|---|---|---|---|
| Customer pays | 678 | 999 | 1,198 |
| Product + silver + pack (assume) | 200 | 300 | 400 |
| Shiprocket (assume) | 70 | 70 | 70 |
| Payment fee 2% | 14 | 20 | 24 |
| **Room for ads per order** | **~₹394** | **~₹609** | **~₹704** |
| Ads cost per order at ₹10/click, 1.5% conv. | ~₹667 | ~₹667 | ~₹667 |

At ₹599 single-pendant orders, Search ads lose money unless conversion is well above 1.5%.
Pushing order value toward ₹999+ and lifting conversion with COD and trust are what make paid
traffic pay.

---

## 5. Way forward — in order

### This week (by 30 Nov) — stop the leaks before spending more
| Action | Who | Effort |
|---|---|---|
| Write down product cost per top-20 SKU (§4) and set a target cost per order | Manav | 1 hr |
| Write down what makes each hero bead higher grade (§6) | Manav | 1 hr |
| Deactivate or rename the 4 health-named combinations | Manav (OK) → code | 30 min |
| Fix the delivery-status bug and move shipping notifications into `after()` (§3.4 #1–2) | code | 1 hr |
| Confirm WhatsApp env vars in Vercel; log email/WhatsApp failures on the order | Manav + code | 1 hr |
| Bundle the lead-magnet PDF into `/api/subscribe/confirm`; rate-limit `create-order` | code | 30 min |
| Add a free uptime check and a daily "anything stuck?" check (paid orders not synced, pending > 1h with a Razorpay payment) | code | 0.5 day |
| Sticky Add to cart bar on mobile product pages; Quick add always visible on touch | code | 0.5 day |
| Fix card ratings to count approved reviews only | code | 15 min |
| Stop the popup on product and collection pages | code | 15 min |
| Add a "Certificate" block to product pages: sample certificate photo + how to check it | Manav (photo) + code | 0.5 day |
| Move `begin_checkout` to checkout page load; add `view_cart`, payment-failed events | code | 0.5 day |
| Approve publishing the Shopping campaign once Merchant Center approves products | Manav | 5 min |
| Daily: check Google search terms, add negatives | Manav / scheduled check | 10 min/day |

### Weeks 2–4 (December) — lift conversion and order value
1. **COD with a fee** (₹49–79) and a **prepaid discount** (5%), COD capped at ~₹3,000, with an
   OTP or WhatsApp confirm before shipping to cut returns-to-origin. Fastest route: Razorpay
   Magic Checkout or Shiprocket Checkout (both give COD, saved addresses and coupons in one
   go) rather than building it. Shiprocket already supports COD shipments.
2. **Coupons**: one first-order code (e.g. 10% off) offered in the popup instead of the PDF,
   plus campaign codes for festivals. Validate the code server-side in `create-order`.
3. **Push order value over ₹999**:
   - "Complete the pair" add-on in the cart drawer when the cart is under ₹999.
   - Fixed bundles: e.g. **5 + 7 Mukhi pair** (the two best Amazon sellers), "family set",
     pendant + mala.
   - Point the 7 Mukhi ads at the product that best matches Amazon demand and price (today
     ads go to the ₹999 Nepal one while a ₹599 Indonesia one exists — test both).
4. **Reviews from D2C buyers**: send the review request 3 days **after delivery** (the
   delivery webhook already knows when). Allow a photo. Show 3 reviews on the homepage.
5. **Faster cart recovery**: run recovery every hour (Vercel cron) and send a link that restores
   the cart. Add a WhatsApp nudge once the WhatsApp Business number is set up.
6. **Mala photos**: shoot the 8 malas (prompt workflow already exists), then add the
   "rudraksha mala" keyword and malas to Shopping.
7. **Gifting for the wedding and New Year season**: gift-wrap option and a gift note at checkout.
8. **Add 8 and 10 Mukhi ad groups** after week 1 (8 Mukhi was #3 by units on Amazon).

### January–March 2027 — scale what works
- **Bidding:** switch Search to *Maximize conversions* after ~15 purchases in 30 days; then
  add a target cost per order from §4.
- **High-value Phase 2:** 12 and 14 Mukhi and Gauri Shankar ad groups (biggest Amazon revenue
  per sale) with a higher CPC cap — one order pays for many clicks.
- **Meta:** once the account is fixed, start with the certificate image and unboxing reels
  (trust first), and Click-to-WhatsApp. Retarget site visitors (Pixel is already collecting).
- **Seasonal pushes:** Makar Sankranti (14 Jan), board-exam season (Feb–Mar, Study Success),
  **Mahashivratri** (early 2027 — confirm the date and start ads 3 weeks before). Plan each
  with a landing page, coupon and journal article.
- **Content:** add 30 more calendar entries so the daily drafts restart; one "how to tell real
  rudraksha" piece and per-mukhi guides that link straight to the product.
- **Email/WhatsApp:** monthly newsletter, post-purchase "how to wear / care" sequence, 60-day
  reorder or "next bead" suggestion.
- **Search box and purpose filters** on the shop page once the catalogue grows past ~60 live products.

### Later (when orders are steady)
Customer accounts and order history, referral credit, loyalty, back-in-stock alerts, variants
(thread / silver / chain) on one product page, more live SKUs from the 131 inactive, Amazon
reviews per product rather than per mukhi.

---

## 6. Decisions only you can make

1. **Product cost per SKU** → sets the break-even cost per order for every campaign.
2. **The quality standard:** no marketplace listings remain and prices are deliberately premium.
   Write down the grade rules (minimum size per mukhi, mukhi-line clarity, no cracks or holes,
   silver purity and weight) so the site and ads can show them.
3. **COD:** yes/no, fee, and order cap.
4. **First-order offer:** discount size (or free shipping on all first orders).
5. **Health-named combinations:** remove, or rename to tradition-framed names.
6. **Total monthly ad budget** across Google Search, Shopping and Meta (today's plans add up to
   ₹1.5–1.8k/day with no overall cap).

---

## 7. What to watch every Monday

| Metric | Target by end of Dec |
|---|---|
| Real orders / week | 5+ |
| Average order value | ₹900+ |
| Ad cost per order | below break-even from §4 |
| Product page → Add to cart | 5%+ |
| Checkout opened → paid | 40%+ |
| Search CTR | 4%+ |
| D2C reviews collected | 10+ |
| Email + WhatsApp list | 200+ |
