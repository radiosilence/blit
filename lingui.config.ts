import { defineConfig } from "@lingui/cli";
import linguiApi from "@lingui/cli/api";
import astroLingui from "astro-lingui/server";

export const sourceLocale = "en-GB";

export const locales = [
  "en-GB",
  "am-ET", // Amharic - Ethiopic script
  "ar-EG",
  "ar-PS",
  "bn-BD", // Bengali - beautiful curvy script
  "bo-CN", // Tibetan - stacked syllables
  "de-DE",
  "dv-MV", // Dhivehi (Maldivian) - Thaana script, RTL
  "el-GR", // Greek - classic
  "fr-FR",
  "gu-IN", // Gujarati
  "he-IL", // Hebrew - RTL
  "hi-IN",
  "hy-AM", // Armenian - unique alphabet
  "it-IT",
  "ja-JP",
  "ka-GE", // Georgian - gorgeous script
  "km-KH", // Khmer - most letters of any alphabet
  "kn-IN", // Kannada - South Indian
  "ko-KR", // Korean - Hangul
  "lo-LA", // Lao - curly and beautiful
  "ml-IN", // Malayalam - very round
  "mn-MN", // Mongolian - traditional vertical script
  "my-MM", // Burmese - circular letters
  "ne-NP", // Nepali - Devanagari
  "nl-BE",
  "nl-NL",
  "or-IN", // Odia - very curvy
  "pa-IN",
  "pl-PL",
  "si-LK", // Sinhala - Sri Lankan, super curly
  "ta-IN", // Tamil - ancient Dravidian
  "te-IN", // Telugu - looks like aliens wrote it
  "th-TH",
  "uk-UA",
  "vi-VN", // Vietnamese - Latin with wild diacritics
  "zh-CN",
  "zh-TW", // Traditional Chinese
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
