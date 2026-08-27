//! Writing extracted messages into `.po` files.
//!
//! Merging rather than generating: a catalogue is a translator's work, and the
//! templates only get to say which messages exist and where they are written. An
//! existing translation, comment or flag survives.
//!
//! A message that has left is first offered to one that has arrived: reworded
//! English is the same message with a new id, and its translation should follow it
//! rather than be thrown away and asked for again in 36 languages. What follows is
//! flagged `fuzzy`, which is what the flag is for — a translation nobody has yet
//! read against the English it now sits under.
//!
//! A message that has left and found nowhere to go is removed. gettext writes one as an
//! obsolete `#~` entry, which keeps the translation without pretending the message
//! still exists — but polib has no way to write those, and the only flag it does
//! have is `fuzzy`, which already means something else: a translation that needs
//! review. Marking one obsolete that way makes it indistinguishable from the other
//! and leaves it referencing a file it is no longer in. Removing it says the true
//! thing, and the removal is reported by id and lands in a diff, so the translation
//! is a `git revert` away rather than a mystery in a file nobody reads.

use std::cmp::Ordering;
use std::collections::{BTreeMap, BTreeSet};
use std::path::{Path, PathBuf};
use std::sync::atomic::{self, AtomicU64};

use polib::catalog::Catalog;
use polib::message::{Message, MessageFlags};
use polib::po_file;

use crate::error::{Error, Result};
use crate::extract::Message as Extracted;
use crate::plural::Forms;
use crate::similar;

/// The messages the templates ask for, one entry per `(context, id)`.
type Wanted<'a> = BTreeMap<(Option<String>, String), Vec<&'a Extracted>>;

/// What changed, for reporting to whoever ran the extraction.
#[derive(Debug, Default, Clone, PartialEq, Eq)]
pub struct Summary {
    /// Messages in the templates.
    pub total: usize,
    /// Messages this catalogue has no translation for.
    pub untranslated: usize,
    /// Ids that were in the catalogue, are in no template, and have been deleted.
    ///
    /// By id rather than by count: this is the one thing a merge does that destroys
    /// a translator's work, so it should be possible to see what went without
    /// reading a diff of 36 files.
    pub removed: Vec<String>,
    /// `(was, is)` for each message the templates reworded rather than replaced.
    ///
    /// The translation moved to the new id and is flagged fuzzy. These are not in
    /// [`Self::removed`] — nothing was lost, it was carried.
    pub reworded: Vec<(String, String)>,
}

