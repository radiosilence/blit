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

    /// A catalogue's `plural=` expression could not be read as one.
    #[error("plural expression `{expression}`: {message}")]
    PluralExpression {
        /// The expression as the catalogue wrote it.
        expression: String,
        /// What stopped it being understood.
        message: String,
    },

    /// A catalogue's `plural=` expression selects a different form from CLDR.
    ///
    /// The count that separates them is given rather than the whole expression,
    /// because that is the input a translator would have to try before noticing
    /// their boxes are in an order the site does not use.
    #[error(
        "{locale}: for n={count} the catalogue's plural expression gives form {declared}, CLDR gives {actual}"
    )]
    PluralExpressionMismatch {
        /// The locale in question.
        locale: String,
        /// The count the two disagree on, smallest first.
        count: u64,
        /// What the header's expression works out to.
        declared: i64,
        /// What CLDR selects.
        actual: usize,
    },

    /// No known gettext expression selects the forms CLDR gives a locale.
    ///
    /// Writing an unverified one is the thing this refuses to do, so a locale that
    /// reaches here needs its expression supplied by hand and added to the
    /// candidates once something has checked it.
    #[error("{locale}: no known plural expression matches CLDR's {forms} forms")]
    NoPluralExpression {
        /// The locale in question.
        locale: String,
        /// How many forms CLDR gives it, for finding a candidate.
        forms: usize,
    },

    /// An I/O failure.
    #[error(transparent)]
    Io(#[from] std::io::Error),
}

/// A `Result` with this crate's [`Error`].
pub type Result<T> = std::result::Result<T, Error>;
