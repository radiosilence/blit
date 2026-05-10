import { loadCatalog } from "#/i18n/catalogs.ts";
import { isValidLocale, sourceLocale } from "#/i18n/config.ts";
import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/{-$locale}")({
  beforeLoad: ({ params }) => {
    if (params.locale === sourceLocale)
      throw redirect({
        params: (prev) => ({ ...prev, locale: undefined }),
        to: ".",
        replace: true,
      });
  },
  loader: ({ params: { locale = sourceLocale } }) => {
    if (!isValidLocale(locale)) throw notFound();
    return loadCatalog(locale);
  },
});
