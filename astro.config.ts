import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import { lingui } from "@lingui/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  integrations: [mdx(), react()],
  vite: {
    // biome-ignore lint/suspicious/noExplicitAny: lingui is a dick
    plugins: [tailwindcss(), lingui() as unknown as any, react()],
  },
});
