import { loadCatalog } from "#/i18n/catalogs";
import { isValidLocale } from "#/i18n/config";
import { notFound } from "@tanstack/react-router";

export function localeLoader(locale: string) {
  if (!isValidLocale(locale)) {
    throw notFound();
  }
  return loadCatalog(locale);
}
