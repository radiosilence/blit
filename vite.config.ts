import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart({
      tsr: {
        srcDirectory: "app",
      },
      target: "bun",
      prerender: {
        enabled: true,
        filter: () => true,
        crawlLinks: true,
      },
    }),
  ],
});
