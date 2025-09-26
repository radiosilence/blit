import { createFileRoute } from "@tanstack/react-router";
import * as z from "zod";
import { Logo } from "~/components/logo";
import * as m from "~/paraglide/messages";
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
  component: HomeRoute,
});

export function HomeRoute() {
  const { languageTag } = Route.useLoaderData();

  // Set language tag for both SSR and CSR
  setLanguageTag(languageTag);

  return (
    <section className="flex flex-col items-center m-12 space-y-4 text-center">
      <Logo width={256} className="mbs-12 mbe-8" />
      <h1>{m.home_name()}</h1>
      <p className="text-sm">{m.home_role()}</p>
      <p>
        <a href={`/${languageTag}/cv`}>{m.nav_cv()}</a> /{" "}
        <a href="https://github.com/radiosilence">{m.nav_github()}</a>
      </p>
    </section>
  );
}
