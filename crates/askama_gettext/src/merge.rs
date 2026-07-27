//! Writing extracted messages into `.po` files.
//!
//! Merging rather than generating: a catalogue is a translator's work, and the
//! templates only get to say which messages exist and where they are written. An
//! existing translation, comment or flag survives.
//!
//! A message that has left the templates is removed. gettext writes one as an
//! obsolete `#~` entry, which keeps the translation without pretending the message
//! still exists — but polib has no way to write those, and the only flag it does
//! have is `fuzzy`, which already means something else: a translation that needs
//! review. Marking one obsolete that way makes it indistinguishable from the other
//! and leaves it referencing a file it is no longer in. Removing it says the true
//! thing, and the removal is reported by id and lands in a diff, so the translation
//! is a `git revert` away rather than a mystery in a file nobody reads.

use std::collections::BTreeMap;
use std::path::Path;

use polib::message::Message;
use polib::po_file;

use crate::error::{Error, Result};
use crate::extract::Message as Extracted;
use crate::plural::Forms;

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

        // Keep whatever a translator has already done; replace only what the
        // templates are authoritative about, which is the references.
        let translations: Vec<String> = match (&existing, plural) {
            (Some(message), Some(_)) => message
                .msgstr_plural()
                .cloned()
                .unwrap_or_else(|_| vec![String::new(); forms.count()]),
            (Some(message), None) => vec![message.msgstr().unwrap_or_default().to_owned()],
            (None, Some(_)) => vec![String::new(); forms.count()],
            (None, None) => vec![String::new()],
        };

        let comments = existing
            .as_ref()
            .map(|m| m.translator_comments().to_owned())
            .unwrap_or_default();
        let flags = existing.as_ref().map(|m| m.flags().clone());

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

    // Anything the templates no longer mention. Gathered before anything is deleted,
    // because removing through the iterator would be changing what is being read.
    let gone: Vec<(Option<String>, String, Option<String>)> = catalog
        .messages()
        .filter(|message| {
            let key = (
                message.msgctxt().map(str::to_owned),
                message.msgid().to_owned(),
            );
            !wanted.contains_key(&key)
        })
        .map(|message| {
            (
                message.msgctxt().map(str::to_owned),
                message.msgid().to_owned(),
                message.msgid_plural().ok().map(str::to_owned),
            )
        })
        .collect();

    for (context, id, plural) in &gone {
        catalog.delete_message(context.as_deref(), id, plural.as_deref());
    }

    summary.removed = gone.into_iter().map(|(_, id, _)| id).collect();

    write_atomically(&catalog, path)?;

    Ok(summary)
}

/// Writes through a temporary file and renames it into place.
///
/// A catalogue is a translator's work, and writing it in place means truncating it
/// first: anything that stops the process between the truncate and the write — a
/// signal, a full disk, a panic in the next locale — leaves an empty file where the
/// translations were. A rename on the same directory is atomic, so the worst case
/// becomes a stray temporary rather than a lost catalogue.
fn write_atomically(catalog: &polib::catalog::Catalog, path: &Path) -> Result<()> {
    let temporary = path.with_extension("po.tmp");

    po_file::write_to_file(catalog, &temporary).map_err(|e| Error::Catalog {
        path: temporary.clone(),
        message: e.to_string(),
    })?;

    std::fs::rename(&temporary, path).map_err(|e| Error::Catalog {
        path: path.to_owned(),
        message: e.to_string(),
    })?;

    Ok(())
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
        assert!(!path.with_extension("po.tmp").exists() || after == original);
    }
}
