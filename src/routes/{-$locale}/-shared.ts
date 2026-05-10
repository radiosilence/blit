import { loadCatalog } from "#/i18n/catalogs";
import { isValidLocale, sourceLocale } from "#/i18n/config";
import { notFound } from "@tanstack/react-router";

export function localeLoader(locale: string = sourceLocale) {
  if (!isValidLocale(locale)) throw notFound();
  return loadCatalog(locale);
}
