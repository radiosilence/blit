import { i18n } from "@lingui/core";
import { I18nProvider, useLingui } from "@lingui/react";
import type { ComponentProps } from "astro/types";
import { type ComponentType, useEffect, useRef } from "react";

const locale = "fr-FR";

console.log("activating", locale);

const LanguageSelectorInner: ComponentType<{
  locales: string[];
  sourceLocale: string;
}> = ({ locales, sourceLocale }) => {
  const { i18n } = useLingui();
  console.log("LanguageSelectorInner::", i18n.locale);
  return (
    <div className="picker">
      {i18n._("SELECT LANGUAGE:")}
      <select
        value={i18n.locale}
        onChange={(e) => {
          const locale = e.target.value;
          window.location.href = locale === sourceLocale ? `/` : `/${locale}`;
        }}
        className="bg-transparent text-xs cursor-pointer"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {locale}
          </option>
        ))}
      </select>
    </div>
  );
};

export function withLanguage<T extends ComponentType>(C: T) {
  return ({ locale, ...props }: ComponentProps<T> & { locale: string }) => {
    const activated = useRef(false);
    console.log("LanguageSelector::render");
    (async () => {
      console.log("LanguageSelector::doing load and activate");
      if (activated.current) return;
      activated.current = true;
      i18n.loadAndActivate({
        locale,
        ...(await import(`../locales/${locale}/messages.mjs`)),
      });
    })();
    return (
      <I18nProvider i18n={i18n}>
        <C {...props} />
      </I18nProvider>
    );
  };
}

export const LanguageSelector = withLanguage(LanguageSelectorInner);

const Balh = () => {
  return <LanguageSelector locale="fr-FR" sourceLocale="en-GB" locales={[]} />;
};
