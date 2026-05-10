import { lingui } from "@lingui/vite-plugin";
import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { devtools } from "@tanstack/devtools-vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import rsc from "@vitejs/plugin-rsc";

import { locales } from "#/i18n/config.ts";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tanstackStart({
      rsc: {
        enabled: true,
      },
      prerender: {
        enabled: true,
        crawlLinks: true,
        autoStaticPathsDiscovery: true,
      },
      pages: locales
        .flatMap((locale) => [`/${locale}/`, `/${locale}/cv`])
        .map((path) => ({ path })),
    }),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    rsc(),
    { enforce: "pre", ...mdx() },
    lingui(),
    tailwindcss({}),
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
  ],
});
