//! The source locale lives at the root (`/`, `/cv`); everything else is prefixed
//! (`/fr-FR`, `/fr-FR/cv`). Pages are written as directory indexes, which nano-web
//! resolves for both `/cv` and `/cv/`.

use crate::config::SOURCE;

pub struct Page {
    pub slug: &'static str,
    pub template: &'static str,
}

pub const PAGES: &[Page] = &[
    Page { slug: "", template: "index" },
    Page { slug: "cv", template: "cv" },
    // Scratch page for exercising i18n against real catalogues. Delete before merge.
    Page { slug: "i18n-test", template: "i18n-test" },
];

pub fn url(locale: &str, slug: &str) -> String {
    let prefix = if locale == SOURCE { "" } else { locale };
    let parts: Vec<&str> = [prefix, slug].into_iter().filter(|p| !p.is_empty()).collect();
    format!("/{}", parts.join("/"))
}
