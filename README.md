# blit.cc personal site

![publish-web-container](https://github.com/radiosilence/blit/actions/workflows/publish-web-container.yml/badge.svg)

## What this does

Builds and deploys [blit.cc](https://blit.cc) — a personal website and CV.

### Stack

- [TanStack Start](https://tanstack.com/start) with React 19 — SSG via prerendering
- [Lingui](https://lingui.dev) for i18n (37 locales, including RTL) — server-side rendering, zero client flash
- [TailwindCSS](https://tailwindcss.com) v4 with Geist Mono variable font
- [Rolldown](https://rolldown.rs) (via rolldown-vite) for bundling
- [Bun](https://bun.sh) as package manager
- [oxlint](https://oxc.rs/docs/guide/usage/linter) + [oxfmt](https://oxc.rs/docs/guide/usage/formatter) for linting/formatting

### i18n

Locale catalogs live in `src/locales/{locale}/messages.po`. The `@lingui/vite-plugin` compiles them at import time — no manual `lingui compile` step needed. All 37 locale variants are prerendered at build time via `crawlLinks`.

Locale routing uses `$locale` path params (`/ja-JP/`, `/fr-FR/cv`). The default locale (en-GB) is also served at `/` and `/cv`.

### Deployment

Docker image → microk8s → CloudFlare Tunnel. Deployed via Pulumi (separate IaC repo).
Static output served by [nano-web](https://github.com/radiosilence/nano-web).
