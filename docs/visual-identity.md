# Amorfos — Visual Identity

> Companion to [`brand.md`](./brand.md). The authoritative reference for how Amorfos
> **looks**. The single source of truth for tokens is `web/src/app/globals.css`;
> this file documents and explains them. **Mirror these values exactly** in any
> ad, email, social tile, or graphic.

---

## 1. Design principle

**Light, warm and airy.** Parchment-ivory grounds, espresso type, a single deep
antique-gold accent, and the rudraksha's own browns. Calm and considered, like
**Forest Essentials / Nicobar**.

> ⚠️ **A dark theme was tried early and rejected as "too dark."** Do **not** produce
> dark-mode marketing. The brand is light. The only dark surfaces permitted are
> small **chips/gradients that sit over product photography** (a dark scrim with
> cream text for legibility) — never a full dark layout.

---

## 2. Colour palette (exact hex — from `globals.css`)

### Grounds (backgrounds)
| Token | Hex | Use |
|---|---|---|
| Paper | `#f6f1e7` | Primary background — warm ivory, "the ground" |
| Paper Raised | `#efe7d5` | Raised surfaces, bands, inputs |
| Paper Soft | `#e7dcc6` | Hover, inset, scrollbar track |

### Ink (text)
| Token | Hex | Use |
|---|---|---|
| Ink | `#221b12` | Primary text (espresso) |
| Ink Dim | `#5d5340` | Secondary / body-supporting text |
| Ink Faint | `#8a7d66` | Tertiary, captions, fine print |

### Accent & naturals
| Token | Hex | Use |
|---|---|---|
| **Gold** | `#97712f` | **The single accent** — buttons, eyebrows, rules, links |
| Gold Soft | `#b08a3f` | Brighter gold — emphasis, italic highlight words |
| Gold Deep | `#6f521f` | Hover / pressed gold |
| Rudra Brown | `#7a4326` | The bead's own brown — accents, sparingly |

### Lines & over-image chips
| Token | Value | Use |
|---|---|---|
| Line | `rgba(34, 27, 18, 0.14)` | Hairline borders |
| Line Strong | `rgba(34, 27, 18, 0.26)` | Outline buttons, stronger dividers |
| Dark chip | `#221b12` | Dark scrim **only over product photos** |
| Cream (on dark) | `#f6f1e7` | Text **on** the dark chip |

**Usage rules**
- **One accent.** Gold is the only accent — do not introduce new brand colours
  (no blue, green, purple). Rudra-brown is a natural, used sparingly.
- **Contrast:** Ink `#221b12` on Paper `#f6f1e7` for body. Gold is for accents and
  large/heavy display type — check contrast before using gold for small body text.
- **Buttons:** primary = gold fill (`#97712f`) with cream text, hover → gold-deep.
  Secondary = transparent with a strong-line border, hover → gold border + gold text.
- **Selection / highlight:** gold background, cream text.

---

## 3. Typography

| Role | Typeface | Notes |
|---|---|---|
| **Display / headings** | **Cormorant Garamond** (serif) | The brand "voice." Weight ~500, tight leading (~1.02), slightly negative tracking. Elegant, editorial. |
| **Body / UI / captions** | **Inter** (sans) | Highly legible. Default for paragraphs, labels, buttons. |
| **Eyebrow** | Inter | small, **UPPERCASE**, letter-spacing ~0.32em, weight 500, **gold**. Sits above headings. |

**Fallbacks:** serif → `"Cormorant Garamond", Georgia, serif`; sans →
`ui-sans-serif, system-ui, sans-serif`.

**Type rules**
- Headlines in Cormorant Garamond, sentence case, often with one *italic* word in
  gold-soft for emphasis (e.g. "The bead that *steadies* you").
- Body in Inter, generous line-height (~1.6), `ink-dim` for longer passages.
- Eyebrows label sections ("OUR STORY", "THE SEED OF SHIVA", "MOST WORN").
- Button text: Inter, small, UPPERCASE, wide tracking (~0.16em).
- Don't mix in other fonts. Don't use Cormorant for long body text or tiny sizes.

---

## 4. Logo

- **Form:** a dark, calligraphic wordmark (`public/brand/logo-dark.png`).
- **Placement:** used **directly on the light ivory page** — **no CSS inversion**,
  no dark box behind it.
- **Clear space:** generous; never crowd it.
- **Don'ts:** don't recolour, stretch, skew, add shadows/glows, rotate, or place on
  a busy/low-contrast photo without a clean field. On a dark photo region, place it
  within a clean light/ivory area rather than inverting it.

---

## 5. Imagery & art direction

### Product photography (strict)
- **Full product, centred, on pure white, fit-to-image** — Amazon-style. **Never**
  crop the bead into a tight rectangle; show the whole object.
- Show the **silver capping, red thread, and the certificate** where relevant.
- Even, clean lighting; true colour; no heavy filters.

### Editorial / lifestyle
- Warm, natural light; soft shadows; calm, uncluttered compositions.
- Palette in-frame: ivory, espresso/brown, silver, a touch of red thread.
- Subtle **film grain** is on-brand (the site uses a faint grain overlay for depth).
- Hands, puja, daily-wear moments — quiet and reverent, never staged-cheesy.

### Avoid
- Neon or harsh saturation; cold blue/grey tones.
- Stock "spirituality" clichés: glowing auras, lens flares, lightning, fire.
- Busy collages, bazaar clutter, loud sale stickers/badges.
- Dark, moody full-bleed layouts (off-brand — we are light).

---

## 6. Layout & motion

- **Generous white (ivory) space.** Let content breathe; restraint signals premium.
- **Hairline borders** (`line` token) and small radii (~2px on buttons) — crisp,
  not rounded-bubbly.
- **Soft shadow** for lift: `0 18px 50px -24px rgba(74,52,24,0.28)`.
- **Motion:** gentle reveal-on-scroll (fade + slight rise), slow easing. Nothing
  flashy. Respect `prefers-reduced-motion`.
- **Subtle film grain** over flat colour fields (≈3.5% opacity) for warmth.

---

## 7. Quick token sheet (for handing to a designer/tool)

```
# Grounds
paper        #f6f1e7
paper-raised #efe7d5
paper-soft   #e7dcc6
# Ink
ink          #221b12
ink-dim      #5d5340
ink-faint    #8a7d66
# Accent
gold         #97712f   (primary accent / buttons)
gold-soft    #b08a3f   (emphasis)
gold-deep    #6f521f   (hover)
rudra        #7a4326   (natural brown, sparingly)
# Lines
line         rgba(34,27,18,0.14)
line-strong  rgba(34,27,18,0.26)
# Type
display/headings: Cormorant Garamond (serif), weight 500
body/ui:          Inter (sans)
eyebrow:          Inter, UPPERCASE, 0.32em tracking, gold
```
