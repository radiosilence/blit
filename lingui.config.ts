import { defineConfig } from "@lingui/cli";
import { astroExtractor } from "./scripts/astro-extractor.mjs";

export const locales = [
  "en-GB",
  "fr-FR",
  "ja-JP",
  "zh-CN",
  "ka-GE",
  "uk-UA",
  "ar-PS",
  "it-IT",
  "de-DE",
  "nl-BE",
  "nl-NL",
  "pl-PL",
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
  extractors: [astroExtractor],
});
