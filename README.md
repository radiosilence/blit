# blit.cc personal site

![publish-web-container](https://github.com/radiosilence/blit/actions/workflows/publish-web-container.yml/badge.svg)

## What this does

Builds and deploys [blit.cc](https://blit.cc) — a personal website and CV.

### Stack

- [TanStack Start](https://tanstack.com/start) with React 19 — SSG via prerendering, SSR capable
- [Lingui](https://lingui.dev) + `@lingui/vite-plugin` for i18n (37 locales, RTL) — server-side rendering, zero client flash
- [TailwindCSS](https://tailwindcss.com) v4 with Geist Mono variable font
- [Vite 8](https://vite.dev) (rolldown-vite) for bundling
- [Bun](https://bun.sh) as package manager and SSR runtime
- [oxlint](https://oxc.rs/docs/guide/usage/linter) + [oxfmt](https://oxc.rs/docs/guide/usage/formatter) for linting/formatting

### i18n

Locale catalogs live in `src/locales/{locale}/messages.po`. The `@lingui/vite-plugin` compiles them at import time — no manual `lingui compile` step. All 37 locale catalogs are loaded eagerly via `import.meta.glob` for synchronous hydration (zero flash).

Locale routing uses `$locale` path params (`/ja-JP/`, `/fr-FR/cv`). Default locale (en-GB) also served at `/` and `/cv`. All 76 pages prerendered at build time — a hidden `<nav>` in the root layout seeds the prerender crawler with every locale/page URL.

### Running

| Mode | Command | Notes |
|------|---------|-------|
| Dev | `bun run dev` | Vite dev server with HMR |
| Preview | `bun run build && bun run preview` | Preview full build locally |
| SSG | `bun run build` | Output in `dist/client/` |
| SSR | `bun run build && bun run serve` | Standalone Bun server on port 3000 |

### Deployment

Docker image → microk8s → CloudFlare Tunnel. Deployed via Pulumi (separate IaC repo).
SSG output served by [nano-web](https://github.com/radiosilence/nano-web) from `dist/client/`.
