import I18nProvider from "@/components/I18nProvider.tsx";
import LanguageSelectorClient from "@/components/LanguageSelectorClient.tsx";

export const ClientLanguageSelector = () => {
  return (
    <I18nProvider>
      <LanguageSelectorClient />
    </I18nProvider>
  );
};

export default ClientLanguageSelector;
