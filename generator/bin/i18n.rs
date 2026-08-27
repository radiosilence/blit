//! Extracts messages from the templates into every catalogue.
//!
//! Separate from the renderer because it writes the files the renderer reads: a
//! build that did both would be rewriting its own input.

use std::collections::BTreeMap;
use std::path::Path;

use anyhow::{Context, Result};
use askama_gettext::{extract, merge};
use askama_parser::Syntax;

use blit::config::{LOCALES, SOURCE};

fn main() -> Result<()> {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"));
    let syntax = Syntax::default();

    let mut files: Vec<_> = std::fs::read_dir(root.join("src/templates"))?
        .filter_map(std::result::Result::ok)
        .map(|entry| entry.path())
        .filter(|path| path.extension().is_some_and(|e| e == "html"))
        .collect();
    files.sort();

    let mut messages = Vec::new();
    for path in &files {
        // Relative, so a `#:` reference means the same thing on every machine.
        let relative = path.strip_prefix(root).unwrap_or(path);
        let source = std::fs::read_to_string(path)?;
        messages.extend(
            extract::from_str(&source, &relative.to_string_lossy(), &syntax)
                .with_context(|| format!("extracting from {}", relative.display()))?,
        );
    }

    println!("{} calls across {} templates", messages.len(), files.len());

    // Which locales a removal touched, rather than a line per locale: the templates
    // decide what goes, so the same ids leave all 36 catalogues at once.
    let mut created: Vec<&str> = Vec::new();
    let mut updated = 0usize;
    let mut removed: BTreeMap<String, usize> = BTreeMap::new();
    let mut reworded: BTreeMap<(String, String), usize> = BTreeMap::new();

    for locale in LOCALES {
        let path = root
            .join("src/locales")
            .join(locale.code)
            .join("messages.po");
        // A locale added to config.rs has no catalogue until something writes one,
        // and the header it needs is derivable, so adding a locale is one step.
        if merge::create_catalog(&path, locale.code)
            .with_context(|| format!("creating {}", path.display()))?
        {
            created.push(locale.code);
        }

        let summary = merge::into_catalog(&path, locale.code, &messages)
            .with_context(|| format!("merging into {}", path.display()))?;

        updated += usize::from(summary.written);

        for id in summary.removed {
            *removed.entry(id).or_default() += 1;
        }

        for pair in summary.reworded {
            *reworded.entry(pair).or_default() += 1;
        }

        if locale.code == SOURCE {
            println!("  {} — {} messages", locale.code, summary.total);
        } else if summary.untranslated > 0 {
            println!("  {} — {} untranslated", locale.code, summary.untranslated);
        }
    }

    if !created.is_empty() {
        println!("\ncatalogues created: {}", created.join(", "));
    }

    // Silent when nothing moved, which after the first run of a session is most of
    // them — extraction only writes a catalogue it disagrees with.
    if updated > 0 {
        println!("\ncatalogues updated: {updated}");
    }

    // Both loud, because between them they are everything extraction does to a
    // translator's work — and `task dev` runs it on every save.
    if !reworded.is_empty() {
        println!("\ncarried onto reworded English, now fuzzy:");
        for ((was, is), catalogues) in &reworded {
            println!("  {was:?} → {is:?} — in {catalogues} catalogues");
        }
    }

    if !removed.is_empty() {
        println!("\nremoved, no longer in any template:");
        for (id, catalogues) in &removed {
            println!("  {id:?} — from {catalogues} catalogues");
        }
    }

    Ok(())
}
