# Changelog

## Unreleased

### Dagger replaces Task, the Dockerfile and most of the workflow

One definition of the build, in `dagger/main.go`, so `dagger call check` on a
laptop is the execution CI performs rather than an approximation of it. The
Taskfile, `Dockerfile` and `.dockerignore` are gone, and the workflow drops from
three jobs and nine pinned actions to one job and two `dagger call`s.

- **The image is assembled in code.** `COPY dist /public` required shipping the repo
  to the daemon and subtracting the unwanted parts with `.dockerignore`; the module
  passes the `dist` the build just produced. `dist/` never reaches the host, which
  also removes the `upload-artifact`/`download-artifact` hop between jobs.
- **`publish()` returns the digest-pinned ref it pushed**, and `deploy` writes that
  into the deployment config. Previously the tag was computed twice — by
  `docker/metadata-action` and again by shell string-trimming in a separate job —
  with nothing checking the two agreed.
- **Platform is pinned to `linux/amd64`** in the module. Publishing from an arm64
  machine would otherwise push an image the cluster cannot run.
- **`serve` runs the real image**, so the production container is one command away
  locally instead of requiring a `docker build` that isn't what CI produces.
- **The module is Go**, for cold-start alone. The TypeScript SDK boots a node runtime
  and re-evaluates the module on every call; profiling a rebuild put ~5 of 6.5s in
  Dagger machinery rather than the build, and the Go port cut it to 2.4s. `gofmt-check`
  runs in `check` so the build definition is not the one unchecked thing in the repo.
- **No watch, and rebuilds cost ~2.4s rather than milliseconds** — a container
  round-trip per call. That is the price of the local and CI paths being the same
  path.
- **The hook checks rather than fixes.** Dagger has no host filesystem access, so
  `stage_fixed` autofix is replaced by `dagger call format export --path=.`.

### Rewritten as a static generator — no framework, no bundler, no client JS

The site is two pages, six translated strings and a markdown CV, and its only
interactivity is the language picker. React, TanStack Start, Vite, MDX and Wrangler
existed to render that, so they're gone. The browser now gets HTML, CSS and a font —
no JavaScript at all, and no `<script>` tag on any page.

- **Language picker** is a `<dialog>` modal replacing the `<select>` + `useNavigate`
  handler, driven entirely by attributes: `command`/`commandfor` to open,
  `closedby="any"` for click-outside and Esc, `<form method="dialog">` to close, and
  `autofocus` on the active locale so the list scrolls to it. Focus trapping and focus
  return are the element's own. Locale names are resolved from ICU via
  `Intl.DisplayNames` **at build time**, so it reads "日本語 / 日本" rather than
  "ja-JP" at no runtime cost, and the region line disambiguates nl-BE from nl-NL.
  Costs pre-2025 browsers, where `command` is unsupported and the button does nothing.
- **Base styles moved into `@layer base`.** Unlayered CSS outranks every `@layer`
  regardless of specificity, so the bare `a` rule was overriding utilities like
  `no-underline` wherever an element needed to opt out.
- **Templates** are Eta (`src/templates/*.html`); `scripts/generate.ts` renders 72
  pages in ~45 ms. The view is wrapped in a Proxy that throws on unknown keys, so a
  mistyped `it.t.taglinne` fails the build naming the path and the keys that exist,
  rather than silently rendering nothing. Generation time is the only runtime, so
  that is the type check.
- **The npm scripts are gone**; orchestration is the Dagger module described above.
- **Node 24 runs the `.ts` scripts directly** via built-in type stripping — no
  transpiler in the pipeline.
- **Removed 14 direct dependencies**; `dependencies` is now empty and the 11 remaining
  devDeps are all build-time. Dropped `tailwindcss-logical` — v4's native `mx-*`/`end-*`
  emit the same logical properties, verified against the RTL locales.

### i18n

- **Lingui replaced by `src/i18n/po.ts`**, a ~40-line gettext reader/writer. The `.po`
  files stay the source of truth and the catalogues are unchanged in content.
- **Message ids are now short keys** (`tagline`) rather than English sentences, so
  templates read `it.t.tagline` with no indirection. These were already explicit ids
  under Lingui, not source text, so nothing is lost.
- **Untranslated keys fall back to `en-GB`** instead of rendering blank.
- Two new strings (`language`, `close`) for the picker, translated across every
  catalogue. The Tibetan, Dhivehi and Odia renderings are the least confident and are
  worth a native-speaker check.
- **`sync-locales` generates `src/i18n/keys.ts`**, a `MessageKey` union derived from
  the source catalogue, so a bad key is a type error in the generator.
- **Dropped `am-ET`.** Geist Mono has no Ethiopic glyphs and the stack has no fallback,
  so it rendered as tofu. 36 locales remain.
- `sync-locales` replaces `lingui extract`, propagating source-locale keys to every
  catalogue and reporting what's outstanding.
- `/en-GB/*` is no longer generated; the source locale lives only at `/` and `/cv`,
  which removes the redirect the router used to perform.

### Fixed

- **The CV lost its typography.** Moving the base element rules into `@layer base`
  (see above) let `@tailwindcss/typography` win inside `.prose`, since its rules are
  wrapped in `:where()` and were previously beaten for free by unlayered CSS — headings
  came out bold, links took the body colour, spacing shifted. The site's typography is
  now restated at `.prose h1` etc., which outranks `.prose :where(h1)`. Verified
  against the live site: pixel-identical over the upper half, 1px of rounding below.
- **Closed dialogs leaked into the page.** An unconditional `flex` utility overrode the
  UA's `dialog:not([open]) { display: none }`, so the picker rendered inline after
  navigating. Now `open:flex`.
- **`/style.css` is fingerprinted** with a content digest. nano-web serves CSS
  `immutable, max-age=31536000`, so a stable URL left returning visitors on old styles
  after a deploy — a cache-busting regression against the old Vite build.
- **`generate` prunes orphaned pages.** It only ever wrote files, so a removed locale
  kept its directory in `dist/` and carried on being served locally.
- **`static` is no longer fingerprinted.** Its output is a directory rather than one
  named file, so a partially-deleted `dist/` could not be detected and fonts and icons
  silently 404'd.
- **`install` re-runs when `package.json` changes.** It was guarded only by whether
  `node_modules` existed.

### Deployment

- **Cloudflare/Wrangler removed.** `wrangler.jsonc` and `@cloudflare/vite-plugin` were
  a second, unused deploy target — the live path is Docker → ghcr → microk8s → Pulumi.
- Build output moved from `dist/client/` to `dist/`; Dockerfile and CI updated.
- CI installs node, aube and dagger from `mise.toml` via `jdx/mise-action`, replacing
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
