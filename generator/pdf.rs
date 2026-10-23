//! /cv.pdf, typeset by Typst from the same Markdown the page renders.
//!
//! The Markdown is translated to Typst markup here rather than handed to a Typst
//! package, so the build fetches nothing and a construct the PDF has no rendering
//! for fails it instead of vanishing from the page a recruiter reads. How it looks
//! lives in `src/templates/cv.typ`; this decides only what each piece is.
//!
//! What makes it parse is mostly what Typst does anyway: one column of real,
//! embedded text in reading order, tagged so headings and lists are structure
//! rather than position, with the dates on the same line as the role they belong to.

use std::fmt::Write as _;

use anyhow::{Result, anyhow, bail};
use pulldown_cmark::{CodeBlockKind, Event, HeadingLevel, Options, Parser, Tag, TagEnd};
use typst::diag::{FileError, FileResult, SourceDiagnostic};
use typst::foundations::{Bytes, Datetime, Duration};
use typst::syntax::{FileId, RootedPath, Source, VirtualPath, VirtualRoot};
use typst::text::{Font, FontBook};
use typst::utils::LazyHash;
use typst::{Library, LibraryExt, World, WorldExt};
use typst_layout::PagedDocument;
use typst_pdf::{PdfOptions, PdfStandard, PdfStandards};

/// Typesets `markdown` with `template`, which must export `cv` and the helpers
/// the markup calls (`small`, `dates`), and can read the logo as `logo.png`.
pub fn render(markdown: &str, template: &str, fonts: &[Vec<u8>], logo: &[u8]) -> Result<Vec<u8>> {
    let (name, body) = markup(markdown)?;

    let main = format!(
        "#import \"cv.typ\": cv, masthead, small, dates\n#show: cv.with(name: {})\n\n{body}",
        string(&name)
    );
    let world = CvWorld::new(main, template.to_owned(), fonts, logo)?;

    let warned = typst::compile::<PagedDocument>(&world);
    for warning in &warned.warnings {
        eprintln!("cv.pdf: warning: {}", describe(&world, warning));
    }
    let document = warned.output.map_err(|errors| diagnose(&world, &errors))?;

    // PDF/UA-1 makes Typst refuse a document whose structure a screen reader or a
    // parser can't follow, rather than writing it anyway. No timestamp, so the
    // same CV produces the same bytes.
    let options = PdfOptions {
        standards: PdfStandards::new(&[PdfStandard::Ua_1]).map_err(|e| anyhow!("{e:?}"))?,
        timestamp: None,
        ..PdfOptions::default()
    };
    typst_pdf::pdf(&document, &options).map_err(|errors| diagnose(&world, &errors))
}

/// The name from the `#` heading, and the body as Typst markup.
fn markup(markdown: &str) -> Result<(String, String)> {
    let mut out = Markup::default();
    for event in Parser::new_ext(markdown, Options::empty()) {
        out.event(event)?;
    }
    if out.name.is_empty() {
        bail!("cv.md has no `#` heading to name the PDF after");
    }
    if out.masthead > 0 {
        bail!("cv.md: the `#` heading needs a title and a contact paragraph under it");
    }
    Ok((out.name, out.body))
}

#[derive(Default)]
struct Markup {
    body: String,
    name: String,
    heading: Option<HeadingLevel>,
    /// Paragraphs still owed to the masthead: the `#` heading is set beside the
    /// logo with the two paragraphs under it, the title and the contact lines,
    /// rather than as loose paragraphs in the flow.
    masthead: usize,
    /// What closes each open HTML element, innermost last.
    html: Vec<&'static str>,
    /// An HTML block arrives a line at a time and is read once it is whole, so
    /// the line breaks inside it stay spaces between words.
    block: Option<String>,
}

impl Markup {
    fn event(&mut self, event: Event) -> Result<()> {
        match event {
            Event::Start(tag) => self.start(tag)?,
            Event::End(tag) => self.end(tag)?,
            Event::Text(text) => {
                if self.heading == Some(HeadingLevel::H1) {
                    self.name.push_str(&text);
                }
                self.text(&text);
            }
            Event::Code(code) => {
                let _ = write!(self.body, "#raw({})", string(&code));
            }
            Event::SoftBreak => self.body.push(' '),
            Event::HardBreak => self.body.push_str("#linebreak()"),
            Event::Rule => self.body.push_str("#line(length: 100%)\n\n"),
            Event::Html(raw) => self.block.get_or_insert_default().push_str(&raw),
            Event::InlineHtml(raw) => self.html(&raw)?,
            other => bail!("cv.md: the PDF has no rendering for {other:?}"),
        }
        Ok(())
    }

