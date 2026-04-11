import { i18n } from "@lingui/core";

type CatalogModule = { messages: Record<string, string> };

const modules = import.meta.glob<CatalogModule>("../locales/*/messages.po", {
  eager: true,
});

const catalogs = Object.fromEntries(
  Object.entries(modules).map(([path, mod]) => [
    path.match(/\/locales\/(.+?)\/messages\.po$/)?.[1] as string,
    mod.messages,
  ]),
);

export function loadCatalog(locale: string) {
  const messages = catalogs[locale];
  if (!messages) throw new Error(`Unknown locale: ${locale}`);
  i18n.load(locale, messages);
  i18n.activate(locale);
}
