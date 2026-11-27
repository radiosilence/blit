//! What the prerender cannot find by itself. It crawls from `/` and follows
//! every internal link, so a page or an asset something links to needs no entry
//! here; this lists only what is reached by address, drawn from the app's own
//! configuration rather than written out path by path.

use crate::config::LOCALES;
use crate::routes::url;

pub enum Entry {
    /// One path.
    Path(&'static str),
    /// `/{locale}/<slug>` for every locale in [`LOCALES`], the source locale at
    /// the root, as [`url`] writes it.
    EachLocale(&'static str),
}

pub const ENTRIES: &[Entry] = &[
    // Each locale's home is an address people type and search engines are told
    // about, so it is published whether or not the locale picker links it.
    Entry::EachLocale(""),
    // Asked for by name: by a browser when a page links no icon, by a crawler,
    // and by whoever has the CV's link from an application form.
    Entry::Path("/favicon.ico"),
    Entry::Path("/robots.txt"),
    Entry::Path("/cv.pdf"),
];

/// Every declared path, in order.
pub fn entries() -> Vec<String> {
    ENTRIES
        .iter()
        .flat_map(|entry| match entry {
            Entry::Path(path) => vec![(*path).to_owned()],
            Entry::EachLocale(slug) => LOCALES.iter().map(|l| url(l.code, slug)).collect(),
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::entries;
    use crate::assets::FIXED;
    use crate::config::LOCALES;

    #[test]
    fn every_unhashed_asset_is_declared() {
        let entries = entries();
        for name in FIXED {
            assert!(
                entries.contains(&format!("/{name}")),
                "/{name} has no hash for a link to carry, so it must be declared"
            );
        }
    }

    #[test]
    fn a_locale_pattern_expands_to_each_locale() {
        let entries = entries();
        assert!(
            entries.contains(&"/".to_owned()),
            "the source locale's home"
        );
        assert!(entries.contains(&"/fr-FR".to_owned()));
        assert_eq!(entries.len(), LOCALES.len() + 3);
    }
}
