# Amorfos — Meta Ads Launch Plan (v1, 22 Nov 2026)

> Companion to [`brand.md`](./brand.md), [`messaging-pillars.md`](./messaging-pillars.md)
> and [`tone-of-voice.md`](./tone-of-voice.md). Every ad must pass `brand.md` §10
> before it runs.

---

## 0. Where we're starting (honest baseline)

- **Real sales to date: 2:** ₹678 (5 Mukhi, 30 Jun) and ₹678 (5 Mukhi, 16 Nov). The other
  "paid" orders were ₹88 launch tests.
- **The 16 Nov sale was paid but stuck as "pending".** An order only becomes "paid" when the
  shopper's browser reports back after Razorpay. If the tab is closed or reloaded (common
  with UPI apps on phones), nothing after payment runs: no Shiprocket booking, no
  confirmation email, no Meta purchase event. Manav shipped it by hand. **Fix before
  launch** (Razorpay webhook, §10).
- **Possibly abandoned:** ₹2,499 (Samriddhi, 18 Oct). Check in the Razorpay dashboard
  whether it was actually paid. Its reminder email failed while the care@ mailbox was down.
- **Tracking is live (21 Nov):** GA4 · Meta Pixel · Conversions API (Purchase, server-side).
  Dataset "Amorfos Website" `1119030484346090`, category **Religion** → Core setup on.
- **Ad-ready catalogue:** all 27 pendants and 12 combinations have photos; malas mostly don't.
- **Prepaid only** (no COD). Free shipping above ₹999, else ₹79.

The site has had almost no traffic, so this campaign's first job is to **find out
what converts**, then scale it.

---

## 1. Campaign overview

- **Name:** *Certified. Sealed. Sent with care.* (internal: `AMF-LAUNCH-01`)
- **Summary:** Put certified Rudraksha in front of Indian buyers on Instagram and Facebook,
  let Meta optimise for purchases, and give hesitant buyers a real person on WhatsApp.
- **Primary objective:** **25 paid orders in the first 6 weeks** of ads, with cost per
  order trending **at or below break-even** (see §8) by weeks 5–6.
- **Secondary objectives:**
  - Learn which products and creatives sell (data for scaling and for Google later).
  - 150+ WhatsApp conversations, with at least 10% turning into orders.
  - First genuine on-site reviews from ad-driven buyers (post-purchase review emails).

**Timeline:** prep week 23–29 Nov → **launch Mon 30 Nov** → run to Sun 10 Jan →
Mahashivratri push in February (early March 2027 — confirm exact date).

---

## 2. Target audience

**Primary — "The Devout Researcher"** (`brand.md` §2): Indian adults ~28–55, tier-1/2
cities, buying for self or family, cautious about fakes. Pain points: *"Is this real?"*,
confusion over mukhi/origin/price, distrust of marketplace listings for something sacred.

**Secondary — "The Remedy-Seeker":** told by an astrologer/pandit to wear a specific mukhi
or combination. Needs the *right* certified bead, fast. Highest intent; most likely to
message on WhatsApp first.

**Seasonal — "The Gifter":** wedding season (Nov–Feb), New Year, **board exams (Feb–Mar)**
— parents buying the Study Success pendant.

**Targeting approach:** let Meta find buyers (Advantage+ audience), India only, age 25+.
Do **not** try to target by religion or "Hinduism" interests: Meta has removed those
options, and the Religion category limits website-visitor retargeting anyway. The
creative does the targeting.

---

## 3. Key messages

**Core message:** *Lab Certified Rudraksha, hand-selected and sent sealed — with a real
person to help you choose.*

| Supporting message | Pillar | Proof point |
|---|---|---|
| Authenticity is documented, not claimed | 1 Certified | Certificate ships with every bead; combos certified per bead |
| Chosen bead by bead, from Nepal and Indonesia | 2 Hand-selected | Origin on every listing; hand-finished silver, red thread |
| Each mukhi carries a ruling deity and planet | 3 Tradition | Mukhi → deity/planet table; "worn on the recommendation of astrologers and pandits" |
| The same care we gave thousands of customers, now direct | 5 Earned trust | Amazon/Flipkart history; 7-day returns (unused, sealed); free shipping >₹999 |

