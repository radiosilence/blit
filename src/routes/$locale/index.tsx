import { i18n } from "@lingui/core";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { HomeContent } from "../../components/home-content";
import { SsrDebug } from "../../components/ssr-debug";
import { loadCatalog } from "../../i18n/catalogs";
import { isValidLocale } from "../../i18n/config";
import { getPageData } from "../-home.shared";

export const Route = createFileRoute("/$locale/")({
  loader: async ({ params }) => {
    if (!isValidLocale(params.locale)) throw notFound();
    loadCatalog(params.locale);
    return await getPageData();
  },
  head: () => ({
    meta: [{ title: i18n._("james cleveland : senior full stack engineer") }],
  }),
  component: () => {
    const data = Route.useLoaderData();
    return (
      <>
        <HomeContent />
        <SsrDebug data={data} />
      </>
    );
  },
});
