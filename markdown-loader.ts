import { compile } from "@mdx-js/mdx";
import type { PluginOption } from "vite";

export const markdownLoader = (): PluginOption => ({
  name: "markdown-loader",
  transform: async (code, id) => {
    if (id.slice(-3) === ".md") {
      return String(
        await compile(code, {
          outputFormat: "program",
          development: false,
        }),
      );
    }
  },
});
