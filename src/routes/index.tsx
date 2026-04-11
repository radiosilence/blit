import { createFileRoute } from "@tanstack/react-router";
import { HomeContent } from "../components/home-content";
import { SsrDebug } from "../components/ssr-debug";
import { loadSourceLocale, pageHead } from "./-shared";
import { getPageData } from "./-home.shared";

export const Route = createFileRoute("/")({
  loader: async () => {
    loadSourceLocale();
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
