import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
export default defineConfig({
  prefetch: {
    defaultStrategy: "viewport",
  },
  vite: { plugins: [tailwindcss()] },
});
