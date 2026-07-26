import { readFile } from "node:fs/promises";

import { locales, sourceLocale } from "#/i18n/config.ts";
import type { MessageKey } from "#/i18n/keys.ts";
import { parse } from "#/i18n/po.ts";

export const catalogPath = (locale: string) =>
  new URL(`../locales/${locale}/messages.po`, import.meta.url);

export const readCatalog = async (locale: string) =>
  parse(await readFile(catalogPath(locale), "utf8"));

/**
 * The `__` templates call. Message ids are the source text, so an id that no
 * catalogue has yet renders as English rather than blank or a key name — which
 * is also why a missing translation is invisible in the output and only shows
 * up in `task i18n:sync`.
 */
export const translator = (messages: Record<string, string>) => (id: string) => {
  /*
   * Falling back to the id would render a mistyped one as itself — `__('githubb')`
   * shipping "githubb" — which is the one way this scheme is weaker than keys.
   * Every extracted id is in every catalogue, so an unknown one means a typo or a
   * string that was never extracted, and both should stop the build.
   */
  if (!(id in messages)) {
    throw new Error(`No message \`${id}\`. If it is new, run \`task i18n:sync\` to extract it.`);
  }
  return messages[id] || id;
};

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
  ) as Record<string, Record<MessageKey, string>>;
}
