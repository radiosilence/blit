//! Reading catalogues and looking messages up.
//!
//! A message id is its English source text, so a lookup that finds nothing renders
//! the English rather than a key name or a blank. That makes an untranslated string
//! live everywhere the moment it is written, and it is why nothing here needs a
//! compilation step between the `.po` file and rendering.

use std::collections::HashMap;
use std::path::{Path, PathBuf};

use polib::po_file;

use crate::error::{Error, Result};
use crate::plural::Forms;

/// gettext joins an id and its context with `\u{4}` to key them together.
const CONTEXT_SEPARATOR: char = '\u{4}';

fn key(context: Option<&str>, msgid: &str) -> String {
    match context {
        Some(context) => format!("{context}{CONTEXT_SEPARATOR}{msgid}"),
        None => msgid.to_owned(),
    }
}

/// What to do with a translation a translator has flagged as needing review.
///
/// gettext's own tools skip them: `msgfmt` leaves a fuzzy entry out of the compiled
/// catalogue, so the message falls back. That is the safer default where a msgid is
/// a key, because it is the difference between a stale sentence and `nav.close` on
/// the page.
///
/// Here a msgid is the English, so both answers render a real sentence and neither
/// is obviously right — [`Serve`](Self::Serve) shows a reader a translation that may
/// have drifted, [`Skip`](Self::Skip) shows them a language they may not read. Which
/// is worse depends on the audience, so it is a choice the caller makes rather than
/// one this crate makes for them.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Fuzzy {
    /// Use it anyway. A translation that has drifted is usually still closer than
    /// the source language.
    Serve,
    /// Leave it out, as `msgfmt` does, and fall back as if it were untranslated.
    Skip,
}

/// One locale's messages.
pub struct Catalog {
    singular: HashMap<String, String>,
    plural: HashMap<String, Vec<String>>,
    forms: Forms,
}

impl Catalog {
    /// Reads a `.po` file.
    ///
    /// # Errors
    ///
    /// Fails if the file cannot be parsed, if CLDR has no rules for the locale, or
    /// if the catalogue's `Plural-Forms` disagrees with CLDR — see [`Forms::check`].
    pub fn load(path: &Path, locale: &str, fuzzy: Fuzzy) -> Result<Self> {
        let parsed = po_file::parse(path).map_err(|e| Error::Catalog {
            path: path.to_owned(),
            message: e.to_string(),
        })?;

        let forms = Forms::new(locale)?;
        forms.check(locale, parsed.metadata.plural_rules.nplurals)?;

        let mut singular = HashMap::new();
        let mut plural = HashMap::new();

        for message in parsed.messages() {
            // Skipped rather than stored-and-ignored, so a fuzzy message is missing
            // from the map and falls back the same way an untranslated one does.
            if fuzzy == Fuzzy::Skip && message.is_fuzzy() {
                continue;
            }

            let id = key(message.msgctxt(), message.msgid());

            if let Ok(translations) = message.msgstr_plural() {
                if translations.iter().any(|t| !t.is_empty()) {
                    plural.insert(id, translations.clone());
                }
            } else if let Ok(translation) = message.msgstr()
                && !translation.is_empty()
            {
                singular.insert(id, translation.to_owned());
            }
        }

        Ok(Self {
            singular,
            plural,
            forms,
        })
    }

    /// A singular translation, or `None` when this locale has not got one.
    #[must_use]
    pub fn get(&self, context: Option<&str>, msgid: &str) -> Option<&str> {
        self.singular.get(&key(context, msgid)).map(String::as_str)
    }

    /// The plural form `count` selects, or `None` when untranslated here.
    #[must_use]
    pub fn get_plural(&self, context: Option<&str>, msgid: &str, count: u64) -> Option<&str> {
        let translations = self.plural.get(&key(context, msgid))?;
        translations
            .get(self.forms.index(count))
            .filter(|form| !form.is_empty())
            .map(String::as_str)
    }

    /// How many `msgstr[n]` slots this language has.
    #[must_use]
    pub fn plural_count(&self) -> usize {
        self.forms.count()
    }
}

/// Every locale, with the source locale behind each of them.
pub struct Catalogs {
    by_locale: HashMap<String, Catalog>,
    source: String,
}

impl Catalogs {
    /// Loads `{dir}/{locale}/messages.po` for each locale.
    ///
    /// # Errors
    ///
    /// Fails if any catalogue fails to load.
    pub fn load(dir: &Path, locales: &[&str], source: &str, fuzzy: Fuzzy) -> Result<Self> {
        let mut by_locale = HashMap::new();

        for locale in locales {
            let path: PathBuf = dir.join(locale).join("messages.po");
            by_locale.insert((*locale).to_owned(), Catalog::load(&path, locale, fuzzy)?);
        }

        Ok(Self {
            by_locale,
            source: source.to_owned(),
        })
    }

    /// One locale's catalogue.
    #[must_use]
    pub fn get(&self, locale: &str) -> Option<&Catalog> {
        self.by_locale.get(locale)
    }

    /// gettext's `gettext`: the translation, else the source locale's, else the
    /// English — which the id already is.
    #[must_use]
    pub fn gettext<'a>(&'a self, locale: &str, msgid: &'a str) -> &'a str {
        self.lookup(locale, None, msgid).unwrap_or(msgid)
    }

    /// gettext's `pgettext`: as [`Self::gettext`], disambiguated by context.
    ///
    /// The context reaches translators and never the page, so two identical English
    /// strings meaning different things can be translated differently.
    #[must_use]
    pub fn pgettext<'a>(&'a self, locale: &str, context: &str, msgid: &'a str) -> &'a str {
        self.lookup(locale, Some(context), msgid).unwrap_or(msgid)
    }

    /// gettext's `ngettext`: the form `count` selects.
    ///
    /// Untranslated, English's own two forms are used rather than the target
    /// language's rules, because the English is all there is to choose between.
    #[must_use]
    pub fn ngettext<'a>(
        &'a self,
        locale: &str,
        msgid: &'a str,
        plural: &'a str,
        count: u64,
    ) -> &'a str {
        self.lookup_plural(locale, None, msgid, count)
            .unwrap_or(if count == 1 { msgid } else { plural })
    }

    /// gettext's `npgettext`: [`Self::ngettext`] with a context.
    #[must_use]
    pub fn npgettext<'a>(
        &'a self,
        locale: &str,
        context: &str,
        msgid: &'a str,
        plural: &'a str,
        count: u64,
    ) -> &'a str {
        self.lookup_plural(locale, Some(context), msgid, count)
            .unwrap_or(if count == 1 { msgid } else { plural })
    }

    fn lookup(&self, locale: &str, context: Option<&str>, msgid: &str) -> Option<&str> {
        self.get(locale)
            .and_then(|catalog| catalog.get(context, msgid))
            .or_else(|| {
                self.get(&self.source)
                    .and_then(|catalog| catalog.get(context, msgid))
            })
    }

    fn lookup_plural(
        &self,
        locale: &str,
        context: Option<&str>,
        msgid: &str,
        count: u64,
    ) -> Option<&str> {
        self.get(locale)
            .and_then(|catalog| catalog.get_plural(context, msgid, count))
    }
}
