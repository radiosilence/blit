//! The CV, typeset by Typst from `src/content/cv.typ` twice: once as pages for
//! `/cv.pdf`, once as HTML for the body of `/cv`.
//!
//! One source means the page and the PDF cannot drift apart. The content says what
//! each piece is; `src/templates/cv.typ` decides how it looks in each target.
//!
//! The world is rooted at `src/` and reads only what the source imports from
//! there, with fonts only from `src/fonts`, so the same file compiles identically
//! in the Typst CLI and in an editor preview:
//!
//! ```sh
//! typst compile --root src --font-path src/fonts --ignore-system-fonts src/content/cv.typ
//! ```

use std::collections::HashMap;
use std::fmt::Write as _;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use anyhow::{Result, anyhow, bail};
use typst::diag::{FileError, FileResult, SourceDiagnostic, SourceResult, Warned};
use typst::foundations::{Bytes, Datetime, Duration};
use typst::syntax::{FileId, RootedPath, Source, VirtualPath, VirtualRoot};
use typst::text::{Font, FontBook};
use typst::utils::LazyHash;
use typst::{Feature, Library, LibraryExt, World, WorldExt};
use typst_html::{HtmlDocument, HtmlOptions};
use typst_layout::PagedDocument;
use typst_pdf::{PdfOptions, PdfStandard, PdfStandards};

/// Typst says this of every HTML compile. Anything else it says fails the build.
const HTML_EXPERIMENTAL: &str = "html export is under active development and incomplete";

pub struct Cv {
    /// The children of `<body>`, for the page template to place.
    pub html: String,
    pub pdf: Vec<u8>,
}

/// Typesets `root/content/cv.typ` with the fonts in `root/fonts`.
pub fn render(root: &Path) -> Result<Cv> {
    let world = CvWorld::new(root)?;

    let document = checked(&world, typst::compile::<PagedDocument>(&world))?;
    // PDF/UA-1 makes Typst refuse a document whose structure a screen reader or a
    // parser can't follow, rather than writing it anyway. No timestamp, so the
    // same CV produces the same bytes.
    let options = PdfOptions {
        standards: PdfStandards::new(&[PdfStandard::Ua_1]).map_err(|e| anyhow!("{e:?}"))?,
        timestamp: None,
        ..PdfOptions::default()
    };
    let pdf = typst_pdf::pdf(&document, &options).map_err(|errors| diagnose(&world, &errors))?;

    let document = checked(&world, typst::compile::<HtmlDocument>(&world))?;
    let page = typst_html::html(&document, &HtmlOptions::default())
        .map_err(|errors| diagnose(&world, &errors))?;
    let html = body(&page)?.to_owned();

    Ok(Cv { html, pdf })
}

/// The output, provided Typst had nothing to say about it. A warning here is
/// content one target dropped (an element HTML export ignores) or set wrongly (a
/// glyph from no font), so it fails the build like an error.
fn checked<T>(world: &CvWorld, warned: Warned<SourceResult<T>>) -> Result<T> {
    let output = warned.output.map_err(|errors| diagnose(world, &errors))?;
    let warnings: Vec<_> = warned
        .warnings
        .iter()
        .filter(|w| !(w.span.is_detached() && w.message == HTML_EXPERIMENTAL))
        .cloned()
        .collect();
    if !warnings.is_empty() {
        return Err(diagnose(world, &warnings));
    }
    Ok(output)
}

/// What sits between `<body>` and `</body>`. The page around it is Askama's, so
/// the `<head>` Typst writes is dropped; and since the fragment goes into the page
/// verbatim, anything that would bypass the asset pipeline or the stylesheet
/// fails here instead.
fn body(page: &str) -> Result<&str> {
    // Text is escaped, so a tag appearing twice means a document shaped
    // differently from the one this was written against.
    if page.matches("<body>").count() != 1 || page.matches("</body>").count() != 1 {
        bail!("the CV's HTML has no single <body> to take");
    }
    let (_, inner) = page.split_once("<body>").unwrap_or_default();
    let (inner, _) = inner.split_once("</body>").unwrap_or_default();

    for (needle, why) in [
        (" style=\"", "inline style, which the stylesheet can't see"),
        (
            "=\"data:",
            "an embedded file, which skips the asset pipeline",
        ),
    ] {
        if inner.contains(needle) {
            bail!("the CV's HTML carries {why}: a paged-only rule reached the HTML target");
        }
    }
    Ok(inner)
}

/// Sources and files under `src/`, read once each: both compiles see the same
/// bytes even if a file is saved between them.
struct CvWorld {
    root: PathBuf,
    library: LazyHash<Library>,
    book: LazyHash<FontBook>,
    fonts: Vec<Font>,
    main: FileId,
    sources: Mutex<HashMap<FileId, FileResult<Source>>>,
    files: Mutex<HashMap<FileId, FileResult<Bytes>>>,
}

impl CvWorld {
    fn new(root: &Path) -> Result<Self> {
        let mut paths: Vec<PathBuf> = fs::read_dir(root.join("fonts"))?
            .map(|entry| entry.map(|e| e.path()))
            .collect::<Result<_, _>>()?;
        paths.retain(|path| path.extension().is_some_and(|e| e == "ttf"));
        paths.sort();
        let mut fonts = Vec::new();
        for path in paths {
            fonts.extend(Font::iter(Bytes::new(fs::read(path)?)));
        }

        let main = VirtualPath::new("/content/cv.typ").map_err(|e| anyhow!("{e:?}"))?;

        Ok(Self {
            root: root.to_owned(),
            // `html` is defined only with the feature. The paged compile doesn't
            // look at it, so one library serves both.
            library: LazyHash::new(
                Library::builder()
                    .with_features([Feature::Html].into_iter().collect())
                    .build(),
            ),
            book: LazyHash::new(FontBook::from_fonts(&fonts)),
            fonts,
            main: RootedPath::new(VirtualRoot::Project, main).intern(),
            sources: Mutex::default(),
            files: Mutex::default(),
        })
    }

