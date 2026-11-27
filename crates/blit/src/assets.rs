//! Assets are content-hashed into their filename, and served at that name.
//!
//! nano-web picks caching from the MIME type alone, so CSS, images and fonts are
//! all served `max-age=31536000, immutable`. A stable URL is a promise the build
//! cannot keep; a hashed one makes it true.
//!
//! Which assets the static site publishes is decided by the prerender's crawl:
//! what a page, the stylesheet or the manifest links to, and [`FIXED`].

use std::collections::BTreeMap;
use std::fs;
use std::path::Path;

use anyhow::Result;
use sha2::{Digest, Sha256};
use walkdir::WalkDir;

/// Their URLs are a convention rather than ours: a browser asks for /favicon.ico
/// when a page links no icon, and a crawler asks for /robots.txt. /cv.pdf is ours,
/// but it is a link handed to people and pasted into application forms, so it has
/// to keep working. nano-web serves a PDF for an hour, not a year, which is what
/// lets that URL stay put. Nothing links the first two, so the prerender requests
/// them by name.
pub const FIXED: &[&str] = &["favicon.ico", "robots.txt", "cv.pdf"];

pub struct Assets {
    bodies: BTreeMap<String, Vec<u8>>,
    /// Published name to source name, kept in step with `bodies`.
    published: BTreeMap<String, String>,
}

impl Assets {
    pub fn load(dir: &Path) -> Result<Self> {
        let mut assets = Self {
            bodies: BTreeMap::new(),
            published: BTreeMap::new(),
        };

        for entry in WalkDir::new(dir).into_iter().filter_map(Result::ok) {
            if !entry.file_type().is_file() {
                continue;
            }
            let name = entry
                .path()
                .strip_prefix(dir)?
                .to_string_lossy()
                .into_owned();
            assets.derive(&name, fs::read(entry.path())?);
        }

        Ok(assets)
    }

    /// Sets an asset's bytes. The stylesheet and the manifest name other assets,
    /// so both are rewritten and replaced before anything asks for their URL.
    pub fn derive(&mut self, name: &str, body: Vec<u8>) {
        if let Some(old) = self.bodies.get(name) {
            self.published.remove(&Self::published(name, old));
        }
        self.published
            .insert(Self::published(name, &body), name.to_owned());
        self.bodies.insert(name.to_owned(), body);
    }

    /// `logo.png` becomes `logo.a1b2c3d4.png`.
    fn published(name: &str, body: &[u8]) -> String {
        if FIXED.contains(&name) {
            return name.to_owned();
        }

        let hash: String = Sha256::digest(body)[..4]
            .iter()
            .map(|b| format!("{b:02x}"))
            .collect();
        match name.rsplit_once('.') {
            Some((stem, ext)) => format!("{stem}.{hash}.{ext}"),
            None => format!("{name}.{hash}"),
        }
    }

    /// The URL for an asset. Templates name assets as literals, so an unknown one
    /// is a mistake in the template rather than a request to answer.
    pub fn href(&self, name: &str) -> String {
        let Some(body) = self.bodies.get(name) else {
            let available: Vec<_> = self.bodies.keys().map(String::as_str).collect();
            panic!("no asset `{name}`. Available: {}", available.join(", "));
        };
        format!("/{}", Self::published(name, body))
    }

    /// The asset published at `path` (`logo.a1b2c3d4.png`), with whether its
    /// name carries its hash.
    pub fn get(&self, path: &str) -> Option<(&[u8], bool)> {
        let name = self.published.get(path)?;
        let body = self.bodies.get(name)?;
        Some((body, !FIXED.contains(&name.as_str())))
    }
}
