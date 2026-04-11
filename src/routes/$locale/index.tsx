import { i18n } from "@lingui/core";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { HomeContent } from "../../components/home-content";
import { loadCatalog } from "../../i18n/catalogs";
import { isValidLocale } from "../../i18n/config";

export const Route = createFileRoute("/$locale/")({
  loader: ({ params }) => {
    if (!isValidLocale(params.locale)) throw notFound();
    loadCatalog(params.locale);
  },
  head: () => ({
    meta: [{ title: i18n._("james cleveland : senior full stack engineer") }],
  }),
  component: HomeContent,
});
