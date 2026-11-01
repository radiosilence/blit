# blit.cc personal site

![CI/CD](https://github.com/radiosilence/blit/actions/workflows/ci-cd.yml/badge.svg)

Static site for [blit.cc](https://blit.cc) — a homepage and a CV, in 36 locales.
The browser gets HTML, CSS and a font. No JavaScript at all.

## Why there's no framework

The site is two pages, seven translated strings and a markdown CV. Its only piece of
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
They come from ICU, resolved once into `generator/config.rs` rather than at build
time, because ICU4X exposes display names only in `icu_experimental` and this is data
that changes about as often as a language renames itself.

## Stack

- [just](https://just.systems) runs the recipes, and
  [watchexec](https://watchexec.github.io) reruns the build on change for `just dev`
- [Askama](https://askama.rs) renders `src/templates/*.html`, bound to a struct at
  compile time — a field a template names but the struct lacks fails `cargo build`
- `crates/askama_gettext` handles the messages: `__`/`__p`/`__n` in the template,
  extraction through Askama's own parser, plural selection from CLDR
- [pulldown-cmark](https://github.com/pulldown-cmark/pulldown-cmark) renders the CV,
  passing through the inline HTML it already contained
- [TailwindCSS](https://tailwindcss.com) v4 with Geist Mono
- [Typst](https://typst.app), as a library, typesets the same CV into `/cv.pdf`
- Everything the build needs is pinned in [mise](https://mise.jdx.dev): rust, just,
  watchexec, tailwind, gh. [nano-web](https://github.com/radiosilence/nano-web) serves
  `dist/` for `just dev` and is yours to install

The build is a Rust binary. Tailwind is the only JavaScript left in it — its
compiler genuinely is TypeScript, and Oxide is only the scanner — so it arrives as a
pinned tool rather than as a `package.json` and a `node_modules` tree.

## i18n

`src/locales/{locale}/messages.po` are the source of truth. A template passes the
English source text — `__("change language")` — so the English is visible where it's
used rather than behind a key, and that text is the `msgid` a translator reads.
Untranslated messages fall back to `en-GB` rather than rendering blank, so a new
string is live everywhere the moment it's added; a message no catalogue has fails the
build, since the alternative is shipping a typo as itself.

Plurals are written the way gettext writes them — one `msgstr[n]` per form the
language actually has, which is what makes Poedit and Weblate show one input box per
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

Adding a locale is a line in `generator/config.rs` and `just i18n-sync`, which writes
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
`generator/config.rs` decides what to do with one. This site serves them: most of a
sentence in your own language beats all of one in someone else's. `msgfmt` would do
the opposite, and that's the right default where a msgid is a key like `nav.close` —
here it's the English, so both answers are a real sentence and it's a judgement call
rather than a rule. Set it to `Fuzzy::Skip` to hold a drifted translation back until
someone reviews it.

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

`src/content/cv.md` is the whole CV. Edit it and `just build` writes both `/cv` and
`/cv.pdf` from it; nothing else needs touching. The PDF is typeset by Typst:
`generator/pdf.rs` translates the Markdown into Typst markup, `src/templates/cv.typ`
decides how it looks, and the fonts come from `src/fonts/`. It is a tagged PDF/UA-1
document in one column, so an applicant tracking system reads it in order.

The Markdown it understands, and what the PDF makes of it:

- The `#` heading is the name, and the two paragraphs under it are the title and the
  contact lines. Together they are the masthead, beside a logo sized to match them.
- `##` is a section, `###` a role. A `<small>` inside a `###` is that role's dates,
  set at the right margin; anywhere else it is small grey text.
- Paragraphs, lists (nested too), bold, italics, links and `code`, plus the inline
  HTML `<br/>`, `<small>`, `<em>` and `<strong>`.

Anything else fails the build with a message saying what, rather than vanishing from
the PDF: an image, table, code block or blockquote, any other HTML tag, a `#` heading
without its two paragraphs, or a character Geist Mono can't draw (PDF/UA refuses to
write one). `★` is the one character already handled; it reads as "stars".

## Adding things

A **string**: write it in a template as `__("the english text")`, then run
`just i18n-sync`. A **page**: add a template, a `page!` entry in
`generator/templates.rs` and a route in `generator/routes.rs`. An **asset**: drop it
in `src/static/` and reference it with `asset("name.ext")`.

## Deployment

Docker image → microk8s → CloudFlare Tunnel, via Pulumi in a separate IaC repo.
`dist/` is layered onto [nano-web](https://github.com/radiosilence/nano-web) and the
image tag is written into the IaC repo's Pulumi config, which Pulumi then rolls out.

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

| Domain   | Paths                                                                                              | Job             |
| -------- | -------------------------------------------------------------------------------------------------- | --------------- |
| `rust`   | `generator/`, `crates/`, `src/templates/`, `Cargo.*`, `askama.toml`, `justfile`, `mise.toml`     | Rust            |
| `site`   | the above and the rest of `src/`                                                                   | Site            |
| `docker` | `Dockerfile`, `justfile`, `mise.toml` on a pull request; on main, also anything in `site`          | Container image |
| `deps`   | `Cargo.*`, `crates/*/Cargo.toml`, `deny.toml`, `justfile`, `mise.toml`                              | Audit           |

Markdown outside `src/` is documentation and counts for nothing; a change under
`.github/` and a manual run count for everything. A job whose domain is untouched is
skipped, and a skipped job is a pass: the one required status is `Checks`, which fails
only when a job it needs failed or was cancelled. Changelog runs for every change.
Advisories are published against code that has not changed, so `audit.yml` also runs
`just audit` against main weekly; its ignores are in `deny.toml`, shared with the job. To
add a domain, add an output and a `touches` line to `changes`, gate the job on it with
`if:`, and add the job to `Checks`'s `needs`.

On main the container job pushes `ghcr.io/radiosilence/blit:<full sha>` alongside the
other checks; nothing deploys that tag. Once `Checks` passes, CD retags it as
`sha-<short>`, which jaritanet pins, and `latest`, then asks jaritanet to update.
