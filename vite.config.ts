import { lingui } from "@lingui/vite-plugin";
import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
        retryCount: 5,
        retryDelay: 500,
      },
    }),
    { enforce: "pre" as const, ...mdx() },
    lingui(),
    tailwindcss(),
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
  ],
});
