import { createFileRoute } from "@tanstack/react-router";
import { Logo } from "~/components/logo";
import * as m from "~/paraglide/messages";
import { setLanguageTag } from "~/paraglide/runtime";

const supportedLocales = [
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
] as const;
type SupportedLocale = (typeof supportedLocales)[number];

const isValidLocale = (locale: string): locale is SupportedLocale => {
  return (supportedLocales as readonly string[]).includes(locale);
};

export const Route = createFileRoute("/$locale/")({
  beforeLoad: async ({ params }: { params: { locale: string } }) => {
    if (!isValidLocale(params.locale)) {
      throw new Error(`Invalid locale: ${params.locale}`);
    }
    // Set paraglide language tag for SSR
    setLanguageTag(params.locale);
  },
  loader: async ({ params }: { params: { locale: string } }) => {
    const locale = params.locale as SupportedLocale;
    return { locale };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { locale } = Route.useLoaderData();

  return (
    <section className="flex flex-col items-center m-12 space-y-4 text-center">
      <Logo width={256} className="mbs-12 mbe-8" />
      <h1>{m.home_name({ languageTag: locale })}</h1>
      <p className="text-sm">{m.home_role({ languageTag: locale })}</p>
      <p>
        <a href={`/${locale}/cv`}>{m.nav_cv({ languageTag: locale })}</a> /{" "}
        <a href="https://github.com/radiosilence">
          {m.nav_github({ languageTag: locale })}
        </a>
      </p>
    </section>
  );
}
