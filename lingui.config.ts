import { defineConfig } from "@lingui/cli";
import { locales, sourceLocale } from "./src/i18n/config";

export default defineConfig({
  sourceLocale,
  locales: [...locales],
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["src"],
      exclude: ["**/node_modules/**"],
    },
  ],
  format: "po",
});
