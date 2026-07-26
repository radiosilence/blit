# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
task dev          # Rebuild on change, serve on :3000
task build        # generate + css + static into dist/
task generate     # Render the 74 pages only
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
- **Templates**: Mustache over `src/templates/*.html`, rendered by `scripts/generate.ts`
- **Content**: markdown-it renders `src/content/cv.md`
- **Styling**: TailwindCSS v4 CLI, Geist Mono
- **i18n**: hand-rolled gettext in `src/i18n/po.ts`, 37 locales, `.po` files are the source of truth
- **Packages**: aube (`aube-lock.yaml`); toolchain via mise (`mise.toml`)
- **Deployment**: Docker → microk8s → CloudFlare Tunnel

Key decisions:

- Nothing in `package.json` is a runtime dependency; it is all build-time tooling.
  Keep the output free of JavaScript — the language picker is a `<details>` element
  and interactivity should stay declarative.
- Scripts under `scripts/` are `.ts` run directly by Node 24's type stripping — no
  transpiler. Keep them strippable: no enums, no namespaces, explicit `import type`.
- Templates are logic-less on purpose. Anything conditional belongs in
  `scripts/generate.ts`, not in a template.
- PO keys are short identifiers (`tagline`), not English sentences. Missing keys fall
  back to `en-GB`.
- Pages are written as directory indexes (`dist/cv/index.html`) because nano-web
  resolves `/cv` to `/cv/`. Don't put extensions on internal links.
- `task clean` must remove `.task` as well as `dist` — leaving the checksum cache makes
  the next build skip steps whose output was just deleted.
- Mustache's default escaper mangles `/` into `&#x2F;`; `generate.ts` overrides it.
- Adding a page means a template plus an entry in `src/i18n/routes.ts`.
