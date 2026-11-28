//! The site's origin, its 36 locales and its fuzzy policy, from `Sando.toml`.
//!
//! sando's build script reads the file, checks the locales against the
//! catalogues on disk and derives each locale's endonym, place and direction
//! from CLDR, with `[i18n.overrides]` for the two it lacks.

pub use sando::Locale;

mod generated {
    sando::include_config!();
}

pub use generated::{ENTRIES, LOCALES, ORIGIN, SOURCE};

/// `[i18n].fuzzy`, in askama_gettext's terms.
pub const FUZZY: askama_gettext::Fuzzy = match generated::FUZZY {
    sando::Fuzzy::Skip => askama_gettext::Fuzzy::Skip,
    sando::Fuzzy::Serve => askama_gettext::Fuzzy::Serve,
};
