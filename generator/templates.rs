//! Askama binds a template to a struct at compile time, so a field a template
//! names but the struct lacks is a compile error rather than a blank in the output.
//! That replaces the runtime Proxy the TypeScript needs.
//!
//! `{% extends %}` requires the child to carry every field the parent names, so the
//! shape is declared once by macro rather than repeated per page. The methods are
//! deliberately `__`, `__n` and `__v`: a template holds the English, never an id.

use askama::Template;

use crate::assets::Assets;
use crate::i18n::Catalogs;

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

pub struct Context<'a> {
    pub catalogs: &'a Catalogs,
    pub assets: &'a Assets,
}

macro_rules! page {
    ($name:ident, $path:literal) => {
        #[derive(Template)]
        #[template(path = $path)]
        pub struct $name<'a> {
            pub ctx: &'a Context<'a>,
            pub locale: &'a str,
            pub dir: &'a str,
            pub canonical_url: String,
            pub cv: &'a str,
            pub urls: &'a Urls,
            pub locale_links: &'a [LocaleLink],
        }

        impl $name<'_> {
            /// gettext's `gettext()`. The argument is the English, which is the msgid.
            fn __(&self, msgid: &str) -> String {
                self.ctx.catalogs.t(self.locale, msgid).to_owned()
            }

            /// gettext's `ngettext()`, with the form chosen from CLDR.
            #[allow(dead_code)]
            fn __n(&self, msgid: &str, plural: &str, count: usize) -> String {
                self.ctx
                    .catalogs
                    .tn(self.locale, msgid, plural, count)
                    .to_owned()
            }

            /// A sentence with a value in the middle, so the whole thing is one msgid
            /// and a translator can move the placeholder where the language needs it.
            #[allow(dead_code)]
            fn __v(&self, msgid: &str, value: &str) -> String {
                self.__(msgid).replacen("{}", value, 1)
            }

            fn asset(&self, name: &str) -> String {
                self.ctx.assets.href(name)
            }
        }
    };
}

page!(Index, "index.html");
page!(Cv, "cv.html");