/// Merges extracted messages into the catalogue at `path`, writing it back.
///
/// The file must already exist: creating it would mean inventing a `Plural-Forms`
/// header, and getting that wrong is worse than saying so.
///
/// # Errors
///
/// Fails if the catalogue cannot be read or written, or if its `Plural-Forms`
/// disagrees with CLDR.
pub fn into_catalog(path: &Path, locale: &str, messages: &[Extracted]) -> Result<Summary> {
    let mut catalog = po_file::parse(path).map_err(|e| Error::Catalog {
        path: path.to_owned(),
        message: e.to_string(),
    })?;

    let forms = Forms::new(locale)?;
    forms.check(locale, catalog.metadata.plural_rules.nplurals)?;
    forms.check_expression(locale, &catalog.metadata.plural_rules.expr)?;

    // One entry per (context, id): the same string used in three templates is one
    // message with three references, not three messages.
    let mut wanted: BTreeMap<(Option<String>, String), Vec<&Extracted>> = BTreeMap::new();
    for message in messages {
        wanted
            .entry((message.context.clone(), message.id.clone()))
            .or_default()
            .push(message);
    }

    let mut summary = Summary {
        total: wanted.len(),
        ..Summary::default()
    };

    // Worked out before anything is written, because the pairing is between the
    // catalogue as it arrived and the templates as they are now — and the loop
    // below is what destroys the first of those.
    let departed = departures(&catalog, &wanted);
    let mut carried = rewordings(&catalog, &wanted, &departed);

    for ((context, id), sites) in &wanted {
        let references = sites
            .iter()
            .map(|site| format!("{}:{}", site.file, site.line))
            .collect::<Vec<_>>()
            .join(" ");

        let plural = sites.iter().find_map(|site| site.plural.as_deref());

        // The plural is part of the key: looking a countable message up without it
        // finds nothing, and the entry is then rebuilt with empty forms — which
        // silently discards a translator's work rather than failing.
        let existing = catalog.find_message(context.as_deref(), id, plural);

        // A message with no entry of its own may still be one the templates just
        // reworded, in which case its predecessor's translation comes with it.
        let reworded = existing
            .is_none()
            .then(|| carried.remove(&(context.clone(), id.clone())))
            .flatten();

        // Keep whatever a translator has already done; replace only what the
        // templates are authoritative about, which is the references.
        let translations: Vec<String> = match (&existing, &reworded, plural) {
            (Some(message), _, Some(_)) => message
                .msgstr_plural()
                .cloned()
                .unwrap_or_else(|_| vec![String::new(); forms.count()]),
            (Some(message), _, None) => vec![message.msgstr().unwrap_or_default().to_owned()],
            (None, Some(from), _) => from.translations.clone(),
            (None, None, Some(_)) => vec![String::new(); forms.count()],
            (None, None, None) => vec![String::new()],
        };

        let comments = existing
            .as_ref()
            .map(|m| m.translator_comments().to_owned())
            .or_else(|| reworded.as_ref().map(|from| from.comments.clone()))
            .unwrap_or_default();

        let mut flags = existing.as_ref().map(|m| m.flags().clone());

        if let Some(from) = &reworded {
            // fuzzy is exactly what this is: a translation carried onto English it
            // was not written for, which someone has to look at.
            let mut inherited = from.flags.clone();
            inherited.add_flag("fuzzy");
            flags = Some(inherited);
            summary.reworded.push((from.id.clone(), id.clone()));
        }

        if translations.iter().all(String::is_empty) {
            summary.untranslated += 1;
        }

        let mut builder = if let Some(plural) = plural {
            let mut forms_out = translations;
            forms_out.resize(forms.count(), String::new());
            let mut b = Message::build_plural();
            b.with_msgid_plural((*plural).to_owned())
                .with_msgstr_plural(forms_out);
            b
        } else {
            let mut b = Message::build_singular();
            b.with_msgstr(translations.into_iter().next().unwrap_or_default());
            b
        };

        builder.with_msgid(id.clone()).with_source(references);
        if let Some(context) = context {
            builder.with_msgctxt(context.clone());
        }
        if !comments.is_empty() {
            builder.with_translator_comments(comments);
        }
        if let Some(flags) = flags {
            builder.with_flags(flags);
        }

        catalog.append_or_update(builder.done());
    }

    // Everything that left goes, including whatever was paired — its translation is
    // on the new message now, and leaving the old one would be keeping a duplicate.
    for message in &departed {
        catalog.delete_message(
            message.context.as_deref(),
            &message.id,
            message.plural.as_deref(),
        );
    }

    let moved: BTreeSet<&str> = summary
        .reworded
        .iter()
        .map(|(from, _)| from.as_str())
        .collect();

    summary.removed = departed
        .iter()
        .filter(|message| !moved.contains(message.id.as_str()))
        .map(|message| message.id.clone())
        .collect();

    write_atomically(&catalog, path)?;

    Ok(summary)
}

/// A message in the catalogue that the templates no longer ask for.
///
/// Read out in full before the merge writes anything, because by the time it is
/// wanted the catalogue has been overwritten with the templates' idea of itself.
struct Departed {
    context: Option<String>,
    id: String,
    plural: Option<String>,
    translations: Vec<String>,
    comments: String,
    flags: MessageFlags,
}

