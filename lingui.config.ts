import { defineConfig } from "@lingui/cli";

export const supportedLocales = [
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
] as const;

export default defineConfig({
  sourceLocale: "en-GB",
  locales: [...supportedLocales],
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
