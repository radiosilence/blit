import { createFileRoute } from "@tanstack/react-router";
import { HomeContent } from "../../components/home-content";
import { loadLocaleParam, pageHead } from "../-shared";

export const Route = createFileRoute("/$locale/")({
  loader: ({ params }) => loadLocaleParam(params.locale),
  head: pageHead,
  component: HomeContent,
});
