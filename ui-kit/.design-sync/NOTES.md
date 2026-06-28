# Amorfos UI Kit — Design Sync Notes

## Setup facts

- Package: `@amorfos/ui-kit` at `web/ui-kit/`
- Build: `npm run build` (tsup → `dist/index.es.js`)
- CSS entry: `styles/index.css` (CSS custom properties + named brand classes; no Tailwind)
- Fonts: Cormorant Garamond + Inter served from Google Fonts CDN at runtime; not shipped as font files. `runtimeFontPrefixes` suppresses the [FONT_MISSING] warning.
- No Storybook. Package shape.
- Node modules for converter: `./node_modules` (react 19 lives here)

## Known render warns

- `[RENDER_SKIPPED]` — Playwright was not available during the initial sync (background session, no browser). Previews were authored but NOT machine-verified. **Action required on first re-sync: install Playwright** (`npx playwright install chromium`) before running validate, or open `.review.html` manually.
- Icons (BagIcon, ArrowIcon, etc.) render as simple SVGs — they may look identical between the 16px and 24px stories. This is expected single-look behavior, not a variant failure.
- `Reveal` component uses IntersectionObserver — the reveal animation won't trigger in a static headless render (the element starts invisible). The floor state is correct.

## Re-sync procedure

```bash
cd web/ui-kit
npm run build
node .ds-sync/package-build.mjs --config .design-sync/config.json --node-modules ./node_modules --entry ./dist/index.es.js --out ./ds-bundle
node .ds-sync/package-validate.mjs ./ds-bundle   # add --no-render-check if no browser
node .ds-sync/resync.mjs --config .design-sync/config.json --node-modules ./node_modules --entry ./dist/index.es.js --out ./ds-bundle --remote
```

## Re-sync risks

- **Product card images**: previews reference `/products/pendant-7-mukhi-1.jpg` etc. These paths work on amorfos.in but won't resolve in Claude Design previews — cards will show the glyphs placeholder instead of real images. Acceptable for design purposes.
- **ArticleCard excerpt** field: not in the storefront's Article type. If the Supabase schema gains an excerpt column, update the `ArticleCardArticle` interface in `src/ArticleCard.tsx`.
- **Google Fonts CDN dependency**: if Cormorant Garamond is ever pulled from Google Fonts, previews will fall back to Georgia. Fix: ship `.woff2` files via `cfg.extraFonts`.
- **NewsletterForm / ReviewForm API URLs**: default to `/api/subscribe` and `/api/reviews`. These routes don't exist in the ui-kit package — they only work when embedded in the Amorfos Next.js app. In Claude Design previews, form submissions will 404 (expected — the form UI still renders correctly).
- **React 19**: if the ui-kit is ever consumed by a project using React 18, `react-dom/client` root APIs are compatible but test carefully.
