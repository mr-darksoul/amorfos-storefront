# Amorfos — Automated Content Marketing Strategy

_The Journal: an owned, SEO-first editorial engine that turns Rudraksha research
demand into organic traffic and product discovery._

Last updated: 2026-06-28 · Owner: Manav Bansal · Channel scope: **SEO blog/journal only**

> **2026-06-28 — SEO audit refresh.** The seed calendar was expanded from 8 to
> **30 entries** (`scripts/content-calendar.json`): the full **1→14 Mukhi** pillar
> set plus Gauri Shankar & Ganesh, the four cluster pillars, and a new
> **"Which Rudraksha by Rashi"** selection guide — the keywords surfaced in the
> audit as winnable long-tail for a new, low-authority domain. The on-page and
> technical recommendations from the same audit (product `<title>`/H1 length,
> missing product images, site-wide `Organization`/`WebSite` schema, default
> social image) are **out of scope for this doc** — they are tracked as a
> separate storefront workstream.

---

## 1. Why this exists

Amorfos (amorfos.in) already ranks its product and collection pages, but it has
**no top-of-funnel content**. Rudraksha is one of the most research-heavy spiritual
purchases in India — buyers ask *"which mukhi should I wear?"*, *"how do I know my
Rudraksha is real?"*, *"what is the Kaal Sarp Dosh remedy?"* long before they buy.
Today that demand flows to astrology blogs, YouTube and marketplaces — not to us.

The **Journal** captures that demand on our own domain. Each article:

1. Answers a real search query (informational / commercial-investigation intent).
2. Builds **topical authority** — a dense, interlinked corpus on Rudraksha lifts
   the ranking of the whole domain, including product pages.
3. **Funnels** readers into the right `/collections/*` and `/shop/*` page via
   contextual internal links.

This is a compounding, owned asset: unlike ads, traffic does not stop when spend
stops.

## 2. Goals & KPIs

| Metric | Source | Baseline (Jun 2026) | 6-month target |
|---|---|---|---|
| Indexed Journal articles | Google Search Console (GSC) | 0 | 30+ |
| Organic impressions (Journal) | GSC | ~0 | growing MoM |
| Organic clicks (Journal) | GSC | ~0 | 1,000+/mo |
| Article → product/collection CTR | (needs analytics — see §8) | n/a | ≥ 8% |
| Assisted conversions from Journal | (needs analytics) | n/a | track once live |

KPIs are reviewed monthly. The leading indicator in the first 90 days is **indexed
article count + impressions** (rankings take time); clicks and assisted revenue are
lagging indicators.

## 3. Audience & search-intent map

| Intent | Example queries | Article angle | Funnel target |
|---|---|---|---|
| Informational | "5 mukhi rudraksha benefits", "[N] mukhi rudraksha", "rudraksha meaning" | Mukhi guides (1→14 + Gauri Shankar/Ganesh), explainers | Soft → collection |
| Informational / selection | "which rudraksha to wear by rashi", "which mukhi for me" | Rashi selection guide + Mukhi pillar | Soft → collection |
| Commercial-investigation | "original vs fake rudraksha", "best rudraksha for studies", "nepali vs indonesian rudraksha" | Buying guides, comparisons | Strong → product/collection |
| Transactional | "buy 5 mukhi rudraksha" | (already served by product/collection pages) | Direct |
| Navigational / brand | "amorfos rudraksha", "lab certified rudraksha" | About, certification explainer | Brand trust |

> **Why long-tail first (audit, 2026-06-28):** head terms ("rudraksha mala", "buy
> rudraksha online") are dominated by Rudra Centre (rudraksha-ratna.com, ~500K
> visits/mo) and Rudralife — out of reach for a new domain in year one. Per-Mukhi,
> question, and Rashi queries are the **winnable** entry points, and each maps
> cleanly to existing inventory.

The Journal owns **informational + commercial-investigation**; product and
collection pages own **transactional**. Articles must never cannibalise a
collection page — they target the *question*, then link to the *product*.

## 4. Topic clusters (pillar → spokes)

Each cluster has one **pillar** (broad, evergreen) and many **spokes** (specific),
all interlinked, every spoke linking to its matching collection/product.

### Cluster 1 — Mukhi guides _(pillar: "Rudraksha Mukhi: a complete guide")_
One spoke per face. Each covers the traditional ruling deity & planet, who
traditionally wears it (per astrologer/pandit recommendation), bead origin notes,
and links to that mukhi's products. **The full 1→14 spoke set is now seeded** in
the calendar (plus Gauri Shankar and Ganesh), so the pillar can interlink a
complete corpus rather than a partial one.
- 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 Mukhi
- Gauri Shankar, Ganesh Rudraksha
- **"Which Rudraksha to wear by Rashi"** — a selection guide that maps mukhi →
  planet → zodiac in tradition, funnelling "which mukhi for me?" demand into the
  spokes. Framed strictly as tradition; selection follows astrologer/pandit advice.
