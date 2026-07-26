# blit.cc personal site

![publish-web-container](https://github.com/radiosilence/blit/actions/workflows/publish-web-container.yml/badge.svg)

Static site for [blit.cc](https://blit.cc) — a homepage and a CV, in 36 locales.
The browser gets HTML, CSS and a font. No JavaScript at all.

## Why there's no framework

The site is two pages, six translated strings and a markdown CV. Its only piece of
interactivity is the language picker, so there was nothing for a client-side
framework to do.

The picker is a `<dialog>` driven entirely by attributes:

| Behaviour                    | Mechanism                             |
| ---------------------------- | ------------------------------------- |
| Open                         | `command="show-modal"` + `commandfor` |
| Click-outside and Esc        | `closedby="any"`                      |
| Close button                 | `<form method="dialog">`              |
| Scroll to the current locale | `autofocus` on the active link        |

Focus trapping and returning focus to the trigger are the element's own. The
principle is to lean on native elements for _behaviour_ and style them ourselves —
`<dialog>` is fully styleable, which is what separates it from something like
`<input type="date">` and its unstyleable shadow DOM.

This costs pre-2025 browsers: without `command` support the button does nothing.
Two lines of feature-detected script would buy that back if it ever matters.

Locale names come from ICU via `Intl.DisplayNames` at build time, so the picker
reads "日本語 / 日本" rather than "ja-JP" at no runtime cost.

## Stack

- [Task](https://taskfile.dev) orchestrates; steps declare `sources`/`generates` so
  nothing re-runs without cause
- [Eta](https://eta.js.org) renders `src/templates/*.html`, with the view wrapped in
  a Proxy so a mistyped key stops the build instead of rendering nothing
- [markdown-it](https://github.com/markdown-it/markdown-it) renders the CV, passing
  through the inline HTML it already contained
- [TailwindCSS](https://tailwindcss.com) v4 with Geist Mono, compiled by its own CLI
- [aube](https://aube.en.dev) for packages, Node 24 via [mise](https://mise.jdx.dev)

Node runs the `.ts` files under `scripts/` directly via its built-in type stripping,
so there is no transpiler and no bundler anywhere in the pipeline.

## i18n

`src/locales/{locale}/messages.po` are the source of truth. Keys are short
(`tagline`, not the English sentence) so templates read `{{t.tagline}}` with no
indirection, and `src/i18n/po.ts` — a ~40-line gettext reader/writer — is the entire
i18n runtime. Untranslated keys fall back to `en-GB` rather than rendering blank, so
a new string is live everywhere the moment it's added.

`task i18n:sync` propagates the source locale's keys to every catalogue, adding
missing ones with an empty `msgstr` and reporting what's outstanding. It also
regenerates `src/i18n/keys.ts`, the `MessageKey` union, so a bad key is a type error
in the generator and a build failure in a template.

The source locale is served at `/` and `/cv`; every other locale is prefixed
(`/fr-FR`, `/fr-FR/cv`). Pages are written as directory indexes — nano-web resolves
`/cv` to `/cv/index.html`, so URLs stay extensionless without a redirect.

## Commands

| Command          | Notes                                              |
| ---------------- | -------------------------------------------------- |
| `task dev`       | Rebuild on change, serve on :3000                  |
| `task build`     | Generate, compile CSS and copy assets into `dist/` |
| `task generate`  | Render the 72 pages only                           |
| `task i18n:sync` | Sync locale catalogues against the source          |
| `task clean`     | Drop `dist/` and Task's checksum cache             |

`task --list` shows the rest (lint, format, typecheck).

## Adding things

A **string**: add it to `src/locales/en-GB/messages.po`, reference it as `{{t.key}}`,
then run `task i18n:sync`. A **page**: add a template and an entry in
`src/i18n/routes.ts`.

## Deployment

Docker image → microk8s → CloudFlare Tunnel, via Pulumi in a separate IaC repo. CI
builds `dist/` on the runner and the publish job layers it onto
[nano-web](https://github.com/radiosilence/nano-web).
