# Amorfos — Google Ads Launch Plan (v1, 23 Nov 2026)

> Companion to [`meta-ads-launch-plan.md`](./meta-ads-launch-plan.md) (Meta is paused on an
> account issue) and [`brand.md`](./brand.md). Every ad must pass `brand.md` §8–10.

---

## 0. What's already in place

| Piece | Status |
|---|---|
| Google Ads account | `475-290-1970`, India / IST / INR, billing on, **no campaigns yet** |
| Purchase tracking | Conversion "Purchase - amorfos.in" (`AW-18589606865`), live on the site, real order value + payment ID. Enhanced conversions **on** since 22 Nov (hashed email + phone from the thank-you page; privacy policy updated) |
| GA4 | Linked to Google Ads (property 543504086) |
| Merchant Center | `5913999099`, site verified, India, shipping + returns set, feed of **37 products** (`/feeds/google.xml`, daily), linked to Google Ads |
| Free Shopping listings | Products in Google review (up to ~3 working days) |
| Offer | **Spend ₹20,000 by 21 Jan 2027 → ₹20,000 credit.** At ₹600/day from ~26 Nov, you pass ₹20,000 around 28 Dec |

---

## 1. Keyword research (Google Keyword Planner, India, last 12 months)

| Keyword | Searches / month | Top-of-page CPC | We sell | Use? |
|---|---|---|---|---|
| 5 mukhi rudraksha | 10K–100K | ₹5–20 | ₹599 pendant | **Yes — core** |
| 7 mukhi rudraksha | 10K–100K | ₹7–23 | ₹599 / ₹999 | **Yes — core** |
| 1 mukhi rudraksha | 10K–100K | ₹3–16 | ₹2,499 (India) | **Yes — high value** |
| gauri shankar rudraksha | 10K–100K | ₹5–26 | ₹4,499 / ₹9,999 | **Yes — high value** |
| rudraksha mala | 10K–100K | ₹4–16 | malas lack photos | **Later** (after mala photos) |
| 6 mukhi rudraksha | 1K–10K | ₹5–19 | ₹599 | Yes |
| 4 mukhi rudraksha | 1K–10K | ₹6–19 | ₹599 | Yes |
| 5 mukhi rudraksha price | 1K–10K | ₹2–10 | ₹599 | Yes (cheap clicks, price is our strength) |
| original rudraksha | 1K–10K | ₹4–17 | pendants | Yes |
| certified rudraksha | 1K–10K | ₹7–32 | pendants | Yes (our differentiator) |
| rudraksha pendant | 1K–10K | ₹6–27 | pendants | Yes |
| 2 / 3 mukhi rudraksha | 1K–10K each | ₹5–20 / ₹5–18 | ₹599 (India) | **Yes — added 22 Nov** ("2 mukhi rudraksha price" 1K–10K at ₹2–11; "do mukhi" 1K–10K) |
| 9 mukhi rudraksha | 1K–10K | ₹4–20 | ₹999 (Indonesia, free shipping) | **Yes — added 22 Nov** ("9 mukhi rudraksha price" up 900% YoY) |
| 8 / 10 mukhi rudraksha | 1K–10K each | ₹6–23 / ₹5–21 | ₹999 / ₹1,499 (Indonesia) | Next after week 1 (dearer clicks) |
| 11 / 12 / 13 / 14 mukhi rudraksha | 1K–10K each | ₹4–24 | ₹2,499–51,000 | Phase 2 (clicks above ₹15 cap) |
| nepali rudraksha | 1K–10K | ₹7–55 | yes | No for now (expensive clicks) |
| lab certified rudraksha | 100–1K | ₹4–19 | yes | Yes (exact match) |
| rudraksha pendant silver | 100–1K | ₹4–18 | yes | Yes |
| buy rudraksha online / rudraksha online | 100–1K | ₹8–38 | yes | Yes (watch cost) |
| rudraksha for students | 100–1K | ₹1–15 | Study Success ₹1,499 | Phase 2 (exam season) |
| kaal sarp dosh rudraksha | 10–100 | — | yes | No (too few searches) |

Planner shows ranges until the account has spent; we'll get exact numbers after week 1.

---

## 2. Campaign 1 — Search (start first)

**Name:** `AMF | Search | India` · **Budget:** ₹600/day · **Networks:** Google Search only
(untick Search Partners and Display) · **Locations:** India, *"Presence: people in or regularly in"*
· **Languages:** English, Hindi · **Bidding:** *Maximize clicks* with max CPC **₹15** (lowered to **₹10** on 24 Nov — clicks were all landing at ₹14–15) for the first
2 weeks → switch to *Maximize conversions* once there are ~15 purchases in 30 days.