- → links to `/collections/rudraksha-pendant`, `/collections/loose-rudraksha-beads`
  and specific beads (e.g. `/shop/5-mukhi-nepal`, `/shop/7-mukhi-nepal`).

### Cluster 2 — Buying & authenticity _(pillar: "How to buy an authentic Rudraksha")_
- "How to identify an original Rudraksha"
- "What 'Lab Certified' means for a Rudraksha" (brand-defining)
- "Nepal vs Indonesia origin Rudraksha — what's the difference?"
- → links to `/about`, `/policies#authenticity`, all collections.

### Cluster 3 — Care & use _(pillar: "How to wear and care for your Rudraksha")_
- "How to wear a Rudraksha — traditional guidance"
- "How to clean and care for Rudraksha beads"
- "When and how a Rudraksha is energised (per pandit recommendation)"
- → links to malas & pendants collections.

### Cluster 4 — Remedies & combinations _(pillar: "Rudraksha combinations explained")_
Framed strictly as **tradition**, with no medical/miraculous claims.
- "The Kaal Sarp Dosh combination (8, 9, 10 Mukhi) explained"
- "Study Success Rudraksha set — the tradition behind it"
- → links to `/collections/rudraksha-combination`,
  `/shop/certified-kaal-sarp-dosh-nivarak-rudraksha-combination-of-8-mukhi-nepal`.

### Cluster 5 — Mala & japa _(pillar: "The Rudraksha mala")_
- "Why a Rudraksha mala has 108 + 1 beads"
- "How to do japa with a Rudraksha mala"
- → links to `/collections/rudraksha-mala`.

## 5. Cadence & 15-week launch calendar

**Cadence: 2 articles / week** (drafted automatically, published after approval).
The seeded calendar lives in `scripts/content-calendar.json` (**30 entries** as of
2026-06-28); this table is the human-readable mirror and should be kept in parity
with the JSON. At the daily Vercel Cron rate (1 draft/day) this is ~30 days of
runway — top it up before it runs dry.

| Wk | Article | Target keyword | Cluster | Key internal links |
|----|---------|----------------|---------|--------------------|
| 1 | What "Lab Certified" Rudraksha really means | lab certified rudraksha | Authenticity | /about, /policies#authenticity |
| 1 | 5 Mukhi Rudraksha: meaning, deity & who wears it | 5 mukhi rudraksha | Mukhi | /shop/5-mukhi-nepal |
| 2 | How to identify an original Rudraksha | original rudraksha identify | Authenticity | all collections |
| 2 | 7 Mukhi Rudraksha: the Lakshmi bead | 7 mukhi rudraksha | Mukhi | /shop/7-mukhi-nepal |
| 3 | Nepal vs Indonesia Rudraksha — the difference | nepali vs indonesian rudraksha | Authenticity | /collections/rudraksha-pendant |
| 3 | Why a Rudraksha mala has 108 + 1 beads | 108 beads mala | Mala & japa | /collections/rudraksha-mala |
| 4 | The Kaal Sarp Dosh combination explained | kaal sarp dosh rudraksha | Remedies | /collections/rudraksha-combination |
| 4 | 1 Mukhi Rudraksha: the rarest bead | 1 mukhi rudraksha | Mukhi | /collections/loose-rudraksha-beads |
| 5 | How to wear a Rudraksha — traditional guidance | how to wear rudraksha | Care | /collections/rudraksha-pendant |
| 5 | 9 Mukhi Rudraksha: meaning & tradition | 9 mukhi rudraksha | Mukhi | /shop/9-mukhi-nepal |
| 6 | How to clean and care for Rudraksha | rudraksha care cleaning | Care | /collections/rudraksha-mala |
| 6 | Gauri Shankar Rudraksha explained | gauri shankar rudraksha | Mukhi | /shop/lab-certified-gauri-shankar-rudraksha-pendant-nepal |
| 7 | How to do japa with a mala | rudraksha japa mala | Mala & japa | /collections/rudraksha-mala |
| 7 | 10 Mukhi Rudraksha: meaning & tradition | 10 mukhi rudraksha | Mukhi | /shop/10-mukhi-nepal |
| 8 | Rudraksha Mukhi: the complete guide (pillar) | rudraksha mukhi guide | Mukhi | every mukhi spoke |
| 8 | 11 Mukhi Rudraksha: meaning & tradition | 11 mukhi rudraksha | Mukhi | /shop/11-mukhi-nepal |
| 9 | How to buy an authentic Rudraksha (pillar) | buy authentic rudraksha | Authenticity | all cluster-2 spokes |
| 9 | 12 Mukhi Rudraksha: the Surya bead | 12 mukhi rudraksha | Mukhi | /shop/12-mukhi-nepal |
| 10 | When a Rudraksha is energised | rudraksha energising | Care | /collections/rudraksha-pendant |
| 10 | 14 Mukhi Rudraksha: meaning & tradition | 14 mukhi rudraksha | Mukhi | /shop/14-mukhi-indonesia |
| 11 | Study Success Rudraksha set | study success rudraksha | Remedies | /shop/study-success-pendant-of-4-nepal |
| 11 | 3 Mukhi Rudraksha: meaning & tradition | 3 mukhi rudraksha | Mukhi | /shop/3-mukhi-nepal |
| 12 | Rudraksha combinations explained (pillar) | rudraksha combinations | Remedies | /collections/rudraksha-combination |
| 12 | 8 Mukhi Rudraksha: the Ganesha bead | 8 mukhi rudraksha | Mukhi | /shop/8-mukhi-nepal |
| 13 | Which Rudraksha to wear by Rashi | which rudraksha to wear by rashi | Mukhi | /collections/rudraksha-pendant |
| 13 | 6 Mukhi Rudraksha: meaning & tradition | 6 mukhi rudraksha | Mukhi | /shop/6-mukhi-nepal |
| 14 | 4 Mukhi Rudraksha: meaning & tradition | 4 mukhi rudraksha | Mukhi | /shop/4-mukhi-nepal |
| 14 | 2 Mukhi Rudraksha: the Ardhanarishwara bead | 2 mukhi rudraksha | Mukhi | /shop/2-mukhi-nepal |
| 15 | 13 Mukhi Rudraksha: the Indra bead | 13 mukhi rudraksha | Mukhi | /shop/13-mukhi-nepal |
| 15 | Ganesh Rudraksha explained | ganesh rudraksha | Mukhi | /shop/lab-certified-ganesh-rudraksha-pendant-nepal |

