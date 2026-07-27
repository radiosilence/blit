//! Catalogues are plain gettext: `msgid`, `msgid_plural`, `msgstr[n]`.
//!
//! There is no ICU MessageFormat here and no message compilation step. ICU was
//! only ever Lingui's internal representation — the conversion to and from
//! gettext's plural forms existed to reach the format this already is.
//!
//! What gettext does not supply is which `msgstr[n]` a count selects. That comes
//! from CLDR via `icu_plurals`: `categories()` gives the forms a language actually
//! has, in order, and `category_for()` gives the one a count falls into. The
//! position of the second within the first is the index — which is exactly what a
//! `Plural-Forms` header encodes, so the same pair also writes the header.

use std::collections::HashMap;
use std::path::Path;

use anyhow::{Context, Result, bail};
use icu_locale_core::Locale as IcuLocale;
use icu_plurals::{PluralCategory, PluralRules};
use polib::po_file;

pub struct Catalog {
    singular: HashMap<String, String>,
    plural: HashMap<String, Vec<String>>,
    rules: PluralRules,
    /// The language's plural categories in CLDR order; position is the msgstr index.
    forms: Vec<PluralCategory>,
}

impl Catalog {
    pub fn load(path: &Path, locale: &str) -> Result<Self> {
        let parsed =
            po_file::parse(path).with_context(|| format!("reading catalogue {}", path.display()))?;

        let mut singular = HashMap::new();
        let mut plural = HashMap::new();

        for message in parsed.messages() {
            if let Ok(translations) = message.msgstr_plural() {
                plural.insert(message.msgid().to_owned(), translations.clone());
            } else if let Ok(translation) = message.msgstr() {
                if !translation.is_empty() {
                    singular.insert(message.msgid().to_owned(), translation.to_owned());
                }
            }
        }

        // A region subtag does not change plural rules, but the parser wants a
        // well-formed tag and our catalogues are named `pt-BR`, not `pt`.
        let tag: IcuLocale = locale
            .parse()
            .with_context(|| format!("`{locale}` is not a language tag"))?;
        let rules = PluralRules::try_new_cardinal((&tag).into())
            .with_context(|| format!("no CLDR plural rules for `{locale}`"))?;

        /*
         * The categories a count can actually land in, in CLDR order — position is
         * the msgstr index. Sampled over integers rather than taken from
         * `categories()`, because CLDR lists categories reachable only by fractions:
         * Polish declares four but a whole number is only ever one, few or many, and
         * gettext's three `msgstr[n]` slots are the three that occur.
         */
        let reachable: Vec<_> = (0u64..=200).map(|n| rules.category_for(n)).collect();
        let forms: Vec<_> = PluralCategory::all()
            .filter(|category| reachable.contains(category))
            .collect();

        /*
         * Two independent sources agreeing: CLDR decides which form a count selects,
         * while the catalogue's own `Plural-Forms` header decides how many slots a
         * translator is given. If they disagree the catalogue cannot be filled in
         * correctly, and silently writing to the wrong index is worse than stopping.
         */
        let declared = parsed.metadata.plural_rules.nplurals;
        if declared != forms.len() {
            bail!(
                "{locale}: catalogue declares nplurals={declared}, CLDR gives {} ({forms:?})",
                forms.len()
            );
        }

        Ok(Self {
            singular,
            plural,
            rules,
            forms,
        })
    }

    /// How many `msgstr[n]` entries this language has, from CLDR.
    ///
    /// Deliberately not a whole `Plural-Forms` header: CLDR gives the categories and
    /// a way to select between them, not the C expression gettext writes, and
    /// synthesising one from sampled counts would produce a header that disagrees
    /// with the selection below. Rendering does not read the header — only a
    /// translator's tooling does — so an absent one beats a wrong one.
    pub fn nplurals(&self) -> usize {
        self.forms.len()
    }

    /// A translation, or `None` so the caller can fall back to the source locale.
    pub fn t(&self, msgid: &str) -> Option<&str> {
        self.singular.get(msgid).map(String::as_str)
    }

    /// The form `count` selects, or `None` when the message is untranslated here.
    pub fn tn(&self, msgid: &str, count: usize) -> Option<&str> {
        let translations = self.plural.get(msgid)?;
        let category = self.rules.category_for(count as u64);
        let index = self
            .forms
            .iter()
            .position(|form| *form == category)
            .unwrap_or(0);

        translations
            .get(index)
            .filter(|form| !form.is_empty())
            .map(String::as_str)
    }
}

/// Every locale, with the source locale behind each one. An untranslated message
/// renders as English rather than blank, so a new string is live everywhere the
/// moment it is written.
pub struct Catalogs {
    by_locale: HashMap<String, Catalog>,
    source: String,
}

impl Catalogs {
    pub fn load(dir: &Path, locales: &[&str], source: &str) -> Result<Self> {
        let mut by_locale = HashMap::new();
        for locale in locales {
            let path = dir.join(locale).join("messages.po");
            by_locale.insert((*locale).to_owned(), Catalog::load(&path, locale)?);
        }

        Ok(Self {
            by_locale,
            source: source.to_owned(),
        })
    }

    pub fn get(&self, locale: &str) -> Option<&Catalog> {
        self.by_locale.get(locale)
    }

    /// gettext's `gettext()`: the translation, else the source locale, else the id.
    pub fn t<'a>(&'a self, locale: &str, msgid: &'a str) -> &'a str {
        self.get(locale)
            .and_then(|catalog| catalog.t(msgid))
            .or_else(|| self.get(&self.source).and_then(|c| c.t(msgid)))
            .unwrap_or(msgid)
    }

    /// gettext's `ngettext()`: English falls back to its own two forms.
    pub fn tn<'a>(&'a self, locale: &str, msgid: &'a str, plural: &'a str, count: usize) -> &'a str {
        self.get(locale)
            .and_then(|catalog| catalog.tn(msgid, count))
            .unwrap_or(if count == 1 { msgid } else { plural })
    }
}

