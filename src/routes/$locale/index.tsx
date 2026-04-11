import { createFileRoute } from "@tanstack/react-router";
import { HomeContent } from "../../components/home-content";
import { SsrDebug } from "../../components/ssr-debug";
import { loadLocaleParam, pageHead } from "../-shared";
import { getPageData } from "../-home.shared";

export const Route = createFileRoute("/$locale/")({
  loader: async ({ params }) => {
    loadLocaleParam(params.locale);
    return await getPageData();
  },
  head: pageHead,
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
