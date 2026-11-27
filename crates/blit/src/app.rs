//! The site as an application: everything a page needs to render, loaded once.
//! [`App::render`] answers a route in a locale. The server's handlers are its
//! only callers; the prerender reaches it through them.

use std::path::Path;

use anyhow::{Context as _, Result, bail};
use askama_gettext::Catalogs;

use crate::assets::Assets;
use crate::config::{FUZZY, LOCALES, Locale, SOURCE};
use crate::layout::Page;
use crate::routes::Route;

pub struct App {
    pub catalogs: Catalogs,
    pub assets: Assets,
    /// The CV as HTML, typeset once and shared by every locale's `/cv`.
    pub cv: String,
}

impl App {
    /// Loads the site from this crate, with the stylesheet `just css` compiled
    /// into `.build/` at the workspace root.
    pub fn open() -> Result<Self> {
        let css = std::fs::read_to_string(workspace()?.join(".build/style.css"))
            .context("reading .build/style.css — run `just css` first")?;
        Self::load(Path::new(env!("CARGO_MANIFEST_DIR")), &css)
    }

    /// Reads the catalogues, the assets and the CV from the crate's directory.
    /// `css` is Tailwind's output, which names other assets and is rewritten to
    /// their hashed URLs here.
    pub fn load(root: &Path, css: &str) -> Result<Self> {
        let codes: Vec<&str> = LOCALES.iter().map(|l| l.code).collect();
        let catalogs = Catalogs::load(&root.join("locales"), &codes, SOURCE, FUZZY)?;

        let mut assets = Assets::load(&root.join("assets"))?;

        // The stylesheet and the manifest name other assets, so both are rewritten
        // before their own hash is taken — otherwise the font and the icons are also
        // fetched at an unhashed URL that is cached just as hard.
        let css = rewrite(&assets, css, "geist-mono.woff2").context("rewriting style.css")?;
        assets.derive("style.css", css.into_bytes());

        let manifest = rewrite_manifest(&assets, &root.join("assets/manifest.json"))?;
        assets.derive("manifest.json", manifest.into_bytes());

        let cv = crate::cv::render(root)?;
        assets.derive("cv.pdf", cv.pdf);

        Ok(Self {
            catalogs,
            assets,
            cv: cv.html,
        })
    }

    /// The page at `route` in `locale`.
    pub fn render(&self, locale: &Locale, route: &Route) -> Result<String> {
        Ok((route.render)(Page::new(self, locale, route))?)
    }
}

/// The workspace root. `dist/` and `.build/` belong there, where the justfile,
/// the Dockerfile and CI expect them, rather than in this crate.
pub fn workspace() -> Result<&'static Path> {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .ancestors()
        .nth(2)
        .context("the crate sits two levels below the workspace")
}

/// The manifest declares icons the browser fetches without any page linking them,
/// so its own references are rewritten for the prerender's crawl to follow.
fn rewrite_manifest(assets: &Assets, path: &Path) -> Result<String> {
    let mut out = std::fs::read_to_string(path)?;

    for name in [
        "favicon-16x16.png",
        "favicon-32x32.png",
        "apple-touch-icon.png",
        "android-chrome-192x192.png",
        "android-chrome-512x512.png",
    ] {
        out = rewrite(assets, &out, name).context("rewriting manifest.json")?;
    }

    Ok(out)
}

/// Points `/{name}` in `text` at the asset's hashed URL.
///
/// A reference here that stopped matching would still ask for the unhashed path,
/// which nothing serves, so a missing one fails the load.
fn rewrite(assets: &Assets, text: &str, name: &str) -> Result<String> {
    let from = format!("/{name}");
    if !text.contains(&from) {
        bail!("no reference to {from}");
    }
    Ok(text.replace(&from, &assets.href(name)))
}
