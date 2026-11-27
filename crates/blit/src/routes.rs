//! The site's routes: an address and the page that answers it.
//!
//! The source locale lives at the root (`/`, `/cv`); everything else is prefixed
//! (`/fr-FR`, `/fr-FR/cv`). Pages are written as directory indexes, which nano-web
//! resolves for both `/cv` and `/cv/`.

use crate::config::SOURCE;
use crate::layout::Page;
use crate::pages;

pub struct Route {
    pub slug: &'static str,
    /// Whether the page's main content is in each locale. The CV is written once,
    /// in English, and only the text around it is translated, which a search
    /// engine counts as the same page rather than a translation of it.
    pub translated: bool,
    pub render: fn(Page<'_>) -> askama::Result<String>,
}

pub const ROUTES: &[Route] = &[
    Route {
        slug: "",
        translated: true,
        render: pages::index::render,
    },
    Route {
        slug: "cv",
        translated: false,
        render: pages::cv::render,
    },
];

pub fn url(locale: &str, slug: &str) -> String {
    let prefix = if locale == SOURCE { "" } else { locale };
    let parts: Vec<&str> = [prefix, slug]
        .into_iter()
        .filter(|p| !p.is_empty())
        .collect();
    format!("/{}", parts.join("/"))
}
