import {
  createFileRoute,
  notFound,
  Outlet,
  redirect,
} from "@tanstack/react-router";

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
const defaultLanguageTag: SupportedLanguageTag = "en-GB";

const isValidLanguageTag = (
  languageTag: string,
): languageTag is SupportedLanguageTag => {
  return (supportedLanguageTags as readonly string[]).includes(languageTag);
};

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }: { params: { locale: string } }) => {
    if (!isValidLanguageTag(params.locale)) {
      throw notFound();
    }
  },
  loader: ({ params }: { params: { locale: string } }) => {
    // Redirect root locale to default without locale prefix
    if (params.locale === defaultLanguageTag) {
      throw redirect({ to: "/" });
    }
  },
  component: () => <Outlet />,
});
