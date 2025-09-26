export const supportedLocales = [
  "en-GB",
  "fr-FR",
  "ar",
  "ja-JP",
  "zh-CN",
  "vi-VN",
  "ka-GE",
  "uk-UA",
  "ar-PS",
  "it-IT",
  "de-DE",
  "nl-BE",
  "nl-NL",
  "pl-PL",
  "cs-CZ",
] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "en-GB";

// RTL languages
export const rtlLocales: readonly SupportedLocale[] = ["ar", "ar-PS"] as const;

export function isValidLocale(locale: string): locale is SupportedLocale {
  return supportedLocales.includes(locale as SupportedLocale);
}

export function isRtlLocale(locale: SupportedLocale): boolean {
  return rtlLocales.includes(locale);
}
