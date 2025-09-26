import { createFileRoute } from "@tanstack/react-router";
import * as z from "zod";
import { HomePage } from "~/pages/home";
import { setLanguageTag } from "~/paraglide/runtime";

const ParamsSchema = z.object({
  languageTag: z.enum([
    "en-GB",
    "fr-FR",
    "ar",
    "ja-JP",
    "zh-CN",
    "ka-GE",
    "uk-UA",
    "ar-PS",
    "it-IT",
    "de-DE",
    "nl-BE",
    "nl-NL",
    "pl-PL",
  ]),
});

export const Route = createFileRoute("/$languageTag/")({
  loader: ({ params }) => {
    const { data } = ParamsSchema.safeParse(params);

    return {
      languageTag: data?.languageTag ?? "en-GB",
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { languageTag } = Route.useLoaderData();

  // Set language tag for both SSR and CSR
  setLanguageTag(languageTag);

  return <HomePage languageTag={languageTag} />;
}
