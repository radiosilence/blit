import { i18n } from "@lingui/core";
import { notFound } from "@tanstack/react-router";
import { loadCatalog } from "../i18n/catalogs";
import { isValidLocale, sourceLocale } from "../i18n/config";

export function loadSourceLocale() {
  loadCatalog(sourceLocale);
}

export function loadLocaleParam(locale: string) {
  if (!isValidLocale(locale)) throw notFound();
  loadCatalog(locale);
}

export function pageHead() {
  return {
    meta: [{ title: i18n._("james cleveland : senior full stack engineer") }],
  };
}
