import { readFile } from "node:fs/promises";

import { formatter } from "@lingui/format-po";

import { locales, sourceLocale } from "#/i18n/config.ts";

const po = formatter({ origins: true, lineNumbers: true });

export const catalogPath = (locale: string) =>
  new URL(`../locales/${locale}/messages.po`, import.meta.url);

/**
 * Messages stay as ICU source rather than being compiled to a catalogue module.
 * `i18n.load` accepts either, generation is the only runtime here, and a compile
 * step would mean 36 generated files in the tree to keep in sync with the .po
 * files they came from.
 */
async function readCatalog(locale: string) {
  const catalog = po.parse(await readFile(catalogPath(locale), "utf8"), {
    locale,
    sourceLocale,
    filename: catalogPath(locale).pathname,
  });

  return Object.fromEntries(
    Object.entries(catalog).map(([id, entry]) => [id, entry.translation || id]),
  );
}

/**
 * Every locale, with the source locale behind it. An id that a translator has not
 * reached yet renders as English rather than blank, which is also why a missing
 * translation is invisible in the output and only shows up in `task i18n:sync`.
 */
export async function loadCatalogs() {
  const entries = await Promise.all(
    locales.map(async (locale) => [locale, await readCatalog(locale)] as const),
  );
  const source = entries.find(([locale]) => locale === sourceLocale)?.[1] ?? {};

  return Object.fromEntries(
    entries.map(([locale, messages]) => [locale, { ...source, ...messages }]),
  );
}
