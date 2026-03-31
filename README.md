# blit.cc personal site

![publish-web-container](https://github.com/radiosilence/blit/actions/workflows/publish-web-container.yml/badge.svg)

## What this does

Builds and deploys [blit.cc](https://blit.cc) — a personal website and CV.

### Stack

- [Astro 6](https://astro.build) with React 19 islands
- [Lingui](https://lingui.dev) + [astro-lingui](https://github.com/radiosilence/astro-lingui) for i18n (37 locales, including RTL)
- [TailwindCSS](https://tailwindcss.com) v4 with Geist Mono variable font
- [Rolldown](https://rolldown.rs) (via rolldown-vite) for bundling
- [Bun](https://bun.sh) as package manager
- [oxlint](https://oxc.rs/docs/guide/usage/linter) + [oxfmt](https://oxc.rs/docs/guide/usage/formatter) for linting/formatting

### Deployment

Docker image → microk8s → CloudFlare Tunnel. Deployed via Pulumi (separate IaC repo).

blyat
