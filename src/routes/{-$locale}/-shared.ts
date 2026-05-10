import { notFound, redirect } from "@tanstack/react-router";

import { loadCatalog } from "#/i18n/catalogs";
import { isValidLocale, sourceLocale } from "#/i18n/config";

export function localeLoader(locale: string | undefined = sourceLocale) {
  if (!isValidLocale(locale)) throw notFound();
  return loadCatalog(locale);
}

export function maybeStripSourceLocale(locale: string | undefined) {
  if (locale === sourceLocale)
    throw redirect({
      params: (prev) => ({ ...prev, locale: undefined }),
      to: ".",
      replace: true,
    });
}
