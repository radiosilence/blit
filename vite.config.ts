import { lingui } from "@lingui/vite-plugin";
import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
  optimizeDeps: {
    exclude: ["@tanstack/start-server-core"],
  },
  plugins: [
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
      },
    }),
    { enforce: "pre", ...mdx() },
    lingui(),
    tailwindcss(),
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
  ],
});
