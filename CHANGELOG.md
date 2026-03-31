# Changelog

## 3.1.0 — 2026-03-31

### Tooling

- Replaced Biome with [oxlint](https://oxc.rs/docs/guide/usage/linter) (linting) and [oxfmt](https://oxc.rs/docs/guide/usage/formatter) (formatting) from the oxc toolchain
- Removed `biome.json`, added `.oxlintrc.json` and `.oxfmtrc.json`
- Updated lefthook pre-commit hooks to use oxlint + oxfmt
- Updated package.json scripts: `lint`, `lint:fix`, `format`, `format:check`

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
