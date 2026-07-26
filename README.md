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

- [Dagger](https://dagger.io) orchestrates: every step is a function in `dagger/src`,
  running in a container, cached on its inputs
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

`dagger call sync-locales export --path=src` propagates the source locale's keys to
every catalogue, adding missing ones with an empty `msgstr` and reporting what's
outstanding. It also regenerates `src/i18n/keys.ts`, the `MessageKey` union, so a bad
key is a type error in the generator and a build failure in a template. Follow it with
`format` — the generator emits one key per line and oxfmt collapses the union.

The source locale is served at `/` and `/cv`; every other locale is prefixed
(`/fr-FR`, `/fr-FR/cv`). Pages are written as directory indexes — nano-web resolves
`/cv` to `/cv/index.html`, so URLs stay extensionless without a redirect.

## Using it

You need [mise](https://mise.jdx.dev) and a container runtime. `mise install` reads
`mise.toml` and fetches node, aube and dagger; Docker or OrbStack has to be running,
because every step happens in a container. Nothing else is installed on the host —
there is no `npm install` step, and `node_modules` on your machine is not used by
any command below.

```bash
dagger call serve up --ports=3000:3000        # the real image, on :3000
dagger call check                             # lint + typecheck + format check
dagger call build export --path=dist          # write the site to dist/
dagger call format export --path=.            # apply formatting
dagger call sync-locales export --path=src    # sync catalogues, then format
```

`dagger functions` lists everything; `dagger call <name> --help` describes one.

**Why the `export`.** Dagger cannot see the host filesystem, so a function that
changes files returns a `Directory` and you choose where it lands. Dropping the
`export` makes any of them a dry run — `dagger call format` tells you nothing was
wrong, `dagger call build` just produces the directory and discards it.

**Functions compose from the CLI**, which is the fastest way to poke at a failure:

```bash
dagger call image directory --path=/public entries   # what's actually in the image
dagger call deps terminal                            # a shell in the build container
dagger call deploy --sha=$(git rev-parse HEAD) --dry-run \
  --ghcr-token=env://GITHUB_TOKEN --deploy-token=env://DEPLOYMENT_PAT
```

Secrets are URIs — `env://VAR`, `file://path`, `cmd://gh auth token` — and are read
at call time rather than being baked into any cached layer.

**The first run is slow** (a few minutes: image pulls, a cold `aube install`).
After that the dependency layers stay cached and only what you changed re-runs.

**There is no watch, and a rebuild costs seconds rather than milliseconds** — every
call is a container round-trip. The trade is that `dagger call check` on a laptop is
the same execution CI performs, so "passes locally, fails in CI" stops being a class
of problem. If that trade ever stops being worth it, the answer is a watcher calling
`dagger call`, not a second build path.

**Dagger Cloud is optional.** The engine runs locally without an account; Cloud only
adds a web UI for traces. `DAGGER_NO_NAG=1` silences the prompt.

## Adding things

A **string**: add it to `src/locales/en-GB/messages.po`, reference it as `{{t.key}}`,
then run `sync-locales`. A **page**: add a template and an entry in
`src/i18n/routes.ts`.

## Deployment

Docker image → microk8s → CloudFlare Tunnel, via Pulumi in a separate IaC repo.
`dagger call deploy` builds the site, layers it onto
[nano-web](https://github.com/radiosilence/nano-web), pushes to ghcr and points the
deployment config at the tag it just pushed — so the deployed tag is the publish
call's return value rather than a sha reconstructed by a second job.

The push to the deployment repo is a plain `git` invocation in a container: Dagger's
git API is read-only, and it is the one step the engine can neither model nor cache.
`--dry-run` returns the diff instead of pushing.
