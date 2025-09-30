import { useLingui } from "@lingui/react";
import { withI18n } from "@/helpers/withI18n";

export const LanguageSelector = withI18n(
  ({ locales, sourceLocale }: { locales: string[]; sourceLocale: string }) => {
    const { i18n } = useLingui();
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
  },
);