    fn start(&mut self, tag: Tag) -> Result<()> {
        match tag {
            Tag::Paragraph if self.masthead > 0 => self.body.push('['),
            Tag::Heading { .. } | Tag::List(_) | Tag::HtmlBlock | Tag::BlockQuote(_)
                if self.masthead > 0 =>
            {
                bail!("cv.md: the `#` heading needs a title and a contact paragraph under it")
            }
            Tag::Paragraph => {}
            Tag::HtmlBlock => self.block = Some(String::new()),
            Tag::Heading {
                level: HeadingLevel::H1,
                ..
            } => {
                self.heading = Some(HeadingLevel::H1);
                self.body.push_str("#masthead([= ");
            }
            Tag::Heading { level, .. } => {
                self.heading = Some(level);
                let _ = write!(self.body, "{} ", "=".repeat(level as usize));
            }
            // Function syntax rather than `- item` lines: an item's content can
            // then span lines and hold a nested list without tracking indentation.
            Tag::List(None) => self.body.push_str("#list("),
            Tag::List(Some(_)) => self.body.push_str("#enum("),
            Tag::Item => self.body.push('['),
            Tag::Emphasis => self.body.push_str("#emph["),
            Tag::Strong => self.body.push_str("#strong["),
            Tag::Link { dest_url, .. } => {
                let _ = write!(self.body, "#link({})[", string(&dest_url));
            }
            Tag::CodeBlock(CodeBlockKind::Fenced(_) | CodeBlockKind::Indented) => {
                bail!("cv.md: the PDF has no rendering for code blocks")
            }
            other => bail!("cv.md: the PDF has no rendering for {other:?}"),
        }
        Ok(())
    }

    fn end(&mut self, tag: TagEnd) -> Result<()> {
        match tag {
            TagEnd::Paragraph if self.masthead > 0 => {
                self.masthead -= 1;
                self.body
                    .push_str(if self.masthead == 0 { "])\n\n" } else { "], " });
            }
            TagEnd::Paragraph => self.body.push_str("\n\n"),
            TagEnd::HtmlBlock => {
                let block = self.block.take().unwrap_or_default();
                self.html(&block)?;
                self.body.push_str("\n\n");
            }
            TagEnd::Heading(HeadingLevel::H1) => {
                self.heading = None;
                self.masthead = 2;
                self.body.push_str("\n], ");
            }
            TagEnd::Heading(_) => {
                self.heading = None;
                self.body.push_str("\n\n");
            }
            TagEnd::List(_) => self.body.push_str(")\n\n"),
            TagEnd::Item => self.body.push_str("],"),
            _ => self.body.push(']'),
        }
        Ok(())
    }

    /// Everything is escaped except quotes, which Typst turns into curly ones. A
    /// backslash before any character is a literal in Typst, so this needn't know
    /// which are special where: `1.` opening a line would be a list, `https://` a
    /// link, and `(` straight after a call another argument.
    fn text(&mut self, text: &str) {
        for c in text.chars() {
            if c.is_ascii_punctuation() && !matches!(c, '\'' | '"' | ',' | '!' | '?' | '%' | '&') {
                self.body.push('\\');
            }
            self.body.push(c);
        }
    }

    /// The few elements cv.md writes inline. Anything else fails the build rather
    /// than leaking a tag into the text.
    fn html(&mut self, raw: &str) -> Result<()> {
        let mut rest = raw;
        while let Some(open) = rest.find('<') {
            self.text(
                &rest[..open]
                    .split_whitespace()
                    .collect::<Vec<_>>()
                    .join(" "),
            );
            let close = rest[open..]
                .find('>')
                .ok_or_else(|| anyhow!("cv.md: unterminated tag in {raw:?}"))?;
            let tag = rest[open + 1..open + close].trim_end_matches('/').trim();
            rest = &rest[open + close + 1..];

            match tag {
                "br" => self.body.push_str("#linebreak()"),
                // A date in a heading is pushed to the right margin, on the same
                // line as the role: where a parser looks for it.
                "small" if self.heading.is_some() => self.open("#dates[", "]"),
                "small" => self.open("#small[", "]"),
                "em" => self.open("#emph[", "]"),
                "strong" => self.open("#strong[", "]"),
                _ if tag.starts_with('/') => {
                    let close = self
                        .html
                        .pop()
                        .ok_or_else(|| anyhow!("cv.md: <{tag}> closes nothing"))?;
                    self.body.push_str(close);
                }
                _ => bail!("cv.md: the PDF has no rendering for <{tag}>"),
            }
        }
        self.text(rest.trim());
        Ok(())
    }

