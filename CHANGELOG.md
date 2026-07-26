# Changelog

## Unreleased

### Templates use layouts, and the Proxy now survives the boundary

A page declares the frame it slots into (`<% layout("./base") %>`) instead of `base`
including a page named by the view. The frame no longer needs to be told what it
wraps, and `content` is gone from the view.

- **The strict-view Proxy is applied to `eta.render` rather than the outermost call.**
  Eta crosses into a layout — and into `include()` — by spreading the view into a
  fresh object, and spreading a Proxy yields a plain one. Top-level keys were
  therefore unguarded past the first boundary: a mistyped `it.cv` in `cv.html` built
  green and shipped the string `undefined`. Both paths route through `this.render`, so
  re-wrapping there closes it for layouts and includes alike.
- Output is byte-identical across all 72 pages.

### CI moved into the Taskfile

GitHub Actions now supplies only an environment — checkout, mise toolchain and
registry credentials — and every step of substance is a Taskfile target. The
pipeline is reproducible on a laptop, and a CI failure is debuggable without pushing
a commit to watch it.

- `task ci` (checks then build), `task docker:build` and `task deploy:update` replace
  the inline `run:` steps, `docker/metadata-action`, `docker/build-push-action` and
  the yq-and-git shell block that rewrote the IaC repo's Pulumi config.
- **Runner-only capabilities arrive as environment, not workflow logic**: `CI` selects
  `--frozen-lockfile`, `GH_TOKEN` authorises the deployment push, and
  `CACHE_FROM`/`CACHE_TO` point buildx at a shared cache. Unset, each falls back to the
  local equivalent, so the command doesn't change shape between the two.
- **No build cache is configured.** The image is a `FROM`, a `LABEL` and a `COPY` of
  `dist/`, whose content changes every build, so `type=gha` imported a manifest and
  cached zero steps. Dropping it also removes the action that existed only to export
  `ACTIONS_RUNTIME_TOKEN` for its benefit. The Taskfile keeps the conditionals.
- **Publishing is gated on the ref, not the event type.** `PUSH` previously keyed on
  "not a pull_request", which meant main only because the trigger list happened to
  contain nothing else; adding a `workflow_dispatch` or a second push branch would have
  started publishing from it silently.
- **The deploy write asserts before it writes.** `yq`'s `|=` creates a missing path
  rather than failing, so a renamed service or moved config would have committed an
  invented node and left prod on the old tag behind a green job. The clone also pins
  `--branch main` instead of following whatever the IaC repo's default branch is.
- **The deploy job is serialised.** Two merges in close succession both cloned, edited
  and pushed; the loser hit a non-fast-forward it couldn't recover from inside a fresh
  shallow clone.
- **`SHA`/`TAG`/`BUILT_AT` are scoped to the tasks that use them.** Task evaluates
  global `sh:` vars on every invocation, so declaring them globally made `task lint`
  and the watch loop fork `git` and `date`. They resolve to a caller-supplied value
  first — a plain task-level var outranks one passed on the command line, which would
  have silently discarded the commit CI passes.
- **OCI labels moved to the Dockerfile**, which is where the constant ones belong;
  `revision`, `created` and `version` still come from the build. Output matches what
  `docker/metadata-action` emitted, except `version`, which is now the image's own tag
  rather than always `latest`. `image.licenses` is pinned empty so the image stops
  inheriting the base image's MIT claim.
- **The image tag is defined once**, in the Taskfile, and derived from `SHA`. Both the
  build and the deployment job read the same definition instead of the workflow
  trimming `sha-$GITHUB_SHA` to 11 characters by hand.
- **The build and publish jobs merged.** They existed to hand `dist/` over as an
  artifact; `docker:build` depends on `build`, so the round trip was pure latency. The
  artifact upload stays, for downloading a PR's output.
- Dropped `setup-qemu-action` — the only platform built is `linux/amd64` and the
  runner is already amd64.
- `gh` and `yq` are pinned in `mise.toml` alongside node, aube and task.
- Actions bumped to releases that declare the `node24` runtime; the previous pins all
  targeted Node 20 and were being forced onto 24 by the runner.
- `install` and `css` are `run: once`, so the now-parallel checks can't race each
  other into `node_modules`.

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
- **Task replaces the npm scripts.** `Taskfile.yml` declares `sources`/`generates` per
  step, so generate/css/static run in parallel and skip when unchanged.
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
- **`task i18n:sync` generates `src/i18n/keys.ts`**, a `MessageKey` union derived from
  the source catalogue, so a bad key is a type error in the generator.
- **Dropped `am-ET`.** Geist Mono has no Ethiopic glyphs and the stack has no fallback,
  so it rendered as tofu. 36 locales remain.
- `task i18n:sync` replaces `lingui extract`, propagating source-locale keys to every
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
- **`task clean` also clears `.task`**, and `static` is no longer fingerprinted.
  Deleting `dist/` by hand left the checksum cache claiming the copy was current, so
  fonts and icons silently 404'd.
- **`install` re-runs when `package.json` changes.** It was guarded only by whether
  `node_modules` existed.

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
