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
task i18n:sync    # Propagate source-locale keys to every catalogue
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
- **Templates**: `hono/html` tagged templates in `src/templates/*.ts`
- **Content**: markdown-it renders `src/content/cv.md`
- **Styling**: TailwindCSS v4 CLI, Geist Mono
- **i18n**: hand-rolled gettext in `src/i18n/po.ts`, 36 locales, `.po` files are the source of truth
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
- Everything under `scripts/` and `src/` is `.ts` run directly by Node 24's type
  stripping — no transpiler. Keep it strippable: no enums, no namespaces, explicit
  `import type`, **and no JSX** — Node strips types but does not compile JSX, which
  is why templates are `hono/html` tagged literals and not `hono/jsx`.
- Templates are typed functions, so `task typecheck` is the check that a message key
  or a link still exists. Each one declares only the props it uses; there is
  deliberately no shared view type, since a god-object accepts every template's
  fields and so checks none of them properly.
- `hono/html` exports `html` and `raw`, nothing else — no slots. `layout.ts` takes a
  `children` prop holding already-rendered markup, which `html` splices in without
  re-escaping. Interpolation escapes; `raw()` is the opt-out, used for the CV only.
- Booleans interpolate as the empty string, not `"true"`/`"false"` — `aria-current`
  needs `${current ? "true" : "false"}` or it silently renders `aria-current=""`.
- Template literals permit arbitrary expressions, so keep templates to presentation.
  Anything that computes a value belongs in `scripts/generate.ts`.
- PO keys are short identifiers (`tagline`), not English sentences. Missing keys fall
  back to `en-GB`.
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
- Adding a page means a template, an entry in `src/i18n/routes.ts`, and rendering it
  into the `slot` map in `scripts/generate.ts`.
- GitHub Actions is an environment, not a pipeline: it checks out, installs mise,
  supplies credentials and a cache, then calls Taskfile targets. Anything a runner has
  and a laptop doesn't must arrive as an environment variable the Taskfile reads
  (`CI`, `CACHE_FROM`/`CACHE_TO`, `GH_TOKEN`) rather than as logic in the workflow. If
  a step can't be run locally, it's in the wrong file.
