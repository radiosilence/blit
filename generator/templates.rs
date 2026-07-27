//! Askama binds a template to a struct at compile time, so a field a template
//! names but the struct lacks is a compile error rather than a blank in the output.
//! That replaces the runtime Proxy the TypeScript needs.
//!
//! `{% extends %}` requires the child to carry every field the parent names, so the
//! shape is declared once by macro rather than repeated per page. The methods are
//! deliberately `__`, `__n` and `__v`: a template holds the English, never an id.

use askama::Template;
use askama_gettext::{Catalogs, Translate, Translator};

use crate::assets::Assets;

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

/// Declares a page template.
///
/// `{% extends %}` requires a child to carry every field the layout names, so the
/// shared ones are listed once here and each page adds only what it uses itself —
/// which keeps an genuinely unused field a warning rather than noise.
macro_rules! page {
    ($name:ident, $path:literal $(, $field:ident: $ty:ty)* $(,)?) => {
        #[derive(Template)]
        #[template(path = $path)]
        pub struct $name<'a> {
            pub ctx: &'a Context<'a>,
            pub locale: &'a str,
            pub dir: &'a str,
            pub canonical_url: String,
            pub urls: &'a Urls,
            pub locale_links: &'a [LocaleLink],
            $(pub $field: $ty,)*
        }

        impl Translate for $name<'_> {
            fn translator(&self) -> Translator<'_> {
                Translator::new(self.ctx.catalogs, self.locale)
            }
        }

        impl $name<'_> {
            fn asset(&self, name: &str) -> String {
                self.ctx.assets.href(name)
            }
        }
    };
}

page!(Index, "index.html");
page!(Cv, "cv.html", cv: &'a str);
page!(I18nTest, "i18n-test.html", counts: &'a [u64]);
