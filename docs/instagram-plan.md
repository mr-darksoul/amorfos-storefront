# Amorfos — Instagram Plan (@amorfos.in)

_Created 23 Nov 2026 · Owner: Manav · Publishing: `/admin/instagram` (API, 7 PM IST daily run)_

> **In one line:** Instagram is the quiet, trustworthy front window for Amorfos. It
> proves the beads are real, teaches people how to choose one, and walks them to
> the journal and the shop. It is not a discount feed.

Read with: [`brand.md`](brand.md), [`tone-of-voice.md`](tone-of-voice.md),
[`messaging-pillars.md`](messaging-pillars.md),
[`meta-ads-launch-plan.md`](meta-ads-launch-plan.md).

---

## 1. What Instagram is for

| Job | Why it matters | Signal it's working |
|---|---|---|
| **Look credible when an ad sends someone here** | Meta and Google ad clicks tap through to the profile. An empty or loud grid kills trust. | Profile visits → link-in-bio clicks |
| **Teach, then link** | 28 published journal articles already answer what people search for. Instagram turns each one into a post that people save. | Saves, shares, `utm_source=instagram` sessions in GA4 |
| **Prove "real"** | Certificate, natural mukhi lines, sealed pouch. Proof beats promise (Pillar 1). | Comments asking "which one for me?", WhatsApp chats |
| **Start conversations** | The house has a real person to talk to (Pillar 4). DMs and comments lead to WhatsApp. | DMs, WhatsApp chats tagged "Instagram" |

**For the first 8 weeks:** the goal is a full, consistent grid and a **baseline**,
not follower counts. Set targets after week 4, once the numbers exist.

---

## 2. Links: how they actually work on Instagram, and our system

**The constraint:** links in captions and comments are **not clickable** for normal
accounts. Clickable links live in the **bio** (up to 5) and in **Story link
stickers**. A plan that says "link in the caption" quietly fails, so we use a
system built for that limit.

### 2a. The "From the feed" page: one bio link that maps every post
- The bio link points to **`amorfos.in/ig`**: a calm page on our own site that
  shows every published post as a tile (newest first). Each tile links to the
  journal article or product it talks about.
- Every post carries a **feed number** in its caption: _"No. 07 · Read the full guide
  at amorfos.in/ig"_. People tap the bio, find No. 07, and land on the exact page.
- Because it's our page, every click is a tracked session on amorfos.in. A Linktree
  click goes to someone else's site.
- **Built (24 Nov 2026).** Set the bio link to
  `amorfos.in/ig?utm_source=instagram&utm_medium=social&utm_campaign=bio`. In `/admin/instagram`, fill
  "Link" when queuing: the feed number and caption line are added for you.

### 2b. Auto first comment with the link
- When a post publishes, the publisher immediately adds a **first comment** from
  @amorfos.in: _"📖 The full guide → amorfos.in/journal/how-to-identify-original-rudraksha"_.
- It isn't clickable, but it's copyable, readable on every screen, and keeps the
  caption clean. **Built:** posted automatically on publish. For a post that's already
  live, use "Add link comment" in admin.

### 2c. Stories: the only clickable link inside the post experience
- **2–3 Stories a week**, posted by hand from the phone, each with a **link sticker** to
  that week's journal article or featured product. The API can't add stickers, so
  Stories stay manual.
- Re-share each new feed post to Stories with a link sticker to its article.

### 2d. Track everything
Every link we put out carries UTM tags so GA4 shows what Instagram actually drives:
```
?utm_source=instagram&utm_medium=social&utm_campaign=ig_<series>&utm_content=no<feed-number>
```
Example: `amorfos.in/journal/what-lab-certified-rudraksha-means?utm_source=instagram&utm_medium=social&utm_campaign=ig_isitreal&utm_content=no02`

### 2e. Later: comment a keyword, get the link by DM
"Comment **GUIDE** and we'll DM you the link" is the strongest link pattern on
Instagram today. Instagram's API supports it ("private replies"), but replying to
the public needs **Meta App Review** (Advanced Access to messaging and comments)
plus a webhook. It's Phase 3 (§9, item 6). Until then, reply to these comments
by hand from the app.

