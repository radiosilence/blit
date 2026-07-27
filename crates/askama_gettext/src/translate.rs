//! The functions a template calls.
//!
//! A template struct implements [`Translate`] by saying where its catalogue and
//! locale are, and gets the whole gettext vocabulary. Askama resolves a bare
//! `__("…")` to a method on the struct, so templates read the way they do in every
//! other gettext codebase.

use crate::catalog::Catalogs;
use crate::message::{Markup, Message};

/// A catalogue and the locale to read it in.
///
/// Cheap to copy; hand it out from [`Translate::translator`].
#[derive(Clone, Copy)]
pub struct Translator<'a> {
    catalogs: &'a Catalogs,
    locale: &'a str,
}

impl<'a> Translator<'a> {
    /// Binds a catalogue set to one locale.
    #[must_use]
    pub fn new(catalogs: &'a Catalogs, locale: &'a str) -> Self {
        Self { catalogs, locale }
    }

    /// The locale being rendered.
    #[must_use]
    pub fn locale(&self) -> &'a str {
        self.locale
    }
}

/// gettext for a template.
///
/// Implement [`Self::translator`]; everything else has a default. The `__` family
/// mirrors C gettext, with an `h` suffix where the English carries markup:
///
/// | Method | gettext | For |
/// |---|---|---|
/// | [`__`](Translate::__) | `gettext` | A sentence whose meaning is plain |
/// | [`__p`](Translate::__p) | `pgettext` | Short or ambiguous text needing context |
/// | [`__n`](Translate::__n) | `ngettext` | Anything countable |
/// | [`__np`](Translate::__np) | `npgettext` | Countable, needing context |
/// | [`__h`](Translate::__h) | — | A sentence carrying inline markup |
/// | [`__ph`](Translate::__ph) | — | …with context |
/// | [`__nh`](Translate::__nh) | — | …countable |
/// | [`__nph`](Translate::__nph) | — | …countable, with context |
///
/// A count is bound to `%{count}` automatically, since a plural almost always
/// wants to show the number it agreed with.
///
/// ```ignore
/// {{ __("james cleveland") }}
/// {{ __p("Nav: language picker", "close") }}
/// {{ __n("%{count} locale", "%{count} locales", locales.len()) }}
/// {{ __("hello %{name}").with("name", user.name) }}
/// {{ __h("read my <cv>CV</cv>").link("cv", urls.cv)|safe }}
/// ```
pub trait Translate {
    /// Where this template's catalogue and locale are.
    fn translator(&self) -> Translator<'_>;

    /// `gettext`: a sentence whose meaning is plain from the English alone.
    fn __(&self, msgid: &str) -> Message {
        let t = self.translator();
        Message::new(t.catalogs.gettext(t.locale, msgid))
    }

    /// `pgettext`: text that needs context to translate.
    ///
    /// The context describes where the string appears and what it does — it reaches
    /// translators and never the page. Prefer this for anything short: "Cancel"
    /// alone cannot be translated reliably.
    fn __p(&self, context: &str, msgid: &str) -> Message {
        let t = self.translator();
        Message::new(t.catalogs.pgettext(t.locale, context, msgid))
    }

    /// `ngettext`: the form `count` selects. `%{count}` is bound for you.
    fn __n(&self, msgid: &str, plural: &str, count: u64) -> Message {
        let t = self.translator();
        Message::new(t.catalogs.ngettext(t.locale, msgid, plural, count)).with("count", count)
    }

    /// `npgettext`: [`Self::__n`] with a context.
    fn __np(&self, context: &str, msgid: &str, plural: &str, count: u64) -> Message {
        let t = self.translator();
        Message::new(t.catalogs.npgettext(t.locale, context, msgid, plural, count))
            .with("count", count)
    }

    /// [`Self::__`] for a sentence carrying inline markup.
    fn __h(&self, msgid: &str) -> Markup {
        let t = self.translator();
        Markup::new(t.catalogs.gettext(t.locale, msgid))
    }

    /// [`Self::__p`] for a sentence carrying inline markup.
    fn __ph(&self, context: &str, msgid: &str) -> Markup {
        let t = self.translator();
        Markup::new(t.catalogs.pgettext(t.locale, context, msgid))
    }

    /// [`Self::__n`] for a sentence carrying inline markup.
    fn __nh(&self, msgid: &str, plural: &str, count: u64) -> Markup {
        let t = self.translator();
        Markup::new(t.catalogs.ngettext(t.locale, msgid, plural, count)).with("count", count)
    }

    /// [`Self::__np`] for a sentence carrying inline markup.
    fn __nph(&self, context: &str, msgid: &str, plural: &str, count: u64) -> Markup {
        let t = self.translator();
        Markup::new(t.catalogs.npgettext(t.locale, context, msgid, plural, count))
            .with("count", count)
    }
}
