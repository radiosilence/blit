import { createFileRoute } from "@tanstack/react-router";
import { setLanguageTag } from "~/paraglide/runtime";

const supportedLanguageTags = [
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
type SupportedLanguageTag = (typeof supportedLanguageTags)[number];

const isValidLanguageTag = (
  languageTag: string,
): languageTag is SupportedLanguageTag => {
  return (supportedLanguageTags as readonly string[]).includes(languageTag);
};

export const Route = createFileRoute("/$locale/cv")({
  beforeLoad: ({ params }: { params: { locale: string } }) => {
    if (!isValidLanguageTag(params.locale)) {
      throw new Error(`Invalid language tag: ${params.locale}`);
    }
    setLanguageTag(params.locale);
  },
  component: () => <div>CV page for locale</div>,
});
