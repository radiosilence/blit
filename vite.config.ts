import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { createElement } from "react";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
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
      transform: (code, id) => {
        if (id.slice(-3) === ".md") {
          return `
            import Markdown from "react-markdown";
            import rehypeRaw from "rehype-raw";
            import { createElement } from "react";
            const md = ${JSON.stringify(code)};
            export default createElement(Markdown, { rehypePlugins: [rehypeRaw], children: md });
          `;
        }
      },
    },
  ],
});
