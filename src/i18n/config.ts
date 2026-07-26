export const sourceLocale = "en-GB";

export const locales = [
  "en-GB",
  "ar-EG",
  "ar-PS",
  "bn-BD",
  "bo-CN",
  "de-DE",
  "dv-MV",
  "el-GR",
  "fr-FR",
  "gu-IN",
  "hi-IN",
  "hy-AM",
  "it-IT",
  "ja-JP",
  "ka-GE",
  "km-KH",
  "kn-IN",
  "ko-KR",
  "lo-LA",
  "ml-IN",
  "mn-MN",
  "my-MM",
  "ne-NP",
  "nl-BE",
  "nl-NL",
  "or-IN",
  "pa-IN",
  "pl-PL",
  "si-LK",
  "ta-IN",
  "te-IN",
  "th-TH",
  "uk-UA",
  "vi-VN",
  "zh-CN",
  "zh-TW",
] as const;

export type Locale = (typeof locales)[number];

const RTL_LOCALES: ReadonlySet<string> = new Set(["ar-EG", "ar-PS", "dv-MV"]);

export function isRtl(locale: string): boolean {
  return RTL_LOCALES.has(locale);
}

export function isValidLocale(locale: string): locale is Locale {
  return (locales as readonly string[]).includes(locale);
}

/**
 * Endonyms — how a locale refers to itself. Resolved from ICU at build time, so
 * the picker shows "日本語 / 日本" rather than "ja-JP" at no runtime cost. The
 * region line is what separates nl-BE from nl-NL and zh-CN from zh-TW.
 */
export function describeLocale(locale: string) {
  const [language = locale, region] = locale.split("-");
  return {
    name: new Intl.DisplayNames([locale], { type: "language" }).of(language),
    place: region ? new Intl.DisplayNames([locale], { type: "region" }).of(region) : "",
  };
}