_Weeks 13–15 (the rows above) were added in the 2026-06-28 audit refresh to
complete the 1→14 Mukhi set and add the Rashi selection guide._

> Validate the exact keyword/title with `WebSearch` before each batch if you want
> to refine — the calendar is a living file.

## 6. Copy & compliance rules (non-negotiable)

Carried verbatim from `CLAUDE.md`. Every draft is checked against these by the
generator's banned-phrase filter **and** by Manav before publishing:

- Say **"Lab Certified" only** — never name a specific lab.
- **No medical or miraculous claims.** No "cures", "heals", "guarantees",
  "miracle", "magic", "scientifically proven". Frame benefits as
  **"traditionally worn on the recommendation of astrologers and pandits."**
- 7-day returns on unused, sealed products. Free shipping above ₹999.
- Voice: premium, spiritual, distinctly Indian but restrained (Nicobar / Forest
  Essentials). Calm, knowledgeable, never hypey.

## 7. Automated workflow

```
                 weekly (scheduled Claude Code routine)
                              │
                              ▼
        scripts/generate-articles.ts  ──reads──►  scripts/content-calendar.json
                              │
                  generates on-brand article objects
                  (embeds §6 rules + Article schema)
                              │
                  banned-phrase + schema validation
                              │ (passes)
                              ▼
        Supabase  articles  (status = 'draft') ──notify──► Manav (WhatsApp/email)
                              │
                              ▼
        /admin/journal  ──review / edit──►  Publish  (status = 'published')
                              │
                              ▼
   live: /journal + /journal/<slug>  +  sitemap  +  internal links  +  JSON-LD
```

Human approval is the gate: nothing reaches the public site without Manav clicking
**Publish**. Off-brand or non-compliant drafts are caught twice (filter + review).

## 8. Measurement

- **Primary:** Google Search Console — submit the sitemap, track indexed pages,
  impressions, clicks, and average position per article. Filter by `/journal/`.
- **Gap / prerequisite:** the storefront has **no analytics pixel** today, so
  on-site funnel metrics (article → product CTR, assisted conversions) cannot be
  measured yet. **Recommended next step:** add a lightweight, privacy-friendly
  analytics tag (e.g. Plausible/GA4) before judging conversion impact. Until then,
  GSC + Razorpay revenue trend are the proxies.
- Review cadence: monthly KPI check; quarterly cluster/calendar refresh.

## 9. Roadmap beyond v1 (deferred, not built)

These were intentionally out of scope for the first build (Manav chose SEO blog
only). Logical next channels, reusing the same draft→approve queue:

1. **Email** — repurpose published articles into a monthly newsletter to the
   Supabase `subscribers` list (GoDaddy SMTP already wired in `lib/notify.ts`).
   The lead-magnet form is **double opt-in**, so only mail rows with
   `confirmed = true` — `confirmed = false` rows are unverified signups (and the
   prune-able fake-signup spam the opt-in exists to filter out).
2. **WhatsApp broadcast** — short article teasers to opted-in customers.
3. **Social** — auto-generated captions + image briefs for Instagram/FB.
4. **Fully hands-off drafting** — Vercel Cron → API route calling the Claude API
   directly (vs. the current scheduled Claude Code routine).
