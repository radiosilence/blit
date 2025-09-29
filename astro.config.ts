import mdx from "@astrojs/mdx";
import { lingui } from "@lingui/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  integrations: [mdx()],
  vite: {
    plugins: [tailwindcss(), lingui() as any],
  },
});
