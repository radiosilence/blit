//! The static site, prerendered from the server: starts the app's router in
//! process, crawls it from `/`, follows every internal link it finds in a page,
//! the stylesheet or the manifest, and writes each response to `dist/` at its
//! path, a page as a directory index. What no link reaches is declared in
//! `blit::prerender`.
//!
//! A page has no render path here: what lands in `dist/` is exactly what the
//! server answers. A declared or crawled path that does not answer 200, or a
//! route in the route table nothing reaches, fails the build, since either would
//! ship as a 404 or as a page nobody can find.

use std::collections::{BTreeMap, BTreeSet, VecDeque};
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use anyhow::{Context as _, Result, bail};
use axum::body::{Body, to_bytes};
use axum::http::{Request, StatusCode, header};
use tower::ServiceExt as _;

use blit::app::{App, workspace};
use blit::config::{LOCALES, ORIGIN};
use blit::prerender::entries;
use blit::routes::{ROUTES, url};

#[tokio::main(flavor = "current_thread")]
async fn main() -> Result<()> {
    let dist = workspace()?.join("dist");
    let router = blit::server::router(Arc::new(App::open()?));

    // The crawl starts at `/`, then takes what `blit::prerender` declares.
    let mut queue = VecDeque::new();
    let mut found_in = BTreeMap::new();
    for (path, from) in std::iter::once(("/".to_owned(), "the crawl's start")).chain(
        entries()
            .iter()
            .map(|path| (normalise(path), "prerender.rs")),
    ) {
        if !found_in.contains_key(&path) {
            found_in.insert(path.clone(), from.to_owned());
            queue.push_back(path);
        }
    }

    let mut written = BTreeSet::new();
    let mut pages = BTreeSet::new();
    let mut broken = Vec::new();

    while let Some(path) = queue.pop_front() {
        let request = Request::get(&path).body(Body::empty())?;
        let response = router.clone().oneshot(request).await?;

        if response.status() != StatusCode::OK {
            broken.push(format!(
                "{path} ({}), linked from {}",
                response.status(),
                found_in[&path]
            ));
            continue;
        }

        let content_type = response
            .headers()
            .get(header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default()
            .to_owned();
        let body = to_bytes(response.into_body(), usize::MAX).await?;
        let text = std::str::from_utf8(&body).unwrap_or_default();

        let links = if content_type.starts_with("text/html") {
            html_links(text)
        } else if content_type.starts_with("text/css") {
            css_links(text)
        } else if content_type.contains("json") {
            json_links(text)
        } else {
            Vec::new()
        };
        for link in links {
            if let Some(target) = internal(&link)
                && !found_in.contains_key(&target)
            {
                found_in.insert(target.clone(), path.clone());
                queue.push_back(target);
            }
        }

        let relative = path.trim_start_matches('/');
        let file = if content_type.starts_with("text/html") {
            pages.insert(path.clone());
            dist.join(relative).join("index.html")
        } else {
            dist.join(relative)
        };
        fs::create_dir_all(
            file.parent()
                .context("a response has no parent directory")?,
        )?;
        fs::write(&file, &body).with_context(|| format!("writing {}", file.display()))?;
        written.insert(file);
    }

    if !broken.is_empty() {
        bail!("links with nothing behind them:\n  {}", broken.join("\n  "));
    }

    let unreached: Vec<String> = LOCALES
        .iter()
        .flat_map(|locale| ROUTES.iter().map(|route| url(locale.code, route.slug)))
        .filter(|path| !pages.contains(path))
        .collect();
    if !unreached.is_empty() {
        bail!("routes no link reaches:\n  {}", unreached.join("\n  "));
    }

    prune(&dist, &written)?;

    println!(
        "Prerendered {} pages and {} assets into {}",
        pages.len(),
        written.len() - pages.len(),
        dist.display()
    );
    Ok(())
}

/// The path an absolute reference points at on this site, if it does: an
/// absolute URL on [`ORIGIN`] counts as the path after it, as the canonical and
/// alternate links are.
fn internal(link: &str) -> Option<String> {
    let link = link
        .strip_prefix(ORIGIN)
        .filter(|path| path.starts_with('/'))
        .unwrap_or(link);
    if !link.starts_with('/') || link.starts_with("//") {
        return None;
    }
    let path = link.split(['?', '#']).next().unwrap_or(link);
    Some(normalise(path))
}

/// `/cv/` and `/cv` are one page written to one file, so the crawl keys both as
/// `/cv`.
fn normalise(path: &str) -> String {
    match path.trim_end_matches('/') {
        "" => "/".to_owned(),
        trimmed => trimmed.to_owned(),
    }
}

/// `href` and `src` for links and assets, and `content` for og:url and og:image;
/// a space before `content`, so `data-content` is not read as one.
fn html_links(html: &str) -> Vec<String> {
    ["href=\"", "src=\"", " content=\""]
        .iter()
        .flat_map(|attr| html.split(attr).skip(1))
        .filter_map(|part| part.split('"').next())
        .map(str::to_owned)
        .collect()
}

/// `url(..)`, quoted or not: the font.
fn css_links(css: &str) -> Vec<String> {
    css.split("url(")
        .skip(1)
        .filter_map(|part| part.split(')').next())
        .map(|value| value.trim_matches(['"', '\'']).to_owned())
        .collect()
}

/// Every string in the manifest that is a path: its icons.
fn json_links(json: &str) -> Vec<String> {
    json.split('"')
        .skip(1)
        .step_by(2)
        .filter(|value| value.starts_with('/'))
        .map(str::to_owned)
        .collect()
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
