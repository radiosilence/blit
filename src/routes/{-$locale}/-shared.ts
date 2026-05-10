import { loadCatalog } from "@/i18n/catalogs";
import { isValidLocale, sourceLocale } from "@/i18n/config";
import { notFound } from "@tanstack/react-router";

export function localeLoader(locale?: string) {
  if (locale) {
    if (!isValidLocale(locale)) {
      throw notFound();
    }
    return loadCatalog(locale);
  } else {
    loadCatalog(sourceLocale);
  }
}
