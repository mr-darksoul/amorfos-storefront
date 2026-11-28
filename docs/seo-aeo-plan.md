# Organic SEO & AEO plan — amorfos.in

_Written 2026-11-28. Covers what shipped in code and what only Manav can do off-site._

**Goal:** rank on page 1 for the commercial terms people in India actually type, which are
mostly per bead: "5 mukhi rudraksha", "7 mukhi rudraksha price", "gauri shankar rudraksha
original", "original rudraksha online". We also want ChatGPT, Perplexity, Gemini and Google AI
Overviews to name Amorfos when someone asks "where to buy original rudraksha in India".

## What the audit found (before this change)

| Problem | Effect |
|---|---|
| Sitemap listed 187 product URLs from the static `products.ts`. Only 49 are live, and **131 returned 404**. | Google spent crawl budget on dead pages and flagged the sitemap as low quality. |
| 7 deleted products still returned 200, using stale static data. | Old prices and names stayed indexable, with no links to them from the site. |
| No page targeted a specific Mukhi. | Most of the search demand had no page that could rank for it. |
| No Organization / WebSite schema. The homepage had no JSON-LD at all. | Google and AI assistants had no single brand entity to tie to (sameAs, contact, address). |
| Homepage `<title>`/H1 had no search terms in them ("The bead that steadies you"). | The homepage didn't rank for "buy original rudraksha online". |
| Root layout set `canonical: "/"`, so any page without its own canonical inherited it. | Checkout, track and review pages told Google they were copies of the homepage. |
| `llms-full.txt` was hand-written and stale: 181 products, 5 Mukhi at ₹350, top price ₹16,950. | AI assistants were reading wrong prices and a wrong catalogue. |
| Product schema said returns were free (`FreeReturn`). Merchant Center says the customer pays. | Structured data contradicted Merchant Center. |
| The Loose Beads collection has 0 live products, yet was indexable. | Thin / soft-404 page. |

## What shipped (code)

- **16 Mukhi landing pages** at `/collections/<n>-mukhi-rudraksha` (1–14, `gauri-shankar-rudraksha`,
  `ganesh-rudraksha`). The data lives in `lib/mukhiCollections.ts`. Each page has a unique intro,
  a fact table (deity and planet from `MUKHI_META`), live products, combinations that include that
  bead, and a FAQ with **live price ranges**. They emit CollectionPage + ItemList + FAQPage +
  BreadcrumbList JSON-LD and link to their Journal guide. Journal guides now link back to them.
- **Internal links:** the homepage has a "Shop by Mukhi" section, `/collections` has a Mukhi grid,
  the footer links 5 Mukhi, 7 Mukhi and Gauri Shankar, every product page links its Mukhi page
  (breadcrumb, spec table and "See every…" link), and every collection page links all its sibling pages.
- **Retired product URLs** (in `products.ts` but no longer live) **308 to their Mukhi page**, or to
  their form collection if they have no Mukhi page, instead of 404ing. This recovers the old
  indexed and linked URLs.
- **Sitemap** is built from the live catalogue (102 URLs), with image entries and real article
  `lastmod`. It revalidates hourly and leaves out empty collections.
- **Site-wide entity graph** (in `layout.tsx`): Organization + OnlineStore (logo, founder, address,
  contact, sameAs Instagram, return policy) and WebSite. Products, articles and collections
  reference it by `@id`.
- **Homepage:** title "Buy Original Rudraksha Online — Lab Certified | Amorfos", a keyword H1
  (the brand line is unchanged visually), and 6 answer-first FAQs with FAQPage JSON-LD. The
  price answer is computed from live data.
- **Product pages:** clean titles ("5 Mukhi Nepali Rudraksha Pendant — Lab Certified") and better
  descriptions (price + policies). Product schema gains sku, additionalProperty (mukhi, origin,
  deity, planet), itemCondition, an image fallback and the correct return fees. Each page has a
  visible 4-question FAQ plus FAQPage JSON-LD.
- **Journal:** Article schema now has datePublished/dateModified, an image fallback and an
  organization @id. Articles show a visible "Updated" date.
- **Noindex** on `/checkout`, `/track` and `/reviews/[token]`, and on empty collections. No
  layout-level canonical any more.
- **robots.txt** explicitly allows the AI search crawlers (OAI-SearchBot, PerplexityBot,
  ClaudeBot, Google-Extended …) and blocks private paths.
- **`/llms.txt` and `/llms-full.txt` are generated** from live data (`lib/llmsText.ts`):
  catalogue, per-Mukhi prices, every product, FAQs and Journal index. They can't go stale.

## Manav's checklist (off-site — needs your accounts)

**This week, right after deploy**
1. **Search Console** → Sitemaps → resubmit `https://amorfos.in/sitemap.xml`. Then use URL
   Inspection → *Request indexing* on the homepage and the 5, 7, 6, 9 Mukhi and Gauri Shankar
   pages (the limit is about 10 a day; do the rest over the next days).
2. **Bing Webmaster Tools** (bing.com/webmasters) → *Import from Google Search Console*. It takes
   one click. Bing's index powers ChatGPT search and Copilot, so this matters for AEO.
3. **Google Business Profile** for Amorfos at Rohini Sector-1. If there's no walk-in shop, set it
   up as a service-area business covering India. Category: "Religious goods store". Add the logo,
   product photos, WhatsApp and the website. This is how you show up for "rudraksha shop in delhi"
   and in the map pack.

**Within the month**
4. **Get 5–10 real reviews** on the top sellers (5, 7, 6 Mukhi). Amazon reviews are hidden, so no
   product shows rating stars in Google today. The post-purchase review link already goes out with
   every order; a WhatsApp nudge after delivery would raise the response rate.
5. **Photograph the 8 live products that have no image.** Products without images can't show image
   results, and the schema falls back to the OG card.
6. **Fix the Kaal Sarp combo data.** Its slug says Nepal, its data says Indonesia (see the parked
   slug plan). Also say who pays return shipping on `/policies`, to match Merchant Center and the schema.
7. **Restock or retire Loose Beads.** The page is noindexed while it's empty.

**Ongoing: links and mentions (what moves rankings once on-page is fixed)**
8. Answer Rudraksha questions on **Quora / Reddit (r/hinduism, r/india)** with a genuinely useful
   answer and one link to the relevant Mukhi page or Journal guide. AI assistants weight these
   threads heavily.
9. **Instagram bio** → amorfos.in. Add **Pinterest** pins of product photos linking to the Mukhi
   pages, and **YouTube Shorts** on "how to identify original Rudraksha".
10. **Astrologer / pandit partnerships:** a link from their site or their "recommended stores" page
    is the most relevant backlink there is.
11. **Journal:** there is no 8 Mukhi guide yet (its page links to the Kaal Sarp article for now).
    Add commercial-intent pieces: "Rudraksha price list 2027", "Best Rudraksha for business",
    "Rudraksha for Sade Sati", "Which Rudraksha for students". Keep publishing 2 a week from the
    content calendar.

## How to measure

In Search Console → Performance, filter the query to `mukhi` and compare 28 days against the
previous 28, every 2 weeks. Expect new pages to start getting impressions in 2–4 weeks and
positions to settle in 2–3 months. Also check Pages → "Not found (404)": it should drain as
Google recrawls the old URLs and follows the 308s.
