# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
task dev          # Rebuild on change, serve on :3000
task build        # css into .build, then generate the site into dist/
task generate     # Render the 72 pages only
task check        # lint + format:check + typecheck, in parallel
task ci           # What CI runs: check, then build
task docker:build # Build the container image (PUSH/LATEST to publish)
task i18n:sync    # Extract messages from the templates into every catalogue
task clean        # Drop dist/, .build/ and Task's checksum cache
task lint         # oxlint  (task lint -- --fix to autofix)
task format       # oxfmt --write
task typecheck    # tsc --noEmit
```

`task --list` is authoritative; prefer it over this list going stale.

## Architecture Overview

Personal website for [blit.cc](https://blit.cc). A static site generator with no
framework and no bundler — the browser receives HTML, CSS and a font, nothing else.

- **Orchestration**: [Task](https://taskfile.dev); each step declares `sources`/`generates`
- **Templates**: [WebC](https://github.com/11ty/webc) over `src/templates/*.html`; the
  `.html` extension is deliberate — WebC only requires `.webc` for `npm:` imports, and
  an editor treats these as what they are
- **Content**: markdown-it renders `src/content/cv.md`
- **Styling**: TailwindCSS v4 CLI, Geist Mono
- **i18n**: [Lingui](https://lingui.dev) — ICU messages in `.po`, 36 locales, catalogues are the source of truth
- **Packages**: aube (`aube-lock.yaml`); toolchain via mise (`mise.toml`)
- **Deployment**: Docker → microk8s → CloudFlare Tunnel

Key decisions:

- Nothing in `package.json` is a runtime dependency; it is all build-time tooling, and
  no JavaScript is shipped. The locale picker runs on `command`/`commandfor`,
  `closedby="any"`, `<form method="dialog">` and `autofocus`. Reach for a native
  element and style it rather than adding script.
- Base element rules in `app.css` must stay inside `@layer base`. Unlayered CSS beats
  every `@layer` regardless of specificity, so an unlayered `a` silently overrides
  utilities like `no-underline`.
- Scripts under `scripts/` are `.ts` run directly by Node 24's type stripping — no
  transpiler. Keep them strippable: no enums, no namespaces, explicit `import type`.
- A template is valid HTML with no template language in it. A custom element is a
  component resolved to the file of the same name, children arrive through `<slot>`,
  and every dynamic value is a JavaScript expression in an attribute — `:href`,
  `@text`, `@html`, `webc:for`, `webc:if`. Page data is under `$data`; WebC scopes
  globals away from nested components, so `locale` alone works only at the top level.
- Everything WebC evaluates is an attribute, which is why extraction is a parse5 tree
  walk. Keep it that way: a value computed in a `<script webc:setup>` block would be
  invisible to `scripts/webc-extractor.ts`.
- The extractor recognises no message syntax of its own. It collects the expressions
  and hands them to Lingui's Babel extractor, so `i18n._()`, plurals, comments and
  contexts are Lingui's to define and stay correct when Lingui's rules change.
- Templates pass the English source text (`i18n._('github')`); catalogues are keyed by
  Lingui's hash of it. Both the extractor and the render-time helper call
  `generateMessageId`, so neither side assumes the other's key. A message no catalogue
  has stops the build, because with source text as the message Lingui's own fallback
  would ship a mistyped `githubb` as itself. Untranslated strings still fall back to
  `en-GB`.
- The hash keying is what makes plurals write as gettext's `msgid`/`msgid_plural` with
  one `msgstr[n]` per form. po-gettext only does that for generated ids; hand it an
  explicit id and a plural degrades to `msgid_plural "<the whole ICU string>_plural"`.
  This is why `scripts/webc-extractor.ts` restates the extracted id as the message.
- `Plural-Forms` is left empty. Lingui derives the forms from CLDR when the header is
  absent, and Poedit and Weblate write it on first save; the alternative is hand-
  maintaining a C expression for all 36 locales.
- `generate.ts` wraps the view in a Proxy that throws on unknown keys, because WebC
  renders an unknown path as nothing. Generation time is the only runtime here, so
  this is the type check. `then` and array indexes are exempt — WebC awaits every
  expression, and a throwing `then` makes the view look like a rejected promise.
- oxfmt is pointed away from `src/templates` (`.oxfmtrc.json`): it parses them as HTML
  and reflows attributes WebC treats as significant.
- WebC re-serialises rather than splicing, so output whitespace and void-element
  syntax are its choice, not the template's. Compare renders structurally.
- Pages are written as directory indexes (`dist/cv/index.html`) because nano-web
  resolves `/cv` to `/cv/`. Don't put extensions on internal links.
- `task clean` must remove `.task` and `.build` as well as `dist` — leaving the
  checksum cache makes the next build skip steps whose output was just deleted.
- Every asset reaches a page through `asset('logo.png')`, which publishes it under a
  content hash (`/logo.4d453d58.png`) and records the reference. Writing the path by
  hand instead fails the build, because the link check resolves `href` and `src`
  against what was actually written.
- Hashing is not decoration. nano-web picks caching by MIME type alone, so CSS,
  images and fonts are all served `immutable, max-age=1y` — a stable URL is a promise
  the build can't keep. `favicon.ico` and `robots.txt` are the exceptions: their URLs
  are a convention, so they publish unhashed and always, and replacing one means
  waiting the cache out.
- `dist/` is written entirely by `generate`, which is what lets it delete anything
  that is not a page or a referenced asset — a removed locale's directory, or the
  previous hash of a file that has changed.
- The stylesheet and the manifest are derived rather than copied: both name other
  assets, so they are rewritten before their own hash is taken. Otherwise the font
  and the icons get fetched at a second, unhashed URL that is cached just as hard.
- Tailwind compiles to `.build`, not `dist`, so that rewrite has a fixed input.
  Rewriting in place would append a second hash on any run where Tailwind's output
  was already up to date.
- Adding a page means a template plus an entry in `src/i18n/routes.ts`.
- Tailwind scans `src/templates`, so a class chosen in `generate.ts` rather than
  written in a template is invisible to it.
- GitHub Actions is an environment, not a pipeline: it checks out, installs mise,
  supplies credentials and a cache, then calls Taskfile targets. Anything a runner has
  and a laptop doesn't must arrive as an environment variable the Taskfile reads
  (`CI`, `CACHE_FROM`/`CACHE_TO`, `GH_TOKEN`) rather than as logic in the workflow. If
  a step can't be run locally, it's in the wrong file.
