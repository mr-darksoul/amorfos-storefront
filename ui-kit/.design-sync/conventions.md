# Amorfos UI Kit — Design Conventions

**Brand:** warm ivory / espresso / antique-gold — Nicobar meets Forest Essentials. Light and airy; no dark theme.

## No provider needed

Components render standalone. No context provider, no theme wrapper. Just render them — they read brand tokens from the shipped `styles.css`.

## Styling idiom

This is a **CSS-custom-property + named-class** system. No Tailwind utilities ship with the bundle.

**For brand elements, use the named classes from `styles.css`:**

| Class | What it does |
|---|---|
| `.btn .btn-primary` | Gold filled button (primary CTA) |
| `.btn .btn-outline` | Bordered outline button |
| `.eyebrow` | Uppercase, wide-tracked, gold label — use above headings |
| `.display` | Cormorant Garamond, tight leading — for large headings |
| `.font-serif` | Forces the serif face (Cormorant Garamond) |
| `.reveal` + `.reveal.is-visible` | Scroll-triggered fade-up (handled by `<Reveal>` component) |
| `.grain` | Subtle film-grain overlay (position: relative required on parent) |
| `.amf-input` `.amf-textarea` | Branded form inputs (parchment bg, gold focus ring) |
| `.amf-label` | Small uppercase field label |

**For layout (flex, grid, padding, margin), always use inline `style={{}}`** — no utility class is defined for these.

**For colors and brand values, always use CSS custom properties:**

```
var(--color-paper)        #f6f1e7  warm ivory bg
var(--color-paper-raised) #efe7d5  raised surfaces
var(--color-paper-soft)   #e7dcc6  hover/inset/track
var(--color-ink)          #221b12  primary text (espresso)
var(--color-ink-dim)      #5d5340  secondary text
var(--color-ink-faint)    #8a7d66  tertiary / captions
var(--color-gold)         #97712f  antique-gold accent
var(--color-gold-soft)    #b08a3f  brighter gold emphasis
var(--color-gold-deep)    #6f521f  darker gold / hover state
var(--color-rudra)        #7a4326  rudraksha brown (errors, accents)
var(--color-line)         rgba(34,27,18,0.14)  default borders
var(--color-line-strong)  rgba(34,27,18,0.26)  strong borders
var(--font-serif)         'Cormorant Garamond', Georgia, serif
var(--font-sans)          'Inter', system-ui, sans-serif
var(--shadow-soft)        warm box-shadow for cards
```

## Where the truth lives

- **Tokens & named classes:** `styles.css` (and its `@import "_ds_bundle.css"` — both ship)
- **Component APIs:** each `<Name>.d.ts` and `<Name>.prompt.md` in `components/general/<Name>/`
- **Icons:** SVG-based, accept any `SVGProps`. Color via `color:` / `style={{ color: "..." }}`. Size via `width`/`height` style props (default 24px).

## Idiomatic build snippet

```jsx
import { Eyebrow, Button, Badge, ProductCard, StarRating } from "@amorfos/ui-kit";

// A product highlight section
function ProductHighlight({ product, rating }) {
  return (
    <section style={{ padding: "4rem 2rem", background: "var(--color-paper)" }}>
      <Eyebrow>Bestseller</Eyebrow>
      <h2 className="display" style={{ fontSize: "2.5rem", color: "var(--color-ink)", margin: "0.5rem 0 0.25rem" }}>
        {product.name}
      </h2>
      <StarRating rating={rating.average} size="md" showValue count={rating.count} />

      <div style={{ maxWidth: "280px", marginTop: "1.5rem" }}>
        <ProductCard product={product} rating={rating} onAddToCart={(p) => console.log("added", p.id)} />
      </div>

      <div style={{ display: "flex", gap: "12px", marginTop: "1.5rem" }}>
        <Button variant="primary">Add to Cart</Button>
        <Button variant="outline">Learn More</Button>
      </div>

      <div style={{ display: "flex", gap: "8px", marginTop: "1rem" }}>
        <Badge variant="gold">Lab Certified</Badge>
        <Badge variant="default">Nepal Origin</Badge>
      </div>
    </section>
  );
}
```
