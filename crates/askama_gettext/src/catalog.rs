//! Reading catalogues and looking messages up.
//!
//! A message id is its English source text, so a lookup that finds nothing renders
//! the English rather than a key name or a blank. That makes an untranslated string
//! live everywhere the moment it is written, and it is why nothing here needs a
//! compilation step between the `.po` file and rendering.

use std::collections::HashMap;
use std::path::{Path, PathBuf};

use icu_locale::LocaleFallbacker;
use icu_locale::fallback::LocaleFallbackConfig;
use icu_locale_core::Locale;
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
        forms.check_expression(locale, &parsed.metadata.plural_rules.expr)?;

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
    /// Each locale's catalogues to try, in order, ending at the source. Resolved
    /// once at load: the walk is the same for every message and there are a lot of
    /// messages.
    chains: HashMap<String, Vec<String>>,
    source: String,
}

/// The catalogues to try for a locale, in order, ending at the source.
///
/// CLDR's own fallback rather than a guess at it, because the guess is wrong in the
/// cases that matter. `zh-TW` falls back to `zh-Hant` and never to `zh` — `zh` is
/// Simplified, and handing a Traditional reader Simplified text is worse than
/// handing them English. `sr-Latn-RS` likewise stops at `sr-Latn` rather than
/// reaching Cyrillic `sr`, and `en-AU` goes through `en-001` before `en`. Splitting
/// on the first dash gets all three wrong, and silently.
///
/// Steps nobody loaded a catalogue for are dropped rather than looked up and missed.
fn chain_for(locale: &str, loaded: &[&str], source: &str) -> Vec<String> {
    // The locale's own catalogue is first whatever CLDR makes of the tag, so an
    // unparseable one still reads the file it was named for.
    let mut chain = vec![locale.to_owned()];

    if let Ok(parsed) = locale.parse::<Locale>() {
        let fallbacker = LocaleFallbacker::new();
        let mut steps = fallbacker
            .for_config(LocaleFallbackConfig::default())
            .fallback_for(parsed.id.into());

        while !steps.get().is_unknown() {
            let step = steps.get().to_string();

            if loaded.contains(&step.as_str()) && !chain.contains(&step) {
                chain.push(step);
            }

            steps.step();
        }
    }

    if !chain.iter().any(|step| step == source) {
        chain.push(source.to_owned());
    }

    chain
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

        let chains = locales
            .iter()
            .map(|locale| ((*locale).to_owned(), chain_for(locale, locales, source)))
            .collect();

        Ok(Self {
            by_locale,
            chains,
            source: source.to_owned(),
        })
    }

    /// What a locale falls back through, in order.
    ///
    /// Empty of anything but the source for a locale that was never loaded.
    #[must_use]
    pub fn chain(&self, locale: &str) -> &[String] {
        self.chains
            .get(locale)
            .map_or(std::slice::from_ref(&self.source), Vec::as_slice)
    }

    /// One locale's catalogue.
    #[must_use]
    pub fn get(&self, locale: &str) -> Option<&Catalog> {
        self.by_locale.get(locale)
    }

    /// gettext's `gettext`: the translation, else what CLDR falls back to, else the source
    /// locale's, else the English — which the id already is.
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
        self.chain(locale)
            .iter()
            .find_map(|locale| self.get(locale)?.get(context, msgid))
    }

    // Walks the same chain as the singular: a plural the locale lacks and the source
    // has was previously ignored, which meant falling all the way back to the two
    // English forms while a translated set sat in the catalogue next door.
    fn lookup_plural(
        &self,
        locale: &str,
        context: Option<&str>,
        msgid: &str,
        count: u64,
    ) -> Option<&str> {
        self.chain(locale)
            .iter()
            .find_map(|locale| self.get(locale)?.get_plural(context, msgid, count))
    }
}

#[cfg(test)]
mod chains {
    use super::chain_for;

    /// Everything loaded, so the chain shows every step CLDR takes.
    const ALL: &[&str] = &[
        "en-GB",
        "en-AU",
        "en-001",
        "en",
        "zh",
        "zh-Hant",
        "zh-CN",
        "zh-TW",
        "pt",
        "pt-BR",
        "sr",
        "sr-Latn",
        "sr-Latn-RS",
        "pl",
        "pl-PL",
    ];

    #[test]
    fn a_script_is_not_crossed_to_reach_a_language() {
        // The one that matters here: zh is Simplified, so a Traditional reader is
        // better served English than zh. Splitting on the dash hands them zh.
        assert_eq!(
            chain_for("zh-TW", ALL, "en-GB"),
            ["zh-TW", "zh-Hant", "en-GB"]
        );
        assert_eq!(chain_for("zh-CN", ALL, "en-GB"), ["zh-CN", "zh", "en-GB"]);

        // Same shape, Cyrillic against Latin.
        assert_eq!(
            chain_for("sr-Latn-RS", ALL, "en-GB"),
            ["sr-Latn-RS", "sr-Latn", "en-GB"]
        );
    }

    #[test]
    fn a_chain_can_be_longer_than_one_step() {
        assert_eq!(
            chain_for("en-AU", ALL, "en-GB"),
            ["en-AU", "en-001", "en", "en-GB"]
        );
    }

    #[test]
    fn the_plain_cases_are_still_plain() {
        assert_eq!(chain_for("pt-BR", ALL, "en-GB"), ["pt-BR", "pt", "en-GB"]);
        assert_eq!(chain_for("pl-PL", ALL, "en-GB"), ["pl-PL", "pl", "en-GB"]);
    }

    #[test]
    fn a_step_nobody_loaded_is_not_in_the_chain() {
        // What this site has: full codes only, so every chain is the locale and
        // the source and the walk costs nothing.
        let loaded = &["en-GB", "pl-PL", "zh-TW"];
        assert_eq!(chain_for("pl-PL", loaded, "en-GB"), ["pl-PL", "en-GB"]);
        assert_eq!(chain_for("zh-TW", loaded, "en-GB"), ["zh-TW", "en-GB"]);
    }

    #[test]
    fn the_source_appears_once_and_is_not_a_full_stop() {
        // en-GB is the source here and also has a chain of its own. It carries on
        // through it rather than being appended a second time — everything past it
        // is a loaded catalogue too, and a more specific English than the id.
        assert_eq!(chain_for("en-GB", ALL, "en-GB"), ["en-GB", "en-001", "en"]);
        assert_eq!(chain_for("en", ALL, "en"), ["en"]);
    }

    #[test]
    fn a_tag_cldr_cannot_parse_still_reads_its_own_catalogue() {
        assert_eq!(
            chain_for("not a locale", ALL, "en-GB"),
            ["not a locale", "en-GB"]
        );
    }
}
