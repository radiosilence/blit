# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
dagger call serve up --ports=3000:3000        # Run the real image on :3000
dagger call build export --path=dist --wipe   # Write the site to dist/
dagger call check                             # lint + typecheck + format check
dagger call format export --path=.            # Apply formatting
dagger call sync-locales export --path=src    # Propagate source-locale keys
dagger call deploy --sha=… --dry-run          # Show the deployment diff
```

`dagger functions` is authoritative; prefer it over this list going stale.

## Architecture Overview

Personal website for [blit.cc](https://blit.cc). A static site generator with no
framework and no bundler — the browser receives HTML, CSS and a font, nothing else.

- **Orchestration**: [Dagger](https://dagger.io); every step is a function in `dagger/main.go`
- **Templates**: Eta over `src/templates/*.html`, rendered via `scripts/render.ts`
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
- Scripts under `scripts/` are `.ts` run directly by Node 24's type stripping — no
  transpiler. Keep them strippable: no enums, no namespaces, explicit `import type`.
- Eta permits arbitrary expressions, so keep templates to presentation. Anything that
  computes a value belongs in `scripts/generate.ts`.
- oxfmt is pointed away from `src/templates` (`.oxfmtrc.json`): it parses them as HTML
  and Eta tags aren't valid in attribute position.
- `scripts/render.ts` wraps the view in a Proxy that throws on unknown keys, so a
  template typo fails the build with the path and the keys that do exist. Generation
  time is the only runtime here, so this is the type check.
- PO keys are short identifiers (`tagline`), not English sentences. Missing keys fall
  back to `en-GB`.
- Pages are written as directory indexes (`dist/cv/index.html`) because nano-web
  resolves `/cv` to `/cv/`. Don't put extensions on internal links.
- The module is Go purely for cold-start: the TypeScript SDK re-evaluates the module in
  a node runtime on every call, measured at 6.5s per rebuild against Go's 2.4s. It is
  the only Go in the repository, so `gofmt-check` runs in `check` to stop the build
  definition being the one unchecked thing here.
- The module's constructor `ignore` list replaces `.dockerignore`, and is load-bearing
  beyond that: because the source carries no `node_modules`, the full-source overlay
  can sit on top of the install layer without clobbering it. Editing a template leaves
  `mise install` and `aube install` cached.
- Dagger cannot touch the host filesystem, so anything that rewrites files returns a
  `Directory` and the caller applies it with `export`. Omitting `export` is a dry run.
- `sync-locales` emits the `MessageKey` union one key per line; oxfmt collapses it.
  Run `format` after it or the next `check` fails.
- The deployment push is a `git` invocation in a container — Dagger's git API is
  read-only. It is the only step with an effect the engine can neither model nor
  cache, which is why it guards on `git diff --quiet` rather than assuming a change.
- `dist/` does not exist in the build container until the build creates it, so there
  are never stale pages to prune. Staleness now only exists on the host, which is why
  `build export` passes `--wipe`: export merges by default and would otherwise leave a
  removed locale's directory behind.
- `static` is deliberately unfingerprinted: its output is a directory rather than one
  named file, so a partially-deleted `dist/` can't be detected. Copying is cheap.
- `/style.css` carries a content digest as a query string. nano-web serves CSS
  `immutable, max-age=1y`, so a stable URL would strand visitors on old styles.
- Adding a page means a template plus an entry in `src/i18n/routes.ts`.
