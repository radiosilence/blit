import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Logo } from "~/components/logo";
import { isValidLocale } from "~/lib/i18n";

export const Route = createFileRoute("/$locale/")({
  beforeLoad: ({ params }: { params: { locale: string } }) => {
    if (!isValidLocale(params.locale)) {
      throw new Error(`Invalid locale: ${params.locale}`);
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { locale } = Route.useParams();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);

  return (
    <section className="flex flex-col items-center m-12 space-y-4 text-center">
      <Logo width={256} className="mbs-12 mbe-8" />
      <h1>{t("home.name")}</h1>
      <p className="text-sm">{t("home.role")}</p>
      <p>
        <a href={`/${locale}/cv`}>{t("nav.cv")}</a> /{" "}
        <a href="https://github.com/radiosilence">{t("nav.github")}</a>
      </p>
    </section>
  );
}
