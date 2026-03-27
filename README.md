# blit.cc personal site

![publish-web-container](https://github.com/radiosilence/blit/actions/workflows/publish-web-container.yml/badge.svg)

## What this does

Builds and deploys [blit.cc](https://blit.cc) — a personal website and CV.

### Stack

- [Astro](https://astro.build) with React 19 islands
- [Lingui](https://lingui.dev) for i18n (37 locales)
- [TailwindCSS](https://tailwindcss.com) v4 with Geist Mono font
- [Rolldown](https://rolldown.rs) (via rolldown-vite) for bundling
- [Bun](https://bun.sh) as package manager
- [Biome](https://biomejs.dev) for linting/formatting

### Deployment

Docker image → microk8s → CloudFlare Tunnel. Deployed via Pulumi (separate IaC repo).

blyat
