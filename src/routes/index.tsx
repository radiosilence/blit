import { createFileRoute } from "@tanstack/react-router";
import { HomeContent } from "../components/home-content";
import { loadSourceLocale, pageHead } from "./-shared";

export const Route = createFileRoute("/")({
  loader: loadSourceLocale,
  head: pageHead,
  component: HomeContent,
});
