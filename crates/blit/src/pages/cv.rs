//! The CV as an article, typeset by [`crate::cv`] once and shared by every locale.

use std::ops::Deref;

use askama::Template;
// The template's `__` calls resolve through `Deref` to `Page`'s impl.
use askama_gettext::Translate as _;

use crate::layout::Page;

#[derive(Template)]
#[template(path = "pages/cv.html")]
pub struct Cv<'a> {
    pub page: Page<'a>,
    /// Typst's HTML from the repository's own `content/cv.typ`, rendered `|safe`.
    pub cv: &'a str,
}

impl<'a> Deref for Cv<'a> {
    type Target = Page<'a>;

    fn deref(&self) -> &Page<'a> {
        &self.page
    }
}

pub fn render(page: Page<'_>) -> askama::Result<String> {
    let app = page.app;
    Cv { page, cv: &app.cv }.render()
}