### Meta policy rules (on top of `brand.md` §8)
- **No personal-attribute phrasing.** Never imply you know the viewer's religion, beliefs
  or problems: 🚫 *"Are you a Shiva devotee?"* · 🚫 *"Struggling with stress?"* ·
  ✅ *"Each mukhi carries a ruling deity and planet."*
- **No health outcomes or "before/after".** Keep these out of ads entirely: *Arogya Health
  Immunity*, *Pain Reliever / Dard Nivarak*, *Hriday Raksha*, *Fitness* combinations.
- **No guarantees, no fake urgency** (also brand rules).

---

## 4. Channel strategy

| Campaign | What it does | Budget (of ₹750/day start) | Effort |
|---|---|---|---|
| **A. Sales — Advantage+** | Sends shoppers to product pages; Meta optimises for **Purchase** | **₹550/day (~73%)** | Medium |
| **B. Click-to-WhatsApp** | "Not sure which mukhi? Ask us." Opens a WhatsApp chat | **₹200/day (~27%)** | Medium–High (replies) |
| Organic Instagram/Facebook | Makes the profile credible when people tap through | — | Low–Medium |
| Existing WhatsApp contacts | One respectful broadcast to past buyers who opted in | — | Low |

### Campaign A — `AMF | Sales | Adv+ | Purchase`
- Objective **Sales** → Advantage+ sales campaign → website → dataset *Amorfos Website* →
  event **Purchase**. India, age min 25, Advantage+ placements, 7-day click / 1-day view.
- **Products to feature:**
  - Entry: **5, 6, 7 Mukhi pendants (₹599)**.
  - Order-value lift: **Mansik Shanti (₹1,499)**, **Study Success (₹1,499)**,
    **Confidence Booster (₹1,499)**, **Samriddhi (₹2,499)**, **Naya Aarambh (₹2,499)**.
  - The ₹1,499+ pieces clear the ₹999 free-shipping line, so lean on them.
- **URL parameters (for GA4):**
  `utm_source=facebook&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}`

### Campaign B — `AMF | WhatsApp | Which mukhi`
- Objective **Engagement** → conversion location **WhatsApp** → +91 83684 69332
  (WhatsApp Business app linked to the Facebook Page).
- **Greeting:** *"Namaste 🙏 Tell us what your astrologer or pandit recommended, or what
  you're looking for, and we'll help you choose the right certified bead."*
- **Quick replies** ready for: 5/6/7 mukhi links, combination links, certificate photo,
  shipping and returns policy.
- Label every chat in WhatsApp Business (*new*, *quoted*, *ordered*) so we can count
  chat → order.

---

## 5. Content calendar