---

## 3. Six recurring series

Named, recurring series make the grid feel deliberate. They also make content
easy to produce: each one has a fixed format and a fixed source. Every series maps
to a messaging pillar and links to something we've already published.

| Series | Day | Format | Pillar | Feeds from |
|---|---|---|---|---|
| **Somvar Bead**: one mukhi each Monday (Shiva's day) | Mon | Real product photo + deity/planet card (carousel, 3 slides) | 3 Tradition | A mukhi journal article + that mukhi's product |
| **The Ritual**: wear, clean, japa, energising | Wed | Step-by-step carousel (5–7 slides) | 3 Tradition / 4 House | Care & mala articles |
| **Is It Real?**: authenticity, origin, certificate | Thu/Fri | Carousel or macro reel with **real photos only** | 1 Certified / 2 Hand-selected | Authenticity articles |
| **From the House**: sealing, packing, founder, Delhi | Fri/Sat | Phone reel 10–20 s | 4 House / 5 Earned trust | Product or `/about` |
| **Words from Wearers**: verified reviews | Every 2 weeks | Quote card (Pomelli) | 5 Earned trust | Approved reviews (mukhi page) |
| **Asked on WhatsApp**: real questions, anonymised | Every 2 weeks | Text card + short answer | 4 House | Whichever article answers it |

**Somvar Bead runs 16 weeks without new writing:** 1–14 Mukhi plus Gauri Shankar
and Ganesh all have published articles. Deity and planet **must** come from
`lib/mukhi.ts` (`MUKHI_META`), never from Pomelli or memory.

---

## 4. Rhythm

- **Launch fill (Mon 23 Nov – Fri 4 Dec): 1 post a day, 12 posts.** This gets the grid to
  the 9–12 posts the Meta ads plan needs before ads send people here. One a day is
  safe for a new account. Never post in bursts.
- **From 7 Dec: 4 feed posts a week** (Mon · Wed · Fri · Sun), plus 2–3 Stories
  and 1 reel inside those 4.
- **Time:** the daily run publishes at **7 PM IST**. Set each post's "publish on
  or after" date and the run picks it up that evening. It publishes **one** due
  post per run, so two posts dated the same day go out on consecutive evenings.
- **Grid rhythm:** alternate **photo → text card → photo** so the 3-column grid
  reads calm. Keep the warm-ivory family. Nothing neon, no stock "spiritual"
  clip-art.
- **Pin 3 posts:** No. 01 (who we are), No. 02 (what Lab Certified means), No. 05
  (the mukhi guide). These answer an ad visitor's three questions.
- **Highlights** (Stories saved to the profile): _Certified · Mukhi Guide · Care ·
  Wearers · Shipping & Returns_.

---

## 5. The first six weeks (post by post)

Links are relative to `amorfos.in`. Add UTMs (§2d) when queuing.
J = journal article, P = product.

### Launch fill: one a day
| No. | Date | Series | Post idea (hook) | Format | Link |
|---|---|---|---|---|---|
| 01 ✅ | Mon 23 Nov | Intro | _Certified. Sealed. Sent with care._ **Published** | Pomelli card | `/` |
| 02 | Tue 24 Nov | Is It Real? | _"Authentic" is a claim. "Lab Certified" is a document._ What the certificate tells you, why it ships with the bead, and why combinations are certified bead by bead. | Carousel 6 | J `what-lab-certified-rudraksha-means` |
| 03 | Wed 25 Nov | From the House | Hands seal the pouch, fold the certificate, tie the red thread. VO: _Certified. Sealed. Sent with care._ | **Reel 12 s** (phone) | P `5-mukhi-nepal` |
| 04 | Thu 26 Nov | Is It Real? | _The checks people swear by, and their honest limits_ (including why the water-float test proves nothing). Ends on: certification is the reliable answer. | Carousel 7 | J `how-to-identify-original-rudraksha` |
| 05 | Fri 27 Nov | Guide | _Find your face: 1 to 14 Mukhi, on one page._ Deity and planet for each (from `MUKHI_META`). The most-saved post format we can make. | Carousel 8 | J `rudraksha-mukhi-complete-guide` |
| 06 | Sat 28 Nov | From the House | Founder note: _We sent thousands of beads through Amazon and Flipkart. Now we send them ourselves._ Manav's photo, Delhi. | Photo + long caption | `/about` |
| 07 | Sun 29 Nov | The Ritual | _Why a mala has 108 + 1 beads_ (the guru bead you never cross). | Carousel 5 | J `why-rudraksha-mala-has-108-beads` → `/collections/rudraksha-mala` |
| 08 | Mon 30 Nov | **Somvar Bead 1** | **5 Mukhi**, the bead most people begin with. Real product photo, then the deity/planet card. | Carousel 3 | J `5-mukhi-rudraksha-meaning-deity` + P `5-mukhi-nepal` |
| 09 | Tue 1 Dec | Is It Real? | _Nepal or Indonesia? Same tree, different bead._ Two real beads side by side: size, face depth, price. | Photo carousel 4 | J `nepal-vs-indonesia-rudraksha` |
| 10 | Wed 2 Dec | The Ritual | _How to wear it, traditionally:_ the day, the thread, what to take off for. | Carousel 6 | J `how-to-wear-rudraksha-traditional-guidance` |
| 11 | Thu 3 Dec | Words from Wearers | A verified review in the customer's words, with the mukhi named. | Quote card | the reviewed product |
| 12 | Fri 4 Dec | From the House | _A gift that arrives with its certificate._ For the wedding season, without pushing: sealed pouch, certificate, red thread. | Pomelli lifestyle | `/collections/rudraksha-pendant` |

### Steady rhythm: four a week (Mon · Wed · Fri · Sun)
| No. | Date | Series | Post idea | Format | Link |
|---|---|---|---|---|---|
| 13 | Mon 7 Dec | Somvar Bead 2 | **7 Mukhi**, the Lakshmi bead | Carousel 3 | J `7-mukhi-rudraksha-lakshmi-bead` + P `7-mukhi-nepal` |
| 14 | Wed 9 Dec | The Ritual | _Caring for your bead:_ oil, water, storage, and what not to do | Carousel 6 | J `how-to-clean-care-rudraksha` |
| 15 | Fri 11 Dec | Is It Real? | **"Count the faces."** Macro reel turning one bead slowly. Ask _"How many mukhi?"_ and pin the answer in the comments with the link | **Reel 8 s** (phone, macro) | J `rudraksha-mukhi-complete-guide` |
| 16 | Sun 13 Dec | The Ritual | _How to do japa with a mala_ (start beside the guru bead, turn back, never cross it) | Carousel 6 | J `how-to-do-japa-rudraksha-mala` |
| 17 | Mon 14 Dec | Somvar Bead 3 | **Gauri Shankar**, the joined bead | Carousel 3 | J `gauri-shankar-rudraksha-explained` + P `lab-certified-gauri-shankar-rudraksha-pendant-nepal` |
| 18 | Wed 16 Dec | The Ritual | _When and how a Rudraksha is energised_ | Carousel 5 | J `when-rudraksha-is-energised` |
| 19 | Fri 18 Dec | Is It Real? | _Anatomy of a certificate:_ a real one, annotated (lab name blurred, per brand rule) | Photo carousel 4 | J `what-lab-certified-rudraksha-means` |
| 20 | Sun 20 Dec | Asked on WhatsApp | _"Can I wear two Rudraksha together?"_ | Text card | J `rudraksha-combinations-explained` (publish this draft first) |
| 21 | Mon 21 Dec | **Moment** | **The longest night falls on a Somvar.** Solstice night (21–22 Dec in India) on Shiva's day: _a night for turning inward._ Japa mala on linen, one diya. | Pomelli lifestyle | J `how-to-do-japa-rudraksha-mala` → `/collections/rudraksha-mala` |
| 22 | Wed 23 Dec | Interactive | **"Your rashi, your bead"**, part 1 (Mesh → Kanya). Ask people to comment their rashi and reply to each by hand with the guide | Carousel 7 | J `which-rudraksha-to-wear-by-rashi` |
| 23 | Fri 25 Dec | Interactive | **"Your rashi, your bead"**, part 2 (Tula → Meen) | Carousel 7 | J `which-rudraksha-to-wear-by-rashi` |
| 24 | Sun 27 Dec | From the House | _A year of sending beads home._ Thank-you note, packing table, real orders (no customer details) | Reel or photo | `/` |
| 25 | Mon 28 Dec | Somvar Bead 4 | **6 Mukhi**, Kartikeya | Carousel 3 | J `6-mukhi-rudraksha-meaning-tradition` + P `6-mukhi-nepal` |

---

## 6. The next three moments (plan ahead)

| Moment | Date (check a local panchang) | Natural bead | Plan |
|---|---|---|---|
| **Makar Sankranti** | Thu 14 Jan 2027 (some calendars: 15 Jan) | **12 Mukhi, the Surya bead.** The Sun enters Capricorn, so the fit is exact. | Somvar Bead that week = 12 Mukhi → J `12-mukhi-rudraksha-surya-bead`. Sunrise-gold card. |
| **Vasant Panchami** | Thu 11 Feb 2027 | **4 Mukhi** (Brahma, the knowledge bead) | Learning and study framing, tradition only → J `4-mukhi-rudraksha-meaning-tradition`. |
| **Maha Shivratri**, the biggest Rudraksha day of the year | **Sat 6 Mar 2027** (one listing says 7 Mar) | Every bead. The seed of Shiva. | **3-week run-up from 13 Feb:** _"21 nights to Shivratri"_ Stories series. Hero posts: 1 Mukhi (J `1-mukhi-rudraksha-rarest-bead`), Gauri Shankar, the japa mala. A founder reel on why the bead is called Shiva's tear. Line up ads and email (Meta and Google plans) on the same dates. Order cut-off post for delivery before the night. |

Every Monday is already Somvar. In Shravan (Jul–Aug 2027), Somvar Bead becomes
the centre of the month.

---

## 7. Making each post: the 30-minute weekly batch

**Every Sunday evening, for the coming week:**
1. **Claude drafts** the four captions and the carousel slide text from the linked
   journal articles, in house voice, with the feed number, link and hashtags. Manav
   reads and edits.
2. **Pomelli** (`labs.google.com/pomelli`, Business DNA already set up) makes the text
   cards, quote cards and lifestyle scenes. Feed 4:5. Attach the real product.
3. **Phone (Manav):** 1–2 short clips (sealing, macro bead turn, packing table).
   Natural window light, linen or ivory ground, no music with lyrics.
4. **Queue** each post at `/admin/instagram` with its date. The daily run publishes
   at 7 PM. Upload any image: it's converted to an Instagram-ready JPEG automatically.

### Pomelli copy check (it drifts, so check every card)
Pomelli has already written all of these. Fix or drop any card that says:
- **"pure silver", "sterling silver", "silver filigree"** → say **"finished in silver"**
  (our only silver claim).
- **"lab-certified"** in lowercase → **"Lab Certified"**.
- **"Verified Pure", "100% original", "guaranteed"** → drop the card.
- Any benefit as outcome (_brings wealth, cures, heals, protects_) → tradition
  framing only: _"traditionally worn for…", "associated with…"_
- A named lab → drop the card.
- Deity or planet that doesn't match `MUKHI_META` → fix from `lib/mukhi.ts`.

### Real vs AI imagery: a deliberate choice
Pomelli builds AI scenes around our real product photos (No. 01 is one). For a brand
whose whole promise is **"this is real"**, follow two rules:
- **Proof posts (Is It Real?, Somvar Bead slide 1, certificates) use real photos
  only.** Never an AI scene.
- AI lifestyle scenes are fine for mood, text cards and moments. **Decision for
  Manav:** label photorealistic AI scenes with Instagram's "AI info" tag. The API now
  supports this (`is_ai_generated`, §9 item 3). The tag fits "proof over promise",
  and Meta is moving toward requiring it anyway.

### Caption formula (from `tone-of-voice.md`)
```
<One calm, evocative line.>

<One useful fact: mukhi / deity / planet / origin / certification.>

<One sentence of tradition, framed as tradition.>

No. <NN> · <Read the full guide | See the bead> at amorfos.in/ig 🪔

<3–8 lowercase hashtags>
```
Add the house disclaimer whenever a post mentions what a bead is _worn for_:
_"Rudraksha is traditionally worn on the recommendation of astrologers and pandits.
We share tradition, not medical or miraculous claims."_

### Hashtag sets (rotate, never more than 8)
- **Core (always 2–3):** `#rudraksha #labcertified #amorfos`
- **Mukhi:** `#5mukhi #panchmukhi #nepalirudraksha #mukhirudraksha`
- **Mala & practice:** `#rudrakshamala #japamala #108beads #japa`
- **Authenticity:** `#originalrudraksha #certifiedrudraksha #nepalirudraksha`
- **Shiva (moments only):** `#mahashivratri #mahadev #harharmahadev`

### Things we don't post
- Health-named combinations (Arogya, Hriday Raksha, Fitness, Dard Nivarak) or the
  "Healing Mala" listing. Their names break our own copy rules.
- Kaal Sarp _Nivarak_ ("remover") framing. Talk about the combination's tradition
  only, or skip it.
- Discount-led posts, countdown timers, "limited stock!!" Promotions, if any, stay
  understated (`brand.md`).
- Before/after, testimonials about outcomes, or anything that reads as a promise.

---

## 8. Measuring (every Monday, 10 minutes)

| Look at | Where | Why |
|---|---|---|
| Reach, saves, shares per post | Instagram insights (app) | Saves = content worth keeping. Make more of what's saved. |
| Profile visits → bio link taps | Instagram insights | Is the grid converting ad and organic visitors? |
| Sessions and orders from `utm_source=instagram` | GA4 `G-N0ERELCSNH` | The only number that pays the bills. |
| DMs and WhatsApp chats that mention Instagram | WhatsApp | Conversation is the real conversion for a ₹2,000+ bead. |
| API posts in the last 24 h | `/admin/instagram` header | Stay well under the limit. We use 1 a day. |

After week 4, write down the baseline here and set targets for weeks 5–12.
Double down on the best two series; cut or rework the weakest.

---

## 9. What to build next (in order of value)

1. ~~**Links: `link_url` field, auto first comment, `/ig` "From the feed" page with
   UTMs.**~~ **Built 24 Nov 2026** (§2a, §2b).
2. **Journal → post drafts.** A button on each journal article ("Draft Instagram
   post") and an optional weekly run. Claude writes the caption and carousel slide
   text from the article and adds it to the queue as a **draft**, which never
   auto-publishes until Manav approves it. The 28 published articles become 28
   ready-to-review posts. Reuses the banned-phrase check and `MUKHI_META`.
3. **Alt text and the AI-info toggle** per post (both are API parameters).
   Accessibility, plus honest labelling (§7).
4. **Trial reels:** publish a reel to non-followers first (API `trial_params`).
   Ideal for founder and macro reels while the follower count is small.
5. **Weekly insights in admin:** reach, saves and profile visits per post, pulled
   through the API next to each queued post, so §8 takes 2 minutes.
6. **Phase 3: comment-keyword → DM link** (§2e). Needs Meta App Review (Advanced
   Access for messaging and comments), the app switched to Live, a webhook
   endpoint, and likely business verification of the Amorfos portfolio.
7. **Phase 3: product tags** (tap a bead in the photo, see the price). Needs a Meta
   catalogue from our existing Google feed (`/feeds/google.xml`) and Instagram
   Shopping approval.

---

## 10. Open decisions for Manav

- [ ] Set the bio link to **`amorfos.in/ig?utm_source=instagram&utm_medium=social&utm_campaign=bio`**
      in the Instagram app → Edit profile → Links.
- [ ] Label photorealistic AI scenes with "AI info"? (Recommended: yes.)
- [ ] Who shoots the phone clips, and when (one 20-minute session covers ~6 reels).
- [ ] Publish the `rudraksha-combinations-explained` draft before No. 20 links to it.
- [ ] Approve build item 2 (journal → post drafts).
