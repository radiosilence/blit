# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server (requires build first)
npm run start

# Lint and format code
npm run lint:biome
npm run lint:biome:fix

# Type checking
bun run typecheck
```

## Architecture Overview

This is a TanStack Start application for a personal website (blit.cc):

- **Runtime**: Node.js (Bun used only as package manager)
- **Framework**: TanStack Start with React 19
- **Styling**: TailwindCSS v4 with custom fonts (Geist Mono)
- **Content**: MDX for CV content rendering
- **Routing**: File-based routing via TanStack Router with auto-generated route tree
- **Build**: Vite with prerendering enabled for static site generation
- **Linting**: Biome for formatting and linting with lefthook git hooks
- **Deployment**: Docker containers with microk8s + CloudFlare Tunnel

Key architectural decisions:

- Routes are file-based in `src/routes/` with `__root.tsx` providing layout
- Static assets in `src/assets/` including favicons and fonts
- Components are minimal - only Logo component and MDX content
- Prerendering crawls all links for static generation
- Git hooks run Biome formatting and TypeScript checking on commit
