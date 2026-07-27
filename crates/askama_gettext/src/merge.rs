//! Writing extracted messages into `.po` files.
//!
//! Merging rather than generating: a catalogue is a translator's work, and the
//! templates only get to say which messages exist and where they are written. An
//! existing translation, comment or flag survives; a message that has left the
//! templates is marked obsolete rather than deleted, so its translation is still
//! there if the string comes back.

use std::collections::BTreeMap;
use std::path::Path;

use polib::message::{Message, MessageMutView, MessageView};
use polib::po_file;

use crate::error::{Error, Result};
use crate::extract::Message as Extracted;
use crate::plural::Forms;

/// What changed, for reporting to whoever ran the extraction.
#[derive(Debug, Default, Clone, Copy, PartialEq, Eq)]
pub struct Summary {
    /// Messages in the templates.
    pub total: usize,
    /// Messages this catalogue has no translation for.
    pub untranslated: usize,
    /// Messages that were in the catalogue but are no longer in any template.
    pub obsolete: usize,
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

    // Anything the templates no longer mention. Marked, not deleted: a string that
    // comes back should come back translated.
    for mut message in catalog.messages_mut() {
        let key = (
            message.msgctxt().map(str::to_owned),
            message.msgid().to_owned(),
        );
        if !wanted.contains_key(&key) && !message.is_fuzzy() {
            summary.obsolete += 1;
            message.flags_mut().add_flag("fuzzy");
        }
    }

    po_file::write_to_file(&catalog, path).map_err(|e| Error::Catalog {
        path: path.to_owned(),
        message: e.to_string(),
    })?;

    Ok(summary)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::extract::Message as Extracted;

    fn catalogue(body: &str) -> std::path::PathBuf {
        // A distinct name per test so they can run in parallel.
        let path = std::env::temp_dir().join(format!("agt-{}.po", body.len()));
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
        let path = catalogue(&format!(
            "{PL_HEADER}\n#: t.html:1\nmsgid \"%{{count}} locale\"\nmsgid_plural \"%{{count}} locales\"\n\
             msgstr[0] \"%{{count}} język\"\nmsgstr[1] \"%{{count}} języki\"\nmsgstr[2] \"%{{count}} języków\"\n"
        ));

        into_catalog(&path, "pl-PL", &[site("%{count} locale", Some("%{count} locales"))]).unwrap();

        let after = std::fs::read_to_string(&path).unwrap();
        assert!(after.contains("język\""), "singular form lost:\n{after}");
        assert!(after.contains("języki\""), "few form lost:\n{after}");
        assert!(after.contains("języków\""), "many form lost:\n{after}");
    }

    #[test]
    fn a_singular_translation_survives_re_extraction() {
        let path = catalogue(&format!(
            "{PL_HEADER}\n#: t.html:1\nmsgid \"close\"\nmsgstr \"zamknij\"\n"
        ));

        into_catalog(&path, "pl-PL", &[site("close", None)]).unwrap();

        assert!(std::fs::read_to_string(&path).unwrap().contains("zamknij"));
    }

    #[test]
    fn a_new_message_arrives_untranslated_and_is_counted() {
        let path = catalogue(&format!("{PL_HEADER}\n#: t.html:1\nmsgid \"old\"\nmsgstr \"stary\"\n "));

        let summary =
            into_catalog(&path, "pl-PL", &[site("old", None), site("new", None)]).unwrap();

        assert_eq!(summary.total, 2);
        assert_eq!(summary.untranslated, 1);
    }
}