fn departures(catalog: &Catalog, wanted: &Wanted<'_>) -> Vec<Departed> {
    catalog
        .messages()
        .filter(|message| {
            !wanted.contains_key(&(
                message.msgctxt().map(str::to_owned),
                message.msgid().to_owned(),
            ))
        })
        .map(|message| Departed {
            context: message.msgctxt().map(str::to_owned),
            id: message.msgid().to_owned(),
            plural: message.msgid_plural().ok().map(str::to_owned),
            translations: message
                .msgstr_plural()
                .cloned()
                .unwrap_or_else(|_| vec![message.msgstr().unwrap_or_default().to_owned()]),
            comments: message.translator_comments().to_owned(),
            flags: message.flags().clone(),
        })
        .collect()
}

/// How alike two ids must be to be treated as one reworded rather than two.
///
/// The same cutoff `difflib` uses for "close enough", and low enough to survive a
/// clause being rewritten while still refusing two unrelated sentences. Being wrong
/// in one direction costs a translator a lost string; in the other it hands them
/// somebody else's sentence to correct. Neither is silent — the pairing is reported
/// and the result is flagged fuzzy — so the bar sits where a human would agree.
const SAME_MESSAGE: f64 = 0.6;

/// Pairs a departure with an arrival when the second is the first reworded.
///
/// Only messages with no entry of their own are candidates: one the catalogue
/// already knows has a translation, and does not need somebody else's.
fn rewordings(
    catalog: &Catalog,
    wanted: &Wanted<'_>,
    departed: &[Departed],
) -> BTreeMap<(Option<String>, String), Departed> {
    let arrived: Vec<&(Option<String>, String)> = wanted
        .iter()
        .filter(|((context, id), sites)| {
            let plural = sites.iter().find_map(|site| site.plural.as_deref());
            catalog
                .find_message(context.as_deref(), id, plural)
                .is_none()
        })
        .map(|(key, _)| key)
        .collect();

    let mut pairs = BTreeMap::new();
    let mut taken = BTreeSet::new();

    // Arrivals in id order and the best match for each, so the same catalogue and
    // the same templates always pair the same way.
    for key in arrived {
        let (context, id) = key;

        let best = departed
            .iter()
            .enumerate()
            .filter(|(index, from)| !taken.contains(index) && &from.context == context)
            .map(|(index, from)| (index, from, similar::ratio(&from.id, id)))
            .filter(|(_, _, ratio)| *ratio >= SAME_MESSAGE)
            .max_by(|(_, a, left), (_, b, right)| {
                // Ties broken on the id so the choice never depends on catalogue order.
                left.partial_cmp(right)
                    .unwrap_or(Ordering::Equal)
                    .then_with(|| b.id.cmp(&a.id))
            });

        if let Some((index, from, _)) = best {
            taken.insert(index);
            pairs.insert(key.clone(), from.clone_for_carrying());
        }
    }

    pairs
}

impl Departed {
    /// The parts that follow a reword. Not `Clone`, because the identity of the
    /// message it came from stays behind.
    fn clone_for_carrying(&self) -> Self {
        Self {
            context: self.context.clone(),
            id: self.id.clone(),
            plural: self.plural.clone(),
            translations: self.translations.clone(),
            comments: self.comments.clone(),
            flags: self.flags.clone(),
        }
    }
}

