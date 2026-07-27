//! A translated sentence whose English carries inline markup.
//!
//! The tags live inside the msgid — `__h("read my <cv>CV</cv>")` — so a translator
//! gets the whole sentence and can move the link wherever the language needs it,
//! rather than being handed three fragments to reassemble in English word order.
//!
//! What a translator does not get is the URL. The tag in the message is a name, not
//! markup; code says what it becomes. So a catalogue can move a link, rename it or
//! drop it, but cannot point it somewhere else or introduce an element nobody
//! allowed — everything that is not a registered name is escaped, including any
//! markup a translator adds by hand.

use std::collections::BTreeMap;
use std::fmt::{self, Display, Write};

/// An element a name expands into: the tag, plus attributes supplied by the caller.
#[derive(Clone)]
struct Element {
    tag: String,
    attrs: Vec<(String, String)>,
    empty: bool,
}

/// Escapes into `out`. Applied to every part of the message that is not a
/// registered tag, so translated text can never introduce markup.
fn escape(out: &mut String, text: &str) {
    for c in text.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            '\'' => out.push_str("&#39;"),
            _ => out.push(c),
        }
    }
}

#[derive(Clone)]
pub struct Interpolated {
    text: String,
    elements: BTreeMap<String, Element>,
}

impl Interpolated {
    pub fn new(text: impl Into<String>) -> Self {
        Self {
            text: text.into(),
            elements: BTreeMap::new(),
        }
    }

    /// `<name>…</name>` becomes `<tag …attrs>…</tag>`.
    pub fn tag(mut self, name: &str, tag: &str, attrs: &[(&str, &str)]) -> Self {
        self.elements.insert(
            name.to_owned(),
            Element {
                tag: tag.to_owned(),
                attrs: attrs
                    .iter()
                    .map(|(k, v)| ((*k).to_owned(), (*v).to_owned()))
                    .collect(),
                empty: false,
            },
        );
        self
    }

    /// The common case: a link whose href a translator never sees.
    pub fn link(self, name: &str, href: &str) -> Self {
        self.tag(name, "a", &[("href", href)])
    }

    /// An element with no content, written `<name/>` in the message.
    pub fn empty(mut self, name: &str, tag: &str) -> Self {
        self.elements.insert(
            name.to_owned(),
            Element {
                tag: tag.to_owned(),
                attrs: Vec::new(),
                empty: true,
            },
        );
        self
    }
}

impl Display for Interpolated {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let mut out = String::with_capacity(self.text.len());
        render(&mut out, &self.text, &self.elements);
        f.write_str(&out)
    }
}

/// Scans for registered names and escapes everything else. Deliberately a scan
/// rather than a parse: the message is a sentence with a few known names in it, not
/// a document, and anything unrecognised must end up escaped rather than guessed at.
fn render(out: &mut String, text: &str, elements: &BTreeMap<String, Element>) {
    let mut rest = text;

    while let Some(open) = rest.find('<') {
        escape(out, &rest[..open]);
        let after = &rest[open + 1..];

        let Some(close) = after.find('>') else {
            escape(out, &rest[open..]);
            return;
        };

        let raw = &after[..close];
        let name = raw.strip_suffix('/').unwrap_or(raw);

        let Some(element) = elements.get(name) else {
            // Not a name we were given, so it is text as far as this is concerned.
            escape(out, &rest[open..open + 1]);
            rest = after;
            continue;
        };

        write_open(out, element);

        if element.empty || raw.ends_with('/') {
            rest = &after[close + 1..];
            continue;
        }

        let body = &after[close + 1..];
        let end = format!("</{name}>");

        match body.find(&end) {
            Some(at) => {
                render(out, &body[..at], elements);
                let _ = write!(out, "</{}>", element.tag);
                rest = &body[at + end.len()..];
            }
            // Unterminated: close it here so the output stays well-formed rather
            // than swallowing the remainder of the sentence.
            None => {
                render(out, body, elements);
                let _ = write!(out, "</{}>", element.tag);
                return;
            }
        }
    }

    escape(out, rest);
}

fn write_open(out: &mut String, element: &Element) {
    let _ = write!(out, "<{}", element.tag);
    for (key, value) in &element.attrs {
        let _ = write!(out, " {key}=\"");
        escape(out, value);
        out.push('"');
    }
    out.push('>');
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn code_supplies_the_url_not_the_translator() {
        let out = Interpolated::new("read my <cv>CV</cv>")
            .link("cv", "/fr-FR/cv")
            .to_string();
        assert_eq!(out, r#"read my <a href="/fr-FR/cv">CV</a>"#);
    }

    #[test]
    fn a_translator_can_move_the_link() {
        // Same registrations, a word order the English never had.
        let out = Interpolated::new("<cv>Mon CV</cv> est ici")
            .link("cv", "/fr-FR/cv")
            .to_string();
        assert_eq!(out, r#"<a href="/fr-FR/cv">Mon CV</a> est ici"#);
    }

    #[test]
    fn markup_from_a_catalogue_is_escaped() {
        let out = Interpolated::new(r#"hi <script>alert(1)</script> <img src=x onerror=y>"#)
            .to_string();
        assert!(!out.contains("<script"), "{out}");
        assert!(!out.contains("<img"), "{out}");
        assert!(out.contains("&lt;script&gt;"), "{out}");
    }

    #[test]
    fn an_unregistered_name_is_not_markup() {
        let out = Interpolated::new("a <b>bold</b> claim").to_string();
        assert_eq!(out, "a &lt;b&gt;bold&lt;/b&gt; claim");
    }

    #[test]
    fn attributes_are_escaped_too() {
        let out = Interpolated::new("<x>t</x>")
            .link("x", "/a\"onmouseover=\"alert(1)")
            .to_string();
        assert!(!out.contains("onmouseover=\"alert"), "{out}");
    }

    #[test]
    fn nesting_and_empties() {
        let out = Interpolated::new("<b>bold <i>and italic</i></b><br/>next")
            .tag("b", "strong", &[])
            .tag("i", "em", &[])
            .empty("br", "br")
            .to_string();
        assert_eq!(out, "<strong>bold <em>and italic</em></strong><br>next");
    }

    #[test]
    fn an_unterminated_tag_stays_well_formed() {
        let out = Interpolated::new("oops <cv>unclosed").link("cv", "/cv").to_string();
        assert_eq!(out, r#"oops <a href="/cv">unclosed</a>"#);
    }
}
