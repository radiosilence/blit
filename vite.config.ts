import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react-oxc";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { z } from "zod/v4";

const { target } = z
  .object({
    target: z.string().default("static"),
  })
  .parse(process.env);

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    { enforce: "pre", ...mdx() },
    tsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart({
      target,
      customViteReactPlugin: true,
      prerender: {
        enabled: true,
        autoSubfolderIndex: true,
      },
    }),
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
  ],
});
