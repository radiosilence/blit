import { formatter } from "@lingui/format-po-gettext";

import { webcExtractor } from "./scripts/webc-extractor.ts";
import { locales, sourceLocale } from "./src/i18n/config.ts";

/*
 * po-gettext writes a plural the way gettext does — `msgid`/`msgid_plural` and one
 * `msgstr[n]` per form the language actually has — so a translator's tooling offers
 * three boxes for Polish and two for French rather than one box of raw ICU. It
 * converts back to ICU on read, so nothing downstream sees the difference.
 *
 * This only applies to generated ids, which is why the extractor keys messages by
 * Lingui's hash of the source text rather than by the text itself.
 */
export default {
  locales: [...locales],
  sourceLocale,
  catalogs: [
    {
      path: "<rootDir>/src/locales/{locale}/messages",
      include: ["<rootDir>/src/templates"],
    },
  ],
  extractors: [webcExtractor],
  format: formatter({ origins: true, lineNumbers: true }),
};