| Week | Dates | Work | Channel | Owner / notes |
|---|---|---|---|---|
| 0 | 23–29 Nov | Ad account in Amorfos portfolio, payment method, Page + Instagram connected | Meta | Manav |
| 0 | 23–29 Nov | Verify amorfos.in domain in Business settings | Meta + site | Manav gets code → Claude adds it |
| 0 | 23–29 Nov | **Razorpay webhook** so paid orders complete even if the browser never reports back | Site + Razorpay | Claude builds; Manav creates webhook + secret in Razorpay |
| 0 | 23–29 Nov | **One real ₹599 test order** with your own card, then refund. Pay by UPI app on a phone to test that path | Site | Manav; Claude checks Pixel/CAPI/email/Shiprocket |
| 0 | 23–29 Nov | 9–12 Instagram posts so the profile looks alive | IG/FB organic | Manav |
| 0 | 23–29 Nov | WhatsApp Business: greeting, quick replies, labels | WhatsApp | Manav |
| 0 | 23–29 Nov | WhatsApp the 2 abandoned checkouts (one polite note each) | WhatsApp | Manav |
| 0 | 23–29 Nov | Produce launch creatives C1–C6 (§6) | Ads | Manav (phone video is fine) |
| 1 | 30 Nov–6 Dec | **Launch A + B.** No edits for 3–4 days (learning) | Ads | Manav |
| 2 | 7–13 Dec | First review (§7 rules). Pause losers, keep winners | Ads | Manav + Claude |
| 3 | 14–20 Dec | Creative refresh: 2 new ads from the winning concept | Ads | Manav |
| 4 | 21–27 Dec | New Year / gifting angle; raise budget if cost per order ≤ target | Ads | Manav |
| 5 | 28 Dec–3 Jan | Study Success push (board exams ahead); WhatsApp broadcast | Ads + WhatsApp | Manav |
| 6 | 4–10 Jan | Wrap-up review → v2 plan (scale, COD decision, Google Shopping) | — | Manav + Claude |
| Feb | Feb 2027 | Mahashivratri creatives + budget bump (confirm date) | Ads | Manav |

**Dependencies:** photos on featured products → creatives → ads. The test order must pass
before any spend. WhatsApp must be staffed before Campaign B goes live.

---

## 6. Content pieces needed

| # | Asset | Description | Priority |
|---|---|---|---|
| C1 | Image — "Authenticity is documented" | Bead + its certificate on white/ivory. Headline *"Lab Certified Rudraksha, sent sealed."* | Must |
| C2 | Carousel — "5 · 6 · 7 Mukhi from ₹599" | One card per mukhi: photo, ruling deity + planet, price | Must |
| C3 | Reel 15–20s — founder | You on camera: *"We sold thousands of beads on Amazon and Flipkart. Now we send them direct — certified and sealed."* | Must |
| C4 | Reel 10–15s — sealing/unboxing | Hands sealing the pouch, certificate, red thread. *"Certified. Sealed. Sent with care."* | Must |
| C5 | Image/carousel — combinations | Mansik Shanti, Study Success, Samriddhi, each with its bead composition | Must |
| C6 | Image — WhatsApp ad | *"Not sure which mukhi is right for you? Ask a real person."* | Must |
| C7 | Reel — bead close-up | Slow rotation showing the mukhi faces (proof the faces are natural) | Nice |
| C8 | Study Success exam-season ad | Parents' gifting angle; tradition framing only | Nice (wk 5) |
| — | 9–12 organic posts | Mukhi guides, certificate close-up, origin story, journal links | Must (wk 0) |

### Starter copy (brand-checked)

**C1 primary text:** *Every Amorfos bead is Lab Certified for authenticity and origin, and the
certificate travels with it. Hand-selected from Nepal and Indonesia, finished in silver,
strung on red thread. Free shipping above ₹999.*
Headline: *Lab Certified Rudraksha, sent sealed.* · CTA: **Shop now**

**C2 primary text:** *Each mukhi carries a ruling deity and planet, and a quiet purpose —
traditionally worn on the recommendation of astrologers and pandits. Certified, sealed,
from ₹599.* · CTA: **Shop now**

**C6 primary text:** *Choosing a Rudraksha shouldn't be guesswork. Tell us what your
astrologer or pandit recommended, and a real person will help you find the right
certified bead — usually the same day.* · CTA: **Send WhatsApp message**

---

## 7. Success metrics and decision rules

| Metric | Starting target (recalibrate after week 2) | Where |
|---|---|---|
| **Paid orders** (primary) | 25 in 6 weeks; ≥1/day by week 4 | Ads Manager + `/admin/orders` |
| **Cost per order** | ≤ break-even (§8) by weeks 5–6 | Ads Manager |
| Link click-through rate | ≥ 1% | Ads Manager |
| Cost per link click | ≤ ₹10–15 | Ads Manager |
| Add-to-cart rate | ≥ 5% of ad sessions | GA4 (utm_source=facebook) |
| Checkout → paid | ≥ 40% | GA4 funnel + admin orders |
| WhatsApp cost per chat | ≤ ₹30–50 | Ads Manager |
| WhatsApp chat → order | ≥ 10% | WhatsApp labels |
| Return on ad spend | ≥ 1.5× by week 6 | Ads Manager |

