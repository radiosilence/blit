import { formatter } from "@lingui/format-po";

import { webcExtractor } from "./scripts/webc-extractor.ts";
import { locales, sourceLocale } from "./src/i18n/config.ts";

/*
 * Plain po rather than po-gettext. Message ids are the source text, and
 * po-gettext only reaches gettext's `msgid_plural` when a message is supplied
 * alongside the id — which for a plural means writing the same ICU string twice
 * in the template, to land a `msgid_plural` of `<the whole ICU string>_plural`.
 * Here a plural is one entry whose msgstr is ICU, which is what a translator
 * edits either way.
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
