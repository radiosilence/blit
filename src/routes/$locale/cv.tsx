import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/$locale/cv")({
  beforeLoad: async ({ params }: { params: { locale: string } }) => {
    if (!isValidLocale(params.locale)) {
      throw new Error(`Invalid locale: ${params.locale}`);
    }
    // Set paraglide language tag for SSR
    setLanguageTag(params.locale);
  },
  component: () => <div>CV page for locale</div>,
});
