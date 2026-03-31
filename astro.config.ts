import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import astroLingui from "astro-lingui/server";
import { locales, sourceLocale } from "./lingui.config";

export default defineConfig({
  integrations: [
    mdx(),
    react(),
    astroLingui.integration({
      locales,
      path: "<rootDir>/src/locales/{locale}/messages.ts",
      sourceLocale,
    }),
  ],
  vite: {
    optimizeDeps: {
      exclude: ["virtual:astro-lingui-config", "virtual:astro-lingui-modules"],
    },
    plugins: [tailwindcss() as any, react()],
  },
});
