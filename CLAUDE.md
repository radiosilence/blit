# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
task dev          # Rebuild on change, serve on :3000 with nano-web
task build        # css into .build/, then generate the site into dist/
task check        # clippy, rustfmt and tests
task ci           # What CI runs: check, then build
task i18n:sync    # Extract messages from the templates into every catalogue
task docker:build # Build the container image (PUSH/LATEST to publish)
task clean        # Drop dist/, .build/, target/ and Task's checksum cache
```

`task --list` is authoritative; prefer it over this list going stale.

## Architecture Overview

Personal website for [blit.cc](https://blit.cc). A static site generator with no
framework and no bundler — the browser receives HTML, CSS and a font, nothing else.

- **Generator**: Rust. `generator/` is the program, `src/` is what it renders
- **Templates**: [Askama](https://askama.rs) over `src/templates/*.html`, bound to a
  struct at compile time
- **i18n**: `crates/askama_gettext` — plain gettext `.po`, 36 locales, CLDR plurals
- **Content**: pulldown-cmark renders `src/content/cv.md`
- **Styling**: TailwindCSS v4 CLI, Geist Mono
- **Toolchain**: mise (`mise.toml`) — rust, task, tailwind, gh, yq. nano-web is not
  pinned there: it serves `dist/` for `task dev`, and nothing the build does needs a
  server
- **Deployment**: container image → k3s on a Hetzner VPS, behind Traefik terminating
  Let's Encrypt over DNS-01. Cloudflare serves DNS only, no proxy or tunnel. The
  cluster and this deployment are one Pulumi program in
  [jaritanet](https://github.com/radiosilence/jaritanet)

Key decisions:

- Nothing ships to the browser but HTML, CSS and a font. The locale picker runs on
  `command`/`commandfor`, `closedby="any"`, `<form method="dialog">` and `autofocus`.
  Reach for a native element and style it rather than adding script.
- Base element rules in `app.css` must stay inside `@layer base`. Unlayered CSS beats
  every `@layer` regardless of specificity, so an unlayered `a` silently overrides
  utilities like `no-underline`.
- Askama binds a template to a struct at compile time, so a field a template names
  but the struct lacks fails `cargo build`. That is the type check — there is no
  runtime view guard to maintain.
- `{% extends %}` requires a child to carry every field the layout names, so the
  `page!` macro lists the shared ones once and each page adds only what it uses. An
  unused field is then a warning worth listening to.
- The English lives in the template: `__("github")` is both what renders and the
  `msgid`. Untranslated strings fall back to the source locale, so a new string is
  live everywhere the moment it is written.
- Which `msgstr[n]` a count selects comes from CLDR, not from the catalogue's
  `Plural-Forms` expression — but the header is checked against CLDR and a
  disagreement fails the build rather than writing to a slot nobody will translate.
- The tags in a `__h` message are names, not markup. A translator can move
  `<cv>…</cv>` wherever the sentence needs it; code decides where it points, and
  anything unregistered is escaped.
- Every asset reaches a page through `asset('logo.png')`, which publishes it under a
  content hash and records the reference. Writing the path by hand fails the build,
  because the reference check resolves `href` and `src` against what was written.
- Hashing is not decoration. nano-web picks caching by MIME type alone, so CSS,
  images and fonts are all served `immutable, max-age=1y`. `favicon.ico` and
  `robots.txt` are the exceptions — their URLs are a convention, so they publish
  unhashed and always.
- `dist/` is written entirely by `generate`, which is what lets it delete anything
  that is not a page or a referenced asset.
- The stylesheet and the manifest are derived rather than copied: both name other
  assets, so they are rewritten before their own hash is taken. Tailwind compiles to
  `.build` so that rewrite has a fixed input.
- Tailwind is the only JavaScript left — its compiler is TypeScript, and Oxide is
  only the scanner. It arrives as a mise tool; `task css` links its typography plugin
  into place so `@plugin` resolves without a `package.json`.
- Pages are written as directory indexes (`dist/cv/index.html`) because nano-web
  resolves `/cv` to `/cv/`. Don't put extensions on internal links.
- Adding a page means a template, a `page!` entry in `generator/templates.rs`, and a
  route in `generator/routes.rs`.
- GitHub Actions is an environment, not a pipeline: it checks out, installs mise,
  supplies credentials and a cargo cache, then calls Taskfile targets. If a step
  can't be run locally, it's in the wrong file.
