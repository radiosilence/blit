import {
  createFileRoute,
  notFound,
  Outlet,
  redirect,
} from "@tanstack/react-router";

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
const defaultLocale: SupportedLocale = "en-GB";

const isValidLocale = (locale: string): locale is SupportedLocale => {
  return (supportedLocales as readonly string[]).includes(locale);
};

export const Route = createFileRoute("/$locale")({
  beforeLoad: ({ params }: { params: { locale: string } }) => {
    if (!isValidLocale(params.locale)) {
      throw notFound();
    }
  },
  loader: ({ params }: { params: { locale: string } }) => {
    // Redirect root locale to default without locale prefix
    if (params.locale === defaultLocale) {
      throw redirect({ to: "/" });
    }
  },
  component: () => <Outlet />,
});
