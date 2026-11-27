//! The home page: the name, the role, and the way to the CV.

use std::ops::Deref;

use askama::Template;

use crate::layout::Page;

#[derive(Template)]
#[template(path = "pages/index.html")]
pub struct Index<'a> {
    pub page: Page<'a>,
}

impl<'a> Deref for Index<'a> {
    type Target = Page<'a>;

    fn deref(&self) -> &Page<'a> {
        &self.page
    }
}

pub fn render(page: Page<'_>) -> askama::Result<String> {
    Index { page }.render()
}
