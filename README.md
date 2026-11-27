# blit.cc personal site

![CI/CD](https://github.com/radiosilence/blit/actions/workflows/ci-cd.yml/badge.svg)

A server-rendered site for [blit.cc](https://blit.cc), deployed as its static prerender — a homepage and a CV, in 36 locales.
The browser gets HTML, CSS and a font. No JavaScript at all.

## Why there's no framework

The site is two pages, seven translated strings and a CV written in Typst. Its only piece of
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

Locale names are endonyms — the picker reads "日本語 / 日本" rather than "ja-JP".
They come from ICU, resolved once into `crates/blit/src/config.rs` rather than at build
time, because ICU4X exposes display names only in `icu_experimental` and this is data
that changes about as often as a language renames itself.

## Stack

- [just](https://just.systems) runs the recipes, and
  [watchexec](https://watchexec.github.io) reruns the build on change for `just dev`
- [Askama](https://askama.rs) renders `crates/blit/templates/`, bound to a struct at
  compile time — a field a template names but the struct lacks fails `cargo build`
- `crates/askama_gettext` handles the messages: `__`/`__p`/`__n` in the template,
  extraction through Askama's own parser, plural selection from CLDR
- [TailwindCSS](https://tailwindcss.com) v4 with Geist Mono
- [Typst](https://typst.app), as a library, typesets the CV into both `/cv` and
  `/cv.pdf`
- Everything the build needs is pinned in [mise](https://mise.jdx.dev): rust, just,
  watchexec, tailwind, gh. [nano-web](https://github.com/radiosilence/nano-web) serves
  `dist/` for `just dev` and is yours to install

The build is a Rust binary. Tailwind is the only JavaScript left in it — its
compiler is TypeScript, and Oxide is only the scanner — so it arrives as a
pinned tool rather than as a `package.json` and a `node_modules` tree.

## How it is put together

The site is a server-rendered app: a table of routes, each answered by a page that
renders a template, served by axum. The static site is a prerender of that server,
in the way TanStack Start prerenders: `blit-prerender` starts the router in
process, requests `/`, follows every internal link it finds in a page, the
stylesheet or the manifest, and writes each response to `dist/` (a page as a
directory index). What no link reaches is declared in `src/prerender.rs`, as
patterns over the app's own configuration: `EachLocale("")` is every locale's home,
from the locale table, and the files asked for by name are listed as paths. The static build has no render path of its own, so
`dist/` holds exactly what the server answers, and only what something links to.
A link that does not answer 200, or a route no link reaches, fails the build.

```bash
just serve   # the server: renders each page on request at http://127.0.0.1:3000
just build   # the static site: prerenders into dist/, which production serves
just dev     # rebuilds dist/ on change and serves it with nano-web, as production does
```

The server reads `BLIT_ADDR` (default `127.0.0.1:3000`) and `RUST_LOG` (default
`blit=info,warn`), and answers `/healthz`.

```
crates/blit/
  src/
    app.rs            App: catalogues, assets and the CV, loaded once; render(locale, route)
    routes.rs         the route table and the URL scheme
    layout.rs         Page, what every page shares with layout.html
    pages/            one module per page: its template struct and its render handler
    server.rs         the router: every locale × route, the assets, the perimeter and headers
    main.rs           the server
    prerender.rs      what the crawl cannot find by itself: entries over the locales, fixed files
    bin/blit-prerender.rs  the crawl into dist/
    bin/blit-i18n.rs  extraction into the catalogues
    assets.rs  config.rs  cv.rs
  templates/          layout.html, pages/, and cv.typ, the CV's Typst styling
  styles/app.css      Tailwind's input
  assets/             icons, the font, the logo, robots.txt and the manifest
  locales/            one gettext catalogue per locale
  content/cv.typ      the CV
  fonts/              the fonts Typst typesets the CV with
crates/askama_gettext/  gettext for askama templates
```

Each page's struct is a plain `#[derive(Template)]` holding a `Page` and
dereferencing to it, so the layout's fields are declared once, askama's generated
`self.locale` reaches them through `Deref`, and askama-analyzer, which finds
templates by their derive, sees every page.

## i18n

`crates/blit/locales/{locale}/messages.po` are the source of truth. A template passes the
English source text — `__("change language")` — so the English is visible where it's
used rather than behind a key, and that text is the `msgid` a translator reads.
Untranslated messages fall back to `en-GB` rather than rendering blank, so a new
string is live everywhere the moment it's added.

Plurals are written the way gettext writes them — one `msgstr[n]` per form the
language has, which is what makes Poedit and Weblate show one input box per
form:

```po
msgid "# locale"
msgid_plural "# locales"
msgstr[0] "# język"
msgstr[1] "# języki"
msgstr[2] "# języków"
```

Three boxes for Polish, two for French, one for Japanese. Which one a count selects
comes from CLDR rather than from evaluating the `Plural-Forms` expression — but the
header is checked against CLDR both ways, so a catalogue that disagrees fails the
build instead of leaving a slot nobody will translate.

Both halves of it, because the count alone isn't enough. French and English both have
two forms, and French puts zero in the singular where English doesn't; a header with
the right `nplurals` and the wrong expression numbers a translator's boxes one way
while the site selects them another. So the expression is parsed and evaluated
against CLDR for every count up to a thousand, and the build names the smallest one
they differ on.

Adding a locale is a line in `crates/blit/src/config.rs` and `just i18n-sync`, which writes
the catalogue. The `Plural-Forms` header it needs is found rather than looked up:
known gettext expressions are offered to CLDR one at a time and the first it confirms
is kept, so what's written has been checked against the same source that decides
which form renders. A language none of them fits is an error rather than a guess.

`just i18n-sync` extracts from the templates into every catalogue and reports what's
outstanding. Extraction walks Askama's own AST, so it recognises no template syntax
of its own and can't drift from what Askama accepts. Translations, translator
comments, flags and header metadata all survive a round trip.

Reword a string and its translations follow it. A message that's left the templates
is offered to one that's arrived, and if they're the same sentence with a few words
changed the translation moves across and is flagged `fuzzy` — reworded English is
the same message with a new id, and the alternative is asking 36 languages for a
string they already have. What finds nowhere to go is deleted. Both are named in the
output, because between them they're everything extraction does to a translator's
work and `just dev` runs it on every save.

Which leaves `fuzzy` meaning only what a translator meant by it, so `FUZZY` in
`crates/blit/src/config.rs` decides what to do with one. This site skips them, as `msgfmt`
does: the merge's own rewordings are the common source of the flag, and serving one
renders a translation of a sentence that no longer exists. Here a msgid is the English
rather than a key like `nav.close`, so skipping costs only what an untranslated string
already costs. `Fuzzy::Serve` shows a drifted translation anyway, on the argument that
most of a sentence in your own language beats all of one in someone else's.

## Assets

Every asset reaches a page through `asset('logo.png')`, which publishes it under a
content hash — `/logo.4d453d58.png` — and records that something wanted it. `dist/`
is built from what was referenced rather than copied wholesale, so a file nothing
points at stops shipping, a name nothing provides fails the build, and a path written
by hand instead of through the helper fails too.

The hashing is what makes the caching correct: nano-web chooses caching by MIME type
alone, so CSS, images and fonts are all served `immutable, max-age=1y`, and a stable
URL is a promise the build cannot keep. `favicon.ico` and `robots.txt` are exceptions
because their URLs are a convention, not ours to choose. `cv.pdf` is one because its
link gets pasted into application forms; nano-web serves a PDF for an hour, not a
year. All three publish unhashed and unconditionally.

The stylesheet and the web app manifest name other assets, so both are rewritten
before their own hash is taken; otherwise the font and the icons would also be fetched
at a second, unhashed URL that is cached just as hard.

The source locale is served at `/` and `/cv`; every other locale is prefixed
(`/fr-FR`, `/fr-FR/cv`). Pages are written as directory indexes — nano-web resolves
`/cv` to `/cv/index.html`, so URLs stay extensionless without a redirect.

## Commands

| Command             | Notes                                              |
| ------------------- | -------------------------------------------------- |
| `just dev`          | Rebuild on change, serve on :3000                  |
| `just build`        | Compile CSS, then generate the site into `dist/`   |
| `just generate`     | Render every locale × page only                    |
| `just check`        | Clippy, rustfmt, tests, actionlint, changelog      |
| `just ci`           | Everything CI checks: `check`, `audit`, `build`    |
| `just docker-build` | Build the site, then the container image           |
| `just i18n-sync`    | Sync locale catalogues against the source          |
| `just clean`        | Drop `dist/`, `.build/` and `target/`              |

`just --list` shows the rest.

## The CV

`crates/blit/content/cv.typ` is the whole CV. Edit it and `just build` writes both `/cv` and
`/cv.pdf` from it. `crates/blit/src/cv.rs` compiles it twice in-process: as pages for a
tagged PDF/UA-1 document in one column, so an applicant tracking system reads it in
order, and as HTML whose `<body>` becomes the page's article. One source means the
two cannot drift apart.

The content says what each piece is and `crates/blit/templates/cv.typ` decides how it looks,
branching on `target()`:

- `cv.with(..)` takes the name, title and contact details, which become the
  masthead: beside a logo sized to match on paper, plain on the page.
- `=` is a section. `job(..)` is a role, taking its dates as data (`from: 2025,
  to: none` reads "2025–Present") and its key skills as an array. A role given a
  `label` can be linked to, so the Selected Work leads jump to the role they
  summarise in both the PDF and the page.
- `project(..)` is an open source entry; `stars: 240` reads "240+★" on the page and
  "240+ stars" on paper, where Geist Mono has no star.
- Skills are a terms list, and the PDF's keywords come from the same arrays.

Any warning from either compile fails the build, because each one is content that
one target dropped or set wrongly: an element HTML export ignores, a font that
isn't there. Typst's notice that HTML export is experimental is the one exception.
The page's article must also carry no inline style, embedded file or inline SVG,
since these would bypass the stylesheet or the asset pipeline, or draw text that
can't be selected.

The world is rooted at `crates/blit/` and reads no system fonts and no packages, so the CLI
and an editor preview compile exactly what the build does:

```sh
typst compile --root crates/blit --font-path crates/blit/fonts --ignore-system-fonts crates/blit/content/cv.typ
```

For tinymist, set `tinymist.rootPath` to `crates/blit`, `tinymist.fontPaths` to
`["crates/blit/fonts"]` and `tinymist.systemFonts` to `false`. Anything written with `html.*`
sits behind `target()`, so the paged preview needs no HTML feature enabled.

## Adding things

A **string**: write it in a template as `__("the english text")`, then run
`just i18n-sync`. A **page**: add `templates/pages/<name>.html` extending
`layout.html`, a module in `src/pages/` holding its `#[derive(Template)]` struct
(a `page: Page` field, `Deref` to it, and whatever else its template uses) with a
`render` function, and a `Route` naming it in `src/routes.rs`. An **asset**: drop it
in `crates/blit/assets/` and reference it with `asset("name.ext")`.

## Deployment

A container image on k3s on a Hetzner VPS, behind Traefik terminating Let's Encrypt
over DNS-01; Cloudflare serves DNS only. The cluster and this deployment are one Pulumi
program in [jaritanet](https://github.com/radiosilence/jaritanet). `dist/` is layered
onto [nano-web](https://github.com/radiosilence/nano-web), and the deployment pins
`sha-<short>`, which CD writes once `Checks` has passed and then asks jaritanet to pick
up.

The published tag is a manifest list for `linux/amd64` and `linux/arm64`, built in one
pass — the image is a `COPY` onto a base that already covers both, so there is nothing
to emulate. A local `just docker-build` loads the host's architecture only, since
`--load` takes a single image rather than a list.

GitHub Actions supplies the environment — a checkout, the mise toolchain, registry
credentials and a build cache — and decides what runs. Each step is a just
recipe, so the same pipeline runs on a laptop:

```bash
just lint fmt-check test               # what the Rust job runs
just changelog-check                   # what the Changelog job runs
just build                             # what the Site job runs
just docker-image                      # what the Container image job builds from dist/
just docker-promote                    # what CD tags once Checks has passed
just deploy-update                     # asks prod to pick the build up
```

Anything a runner has and a laptop doesn't arrives as environment rather than as
workflow logic: `CI` selects an optimised build over the fast debug one the watch loop
wants, `CACHE_FROM`/`CACHE_TO` select a shared buildx cache over the local one, and
`GH_TOKEN` authorises asking the deployment repository to update. Unset, each falls
back to the local equivalent.

### CI/CD

`.github/workflows/ci-cd.yml` is one run in two halves. Its first job, `changes`,
diffs the change (a pull request against its base, a push against the last main
commit whose run passed) and sets one flag per domain:

| Domain   | Paths | Job |
| -------- | ----- | --- |
| `rust`   | `crates/askama_gettext/`, and in `crates/blit/` the `src/`, `templates/`, `content/`, `fonts/`, `locales/`, `assets/` and `Cargo.toml`, which the server tests load; `Cargo.*`, `justfile`, `mise.toml` | Rust |
| `site`   | the above and the rest of `crates/` | Site |
| `docker` | `Dockerfile`, `justfile`, `mise.toml` on a pull request; on main, also anything in `site` | Container image |
| `deps`   | `Cargo.*`, `crates/*/Cargo.toml`, `deny.toml`, `justfile`, `mise.toml` | Audit |

Markdown outside `crates/blit/content/` is documentation and counts for nothing; a change under
`.github/` and a manual run count for everything. A job whose domain is untouched is
skipped, and a skipped job is a pass: the one required status is `Checks`, which fails
only when a job it needs failed or was cancelled. Changelog runs for every change. To
add a domain, add an output and a `touches` line to `changes`, gate the job on it with
`if:`, and add the job to `Checks`'s `needs`.

Advisories are published against code that has not changed, so `audit.yml`, which
`ci-cd.yml` calls for `deps`, also runs `just audit` against main weekly. Its ignores
are in `deny.toml`.

On main the container job pushes `ghcr.io/radiosilence/blit:<full sha>` alongside the
other checks; nothing deploys that tag. Once `Checks` passes, CD retags it as
`sha-<short>`, which jaritanet pins, and `latest`, then asks jaritanet to update.