### Ad groups (keywords in "phrase" and [exact] match)

| Ad group | Keywords | Landing page |
|---|---|---|
| 5 Mukhi | "5 mukhi rudraksha", [5 mukhi rudraksha original], "5 mukhi rudraksha pendant", "5 mukhi rudraksha price", "buy 5 mukhi rudraksha", "panchmukhi rudraksha", [panchmukhi rudraksha], "5 face rudraksha", "five mukhi rudraksha" | `/shop/5-mukhi-nepal` (₹599) |
| 7 Mukhi | "7 mukhi rudraksha", "7 mukhi rudraksha original", "7 mukhi rudraksha pendant", "7 face rudraksha", "seven mukhi rudraksha" | `/shop/7-mukhi-nepal` (₹999, free shipping) |
| 6 Mukhi | "6 mukhi rudraksha", "6 mukhi rudraksha pendant", "6 face rudraksha", "chhe mukhi rudraksha" | `/shop/6-mukhi-nepal` (₹599) |
| 4 Mukhi | "4 mukhi rudraksha", "4 mukhi rudraksha pendant", "chaturmukhi rudraksha", "4 face rudraksha" | `/shop/4-mukhi-nepal` (₹599) |
| 1 Mukhi | "1 mukhi rudraksha", "ek mukhi rudraksha", "1 face rudraksha", "one mukhi rudraksha" | `/shop/1-mukhi-india` (₹2,499) |
| Gauri Shankar | "gauri shankar rudraksha", "gauri shankar rudraksha pendant", "gauri shankar pendant", "gauri shankar rudraksha locket" | `/shop/lab-certified-gauri-shankar-rudraksha-pendant-nepal` (₹9,999) |
| Certified (trust) | [certified rudraksha], [lab certified rudraksha], "original rudraksha", "asli rudraksha", "real rudraksha", "rudraksha pendant", "rudraksha pendant silver", "buy rudraksha online", "rudraksha locket", "rudraksha locket silver", "original rudraksha locket", "rudraksha price" | `/collections/rudraksha-pendant` |
| 7 Mukhi Mala | "7 mukhi rudraksha mala", "7 mukhi mala", [rudraksha mala], "lakshmi mala rudraksha", "7 mukhi lakshmi mala" | `/shop/7-mukhi-nepal-2` (₹4,499, Indonesian beads) |
| 9 Mukhi Mala | "9 mukhi rudraksha mala", "9 mukhi mala" | `/shop/9-mukhi-nepal-2` (₹9,999) |
| 2 Mukhi | "2 mukhi rudraksha", [2 mukhi rudraksha original], "2 mukhi rudraksha pendant", "2 mukhi rudraksha price", "buy 2 mukhi rudraksha", "do mukhi rudraksha", "2 face rudraksha", "two mukhi rudraksha" | `/shop/2-mukhi-india` (₹599) |
| 3 Mukhi | "3 mukhi rudraksha", [3 mukhi rudraksha original], "3 mukhi rudraksha pendant", "3 mukhi rudraksha price", "buy 3 mukhi rudraksha", "teen mukhi rudraksha", "3 face rudraksha", "three mukhi rudraksha" | `/shop/3-mukhi-india` (₹599) |
| 9 Mukhi | "9 mukhi rudraksha", [9 mukhi rudraksha original], "9 mukhi rudraksha pendant", "9 mukhi rudraksha price", "buy 9 mukhi rudraksha", "nau mukhi rudraksha", "9 face rudraksha", "nine mukhi rudraksha" | `/shop/9-mukhi-indonesia` (₹999) |

**Built in Google Ads** as `AMF | Search | India` (ID 24528597072). **Went live 22 Nov 2026** (start
date moved up from 30 Nov, budget ₹600/day). 12 ad groups, 91 keywords and 88 negatives are in (reviewed and extended 22 Nov; 2, 3 and 9 Mukhi added the same day). Mala ads show the price up front so
shoppers looking for cheap japa malas skip them.

### Price-tier bidding (24 Nov 2026, assumes 50% margin until real costs are known)

Switched from *Maximize clicks* (₹15 → ₹10 cap) to **Manual CPC with a bid per ad group**.
Break-even CPC = price × 50% margin × 1.5% conversion rate; bids sit just under it.

