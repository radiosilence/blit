import { i18n } from "@lingui/core";
import type { ComponentType } from "react";

export const LanguageSelector: ComponentType<{
  locales: string[];
  sourceLocale: string;
}> = ({ locales, sourceLocale }) => {
  return (
    <div className="picker">
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

export default LanguageSelector;
