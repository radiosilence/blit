import { useNavigate } from "@tanstack/react-router";

import { locales } from "#/i18n/config";
import { i18n } from "@lingui/core";

export function LanguageSelector() {
  const navigate = useNavigate();

  return (
    <div className="fixed inline-end-2 block-end-2">
      <select
        value={i18n.locale}
        onChange={(e) => {
          navigate({
            to: ".",
            params: (prev) => ({ ...prev, locale: e.target.value }),
          });
        }}
        className="bg-transparent text-xs cursor-pointer"
      >
        {locales.map((l) => (
          <option key={l}>{l}</option>
        ))}
      </select>
    </div>
  );
}
