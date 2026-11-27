//! The static generator: asks the [`App`] for every locale × route, writes each
//! answer to `dist/` as a directory index, publishes the assets they referenced,
//! and checks that every absolute reference resolves to something written.
//!
//! Everything a page is lives in the library; this is only how the site reaches
//! disk rather than a socket.

use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};

use anyhow::{Context as _, Result, bail};

use blit::app::App;
use blit::config::{LOCALES, ORIGIN};
use blit::routes::{ROUTES, url};

fn main() -> Result<()> {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"));
    // dist/ and .build/ belong to the workspace, where the justfile, the
    // Dockerfile and CI expect them, rather than to this crate.
    let workspace = root
        .ancestors()
        .nth(2)
        .context("the crate sits two levels below the workspace")?;

    let dist = workspace.join("dist");

    let css = fs::read_to_string(workspace.join(".build/style.css"))
        .context("reading .build/style.css — run `just css` first")?;
    let app = App::load(root, &css)?;

    let mut written = BTreeSet::new();

    for locale in LOCALES {
        for route in ROUTES {
            let html = app.render(locale, route)?;

            let path = url(locale.code, route.slug);
            let file = dist.join(path.trim_start_matches('/')).join("index.html");
            fs::create_dir_all(file.parent().context("page has no parent directory")?)?;
            fs::write(&file, html)?;
            written.insert(file);
        }
    }

    let published = app.assets.publish(&dist)?;

    let mut current = written.clone();
    current.extend(published.iter().cloned());
    prune(&dist, &current)?;
    check_references(&dist, &written, &current)?;

    println!(
        "Generated {} pages and {} assets in {}",
        written.len(),
        published.len(),
        dist.display()
    );
    Ok(())
}

/// dist/ is written entirely here, so anything else in it is from an earlier build:
/// a removed locale's directory, or the previous hash of a file that has changed.
fn prune(dist: &Path, keep: &BTreeSet<PathBuf>) -> Result<()> {
    for entry in walkdir::WalkDir::new(dist)
        .into_iter()
        .filter_map(Result::ok)
    {
        if entry.file_type().is_file() && !keep.contains(entry.path()) {
            fs::remove_file(entry.path())?;
        }
    }

    // Depth-first, so a directory is judged only once its children are gone.
    for entry in walkdir::WalkDir::new(dist)
        .contents_first(true)
        .into_iter()
        .filter_map(Result::ok)
    {
        if entry.file_type().is_dir()
            && entry.path() != dist
            && fs::read_dir(entry.path())?.next().is_none()
        {
            fs::remove_dir(entry.path())?;
        }
    }

    Ok(())
}

/// A link that misses is a routing bug; an `src` that misses is an asset written by
/// hand rather than through `asset()`. Both would ship as a 404 nobody clicks.
/// `content` attributes are read too, for og:url and og:image, and an absolute URL
/// on ORIGIN counts as the path after it, as the canonical and alternate links are.
fn check_references(
    dist: &Path,
    pages: &BTreeSet<PathBuf>,
    current: &BTreeSet<PathBuf>,
) -> Result<()> {
    let mut broken = BTreeSet::new();

    for page in pages {
        let html = fs::read_to_string(page)?;

        // A space before `content`, so `data-content` is not read as a reference.
        for attr in ["href=\"", "src=\"", " content=\""] {
            for part in html.split(attr).skip(1) {
                let Some(value) = part.split('"').next() else {
                    continue;
                };
                let value = value
                    .strip_prefix(ORIGIN)
                    .filter(|path| path.starts_with('/'))
                    .unwrap_or(value);
                if !value.starts_with('/') {
                    continue;
                }

                let path = value.split(['?', '#']).next().unwrap_or(value);
                let target = dist.join(path.trim_start_matches('/'));

                if !current.contains(&target) && !current.contains(&target.join("index.html")) {
                    broken.insert(format!("{} -> {value}", page.display()));
                }
            }
        }
    }

    if !broken.is_empty() {
        bail!(
            "references with nothing behind them:\n  {}",
            broken.into_iter().collect::<Vec<_>>().join("\n  ")
        );
    }

    println!("Checked links and assets across {} pages", pages.len());
    Ok(())
}
