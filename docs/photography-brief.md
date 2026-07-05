# Amorfos — Photography Sourcing Brief

The single source of truth for every image on the storefront: **what to shoot or
generate, at what crop, and in what style.** Hand this to a photographer, or paste the
per-surface prompts into an AI image generator. Every spec here is locked to the exact
crop the live site renders, so on-brand imagery drops in without re-cropping.

Companion docs: `visual-identity.md` (full art direction), `globals.css` (design tokens,
the palette's source of truth), `../CLAUDE.md` (brand + copy rules).

---

## 1. Art-direction north star

Amorfos is **light, warm, airy and reverent** — premium spiritual minimalism in the
key of **Forest Essentials** and **Nicobar**. A dark theme was tried early and rejected.
Imagery should feel like a quiet, well-lit house, never a bazaar.

### Palette to keep *in frame* (exact hexes from `globals.css`)

| Role | Hex | Where it shows up in a photo |
|---|---|---|
| Paper / ivory | `#f6f1e7` | Backgrounds, cloth, paper, walls |
| Paper raised | `#efe7d5` | Secondary warm surfaces |
| Espresso ink | `#221b12` | Deep shadows, dark props |
| Antique gold | `#97712f` | Brass, warm metal, warm light |
| Rudraksha brown | `#7a4326` | The bead's own colour |
| — | real silver | Capping, findings (true, not blue-cold) |
| — | a touch of red | The thread only — a single accent, never loud |

### Mood
Warm **natural** light, soft directional shadows, calm and uncluttered, generous
negative space. Subtle film grain is on-brand. Reverent, not theatrical.

### Global negative list (applies to **every** shot — reproduced in each prompt below)
> no neon or harsh saturation, no cold blue/grey tones, no glowing auras, no lens
> flares, no fire or lightning, no incense-smoke drama, no stock "spirituality"
> clichés, no busy collage or bazaar clutter, no sale stickers or badges, no dark
> moody full-bleed, no heavy filters, no text.

### Two production modes

**A. Product-on-white (Amazon-style).** Full product centred on **pure white
`#FFFFFF`**, fit-to-image, even soft lighting, true colour. Show the silver capping,
the red thread, and — where relevant — the Lab Certificate. The site renders these with
`object-contain` on a `#FDFBF7`/white field, so the shot's background must be genuinely
white to blend seamlessly.

**B. Editorial / lifestyle.** Warm-lit scenes — hands in puja, a bead resting on cloth,
a quiet daily-wear moment. Palette in-frame (ivory, espresso, silver, a touch of red
thread). The site renders these with `object-cover`, so composition **must respect the
safe zones** noted per surface (text and dark chips overlay parts of the frame).

> **Certificate honesty rule:** the certificate is real and says **"Lab Certified"** —
> never fabricate a certificate graphic or name a specific lab. Photograph the real one.

---

## 2. Per-surface specs (the core)

Aspect ratios and `object-fit` are pulled directly from the components — deliver source
larger than the "shown" size so Next/Image can downscale and serve AVIF/WebP.

### Homepage hero — `src/app/page.tsx:83`
- **Mode:** Editorial / lifestyle · **Render:** `aspect-[4/5]` portrait, `object-cover`, shown ≈448×560
- **Source:** ≥ 1200 × 1500 px
- **Subject:** the signature bead/pendant in a warm, aspirational hero moment — on cloth or held, ivory surroundings.
- **Safe zone:** a **dark caption chip sits bottom-left** (spec + product name). Keep the bottom-left quadrant calm and uncluttered so white text reads.
- **Prompt:**
  > Editorial hero photograph of a single authentic Rudraksha pendant capped in real silver on a red thread, resting on soft warm-ivory linen, warm natural window light, soft shadows, calm and reverent, premium Indian minimalism in the style of Forest Essentials and Nicobar, subtle film grain, uncluttered composition with clear calm space in the lower-left, portrait 4:5. *(Then the global negative list.)*

### Editorial band "The seed of Shiva" — `src/app/page.tsx:150`
- **Mode:** Product-on-white · **Render:** tall panel (min-height 360→560px), `object-contain` on **white**
- **Source:** ≥ 1600 px on the long edge
- **Subject:** a **macro** of one bead in silver capping — hero-quality, showing the mukhi face lines and craftsmanship.
- **Safe zone:** none, but centre the bead; the panel is taller than wide, so vertical framing works best.
- **Prompt:**
  > Macro product photograph of a single authentic Rudraksha bead set in a fine silver cap on red thread, centred on a pure white background, crisp even studio lighting, true natural brown colour, sharp detail on the bead's grooved faces, no shadow clutter, Amazon-style clean product shot, fit-to-image. *(Global negative list.)*

### Category tiles ×4 — `src/app/page.tsx:196` (`catImage` map)
- **Mode:** Editorial / lifestyle (or clean product crop) · **Render:** `aspect-[3/4]`, `object-cover`
- **Source:** ≥ 1000 × 1333 px each
- **Four needed:** `pendant`, `mala`, `combination`, `loose`.
- **Safe zone:** a **dark gradient overlays the bottom third** (category title + blurb). Keep the bottom third simple/darker-toned; put the subject in the upper two-thirds.
- **Prompts (swap the subject line):**
  - **pendant:** a single silver-capped Rudraksha pendant
  - **mala:** a full Rudraksha mala coiled softly
  - **combination:** a small grouping of two–three complementary beads/pendants
  - **loose:** a few loose Rudraksha beads gathered
  > Warm editorial photograph of {subject} on warm-ivory cloth, soft natural light, calm reverent mood, premium Indian minimalism, palette of ivory espresso silver and a touch of red thread, subject in the upper two-thirds with calmer darker space toward the bottom, subtle film grain, portrait 3:4. *(Global negative list.)*

### Product cards — `src/components/ProductCard.tsx:31` & `:49`
- **Mode:** Product-on-white · **Render:** `aspect-square` on `#FDFBF7`, `object-contain`
- **Source:** ≥ 2000 × 2000 px square
- **Two images per product:** `[0]` front (hero angle), `[1]` back/side — the card **cross-fades to the second on hover**, so they should be the same product from a clearly different angle.
- **Prompt:** *(same as product-on-white; specify "front three-quarter view" vs "reverse / side view")*

### Product detail gallery — `src/components/ProductGallery.tsx:82`
- **Mode:** Product-on-white · **Render:** `aspect-square`, `object-contain` on white, **2.5× hover zoom + click-to-lightbox**
- **Source:** **≥ 2000 px square (higher is better)** — the magnify layer scales 2.5×, so low-res source will look soft.
- **Per SKU, 2–4 frames:** front, back/side, silver-capping detail, and (where relevant) the **real Lab Certificate**.
- **Prompt:** *(product-on-white; add "extremely sharp, high resolution, suitable for zoom")*

### About founder section — `src/app/about/page.tsx:57`
- **Mode:** Editorial / lifestyle · **Render:** `aspect-[4/5]`, `object-cover`
- **Source:** ≥ 1200 × 1500 px
- **Subject:** an atmospheric "house of Amorfos" moment — a mala laid on cloth, or hands presenting a certified, sealed bead. Delhi-house warmth, human and honest.
- **Prompt:**
  > Warm editorial lifestyle photograph, a Rudraksha mala resting on natural ivory cloth beside a folded certificate, warm morning light, calm and honest mood, premium restrained Indian aesthetic like Nicobar, subtle film grain, portrait 4:5. *(Global negative list.)*

### Journal article hero — `src/components/ArticleCard.tsx` (fallback `pendant-7-mukhi-1.jpg`)
- **Mode:** Editorial · **Render:** card thumbnail + wide article hero, `object-cover`
- **Source:** ≥ 1600 px wide (landscape safe)
- **Subject:** topic-appropriate, calm editorial imagery; leave breathing room for adjacent text.
- **Prompt:** *(editorial base prompt, adapt subject to the article topic, keep landscape composition uncluttered.)*

### Open Graph / social — `src/app/opengraph-image.tsx` (1200×630, logo-based) & `src/app/shop/[id]/og/route.tsx`
- **Render:** 1200 × 630 landscape. These are **generated in code** (logo / product + stars composited on the fly) — you don't strictly need to shoot for them.
- **Optional:** a warm ivory **backdrop plate** (soft texture, no subject) that reads well behind a centred logo or product. Keep the centre clean and low-contrast.

---

## 3. Product-shot checklist — for the ~101 SKUs with no photo

101 of 181 products currently render a placeholder glyph. To fill them consistently:

- **Background:** pure white `#FFFFFF`, even soft lighting, no visible shadow edge.
- **Resolution:** ≥ 2000 × 2000 px, square, sharp enough for 2.5× zoom.
- **Format:** deliver high-quality **JPG** (Next/Image re-encodes to AVIF/WebP automatically).
- **Frames per SKU:** ① front three-quarter · ② back/side · ③ silver-capping detail · ④ real Lab Certificate (where the SKU ships with one).
- **File naming — match the existing convention** in `public/products/`:
  `{type}-{mukhi}-{origin}-{n}.jpg` → e.g. `pendant-11-nepal-1.jpg`, `pendant-11-nepal-2.jpg`, `mala-9-indonesia-1.jpg`, `combo-kaalsarp-1.jpg`, `loose-gauri-1.jpg`.
  Then reference them in the product's `images: [...]` array in `src/lib/products.ts`
  (or upload via the admin product editor, which stores to Vercel Blob).

---

## 4. AI-generator prompt pack — how to use it

Each surface above ships with a copy-paste prompt. General guidance for
Midjourney / "Nano Banana" / Imagen / etc.:

- **Append the global negative list** to every prompt (many tools take it as a
  `--no` / negative field).
- **Set the aspect ratio** to match the surface (`4:5`, `3:4`, `1:1`, `16:9`≈OG).
- **Anchor the palette** with the words *warm ivory, espresso, antique gold, silver,
  a touch of red thread* — it keeps outputs off the cold-blue default.

### Where AI works — and where it doesn't
- ✅ **Good for:** hero, category tiles, About, journal heroes, OG backdrop plates —
  anything editorial/atmospheric where the bead is suggestive rather than forensic.
- ⚠️ **Weak at:** the **authentic mukhi face-lines** of a real Rudraksha and any **Lab
  Certificate**. AI invents plausible-but-wrong bead grooves and fake certificates —
  which collides with the brand's honesty rule ("authenticity is documented").
- 📷 **Shoot with a real camera for:** all **product-on-white** SKU photography, the
  "Seed of Shiva" macro, and every frame showing the certificate or exact bead detail.

> **Do not** generate a fake certificate, fake lab name, or fake mukhi count. Photograph
> the real product. Use AI only for mood, not for claims.