/// Creates an empty catalogue for a locale, with a header CLDR agrees with.
///
/// The reason this could not exist before was that a `Plural-Forms` header needs a
/// C expression and CLDR does not hand one out. It is now found by offering known
/// gettext expressions and keeping the one CLDR confirms — see
/// [`Forms::expression`] — so what gets written has been checked rather than
/// believed. A locale no candidate fits is an error, not an approximation.
///
/// Does nothing if the file already exists, so it is safe to call before a merge.
///
/// # Errors
///
/// Fails if CLDR has no rules for the locale, if no known expression matches them,
/// or if the file cannot be written.
pub fn create_catalog(path: &Path, locale: &str) -> Result<bool> {
    if path.exists() {
        return Ok(false);
    }

    let forms = Forms::new(locale)?;
    let expression = forms.expression(locale)?;

    // Written as text because a new catalogue is nothing but its header, and the
    // one field that matters is the one polib does not expose a way to build.
    let header = format!(
        "msgid \"\"\nmsgstr \"\"\n\
         \"MIME-Version: 1.0\\n\"\n\
         \"Content-Type: text/plain; charset=utf-8\\n\"\n\
         \"Content-Transfer-Encoding: 8bit\\n\"\n\
         \"Language: {locale}\\n\"\n\
         \"Plural-Forms: nplurals={}; plural={expression};\\n\"\n",
        forms.count(),
    );

    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }

    let temporary = temporary(path);
    std::fs::write(&temporary, header)?;

    // Read back before it is put in place: what was written has to be a catalogue
    // this crate would accept, and the cheapest way to know is to accept it.
    let placed = (|| {
        let written = po_file::parse(&temporary).map_err(|e| Error::Catalog {
            path: temporary.clone(),
            message: e.to_string(),
        })?;
        forms.check(locale, written.metadata.plural_rules.nplurals)?;
        forms.check_expression(locale, &written.metadata.plural_rules.expr)?;
        Ok(std::fs::rename(&temporary, path)?)
    })();

    if placed.is_err() {
        let _ = std::fs::remove_file(&temporary);
    }

    placed.map(|()| true)
}

/// Writes through a temporary file and renames it into place.
///
/// A catalogue is a translator's work, and writing it in place means truncating it
/// first: anything that stops the process between the truncate and the write — a
/// signal, a full disk, a panic in the next locale — leaves an empty file where the
/// translations were. A rename on the same directory is atomic, so the worst case
/// becomes a stray temporary rather than a lost catalogue.
fn write_atomically(catalog: &polib::catalog::Catalog, path: &Path) -> Result<()> {
    let temporary = temporary(path);

    let written = po_file::write_to_file(catalog, &temporary)
        .map_err(|e| Error::Catalog {
            path: temporary.clone(),
            message: e.to_string(),
        })
        .and_then(|()| {
            std::fs::rename(&temporary, path).map_err(|e| Error::Catalog {
                path: path.to_owned(),
                message: e.to_string(),
            })
        });

    // No later run will reuse this name, so one left behind stays in src/ until
    // somebody deletes it by hand.
    if written.is_err() {
        let _ = std::fs::remove_file(&temporary);
    }

    written
}

