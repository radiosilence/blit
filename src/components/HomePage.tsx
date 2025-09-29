import { Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import I18nProvider from "@/components/I18nProvider.tsx";
import LanguageSelectorClient from "@/components/LanguageSelectorClient.tsx";
import Logo from "@/components/Logo.tsx";

const HomePageContent = () => {
  const { i18n } = useLingui();
  const locale = i18n.locale;

  const supportedLocales = [
    "en-GB",
    "fr-FR",
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
    "ar",
  ];

  return (
    <section className="flex flex-col items-center m-12 space-y-4 text-center">
      <Logo width={256} className="mbs-12 mbe-8" />
      <h1>
        <Trans id="james cleveland">james cleveland</Trans>
      </h1>
      <p className="text-sm">
        <Trans id="james cleveland : senior full stack engineer">
          james cleveland : senior full stack engineer
        </Trans>
      </p>
      <p>
        <a href={`${locale !== "en-GB" ? `/${locale}` : ""}/cv`}>
          <Trans id="cv-2025.01">cv-2025.01</Trans>
        </a>
        {" / "}
        <a href="https://github.com/radiosilence">
          <Trans id="github">github</Trans>
        </a>
        <div className="hidden">
          {supportedLocales.map((locale) => (
            <div key={locale}>
              <a href={`/${locale}`}>{locale}</a>
              <a href={`/${locale}/cv`}>{locale} CV</a>
            </div>
          ))}
        </div>
        <LanguageSelectorClient />
      </p>
    </section>
  );
};

export const HomePage = () => {
  return (
    <I18nProvider>
      <HomePageContent />
    </I18nProvider>
  );
};
