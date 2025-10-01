import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import astroLingui from "astro-lingui";
import { locales, sourceLocale } from "./lingui.config";

export default defineConfig({
  output: "static",
  integrations: [
    mdx(),
    react(),
    astroLingui.integration({
      sourceLocale,
      locales,
      dir: "./src/locales",
    }),
  ],
  vite: {
    // biome-ignore lint/suspicious/noExplicitAny: do not care
    plugins: [tailwindcss() as any, react()],
  },
});
