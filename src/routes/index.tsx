import { createFileRoute } from "@tanstack/react-router";
import { HomeRoute } from "~/routes/$languageTag/index";

export const Route = createFileRoute("/")({
  loader: () => {
    return { languageTag: "en-GB" };
  },
  component: HomeRoute,
});
