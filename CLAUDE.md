# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
task dev          # Rebuild on change, serve on :3000
task build        # generate + css + static into dist/
task generate     # Render the 72 pages only
task check        # lint + format:check + typecheck, in parallel
task ci           # What CI runs: check, then build
task docker:build # Build the container image (PUSH/LATEST to publish)
task i18n:sync    # Extract messages from the templates into every catalogue
task clean        # Drop dist/ and Task's checksum cache
task lint         # oxlint  (task lint -- --fix to autofix)
task format       # oxfmt --write
task typecheck    # tsc --noEmit
```

`task --list` is authoritative; prefer it over this list going stale.

## Architecture Overview

Personal website for [blit.cc](https://blit.cc). A static site generator with no
framework and no bundler — the browser receives HTML, CSS and a font, nothing else.

- **Orchestration**: [Task](https://taskfile.dev); each step declares `sources`/`generates`
- **Templates**: [WebC](https://github.com/11ty/webc) over `src/templates/*.webc`
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
- `task clean` must remove `.task` as well as `dist` — leaving the checksum cache makes
  the next build skip steps whose output was just deleted.
- `generate` prunes orphaned `index.html` files and empty directories. Without it a
  removed locale keeps its directory in `dist/` and carries on being served.
- `static` is deliberately unfingerprinted: its output is a directory rather than one
  named file, so a partially-deleted `dist/` can't be detected. Copying is cheap.
- `/style.css` carries a content digest as a query string. nano-web serves CSS
  `immutable, max-age=1y`, so a stable URL would strand visitors on old styles.
- Adding a page means a template plus an entry in `src/i18n/routes.ts`.
- Tailwind scans `src/templates/*.webc` as an explicit glob — `.webc` is not an
  extension it picks up from a bare directory. A class chosen in `generate.ts` rather
  than written in a template is invisible to it.
- GitHub Actions is an environment, not a pipeline: it checks out, installs mise,
  supplies credentials and a cache, then calls Taskfile targets. Anything a runner has
  and a laptop doesn't must arrive as an environment variable the Taskfile reads
  (`CI`, `CACHE_FROM`/`CACHE_TO`, `GH_TOKEN`) rather than as logic in the workflow. If
  a step can't be run locally, it's in the wrong file.
