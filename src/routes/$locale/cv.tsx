import { createFileRoute } from "@tanstack/react-router";
import { CvContent } from "../../components/cv-content";
import { loadLocaleParam, pageHead } from "../-shared";

export const Route = createFileRoute("/$locale/cv")({
  loader: ({ params }) => loadLocaleParam(params.locale),
  head: pageHead,
  component: CvContent,
});
