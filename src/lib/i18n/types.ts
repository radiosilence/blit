export const supportedLocales = [
  "en-GB",
  "fr-FR",
  "ar",
  "ja-JP",
  "zh-CN",
] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "en-GB";

// RTL languages
export const rtlLocales: readonly SupportedLocale[] = ["ar"] as const;

export function isValidLocale(locale: string): locale is SupportedLocale {
  return supportedLocales.includes(locale as SupportedLocale);
}

export function isRtlLocale(locale: SupportedLocale): boolean {
  return rtlLocales.includes(locale);
}
