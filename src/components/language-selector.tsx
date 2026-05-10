import { useLingui } from "@lingui/react";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { locales, sourceLocale } from "#/i18n/config";

export function LanguageSelector() {
  const { i18n } = useLingui();
  const navigate = useNavigate();

  return (
    <div className="picker">
      <select
        value={i18n.locale}
        onChange={(e) => {
          const locale = e.target.value;
          navigate({
            to: ".",
            params: (prev) => ({
              ...prev,
              locale: locale === sourceLocale ? undefined : locale,
            }),
          });
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
}
