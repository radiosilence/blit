import { useLingui } from "@lingui/react";
import { useNavigate } from "@tanstack/react-router";

import { locales, sourceLocale } from "#/i18n/config";

export function LanguageSelector() {
  const { i18n } = useLingui();
  const navigate = useNavigate();

  return (
    <div className="fixed inline-end-2 block-end-2">
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
