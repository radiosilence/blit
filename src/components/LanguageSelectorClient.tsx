import { useLingui } from "@lingui/react";

/**
 * Client-side language selector that works with React context
 * This version uses runtime API instead of macros to avoid build issues
 */
export const LanguageSelectorClient = () => {
  const { i18n } = useLingui();

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

  const handleLocaleChange = async (newLocale: string) => {
    try {
      // Load messages for the new locale
      const messagesModule = await import(
        `../locales/${newLocale}/messages.mjs`
      );

      // Activate the new locale
      i18n.loadAndActivate({
        locale: newLocale,
        messages: messagesModule.messages,
      });

      // Update URL without full page reload
      const currentPath = window.location.pathname;
      const pathSegments = currentPath.split("/").filter(Boolean);

      // Remove current locale from path if it exists
      if (supportedLocales.includes(pathSegments[0])) {
        pathSegments.shift();
      }

      // Build new path
      const basePath = pathSegments.join("/");
      const newPath =
        newLocale === "en-GB" ? `/${basePath}` : `/${newLocale}/${basePath}`;

      // Clean up double slashes and ensure proper ending
      const cleanPath = newPath.replace(/\/+/g, "/").replace(/\/$/, "") || "/";

      // Navigate to new URL
      window.history.pushState({}, "", cleanPath);

      // Update document language
      document.documentElement.lang = newLocale;

      // Update RTL direction
      const isRtl = ["ar", "ar-PS"].includes(newLocale);
      document.documentElement.dir = isRtl ? "rtl" : "ltr";
    } catch (error) {
      console.error(`Failed to switch to locale ${newLocale}:`, error);
      // Fallback to page reload
      window.location.href = newLocale === "en-GB" ? "/" : `/${newLocale}`;
    }
  };

  return (
    <div className="picker">
      <select
        value={i18n.locale}
        onChange={(e) => handleLocaleChange(e.target.value)}
        className="bg-transparent text-xs cursor-pointer"
        aria-label={i18n._("Select language")}
      >
        {supportedLocales.map((locale) => (
          <option key={locale} value={locale}>
            {locale}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelectorClient;