    /// Packages would be fetched, so none resolve.
    fn read(&self, id: FileId) -> FileResult<Vec<u8>> {
        let path = id.get();
        if *path.root() != VirtualRoot::Project {
            return Err(FileError::Other(Some(
                "the CV imports nothing from packages".into(),
            )));
        }
        let real = path
            .vpath()
            .realize(&self.root)
            .map_err(FileError::Realize)?;
        fs::read(&real).map_err(|e| FileError::from_io(e, &real))
    }
}

impl World for CvWorld {
    fn library(&self) -> &LazyHash<Library> {
        &self.library
    }

    fn book(&self) -> &LazyHash<FontBook> {
        &self.book
    }

    fn main(&self) -> FileId {
        self.main
    }

    fn source(&self, id: FileId) -> FileResult<Source> {
        let mut sources = self.sources.lock().unwrap();
        sources
            .entry(id)
            .or_insert_with(|| {
                let text = String::from_utf8(self.read(id)?).map_err(|_| FileError::InvalidUtf8)?;
                Ok(Source::new(id, text))
            })
            .clone()
    }

    fn file(&self, id: FileId) -> FileResult<Bytes> {
        let mut files = self.files.lock().unwrap();
        files
            .entry(id)
            .or_insert_with(|| self.read(id).map(Bytes::new))
            .clone()
    }

    fn font(&self, index: usize) -> Option<Font> {
        self.fonts.get(index).cloned()
    }

    fn today(&self, _: Option<Duration>) -> Option<Datetime> {
        None
    }
}

fn describe(world: &CvWorld, diagnostic: &SourceDiagnostic) -> String {
    let mut out = diagnostic.message.to_string();
    if let Some(id) = diagnostic.span.id()
        && let Ok(source) = world.source(id)
        && let Some(range) = world.range(diagnostic.span)
    {
        let line = source
            .lines()
            .byte_to_line(range.start)
            .map(|l| format!(":{}", l + 1))
            .unwrap_or_default();
        let path = id.get().vpath().get_without_slash();
        let _ = write!(out, " ({path}{line}: {:?})", &source.text()[range]);
    }
    for hint in &diagnostic.hints {
        let _ = write!(out, "\n  hint: {}", hint.v);
    }
    out
}

fn diagnose(world: &CvWorld, errors: &[SourceDiagnostic]) -> anyhow::Error {
    let messages: Vec<String> = errors.iter().map(|e| describe(world, e)).collect();
    anyhow!("typesetting the CV:\n  {}", messages.join("\n  "))
}

#[cfg(test)]
mod tests {
    use std::fs;
    use std::path::{Path, PathBuf};

    use super::{body, render};

    fn src() -> PathBuf {
        Path::new(env!("CARGO_MANIFEST_DIR")).join("src")
    }

    /// A root holding `source` as the CV, with the real fonts.
    fn root(name: &str, source: &str) -> PathBuf {
        let root = std::env::temp_dir().join(format!("blit-cv-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join("content")).unwrap();
        std::os::unix::fs::symlink(src().join("fonts"), root.join("fonts")).unwrap();
        // A title, or PDF/UA refuses the document before anything else is checked.
        let source =
            format!("#set document(title: \"t\")\n#set text(font: \"Geist Mono\")\n{source}");
        fs::write(root.join("content/cv.typ"), source).unwrap();
        root
    }

    #[test]
    fn links_to_roles_resolve_in_both_targets() {
        let cv = render(&src()).unwrap();
        assert!(cv.pdf.starts_with(b"%PDF"));
        for label in ["fresha", "engineerbetter", "contributed"] {
            assert!(cv.html.contains(&format!(" id=\"{label}\"")), "{label}");
            assert!(cv.html.contains(&format!("href=\"#{label}\"")), "{label}");
        }
    }

    #[test]
    fn a_warning_fails_the_build() {
        let root = root("warning", "#text(font: \"Nope\")[x]\n");
        let error = render(&root).err().unwrap().to_string();
        let _ = fs::remove_dir_all(&root);
        assert!(error.contains("unknown font family"), "{error}");
    }

    #[test]
    fn what_html_export_ignores_fails_the_build() {
        let root = root("ignored", "#rotate(10deg)[x]\n");
        let error = render(&root).err().unwrap().to_string();
        let _ = fs::remove_dir_all(&root);
        assert!(error.contains("ignored during HTML export"), "{error}");
    }

    #[test]
    fn packages_are_not_fetched() {
        let root = root("package", "#import \"@preview/anything:0.1.0\": *\n");
        let error = render(&root).err().unwrap().to_string();
        let _ = fs::remove_dir_all(&root);
        assert!(error.contains("imports nothing from packages"), "{error}");
    }

    #[test]
    fn body_takes_what_is_between_the_tags() {
        assert_eq!(
            body("<html><body><p>a</p></body></html>").unwrap(),
            "<p>a</p>"
        );
        assert!(body("<html></html>").is_err());
        assert!(body("<body></body><body></body>").is_err());
    }

    #[test]
    fn body_refuses_what_bypasses_the_stylesheet_or_the_assets() {
        assert!(body(r#"<body><span style="color: red">a</span></body>"#).is_err());
        assert!(body(r#"<body><img src="data:image/png;base64,AA"></body>"#).is_err());
        assert!(body("<body><svg></svg></body>").is_err());
    }
}
