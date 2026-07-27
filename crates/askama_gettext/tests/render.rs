//! The whole surface, rendered by Askama against catalogues on disk.
//!
//! The unit tests reach each piece on its own — interpolation, markup, plural
//! selection, lookup. What none of them covers is the join: that Askama resolves a
//! bare `__(…)` to the trait method, that a `Message` goes through the HTML escaper
//! and a `Markup` past it, and that a `.po` file on disk is what decides any of it.
//! Everything here goes through `Template::render`.

use std::path::Path;

use askama::Template;
use askama_gettext::{Catalogs, Translate, Translator};

#[derive(Template)]
#[template(path = "i18n.html")]
struct Page<'a> {
    catalogs: &'a Catalogs,
    locale: &'a str,
    cv: &'a str,
}

impl Translate for Page<'_> {
    fn translator(&self) -> Translator<'_> {
        Translator::new(self.catalogs, self.locale)
    }
}

fn render(locale: &str) -> String {
    let dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("tests/locales");
    let catalogs = Catalogs::load(&dir, &["en-GB", "pl-PL"], "en-GB").unwrap();

    Page {
        catalogs: &catalogs,
        locale,
        cv: "/pl-PL/cv",
    }
    .render()
    .unwrap()
}

/// The text of one `<p id="…">`, so an assertion names what it is reading.
fn part<'a>(html: &'a str, id: &str) -> &'a str {
    let open = format!("<p id=\"{id}\">");
    let start = html
        .find(&open)
        .unwrap_or_else(|| panic!("no `{id}` in:\n{html}"))
        + open.len();
    let rest = &html[start..];
    &rest[..rest.find("</p>").expect("unclosed paragraph")]
}

#[test]
fn a_translation_reaches_the_page() {
    assert_eq!(part(&render("pl-PL"), "translated"), "Zarezerwuj teraz");
}

#[test]
fn an_untranslated_string_renders_as_its_own_english() {
    assert_eq!(
        part(&render("pl-PL"), "untranslated"),
        "Nobody has translated this"
    );
}

#[test]
fn the_source_locale_is_what_a_locale_falls_back_to() {
    // "Sign in" is translated only in en-GB, and to something other than itself —
    // so English here is the source catalogue's answer rather than the id.
    assert_eq!(part(&render("pl-PL"), "from-source"), "Log in");
}

#[test]
fn context_separates_identical_english() {
    let html = render("pl-PL");
    assert_eq!(part(&html, "context-dialog"), "zamknij");
    assert_eq!(part(&html, "context-distance"), "blisko");
}

#[test]
fn cldr_chooses_the_plural_form_and_binds_the_count() {
    let html = render("pl-PL");
    assert_eq!(part(&html, "one"), "1 plik");
    assert_eq!(part(&html, "few"), "2 pliki");
    assert_eq!(part(&html, "many"), "5 plików");
}

#[test]
fn a_value_is_interpolated_into_the_translation() {
    assert_eq!(part(&render("pl-PL"), "interpolated"), "pokazano 3 z 36");
}

#[test]
fn a_translator_moves_the_link_and_code_still_owns_the_href() {
    assert_eq!(
        part(&render("pl-PL"), "markup"),
        r#"mój <a href="/pl-PL/cv">życiorys</a> jest tutaj"#
    );
}

#[test]
fn a_catalogue_cannot_put_markup_on_the_page() {
    let html = render("pl-PL");

    // Two escapers are in play and they spell an entity differently — Askama's is
    // numeric, Markup's is named — so these ask what reached the page rather than
    // which characters it was spelt with.
    let text = part(&html, "hostile-text");
    assert!(!text.contains("<script"), "{text}");
    assert!(text.contains("alert(2)"), "escaped away entirely:\n{text}");

    // `|safe` is not a way round it: Markup escapes everything it was not given a
    // name for, so a translator's own tags are text.
    let markup = part(&html, "hostile-markup");
    assert!(!markup.contains("<img"), "{markup}");
    assert!(!markup.contains("<b>"), "{markup}");
    assert!(markup.contains("nie pogrubione"), "{markup}");
}

#[test]
fn the_source_locale_renders_the_english_it_was_written_in() {
    let html = render("en-GB");
    assert_eq!(part(&html, "translated"), "Book now");
    assert_eq!(part(&html, "context-dialog"), "close");
    assert_eq!(part(&html, "many"), "5 files");
}
