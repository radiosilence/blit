import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // tsr: {
  //   appDirectory: "app",
  // },
  server: {
    // preset: "bun",
    // prerender: {
    //   routes: ["/", "/cv"],
    //   crawlLinks: true,
    // },
  },
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
  ],
});
