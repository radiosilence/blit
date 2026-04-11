import { i18n } from "@lingui/core";
import { createFileRoute } from "@tanstack/react-router";
import { CvContent } from "../components/cv-content";
import { loadCatalog } from "../i18n/catalogs";
import { sourceLocale } from "../i18n/config";

export const Route = createFileRoute("/cv")({
  loader: () => loadCatalog(sourceLocale),
  head: () => ({
    meta: [{ title: i18n._("james cleveland : senior full stack engineer") }],
  }),
  component: CvContent,
});
