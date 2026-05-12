# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
aube run dev

# Build for production
aube run build

# Preview production build
aube run preview

# Lint code
aube run lint
aube run lint:fix

# Format code
aube run format
aube run format:check

# Type checking
aube run typecheck

# i18n string extraction and compilation
aube run lingui:extract
aube run lingui:compile
```

## Architecture Overview

Personal website for [blit.cc](https://blit.cc), built with Astro:

- **Package manager**: aube (pnpm-style isolated `node_modules`, reads `aube-lock.yaml`)
- **Framework**: Astro 5 with React 19 (for interactive islands)
- **Styling**: TailwindCSS v4 with Geist Mono font
- **Content**: MDX for CV content
- **i18n**: Lingui with 37 locales, PO file format, compiled to TypeScript
- **Routing**: File-based via Astro (`src/pages/`) with dynamic `[locale]` segments
- **Build**: Rolldown (via rolldown-vite) with static output
- **Linting**: oxlint for linting, oxfmt for formatting, lefthook for git hooks
- **Deployment**: Docker → microk8s → CloudFlare Tunnel

Key decisions:

- Static site generation (`output: "static"`) — no server runtime needed
- Favicons in `src/assets/` (Astro-processed), icons for manifest in `public/`
- Locale files: `.po` sources committed, compiled `.ts` files gitignored
- Git hooks run oxlint, oxfmt, and TypeScript checking on commit
