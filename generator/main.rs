//! Renders every locale × page into dist/, publishes the assets they referenced,
//! and checks that every absolute reference resolves to something written.

use std::collections::BTreeSet;
use std::fs;
use std::path::{Path, PathBuf};

use anyhow::{Context as _, Result, bail};
use askama::Template;
use pulldown_cmark::{Options, Parser, html};

use askama_gettext::Catalogs;
use blit::assets::Assets;
use blit::config::{FUZZY, LOCALES, SOURCE};
use blit::routes::{PAGES, url};
use blit::templates::{Context, Cv, Index, LocaleLink, Urls};

fn main() -> Result<()> {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).to_owned();

    let dist = root.join("dist");
    let build = root.join(".build");

    let codes: Vec<&str> = LOCALES.iter().map(|l| l.code).collect();
    let catalogs = Catalogs::load(&root.join("src/locales"), &codes, SOURCE, FUZZY)?;

    let mut assets = Assets::load(&root.join("src/static"))?;

    // The stylesheet and the manifest name other assets, so both are rewritten
    // before their own hash is taken — otherwise the font and the icons are also
    // fetched at an unhashed URL that is cached just as hard.
    let font = assets.href("geist-mono.woff2");
    let css = fs::read_to_string(build.join("style.css"))
        .context("reading .build/style.css — run the css task first")?
        .replace("/geist-mono.woff2", &font);
    assets.derive("style.css", css.into_bytes());

    let manifest = rewrite_manifest(&assets, &root.join("src/static/manifest.json"))?;
    assets.derive("manifest.json", manifest.into_bytes());

    let cv = markdown(&fs::read_to_string(root.join("src/content/cv.md"))?);

    let ctx = Context {
        catalogs: &catalogs,
        assets: &assets,
    };

    let mut written = BTreeSet::new();

    for locale in LOCALES {
        let dir = if locale.rtl { "rtl" } else { "ltr" };

        for page in PAGES {
            let path = url(locale.code, page.slug);

            let urls = Urls {
                home: url(locale.code, ""),
                cv: url(locale.code, "cv"),
            };

            let locale_links: Vec<LocaleLink> = LOCALES
                .iter()
                .map(|other| LocaleLink {
                    code: other.code.to_owned(),
                    href: url(other.code, page.slug),
                    name: other.name.to_owned(),
                    place: other.place.to_owned(),
                    current: other.code == locale.code,
                })
                .collect();

            let canonical_url = format!("https://blit.cc{path}");

            let html = match page.template {
                "index" => Index {
                    ctx: &ctx,
                    locale: locale.code,
                    dir,
                    canonical_url,
                    urls: &urls,
                    locale_links: &locale_links,
                }
                .render()?,
                "cv" => Cv {
                    ctx: &ctx,
                    locale: locale.code,
                    dir,
                    canonical_url,
                    urls: &urls,
                    locale_links: &locale_links,
                    cv: &cv,
                }
                .render()?,
                other => bail!("no template named `{other}`"),
            };

            let file = dist.join(path.trim_start_matches('/')).join("index.html");
            fs::create_dir_all(file.parent().context("page has no parent directory")?)?;
            fs::write(&file, html)?;
            written.insert(file);
        }
    }

    let published = assets.publish(&dist)?;

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

fn markdown(source: &str) -> String {
    let parser = Parser::new_ext(source, Options::empty());
    let mut out = String::new();
    html::push_html(&mut out, parser);
    out
}

/// The manifest declares icons the browser fetches without any page linking them,
/// so its own references are rewritten and thereby recorded as used.
fn rewrite_manifest(assets: &Assets, path: &Path) -> Result<String> {
    let mut out = fs::read_to_string(path)?;

    for name in [
        "favicon-16x16.png",
        "favicon-32x32.png",
        "apple-touch-icon.png",
        "android-chrome-192x192.png",
        "android-chrome-512x512.png",
    ] {
        out = out.replace(&format!("/{name}"), &assets.href(name));
    }

    Ok(out)
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
fn check_references(
    dist: &Path,
    pages: &BTreeSet<PathBuf>,
    current: &BTreeSet<PathBuf>,
) -> Result<()> {
    let mut broken = BTreeSet::new();

    for page in pages {
        let html = fs::read_to_string(page)?;

        for attr in ["href=\"", "src=\""] {
            for part in html.split(attr).skip(1) {
                let Some(value) = part.split('"').next() else {
                    continue;
                };
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
