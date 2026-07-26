import { readFile } from "node:fs/promises";

import { type Locale, locales, sourceLocale } from "#/i18n/config.ts";
import type { MessageKey } from "#/i18n/keys.ts";
import { parse } from "#/i18n/po.ts";

/** One locale's strings. What templates take, and what `tsc` checks their keys against. */
export type Catalog = Record<MessageKey, string>;

export const catalogPath = (locale: string) =>
  new URL(`../locales/${locale}/messages.po`, import.meta.url);

export const readCatalog = async (locale: string) =>
  parse(await readFile(catalogPath(locale), "utf8"));

/**
 * Every locale, keyed by the source catalogue's keys. Missing or untranslated
 * entries fall back to the source locale so a new string renders in English
 * everywhere the moment it is added, rather than rendering blank.
 */
export async function loadCatalogs() {
  const entries = await Promise.all(
    locales.map(async (locale) => [locale, await readCatalog(locale)] as const),
  );
  const catalogs = Object.fromEntries(entries);
  const source = catalogs[sourceLocale] ?? {};

  return Object.fromEntries(
    entries.map(([locale]) => [
      locale,
      Object.fromEntries(
        Object.entries(source).map(([key, fallback]) => [key, catalogs[locale]?.[key] || fallback]),
      ),
    ]),
  ) as Record<Locale, Catalog>;
}
