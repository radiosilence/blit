import { paraglide } from "@inlang/paraglide-vite";
import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    { enforce: "pre", ...mdx() },
    paraglide({
      project: "./project.inlang",
      outdir: "./src/paraglide",
    }),
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart({
      prerender: {
        enabled: true,
        autoSubfolderIndex: true,
      },
    }),
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
  ],
});
