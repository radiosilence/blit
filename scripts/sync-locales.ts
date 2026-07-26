/**
 * Propagates the source catalogue's keys to every other locale, adding new ones
 * with an empty `msgstr` and dropping ones that no longer exist. Replaces
 * `lingui extract`: rendering falls back to English regardless, so this exists
 * to give translators a visible list of what still needs doing.
 *
 * Also regenerates the MessageKey union, which is what makes a mistyped key a
 * type error rather than a blank string.
 */
import { writeFile } from "node:fs/promises";

import { catalogPath, readCatalog } from "#/i18n/catalogs.ts";
import { locales, sourceLocale } from "#/i18n/config.ts";
import { format } from "#/i18n/po.ts";

const source = await readCatalog(sourceLocale);

await writeFile(
  new URL("../src/i18n/keys.ts", import.meta.url),
  `// Generated from ${sourceLocale}/messages.po by \`task i18n:sync\`. Do not edit.\n` +
    `export type MessageKey =\n` +
    `${Object.keys(source)
      .map((key) => `  | ${JSON.stringify(key)}`)
      .join("\n")};\n`,
);

const untranslated = await Promise.all(
  locales.map(async (locale) => {
    const existing = locale === sourceLocale ? source : await readCatalog(locale);
    const messages = Object.fromEntries(
      Object.keys(source).map((key) => [key, existing[key] ?? ""]),
    );

    await writeFile(catalogPath(locale), format(locale, messages));

    return [locale, Object.values(messages).filter((value) => !value).length] as const;
  }),
);

for (const [locale, missing] of untranslated) {
  if (missing) console.log(`${locale}: ${missing} untranslated`);
}
