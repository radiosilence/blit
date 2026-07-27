//! The 36 locales, their endonyms and their direction.
//!
//! Endonyms come from ICU via `Intl.DisplayNames`, resolved once and kept here
//! rather than at build time: ICU4X exposes display names only in
//! `icu_experimental`, and this is data that changes about as often as a language
//! renames itself. Regenerate with `task i18n:locales`.

pub struct Locale {
    pub code: &'static str,
    pub name: &'static str,
    pub place: &'static str,
    pub rtl: bool,
}

pub const SOURCE: &str = "en-GB";

pub const LOCALES: &[Locale] = &[
    Locale {
        code: "en-GB",
        name: "English",
        place: "United Kingdom",
        rtl: false,
    },
    Locale {
        code: "ar-EG",
        name: "العربية",
        place: "مصر",
        rtl: true,
    },
    Locale {
        code: "ar-PS",
        name: "العربية",
        place: "الأراضي الفلسطينية",
        rtl: true,
    },
    Locale {
        code: "bn-BD",
        name: "বাংলা",
        place: "বাংলাদেশ",
        rtl: false,
    },
    Locale {
        code: "bo-CN",
        name: "བོད་སྐད་",
        place: "རྒྱ་ནག",
        rtl: false,
    },
    Locale {
        code: "de-DE",
        name: "Deutsch",
        place: "Deutschland",
        rtl: false,
    },
    Locale {
        code: "dv-MV",
        name: "Divehi",
        place: "Maldives",
        rtl: true,
    },
    Locale {
        code: "el-GR",
        name: "Ελληνικά",
        place: "Ελλάδα",
        rtl: false,
    },
    Locale {
        code: "fr-FR",
        name: "français",
        place: "France",
        rtl: false,
    },
    Locale {
        code: "gu-IN",
        name: "ગુજરાતી",
        place: "ભારત",
        rtl: false,
    },
    Locale {
        code: "hi-IN",
        name: "हिन्दी",
        place: "भारत",
        rtl: false,
    },
    Locale {
        code: "hy-AM",
        name: "հայերեն",
        place: "Հայաստան",
        rtl: false,
    },
    Locale {
        code: "it-IT",
        name: "italiano",
        place: "Italia",
        rtl: false,
    },
    Locale {
        code: "ja-JP",
        name: "日本語",
        place: "日本",
        rtl: false,
    },
    Locale {
        code: "ka-GE",
        name: "ქართული",
        place: "საქართველო",
        rtl: false,
    },
    Locale {
        code: "km-KH",
        name: "ខ្មែរ",
        place: "កម្ពុជា",
        rtl: false,
    },
    Locale {
        code: "kn-IN",
        name: "ಕನ್ನಡ",
        place: "ಭಾರತ",
        rtl: false,
    },
    Locale {
        code: "ko-KR",
        name: "한국어",
        place: "대한민국",
        rtl: false,
    },
    Locale {
        code: "lo-LA",
        name: "ລາວ",
        place: "ລາວ",
        rtl: false,
    },
    Locale {
        code: "ml-IN",
        name: "മലയാളം",
        place: "ഇന്ത്യ",
        rtl: false,
    },
    Locale {
        code: "mn-MN",
        name: "монгол",
        place: "Монгол",
        rtl: false,
    },
    Locale {
        code: "my-MM",
        name: "မြန်မာ",
        place: "မြန်မာ",
        rtl: false,
    },
    Locale {
        code: "ne-NP",
        name: "नेपाली",
        place: "नेपाल",
        rtl: false,
    },
    Locale {
        code: "nl-BE",
        name: "Nederlands",
        place: "België",
        rtl: false,
    },
    Locale {
        code: "nl-NL",
        name: "Nederlands",
        place: "Nederland",
        rtl: false,
    },
    Locale {
        code: "or-IN",
        name: "ଓଡ଼ିଆ",
        place: "ଭାରତ",
        rtl: false,
    },
    Locale {
        code: "pa-IN",
        name: "ਪੰਜਾਬੀ",
        place: "ਭਾਰਤ",
        rtl: false,
    },
    Locale {
        code: "pl-PL",
        name: "polski",
        place: "Polska",
        rtl: false,
    },
    Locale {
        code: "si-LK",
        name: "සිංහල",
        place: "ශ්‍රී ලංකාව",
        rtl: false,
    },
    Locale {
        code: "ta-IN",
        name: "தமிழ்",
        place: "இந்தியா",
        rtl: false,
    },
    Locale {
        code: "te-IN",
        name: "తెలుగు",
        place: "భారతదేశం",
        rtl: false,
    },
    Locale {
        code: "th-TH",
        name: "ไทย",
        place: "ไทย",
        rtl: false,
    },
    Locale {
        code: "uk-UA",
        name: "українська",
        place: "Україна",
        rtl: false,
    },
    Locale {
        code: "vi-VN",
        name: "Tiếng Việt",
        place: "Việt Nam",
        rtl: false,
    },
    Locale {
        code: "zh-CN",
        name: "中文",
        place: "中国",
        rtl: false,
    },
    Locale {
        code: "zh-TW",
        name: "中文",
        place: "台灣",
        rtl: false,
    },
];
