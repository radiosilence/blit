//! gettext for [Askama](https://askama.rs) templates.
//!
//! The English lives in the template. `__("Book now")` is both the thing rendered
//! and the `msgid` a translator sees, so there is no key to invent, no indirection
//! to follow, and a string that has not been translated yet renders as English
//! rather than as a blank or a name.
//!
//! # Templates
//!
//! Implement [`Translate`] on a template struct and the whole gettext vocabulary is
//! available unqualified, because Askama resolves a bare call to a method on the
//! struct:
//!
//! ```ignore
//! {{ __("james cleveland") }}
//! {{ __p("Nav: language picker", "close") }}
//! {{ __n("%{count} locale", "%{count} locales", locales.len()) }}
//! {{ __("hello %{name}").with("name", user.name) }}
//! {{ __h("read my <cv>CV</cv>").link("cv", urls.cv)|safe }}
//! ```
//!
//! ```
//! use askama_gettext::{Catalogs, Translate, Translator};
//!
//! struct Page<'a> {
//!     catalogs: &'a Catalogs,
//!     locale: &'a str,
//! }
//!
//! impl Translate for Page<'_> {
//!     fn translator(&self) -> Translator<'_> {
//!         Translator::new(self.catalogs, self.locale)
//!     }
//! }
//! ```
//!
//! # Extraction
//!
//! [`extract`] reads those calls back out using Askama's own parser, so it
//! recognises no template syntax of its own and cannot drift from what Askama
//! accepts. [`merge`] writes them into `.po` files, keeping existing translations,
//! comments and flags, and deleting what has left the templates rather than
//! flagging it — so `fuzzy` keeps meaning only what a translator meant by it.
//!
//! What to then do with one is [`Fuzzy`], which the caller chooses: `msgfmt` skips
//! them, but where a msgid is the English rather than a key both answers render a
//! real sentence.
//!
//! # Plurals
//!
//! Which `msgstr[n]` a count selects comes from CLDR via [`plural`], not from the
//! catalogue's `Plural-Forms` expression. The header is still checked: it says how
//! many forms a translator is offered, and a catalogue that disagrees with CLDR is
//! an error rather than a slot quietly written to or left unfilled.
//!
//! # Markup
//!
//! In [`Markup`] the tags inside a message are names, not HTML: a translator can
//! move `<cv>…</cv>` wherever the sentence needs it but never chooses where it
//! points, and anything unregistered is escaped.

pub mod catalog;
pub mod error;
pub mod expression;
pub mod extract;
pub mod interpolate;
pub mod merge;
pub mod message;
pub mod plural;
mod similar;
pub mod translate;

pub use catalog::{Catalog, Catalogs, Fuzzy};
pub use error::{Error, Result};
pub use expression::Expression;
pub use extract::Message as ExtractedMessage;
pub use interpolate::interpolate;
pub use message::{Markup, Message};
pub use plural::Forms;
pub use translate::{Translate, Translator};
