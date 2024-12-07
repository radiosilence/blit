import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";

export default defineConfig({
  prefetch: {
    defaultStrategy: "viewport",
  },
  // integrations: [tailwind()],
});
