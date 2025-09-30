import { defineConfig } from "@lingui/cli";
import linguiApi from "@lingui/cli/api";
import { astroExtractor } from "./extractors/astro";

export const locales = [
  "en-GB",
  "ar-PS",
  "de-DE",
  "fr-FR",
  "it-IT",
  "ja-JP",
  "ka-GE",
  "nl-BE",
  "nl-NL",
  "pl-PL",
  "uk-UA",
  "zh-CN",
];

export default defineConfig({
  sourceLocale: "en-GB",
  locales,
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["src"],
      exclude: ["**/node_modules/**"],
    },
  ],
  format: "po",
  compileNamespace: "es",
  extractors: [linguiApi.extractor, astroExtractor],
});
