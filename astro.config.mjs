import mdx from "@astrojs/mdx";
import node from "@astrojs/node";
import { paraglideVitePlugin } from "@inlang/paraglide-js";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [mdx()],
  vite: {
    plugins: [
      paraglideVitePlugin({
        project: "./project.inlang",
        outdir: "./src/paraglide",
        outputStructure: "locale-modules",
        strategy: ["url", "baseLocale"],
      }),
      tailwindcss(),
    ],
  },
});
