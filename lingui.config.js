import { defineConfig } from "@lingui/cli";

export default defineConfig({
  sourceLocale: "en-GB",
  locales: [
    "en-GB",
    "fr-FR",
    "ar",
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
  ],
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["src"],
      exclude: ["**/node_modules/**"],
    },
  ],
  format: "po",
  compileNamespace: "es",
});
