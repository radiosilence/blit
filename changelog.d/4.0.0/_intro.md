Released 2026-04-11.

Replaced Astro with TanStack Start. Server-side i18n with zero client flash.

### Framework

- Migrated from Astro 6 to TanStack Start (v1.167) with React 19
- Replaced `astro-lingui` with `@lingui/vite-plugin` — .po catalogs compiled at import time via Vite plugin, no manual compile step
- All catalogs loaded eagerly via `import.meta.glob` for sync access during hydration
- SSG via TanStack Start's prerender with `crawlLinks` — hidden `<nav>` in root layout seeds the crawler with all locale/page URLs
- Locale routing via `$locale` path param routes, validated against known locale list

### Build

- Vite 8 (rolldown-vite) — required for TanStack Start's `buildApp` hook
- MDX via `@mdx-js/rollup` (replaces `@astrojs/mdx`)
- Removed Babel — no longer needed
- TypeScript 6

### Tooling

- Replaced Biome with [oxlint](https://oxc.rs/docs/guide/usage/linter) + [oxfmt](https://oxc.rs/docs/guide/usage/formatter)

### Output

- 76 prerendered HTML pages (37 locales × 2 pages + root)
- Client JS: ~108kB gzip (main bundle), code-split per route
- SSG served by nano-web from `dist/client/`
- Standalone SSR via `bun run serve` (Bun.serve wrapping TanStack Start's fetch handler)
