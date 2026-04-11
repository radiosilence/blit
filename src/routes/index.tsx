import { i18n } from "@lingui/core";
import { createFileRoute } from "@tanstack/react-router";
import { HomeContent } from "../components/home-content";
import { SsrDebug } from "../components/ssr-debug";
import { loadCatalog } from "../i18n/catalogs";
import { sourceLocale } from "../i18n/config";
import { getPageData } from "./-home.shared";

export const Route = createFileRoute("/")({
  loader: async () => {
    loadCatalog(sourceLocale);
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
