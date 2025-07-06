import { compile } from "@mdx-js/mdx";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart({
      target: "bun",
      prerender: {
        concurrency: 14,
        failOnError: true,
        enabled: true,
        crawlLinks: true,
      },
    }),
    {
      name: "markdown-loader",
      transform: async (code, id) => {
        if (id.slice(-3) === ".md") {
          try {
            const compiled = await compile(code, {
              outputFormat: "program",
              development: false,
            });

            return compiled.toString();
          } catch (error) {
            console.error("Error compiling markdown:", error);
            return `import { jsx as _jsx } from "react/jsx-runtime";
export default function() { return _jsx("div", { children: "Error processing markdown" }); }`;
          }
        }
      },
    },
  ],
});
