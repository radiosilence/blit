//! The error type.

use std::path::PathBuf;

/// Anything that can go wrong loading, extracting from, or writing a catalogue.
#[derive(Debug, thiserror::Error)]
#[non_exhaustive]
pub enum Error {
    /// A template could not be parsed by Askama's parser.
    #[error("parsing {path}: {message}")]
    Template {
        /// The template that failed.
        path: PathBuf,
        /// Askama's own message.
        message: String,
    },

    /// A catalogue could not be read or written.
    #[error("catalogue {path}: {message}")]
    Catalog {
        /// The catalogue that failed.
        path: PathBuf,
        /// What went wrong.
        message: String,
    },

    /// A locale string is not a well-formed language tag.
    #[error("`{0}` is not a language tag")]
    Locale(String),

    /// CLDR has no plural rules for a locale.
    #[error("no CLDR plural rules for `{0}`")]
    NoPluralRules(String),

    /// A catalogue's `Plural-Forms` header disagrees with CLDR about how many
    /// forms the language has. Filling in the extra slot would be wasted work and
    /// writing to it would be a silent bug, so this stops rather than guessing.
    #[error("{locale}: catalogue declares nplurals={declared}, CLDR gives {actual} ({categories})")]
    PluralMismatch {
        /// The locale in question.
        locale: String,
        /// What the catalogue's header says.
        declared: usize,
        /// What CLDR says.
        actual: usize,
        /// The CLDR categories, for diagnosis.
        categories: String,
    },

    /// An I/O failure.
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

/// A `Result` with this crate's [`Error`].
pub type Result<T> = std::result::Result<T, Error>;
