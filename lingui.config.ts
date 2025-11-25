import { defineConfig } from "@lingui/cli";
import linguiApi from "@lingui/cli/api";
import astroLingui from "astro-lingui/server";

export const sourceLocale = "en-GB";

export const locales = [
  "en-GB",
  "am-ET",
  "ar-EG",
  "ar-PS",
  "bn-BD",
  "bo-CN",
  "de-DE",
  "dv-MV",
  "el-GR",
  "fr-FR",
  "gu-IN",
  "hi-IN",
  "hy-AM",
  "it-IT",
  "ja-JP",
  "ka-GE",
  "km-KH",
  "kn-IN",
  "ko-KR",
  "lo-LA",
  "ml-IN",
  "mn-MN",
  "my-MM",
  "ne-NP",
  "nl-BE",
  "nl-NL",
  "or-IN",
  "pa-IN",
  "pl-PL",
  "si-LK",
  "ta-IN",
  "te-IN",
  "th-TH",
  "uk-UA",
  "vi-VN",
  "zh-CN",
  "zh-TW",
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
