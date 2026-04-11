# Changelog

## 4.0.0 — 2026-04-11

Replaced Astro with TanStack Start. Server-side i18n with zero client flash.

### Framework

- Migrated from Astro 6 to TanStack Start (v1.167) with React 19
- Replaced `astro-lingui` with `@lingui/vite-plugin` — .po catalogs compiled at import time via Vite plugin, no manual compile step
- All catalogs loaded eagerly via `import.meta.glob` for sync access during hydration
- SSG via TanStack Start's prerender with `crawlLinks` — hidden `<nav>` in root layout seeds the crawler with all locale/page URLs
- Locale routing via `$locale` path param routes, validated against known locale list

### Build

- Upgraded to Vite 7 (rolldown-vite) — required for TanStack Start's `buildApp` hook
- MDX via `@mdx-js/rollup` (replaces `@astrojs/mdx`)
- Removed Babel config — no longer needed

### Output

- 76 prerendered HTML pages (37 locales × 2 pages + root)
- Client JS: ~108kB gzip (main bundle), code-split per route
- Served by nano-web from `dist/client/`

## 3.0.0 — 2026-03-14

Astro 6 upgrade with build and asset optimisations.

### Astro 6

- Upgraded from Astro 5 to [Astro 6.0](https://astro.build/blog/astro-6/) — brings Vite 7 internals, Content Security Policy by default, and the new Fonts API
- `@astrojs/mdx` 4.x → 5.0, `@astrojs/react` 4.x → 5.0
- `astro-lingui` 0.0.25 → 0.1.0 (Astro 6 peer dep support)
- Removed explicit `output: "static"` — it's the default in Astro 6
- Dropped explicit `@astrojs/compiler` dependency (bundled with Astro 6)

### Variable Font

- Replaced 9 individual Geist Mono weight files with a single variable font (`GeistMono[wght].woff2`)
- Single `@font-face` declaration covers weights 100–900 with `font-display: swap`
- Fewer HTTP requests, smaller total font payload

### Image Optimisation

- Logo component now uses Astro's `<Image>` instead of raw `<img>` — automatic WebP conversion (22kB PNG → 7kB/15kB WebP)

### Tooling

- Biome 2.4.4 → 2.4.7
