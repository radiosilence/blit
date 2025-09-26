import { createFileRoute } from "@tanstack/react-router";
import { Logo } from "~/components/logo";
import { i18n, isValidLocale, type SupportedLocale } from "~/lib/i18n";

// Direct import of translation files for SSR
const getTranslations = async (locale: SupportedLocale) => {
  const translations = await import(
    `../../lib/i18n/locales/${locale}/common.json`
  );
  return translations.default || translations;
};

export const Route = createFileRoute("/$locale/")({
  beforeLoad: async ({ params }: { params: { locale: string } }) => {
    if (!isValidLocale(params.locale)) {
      throw new Error(`Invalid locale: ${params.locale}`);
    }
    // Set language for SSR - wait for it to complete
    await i18n.changeLanguage(params.locale);
  },
  loader: async ({ params }: { params: { locale: string } }) => {
    const locale = params.locale as SupportedLocale;
    const translations = await getTranslations(locale);

    return {
      translations,
      locale,
    };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { translations, locale } = Route.useLoaderData();

  return (
    <section className="flex flex-col items-center m-12 space-y-4 text-center">
      <Logo width={256} className="mbs-12 mbe-8" />
      <h1>{translations.home.name}</h1>
      <p className="text-sm">{translations.home.role}</p>
      <p>
        <a href={`/${locale}/cv`}>{translations.nav.cv}</a> /{" "}
        <a href="https://github.com/radiosilence">{translations.nav.github}</a>
      </p>
    </section>
  );
}