/// The temporary a catalogue is written through, unique to the write that asks.
///
/// Two extractions overlap routinely: `task dev` watches the catalogues an
/// extraction writes, so saving a template can start a second one before the first
/// has finished. Sharing one temporary meant the first rename took the second's
/// file with it, and the second then failed to rename a path that had just existed —
/// reported against the catalogue, which made a race look like a missing file.
///
/// The pid separates processes and the counter separates writes within one, since
/// nothing here promises the callers are on the same thread.
fn temporary(path: &Path) -> PathBuf {
    static WRITES: AtomicU64 = AtomicU64::new(0);

    let mut name = path.file_name().unwrap_or_default().to_owned();
    name.push(format!(
        ".{}.{}.tmp",
        std::process::id(),
        WRITES.fetch_add(1, atomic::Ordering::Relaxed)
    ));
    path.with_file_name(name)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::extract::Message as Extracted;

    fn catalogue(name: &str, body: &str) -> std::path::PathBuf {
        // Named for its test rather than derived from the body: two fixtures of
        // equal length collided on one path and raced.
        let path = std::env::temp_dir().join(format!("agt-{name}.po"));
        std::fs::write(&path, body).unwrap();
        path
    }

    fn site(id: &str, plural: Option<&str>) -> Extracted {
        Extracted {
            id: id.to_owned(),
            context: None,
            plural: plural.map(str::to_owned),
            file: "t.html".to_owned(),
            line: 1,
        }
    }

    const PL_HEADER: &str = concat!(
        "msgid \"\"\nmsgstr \"\"\n",
        "\"Language: pl-PL\\n\"\n",
        "\"MIME-Version: 1.0\\n\"\n",
        "\"Content-Type: text/plain; charset=utf-8\\n\"\n",
        "\"Content-Transfer-Encoding: 8bit\\n\"\n",
        "\"Plural-Forms: nplurals=3; plural=n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2;\\n\"\n",
    );

    #[test]
    fn a_plural_translation_survives_re_extraction() {
        let path = catalogue(
            "a_plural_translation_survives_re_extraction",
            &format!(
                "{PL_HEADER}\n#: t.html:1\nmsgid \"%{{count}} locale\"\nmsgid_plural \"%{{count}} locales\"\n\
             msgstr[0] \"%{{count}} język\"\nmsgstr[1] \"%{{count}} języki\"\nmsgstr[2] \"%{{count}} języków\"\n"
            ),
        );

        into_catalog(
            &path,
            "pl-PL",
            &[site("%{count} locale", Some("%{count} locales"))],
        )
        .unwrap();

        let after = std::fs::read_to_string(&path).unwrap();
        assert!(after.contains("język\""), "singular form lost:\n{after}");
        assert!(after.contains("języki\""), "few form lost:\n{after}");
        assert!(after.contains("języków\""), "many form lost:\n{after}");
    }

    #[test]
    fn a_singular_translation_survives_re_extraction() {
        let path = catalogue(
            "a_singular_translation_survives_re_extraction",
            &format!("{PL_HEADER}\n#: t.html:1\nmsgid \"close\"\nmsgstr \"zamknij\"\n"),
        );

        into_catalog(&path, "pl-PL", &[site("close", None)]).unwrap();

        assert!(std::fs::read_to_string(&path).unwrap().contains("zamknij"));
    }

    #[test]
    fn a_message_that_left_the_templates_is_removed_and_named() {
        let path = catalogue(
            "a_message_that_left_the_templates_is_removed_and_named",
            &format!(
                "{PL_HEADER}\n#: t.html:1\nmsgid \"stays\"\nmsgstr \"zostaje\"\n\n\
             #: t.html:2\nmsgid \"went\"\nmsgstr \"poszło\"\n"
            ),
        );

        let summary = into_catalog(&path, "pl-PL", &[site("stays", None)]).unwrap();

        assert_eq!(summary.removed, ["went"]);

        let after = std::fs::read_to_string(&path).unwrap();
        assert!(!after.contains("poszło"), "not removed:\n{after}");
        assert!(after.contains("zostaje"), "took the wrong one:\n{after}");
        // The header is metadata rather than a message, and must not be swept up
        // with them — without it a catalogue has no Plural-Forms to check.
        assert!(after.contains("Plural-Forms:"), "header lost:\n{after}");
    }

    #[test]
    fn a_created_catalogue_is_one_this_crate_would_accept() {
        for locale in ["fr-FR", "en-GB", "pl-PL", "ar-EG", "ja-JP", "uk-UA"] {
            let path = std::env::temp_dir().join(format!("agt-created-{locale}.po"));
            let _ = std::fs::remove_file(&path);

            assert!(create_catalog(&path, locale).unwrap(), "{locale}");

            // The point of the exercise: a header nothing had to be told.
            let forms = Forms::new(locale).unwrap();
            let written = po_file::parse(&path).unwrap();
            forms
                .check(locale, written.metadata.plural_rules.nplurals)
                .unwrap();
            forms
                .check_expression(locale, &written.metadata.plural_rules.expr)
                .unwrap();

            // And a merge into it works, which is the reason to have one.
            let summary = into_catalog(&path, locale, &[site("hello", None)]).unwrap();
            assert_eq!(summary.total, 1);
            assert_eq!(summary.untranslated, 1);

            std::fs::remove_file(&path).unwrap();
        }
    }

    #[test]
    fn an_existing_catalogue_is_left_alone() {
        let path = catalogue(
            "an_existing_catalogue_is_left_alone",
            &format!("{PL_HEADER}\n#: t.html:1\nmsgid \"here\"\nmsgstr \"tutaj\"\n"),
        );

        assert!(!create_catalog(&path, "pl-PL").unwrap());
        assert!(std::fs::read_to_string(&path).unwrap().contains("tutaj"));
    }

    #[test]
    fn a_reworded_message_keeps_its_translation_and_is_flagged() {
        let path = catalogue(
            "a_reworded_message_keeps_its_translation_and_is_flagged",
            &format!(
                "{PL_HEADER}\n#: t.html:1\nmsgid \"read my CV\"\nmsgstr \"przeczytaj moje CV\"\n"
            ),
        );

        // The English was reworded; it is the same sentence and the same page.
        let summary = into_catalog(&path, "pl-PL", &[site("read my resume", None)]).unwrap();

        assert_eq!(
            summary.reworded,
            [("read my CV".to_owned(), "read my resume".to_owned())]
        );
        // Carried, not lost — so it does not count as removed.
        assert!(summary.removed.is_empty());
        assert_eq!(summary.untranslated, 0);

        let after = std::fs::read_to_string(&path).unwrap();
        assert!(
            after.contains("przeczytaj moje CV"),
            "translation lost:\n{after}"
        );
        assert!(after.contains("read my resume"), "new id missing:\n{after}");
        assert!(
            !after.contains("msgid \"read my CV\""),
            "old id kept:\n{after}"
        );
        assert!(after.contains("fuzzy"), "not flagged for review:\n{after}");
    }

    #[test]
    fn an_unrelated_message_is_not_treated_as_a_reword() {
        let path = catalogue(
            "an_unrelated_message_is_not_treated_as_a_reword",
            &format!(
                "{PL_HEADER}\n#: t.html:1\nmsgid \"change language\"\nmsgstr \"zmień język\"\n"
            ),
        );

        let summary =
            into_catalog(&path, "pl-PL", &[site("senior full stack engineer", None)]).unwrap();

        assert!(summary.reworded.is_empty(), "{:?}", summary.reworded);
        assert_eq!(summary.removed, ["change language"]);

        let after = std::fs::read_to_string(&path).unwrap();
        assert!(
            !after.contains("zmień język"),
            "carried onto a stranger:\n{after}"
        );
    }

    #[test]
    fn a_reword_does_not_steal_from_a_message_that_stayed() {
        let path = catalogue(
            "a_reword_does_not_steal_from_a_message_that_stayed",
            &format!(
                "{PL_HEADER}\n#: t.html:1\nmsgid \"read my CV\"\nmsgstr \"przeczytaj moje CV\"\n\n\
                 #: t.html:2\nmsgid \"read my blog\"\nmsgstr \"przeczytaj mój blog\"\n"
            ),
        );

        // "read my blog" is still there, so only "read my CV" is free to move.
        let summary = into_catalog(
            &path,
            "pl-PL",
            &[site("read my blog", None), site("read my resume", None)],
        )
        .unwrap();

        assert_eq!(
            summary.reworded,
            [("read my CV".to_owned(), "read my resume".to_owned())]
        );

        let after = std::fs::read_to_string(&path).unwrap();
        assert!(
            after.contains("przeczytaj mój blog"),
            "the one that stayed lost its translation:\n{after}"
        );
        assert!(after.contains("przeczytaj moje CV"), "{after}");
    }

    #[test]
    fn a_fuzzy_message_is_left_alone_while_it_is_still_in_a_template() {
        // fuzzy means a translation that needs review. Extraction has no opinion
        // on that, and removal is about the id being gone, not the flag.
        let path = catalogue(
            "a_fuzzy_message_is_left_alone_while_it_is_still_in_a_template",
            &format!("{PL_HEADER}\n#: t.html:1\n#, fuzzy\nmsgid \"here\"\nmsgstr \"tutaj\"\n"),
        );

        let summary = into_catalog(&path, "pl-PL", &[site("here", None)]).unwrap();

        assert!(summary.removed.is_empty());
        let after = std::fs::read_to_string(&path).unwrap();
        assert!(after.contains("fuzzy"), "flag lost:\n{after}");
        assert!(after.contains("tutaj"), "translation lost:\n{after}");
    }

    #[test]
    fn a_new_message_arrives_untranslated_and_is_counted() {
        let path = catalogue(
            "a_new_message_arrives_untranslated_and_is_counted",
            &format!("{PL_HEADER}\n#: t.html:1\nmsgid \"old\"\nmsgstr \"stary\"\n "),
        );

        let summary =
            into_catalog(&path, "pl-PL", &[site("old", None), site("new", None)]).unwrap();

        assert_eq!(summary.total, 2);
        assert_eq!(summary.untranslated, 1);
    }
}