    fn open(&mut self, open: &str, close: &'static str) {
        self.body.push_str(open);
        self.html.push(close);
    }
}

/// A Typst string literal.
fn string(s: &str) -> String {
    format!("\"{}\"", s.replace('\\', "\\\\").replace('"', "\\\""))
}

/// Two sources, the logo and the fonts that were handed in. Nothing is read from disk, so the
/// PDF can't come to depend on what happens to be installed.
struct CvWorld {
    library: LazyHash<Library>,
    book: LazyHash<FontBook>,
    fonts: Vec<Font>,
    main: Source,
    template: Source,
    logo: (FileId, Bytes),
}

impl CvWorld {
    fn new(main: String, template: String, fonts: &[Vec<u8>], logo: &[u8]) -> Result<Self> {
        let id = |path: &str| -> Result<FileId> {
            let vpath = VirtualPath::new(path).map_err(|e| anyhow!("{e:?}"))?;
            Ok(RootedPath::new(VirtualRoot::Project, vpath).intern())
        };

        let fonts: Vec<Font> = fonts
            .iter()
            .flat_map(|data| Font::iter(Bytes::new(data.clone())))
            .collect();

        Ok(Self {
            library: LazyHash::new(Library::default()),
            book: LazyHash::new(FontBook::from_fonts(&fonts)),
            fonts,
            main: Source::new(id("/main.typ")?, main),
            template: Source::new(id("/cv.typ")?, template),
            logo: (id("/logo.png")?, Bytes::new(logo.to_vec())),
        })
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
        self.main.id()
    }

    fn source(&self, id: FileId) -> FileResult<Source> {
        [&self.main, &self.template]
            .into_iter()
            .find(|source| source.id() == id)
            .cloned()
            .ok_or_else(|| FileError::NotFound(id.get().vpath().get_without_slash().into()))
    }

    fn file(&self, id: FileId) -> FileResult<Bytes> {
        if id == self.logo.0 {
            return Ok(self.logo.1.clone());
        }
        Err(FileError::NotFound(
            id.get().vpath().get_without_slash().into(),
        ))
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
        let line = source.text()[..range.start].lines().count();
        let path = id.get().vpath().get_without_slash();
        let _ = write!(out, " ({path}:{line}: {:?})", &source.text()[range]);
    }
    for hint in &diagnostic.hints {
        let _ = write!(out, "\n  hint: {}", hint.v);
    }
    out
}

fn diagnose(world: &CvWorld, errors: &[SourceDiagnostic]) -> anyhow::Error {
    let messages: Vec<String> = errors.iter().map(|e| describe(world, e)).collect();
    anyhow!("typesetting cv.pdf:\n  {}", messages.join("\n  "))
}

#[cfg(test)]
mod tests {
    use super::markup;

    #[test]
    fn escapes_what_typst_would_read_as_markup() {
        let (_, body) = markup("# A\n\nt\n\nc\n\nSee 1. or `code` at https://x.y (#2)\n").unwrap();
        assert!(body.contains(r#"See 1\. or #raw("code") at https\:\/\/x\.y \(\#2\)"#));
    }

    #[test]
    fn dates_in_headings_move_right() {
        let (name, body) = markup("# James\n\nt\n\nc\n\n### Role <small>2025</small>\n").unwrap();
        assert_eq!(name, "James");
        assert!(body.contains("=== Role #dates[2025]"));
    }

    #[test]
    fn html_blocks_keep_their_line_breaks_as_spaces() {
        let (_, body) = markup("# A\n\nt\n\nc\n\n<small>\none\ntwo\n</small>\n").unwrap();
        assert!(body.contains("#small[one two]"));
    }

    #[test]
    fn the_name_title_and_contact_make_the_masthead() {
        let (_, body) = markup("# James\n\ntitle\n\nmail\n\nbody\n").unwrap();
        assert!(body.starts_with("#masthead([= James\n], [title], [mail])\n\nbody"));
        assert!(markup("# James\n\ntitle\n").is_err());
    }

    #[test]
    fn unknown_html_fails() {
        assert!(markup("# A\n\nt\n\nc\n\n<blink>x</blink>\n").is_err());
    }
}
