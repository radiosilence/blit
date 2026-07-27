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
- [WebC](https://github.com/11ty/webc) expands `src/templates/*.html` — valid HTML in,
  static HTML out, with the view behind a Proxy so a mistyped path stops the build
  instead of rendering nothing
- [Lingui](https://lingui.dev) extracts and compiles the messages
- [markdown-it](https://github.com/markdown-it/markdown-it) renders the CV, passing
  through the inline HTML it already contained
- [TailwindCSS](https://tailwindcss.com) v4 with Geist Mono, compiled by its own CLI
- [aube](https://aube.en.dev) for packages, Node 24 via [mise](https://mise.jdx.dev)

Node runs the `.ts` files under `scripts/` directly via its built-in type stripping,
so there is no transpiler and no bundler anywhere in the pipeline.

## i18n

`src/locales/{locale}/messages.po` are the source of truth. A template passes the
English source text — `i18n._('change language')` — so the English is visible where
it's used rather than behind a key, and that text is the `msgid` a translator reads.
Untranslated messages fall back to `en-GB` rather than rendering blank, so a new
string is live everywhere the moment it's added; a message no catalogue has fails the
build, since the alternative is shipping a typo as itself.

Messages are ICU, so plurals and interpolation come for free, and they're written the
way gettext writes them — one `msgstr[n]` per form the language actually has, which is
what makes Poedit and Weblate show one input box per form:

```po
msgid "# locale"
msgid_plural "# locales"
msgstr[0] "# język"
msgstr[1] "# języki"
msgstr[2] "# języków"
```

Three boxes for Polish, two for French, one for Japanese. Catalogues are keyed by
Lingui's hash of the source text rather than the text itself, because po-gettext only
writes native plurals for ids it generated.

`task i18n:sync` extracts from the templates into every catalogue and reports what's
outstanding. Templates are valid HTML and every dynamic value is a JavaScript
expression in an attribute, so extraction is a parse5 tree walk that hands those
expressions to Lingui's own Babel extractor — nothing in this repo decides what
counts as a message.

## Assets

Every asset reaches a page through `asset('logo.png')`, which publishes it under a
content hash — `/logo.4d453d58.png` — and records that something wanted it. `dist/`
is built from what was referenced rather than copied wholesale, so a file nothing
points at stops shipping, a name nothing provides fails the build, and a path written
by hand instead of through the helper fails too.

The hashing is load-bearing rather than decorative: nano-web chooses caching by MIME
type alone, so CSS, images and fonts are all served `immutable, max-age=1y`. A stable
URL is a promise the build cannot keep. `favicon.ico` and `robots.txt` are the
exceptions — their URLs are a convention, not ours to choose, so they publish unhashed
and unconditionally.

The stylesheet and the web app manifest name other assets, so both are rewritten
before their own hash is taken; otherwise the font and the icons would also be fetched
at a second, unhashed URL that is cached just as hard.

The source locale is served at `/` and `/cv`; every other locale is prefixed
(`/fr-FR`, `/fr-FR/cv`). Pages are written as directory indexes — nano-web resolves
`/cv` to `/cv/index.html`, so URLs stay extensionless without a redirect.

## Commands

| Command             | Notes                                              |
| ------------------- | -------------------------------------------------- |
| `task dev`          | Rebuild on change, serve on :3000                  |
| `task build`        | Generate, compile CSS and copy assets into `dist/` |
| `task generate`     | Render the 72 pages only                           |
| `task check`        | Lint, formatting and types                         |
| `task ci`           | Exactly what CI runs — `check`, then `build`       |
| `task docker:build` | Build the container image                          |
| `task i18n:sync`    | Sync locale catalogues against the source          |
| `task clean`        | Drop `dist/` and Task's checksum cache             |

`task --list` shows the rest.

## Adding things

A **string**: write it in a template as `i18n._('the english text')`, then run
`task i18n:sync`. A **page**: add a template and an entry in `src/i18n/routes.ts`.
An **asset**: drop it in `src/static/` and reference it with `asset('name.ext')`.

## Deployment

Docker image → microk8s → CloudFlare Tunnel, via Pulumi in a separate IaC repo.
`dist/` is layered onto [nano-web](https://github.com/radiosilence/nano-web) and the
image tag is written into the IaC repo's Pulumi config, which Pulumi then rolls out.

GitHub Actions only supplies the environment — a checkout, the mise toolchain,
registry credentials and a build cache. Each step is a Taskfile target, so the same
pipeline runs on a laptop:

```bash
task ci                                # what the build job runs
task docker:build                      # what it publishes, minus the push
task deploy:update SHA=$(git rev-parse HEAD)   # what points prod at it
```

Anything a runner has and a laptop doesn't arrives as environment rather than as
workflow logic: `CI` selects `--frozen-lockfile`, `CACHE_FROM`/`CACHE_TO` select
GitHub's buildx cache over the local one, `GH_TOKEN` authorises the push to the IaC
repo. Unset, each falls back to the local equivalent.
