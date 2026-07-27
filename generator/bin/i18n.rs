//! Extracts messages from the templates into every catalogue.
//!
//! Separate from the renderer because it writes the files the renderer reads: a
//! build that did both would be rewriting its own input.

#[path = "../config.rs"]
mod config;

use std::path::Path;

use anyhow::{Context, Result};
use askama_gettext::{extract, merge};
use askama_parser::Syntax;

use crate::config::{LOCALES, SOURCE};

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

    for locale in LOCALES {
        let path = root.join("src/locales").join(locale.code).join("messages.po");
        let summary = merge::into_catalog(&path, locale.code, &messages)
            .with_context(|| format!("merging into {}", path.display()))?;

        if locale.code == SOURCE {
            println!("  {} — {} messages", locale.code, summary.total);
        } else if summary.untranslated > 0 || summary.obsolete > 0 {
            println!(
                "  {} — {} untranslated, {} obsolete",
                locale.code, summary.untranslated, summary.obsolete
            );
        }
    }

    Ok(())
}
