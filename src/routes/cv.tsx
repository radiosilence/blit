import { createFileRoute } from "@tanstack/react-router";
import { CvContent } from "../components/cv-content";
import { loadSourceLocale, pageHead } from "./-shared";

export const Route = createFileRoute("/cv")({
  loader: loadSourceLocale,
  head: pageHead,
  component: CvContent,
});