| Price tier | Ad groups | Max CPC |
|---|---|---|
| ₹599 | 2, 3, 4, 5, 6 Mukhi, Certified (generic) | ~~₹5~~ **₹10** (25 Nov) |
| ₹999 | 7 Mukhi, 9 Mukhi | ~~₹7~~ **₹12** (25 Nov) |
| ₹1,499 | 10 Mukhi | ₹10 |
| ₹2,499 | 1 Mukhi, 11 Mukhi | ₹15 |
| ₹2,999 | 12 Mukhi, 13 Mukhi | ₹18 |
| ₹4,499 | 7 Mukhi Mala | ₹15 |
| ₹9,999 | 9 Mukhi Mala | ₹20 |
| ₹9,999 / ₹16,499 | Gauri Shankar, 14 Mukhi | ₹25 (Gauri Shankar ~~₹25~~ **₹15**, 25 Nov) |

New ad groups (24 Nov): 10–14 Mukhi → `/shop/{10..14}-mukhi-indonesia` (₹1,499 / ₹2,499 / ₹2,999 /
₹2,999 / ₹16,499); Certified now excludes 10–14 Mukhi names; each new group excludes "mala".
Google showed "Below first page bid" estimates of ₹39–121 right after the switch — watch impressions
for 24–48 h; if they collapse, raise the ₹599-tier bids or revert to Maximize clicks with a cap.
Recalculate all bids when Manav shares real unit costs (after the ₹2,400 test).

**25 Nov 2026 — ₹599 and ₹999 tiers raised (₹5 → ₹10, ₹7 → ₹12).** Over the first ~15 h of
first-party tracking (24 Nov 6 pm onward), the ₹5/₹7 groups got zero Search visits. The
Search budget all went to Gauri Shankar (₹25 bid, about half of Search visits), 14 Mukhi, 1 Mukhi,
12 Mukhi and the malas, with no add-to-carts out of 57 Google Ads visits. These bids sit **above**
the 50%-margin break-even (₹4.5 / ₹7.5): they buy learning data on the highest-demand searches, not
profit. Review on ~2 Dec: if a group has 30+ clicks and no add-to-cart, lower it or pause it.

**25 Nov 2026 — Gauri Shankar lowered ₹25 → ₹15.** The bid is under break-even (₹75 at ₹9,999), but this
group took ~30% of Search spend (₹262 of ₹872 by 24 Nov). Its 13 tracked visits all left after one page
(median ~18 s), probably because searchers expect a ₹2–5k bead. Next option if it still doesn't engage:
point the ad group at the ₹4,499 wooden Gauri Shankar instead of the ₹9,999 one.

