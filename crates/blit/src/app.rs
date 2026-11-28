//! The site as an application: everything a page needs to render, loaded once.
//! [`App::render`] answers a route in a locale. The server's handlers are its
//! only callers; `sdo build` reaches it through them.

use std::path::Path;

use anyhow::Result;
use askama_gettext::Catalogs;
use sando::Assets;

use crate::config::{FUZZY, LOCALES, Locale, SOURCE};
use crate::layout::Page;
use crate::routes::Route;

pub struct App {
    pub catalogs: Catalogs,
    /// What `sdo` published: the stylesheet, the font, the icons and the
    /// manifest at their hashed names, with their references already rewritten.
    pub assets: Assets,
    /// The CV as HTML, typeset once and shared by every locale's `/cv`.
    pub cv: String,
    /// The same CV as a PDF, for `/cv.pdf`.
    pub cv_pdf: Vec<u8>,
}

impl App {
    /// Loads the site from this crate, with the assets `sdo` published into
    /// `SANDO_ASSETS`.
    pub fn open() -> Result<Self> {
        Self::load(Path::new(env!("CARGO_MANIFEST_DIR")), Assets::from_env()?)
    }

    /// Reads the catalogues and the CV from the crate's directory.
    pub fn load(root: &Path, assets: Assets) -> Result<Self> {
        let codes: Vec<&str> = LOCALES.iter().map(|l| l.code).collect();
        let catalogs = Catalogs::load(&root.join("locales"), &codes, SOURCE, FUZZY)?;
        let cv = crate::cv::render(root)?;
        Ok(Self {
            catalogs,
            assets,
            cv: cv.html,
            cv_pdf: cv.pdf,
        })
    }

    /// The page at `route` in `locale`.
    pub fn render(&self, locale: &Locale, route: &Route) -> Result<String> {
        Ok((route.render)(Page::new(self, locale, route))?)
    }
}