**Rules:**
1. **Don't touch new ads for 3–4 days.** Edits restart Meta's learning.
2. An ad that has spent ~₹1,500 with link CTR under 0.7% → pause it and replace with a new creative.
3. Lots of add-to-carts but few purchases → it's a checkout problem (shipping cost,
   prepaid-only, trust), not an ad problem. Bring the data to Claude.
4. Cost per order at or below target for 5+ days → raise budget by ≤20% every 3 days.
5. Refresh creative every 2–3 weeks, or sooner if frequency passes ~3.
6. **Weekly 15-minute review (Mondays):** share Ads Manager + GA4 screenshots and decide
   what to change together.

---

## 8. Budget

| Item | Weeks 1–2 | Weeks 3–6 (if on target) |
|---|---|---|
| Campaign A — Sales | ₹550/day | up to ₹750/day |
| Campaign B — WhatsApp | ₹200/day | ₹250/day |
| **Daily total** | **₹750** | **up to ₹1,000** |
| 6-week media estimate | ~₹31,500–38,000 | |
| Contingency (~10%) | ~₹3,500 for a winning ad or Mahashivratri | |
| Production | ₹0 — phone photos/reels + existing product shots | |

**Break-even cost per order** (fill in your real product cost):
`order value − product cost (bead + silver + packaging) − shipping cost − ~2% payment fee`.
On a ₹599 pendant, the margin is thin. That's why ads should push the ₹1,499+ combinations
and the free-shipping threshold. **Decision needed:** your product cost per item, so we can
set a real target.

---

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| **Paid orders stuck as "pending"** (browser never reports back after UPI) — no shipping, no email, and Meta never sees the sale, so ad optimisation goes blind | Razorpay webhook before launch; check Razorpay dashboard against `/admin/orders` weekly until proven |
| **Ads rejected** (health, personal attributes, religion) | Copy rules in §3; leave health-named combinations out; appeal with tradition framing if wrongly flagged |
| **Low trust** (new site, old Amazon reviews) | Lead with certificate + founder reel; ask every ad-driven buyer for a review; WhatsApp a real person |
| **Prepaid-only drop-off** | Watch checkout→paid; if under 40%, build Cash on Delivery with a minimum order value |
| **Budget too small for Meta's learning** (~50 purchases/week ideal) | One sales campaign, one audience, few ads — concentrate spend; judge on trends, not single days |
| **WhatsApp overload / slow replies** | Quick replies; reply within ~2 hours in daytime; pause Campaign B if you can't keep up |
| **Religion category limits retargeting** | Broad Advantage+ targeting; WhatsApp follow-up; email and cart reminders for warm buyers |

---

## 10. Next steps

**This week (prep):**
0. Claude: build the Razorpay webhook (paid orders complete server-side). Manav: add the
   webhook + secret in the Razorpay dashboard. **Must be done before any ad spend.**
1. Manav: set up the ad account, payment method, and connect Page + Instagram.
2. Manav: send Claude the domain-verification meta tag → Claude adds it to the site.
3. Manav: place one real ₹599 test order → Claude confirms Pixel, Conversions API, email
   and Shiprocket all fired → refund it.
4. Manav: WhatsApp Business set-up; message the 2 abandoned checkouts.
5. Manav: shoot C3 and C4 on phone; Claude can draft final copy and captions for C1–C8.

**Decisions:**
- Product cost per item (sets the break-even target).
- Start date (30 Nov proposed) and daily budget (₹750 proposed).
- Who answers WhatsApp, and when.