#[cfg(test)]
mod atomicity {
    use super::*;
    use crate::extract::Message as Extracted;

    /// Temporaries left beside `path`. Names are unique per write, so the only way
    /// to look for one is by the shape of the name.
    fn strays(path: &Path) -> Vec<PathBuf> {
        let name = path.file_name().unwrap().to_string_lossy().into_owned();
        std::fs::read_dir(path.parent().unwrap())
            .unwrap()
            .filter_map(std::result::Result::ok)
            .map(|entry| entry.path())
            .filter(|found| {
                let found = found.file_name().unwrap_or_default().to_string_lossy();
                found.starts_with(&name) && found.ends_with(".tmp")
            })
            .collect()
    }

    #[test]
    fn a_failed_merge_leaves_the_catalogue_intact() {
        // The header says two forms; CLDR gives Polish three, so this fails the
        // check — after the point where an in-place write would have truncated.
        let path = std::env::temp_dir().join("agt-atomic.po");
        let original = concat!(
            "msgid \"\"\nmsgstr \"\"\n",
            "\"Language: pl-PL\\n\"\n",
            "\"MIME-Version: 1.0\\n\"\n",
            "\"Content-Type: text/plain; charset=utf-8\\n\"\n",
            "\"Content-Transfer-Encoding: 8bit\\n\"\n",
            "\"Plural-Forms: nplurals=2; plural=n != 1;\\n\"\n",
            "\n#: t.html:1\nmsgid \"close\"\nmsgstr \"zamknij\"\n",
        );
        std::fs::write(&path, original).unwrap();

        let sites = [Extracted {
            id: "close".to_owned(),
            context: None,
            plural: None,
            file: "t.html".to_owned(),
            line: 1,
        }];
        assert!(into_catalog(&path, "pl-PL", &sites).is_err());

        let after = std::fs::read_to_string(&path).unwrap();
        assert!(
            after.contains("zamknij"),
            "translation lost on a failed merge"
        );
        assert_eq!(after, original, "a failed merge rewrote the catalogue");
        assert!(
            strays(&path).is_empty(),
            "temporary left behind: {:?}",
            strays(&path)
        );
    }

