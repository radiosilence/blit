//! What every page shares with `templates/layout.html`: the locale it is drawn
//! in, where it lives, the links between its translations, and the two calls
//! every template makes, `asset()` and the `__` family.
//!
//! `{% extends %}` requires a page's struct to carry every field the layout
//! names. Each page holds a [`Page`] and dereferences to it, so the layout's
//! fields are declared once and a page adds only what its own template uses;
//! askama's `self.locale` and `self.asset(..)` reach them through `Deref`.

use askama_gettext::{Translate, Translator};

use crate::app::App;
use crate::config::{LOCALES, Locale, ORIGIN, SOURCE};
use crate::routes::{Route, url};

pub struct LocaleLink {
    pub code: String,
    pub href: String,
    pub name: String,
    pub place: String,
    pub current: bool,
}

/// A struct rather than a map: Askama checks field access at compile time, so a
/// mistyped `urls.cvv` fails to build. A map would resolve at runtime to nothing.
pub struct Urls {
    pub home: String,
    pub cv: String,
}

pub struct Page<'a> {
    pub app: &'a App,
    pub locale: &'a str,
    pub dir: &'a str,
    pub canonical_url: String,
    /// Whether to name each locale's copy as an alternate of this one.
    pub alternates: bool,
    pub urls: Urls,
    pub locale_links: Vec<LocaleLink>,
}

impl<'a> Page<'a> {
    /// The layout's view of `route` in `locale`.
    pub fn new(app: &'a App, locale: &'a Locale, route: &Route) -> Self {
        let locale_links = LOCALES
            .iter()
            .map(|other| LocaleLink {
                code: other.code.to_owned(),
                href: url(other.code, route.slug),
                name: other.name.to_owned(),
                place: other.place.to_owned(),
                current: other.code == locale.code,
            })
            .collect();

        // An untranslated page has one canonical copy, the source locale's.
        let canonical = if route.translated {
            url(locale.code, route.slug)
        } else {
            url(SOURCE, route.slug)
        };

        Self {
            app,
            locale: locale.code,
            dir: if locale.rtl { "rtl" } else { "ltr" },
            canonical_url: format!("{ORIGIN}{canonical}"),
            alternates: route.translated,
            urls: Urls {
                home: url(locale.code, ""),
                cv: url(locale.code, "cv"),
            },
            locale_links,
        }
    }

    pub fn asset(&self, name: &str) -> String {
        self.app.assets.href(name)
    }
}

impl Translate for Page<'_> {
    fn translator(&self) -> Translator<'_> {
        Translator::new(&self.app.catalogs, self.locale)
    }
}
