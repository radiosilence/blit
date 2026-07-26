# Changelog

## Unreleased

### Rewritten as a static generator — no framework, no bundler, no client JS

The site is two pages, four translated strings and a markdown CV, and its only
interactivity is the language picker. React, TanStack Start, Vite, MDX and Wrangler
existed to render that, so they're gone. Output is now HTML, CSS and a font: the
homepage is 4.3 KB of markup with no `<script>` tag at all.

- **Language picker** is a `<details>` element with one `<a>` per locale, replacing the
  `<select>` + `useNavigate` handler. No script, keyboard-accessible natively.
- **Templates** are Mustache (`src/templates/*.html`) — logic-less, so logic can't
  accumulate in them. `scripts/generate.ts` renders 74 pages in ~40 ms.
- **Task replaces the npm scripts.** `Taskfile.yml` declares `sources`/`generates` per
  step, so generate/css/static run in parallel and skip when unchanged.
- **Node 24 runs the `.ts` scripts directly** via built-in type stripping — no
  transpiler in the pipeline.
- **Removed 13 direct dependencies**; `dependencies` is now empty and the 12 remaining
  devDeps are all build-time. Dropped `tailwindcss-logical` — v4's native `mx-*`/`end-*`
  emit the same logical properties, verified against the RTL locales.

### i18n

- **Lingui replaced by `src/i18n/po.ts`**, a ~40-line gettext reader/writer. The `.po`
  files stay the source of truth and all 37 catalogues are unchanged in content.
- **Message ids are now short keys** (`tagline`) rather than English sentences, so
  templates read `{{t.tagline}}` with no indirection. These were already explicit ids
  under Lingui, not source text, so nothing is lost.
- **Untranslated keys fall back to `en-GB`** instead of rendering blank.
- `task i18n:sync` replaces `lingui extract`, propagating source-locale keys to every
  catalogue and reporting what's outstanding.
- `/en-GB/*` is no longer generated; the source locale lives only at `/` and `/cv`,
  which removes the redirect the router used to perform.

### Deployment

- **Cloudflare/Wrangler removed.** `wrangler.jsonc` and `@cloudflare/vite-plugin` were
  a second, unused deploy target — the live path is Docker → ghcr → microk8s → Pulumi.
- Build output moved from `dist/client/` to `dist/`; Dockerfile and CI updated.
- CI installs node, aube and task from `mise.toml` via `jdx/mise-action`, replacing
  `endevco/aube-action`, so the runner and local dev share one toolchain definition.

### Dependencies

- Within-semver bumps to `oxlint` and `oxfmt`. The rest of that batch — Lingui,
  TanStack, Vite, Wrangler, React — was removed by the rewrite above before it shipped.

### Tooling

- Switched package manager from Bun to [aube](https://aube.en.dev) (pnpm-style isolated `node_modules`, `aube-lock.yaml`)
- Build-script allowlist moved from bun's `trustedDependencies` to aube's `allowBuilds` (now just `lefthook`)
- Docker base image: `oven/bun:latest` → `node:24-alpine` with aube installed via npm — aube does not bundle a runtime
- Added `aube-workspace.yaml` with security-focused defaults: `minimumReleaseAge: 10080` (7-day install delay), `trustPolicy: no-downgrade`, explicit `blockExoticSubdeps`. Build-script allowlist consolidated here (moved out of `package.json`).

### CI

- CI runs lint + typecheck + build on the runner (toolchain now from `mise.toml`, see above)
- Docker pipeline split: runner builds the site and uploads it as an artifact; the publish job downloads it and packages a thin image (just `FROM nano-web` + `COPY dist /public`)
- Dockerfile no longer needs Node, npm, or aube — final image is just static assets on top of nano-web

## 4.0.0 — 2026-04-11

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
