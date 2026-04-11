import { i18n } from "@lingui/core";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { CvContent } from "../../components/cv-content";
import { loadCatalog } from "../../i18n/catalogs";
import { isValidLocale } from "../../i18n/config";

export const Route = createFileRoute("/$locale/cv")({
  loader: ({ params }) => {
    if (!isValidLocale(params.locale)) throw notFound();
    loadCatalog(params.locale);
  },
  head: () => ({
    meta: [{ title: i18n._("james cleveland : senior full stack engineer") }],
  }),
  component: CvContent,
});
