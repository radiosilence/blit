import { defineConfig } from "@lingui/cli";
import linguiApi from "@lingui/cli/api";
import astroLingui from "astro-lingui/server";

export const sourceLocale = "en-GB";

export const locales = [
  "en-GB",
  "ar-EG",
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
  sourceLocale,
  locales,
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["src"],
      exclude: ["**/node_modules/**"],
    },
  ],
  format: "po",
  compileNamespace: "ts",
  extractors: [linguiApi.extractor, astroLingui.extractor],
});