### Negative keywords (campaign level)
`free, meaning, benefits, wikipedia, pdf, video, youtube, image, images, photo, wallpaper,
drawing, how to wear, how to identify, identify, test, real or fake, fake, side effects, rules,
mantra, tree, plant, seed, seeds, wholesale, bulk, manufacturer, supplier, job, jobs, course,
book, bracelet, amazon, flipkart, meesho, round` ("round" because people searching
"1 mukhi round" want a Nepal round bead, which we don't sell.)

**Ad-group negatives:** Certified gets every mukhi name it has a group for (1/ek, 2/do, 3/teen, 4/chaturmukhi, 5/panchmukhi/panch, 6, 7/saat, 9/nau), "gauri shankar" and "mala", so it only catches generic searches. Each single-bead group (1–7, 9, Gauri Shankar) has "mala" so mala searches go to the mala groups.

Review the **search terms report every Monday** and add new irrelevant terms here.

### Ad copy (Responsive Search Ads — Google checks lengths as you type)

**Shared headlines (≤30 characters):**
`Lab Certified Rudraksha` · `Sent Sealed With Certificate` · `Free Shipping Above ₹999` ·
`7-Day Returns on Sealed Items` · `Silver Capping, Red Thread` · `Thousands of Beads Sold` ·
`Ask Us on WhatsApp` · `Hand-Selected Beads`

**Per-group headlines (examples):**
- 5 Mukhi: `5 Mukhi Rudraksha Pendant` · `Certified 5 Mukhi Rudraksha` · `5 Mukhi Nepal Bead, ₹599`
- 7 Mukhi: `7 Mukhi Rudraksha Pendant` · `Certified 7 Mukhi Rudraksha` · `7 Mukhi Nepal, Free Shipping`
- 1 Mukhi: `1 Mukhi Rudraksha (India)` · `Certified 1 Mukhi Rudraksha`
- Gauri Shankar: `Gauri Shankar Rudraksha` · `Certified Gauri Shankar Bead`

**Descriptions (≤90 characters):**
1. `Every bead is Lab Certified and sent sealed with its certificate. Free shipping over ₹999.`
2. `Hand-selected Nepal bead in silver capping on red thread. Questions? Ask us on WhatsApp.`
3. `Traditionally worn on the advice of astrologers and pandits. 7-day returns if sealed.`
4. Per group, from the canonical table in `lib/mukhi.ts`, e.g. 5 Mukhi:
   `The 5 Mukhi is traditionally linked to Kalagni Rudra and Jupiter. Certified, from ₹599.`
   (7 Mukhi: Goddess Mahalakshmi + Saturn · 6: Kartikeya + Venus · 4: Brahma + Mercury ·
   1: Shiva + Sun · Gauri Shankar: Shiva, all planets.)

**Rules:** never name Amazon / Flipkart (trademark disapprovals), no exclamation marks in headlines (Google rejects them), no "miracle / cures /
guaranteed", no religion-targeted phrasing ("Are you a Shiva devotee?"), never name a lab.

### Assets (add at campaign level)
- **Sitelinks:** All Rudraksha Pendants · 5 Mukhi Pendant · 7 Mukhi Pendant · Gauri Shankar Pendant · How We Certify (`/policies#authenticity`). Combination Pendants was dropped because that page lists health-named products.
- **Callouts:** Lab Certified · Sent Sealed · Free Shipping Above ₹999 · 7-Day Returns · WhatsApp Support
- **Structured snippet (Types):** Pendants, Combination Pendants, Japa Malas, Gauri Shankar Beads
- **Images:** 3–5 product photos on white · **Business name:** Amorfos · **Logo:** `public/brand/logo-dark.png`

---

## 3. Campaign 2 — Shopping (after Merchant Center approves products)

**Status 23 Nov 2026:** feed fixed (5 product ids were over Merchant Center's 50-character limit;
long ids are now shortened with a hash in `feeds/google.xml`), all 37 products in Merchant Center
and under review. Campaign drafted in Google Ads but **not published**: Standard Shopping,
₹200/day, Manual CPC with ₹10 bid on "All Products", India (presence), Google Search only, AI Max
off. **Published 24 Nov 2026** on Manav's go-ahead after all 37 products were approved for Shopping ads (campaign ID 24535086396).
Merchant Center also says the account "isn't set up to show products in ads yet" — enable the
Shopping ads programme there before launch.

**Name:** `AMF | Shopping | All` · Standard Shopping (not Performance Max yet; it needs
conversion history) · **Budget:** ₹200/day, taken from Search if Search isn't spending its
budget · **Bidding:** Maximize clicks, max CPC ₹10 · all 37 feed products.
Shopping ads show the photo and price, so they suit ₹599 pendants well.

---

## 4. What good looks like (recalibrate after week 2)

| Metric | Target | Where |
|---|---|---|
| Purchases | ≥15 in the first 30 days | Google Ads → Conversions, `/admin/orders` |
| Cost per purchase | ≤ break-even (needs your product cost per item) | Google Ads |
| Search CTR | ≥4% | Google Ads |
| Average CPC | ₹6–15 | Google Ads |
| Conversion rate (click → order) | ≥1.5% | Google Ads |
| Return on ad spend | ≥1.5× by week 6 | Google Ads |

**Honest expectation:** at ₹600/day and ~₹12 per click that's ~50 clicks a day. At 1–2%
conversion, that's roughly 15–30 orders a month to start. The first two weeks are about learning
which searches buy, not profit.

### Weekly routine (Monday, 15 minutes)
1. Search terms report → add irrelevant terms as negatives.
2. Pause keywords that spent ₹1,000+ with no purchase.
3. Raise budget by ≤20% where cost per purchase is under target.
4. After ~15 purchases, switch bidding to Maximize conversions.

---

## 5. Next steps

1. **Claude (with your OK):** build Campaign 1 in Google Ads exactly as above and leave it
   **paused**, so you can review it before anything spends.
2. **You:** review, then switch it on (proposed start: as soon as you approve).
3. **After Merchant Center approval:** add the Shopping campaign.
4. **After week 1:** 8 and 10 Mukhi (Indonesian, ₹999 / ₹1,499) if budget allows. **Phase 2 (week 3+):** 11 / 12 / 13 / 14 Mukhi ad groups, Study Success for exam season,
   "rudraksha mala" once mala photos are in.
5. ~~Turn on enhanced conversions~~ — done 22 Nov 2026.