    #[test]
    fn merges_of_one_catalogue_do_not_collide() {
        // `task dev` watches the catalogues an extraction writes, so a save can
        // start a second extraction over the first. They must not share a
        // temporary: one rename would take the other's file, and the second would
        // then fail on a path that had just existed.
        let path = std::env::temp_dir().join("agt-concurrent.po");
        std::fs::write(
            &path,
            concat!(
                "msgid \"\"\nmsgstr \"\"\n",
                "\"Language: pl-PL\\n\"\n",
                "\"MIME-Version: 1.0\\n\"\n",
                "\"Content-Type: text/plain; charset=utf-8\\n\"\n",
                "\"Content-Transfer-Encoding: 8bit\\n\"\n",
                "\"Plural-Forms: nplurals=3; plural=n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2;\\n\"\n",
                "\n#: t.html:1\nmsgid \"close\"\nmsgstr \"zamknij\"\n",
            ),
        )
        .unwrap();

        let sites = [Extracted {
            id: "close".to_owned(),
            context: None,
            plural: None,
            file: "t.html".to_owned(),
            line: 1,
        }];

        std::thread::scope(|scope| {
            for _ in 0..8 {
                scope.spawn(|| {
                    for _ in 0..20 {
                        into_catalog(&path, "pl-PL", &sites).unwrap();
                    }
                });
            }
        });

        assert!(std::fs::read_to_string(&path).unwrap().contains("zamknij"));
    }
}
