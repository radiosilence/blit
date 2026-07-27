//! `%{name}` substitution.
//!
//! Named rather than positional so a translator can reorder a sentence freely, and
//! so the name itself says what the value is — `%{count} of %{total}` survives being
//! rewritten in a language that puts the total first.

use std::fmt::Write as _;

/// Replaces every `%{name}` for which a value was supplied.
///
/// A placeholder with no value is left as written. That is deliberate: blanking it
/// hides the mistake, whereas leaving `%{total}` visible in the output is obvious
/// the first time anyone looks at the page.
///
/// ```
/// # use askama_gettext::interpolate;
/// let out = interpolate("%{count} of %{total}", &[("count", "3"), ("total", "9")]);
/// assert_eq!(out, "3 of 9");
///
/// // Reordered by a translator — the names still find their values.
/// let out = interpolate("von %{total}: %{count}", &[("count", "3"), ("total", "9")]);
/// assert_eq!(out, "von 9: 3");
/// ```
#[must_use]
pub fn interpolate(text: &str, values: &[(&str, &str)]) -> String {
    let mut out = String::with_capacity(text.len());
    let mut rest = text;

    while let Some(at) = rest.find("%{") {
        out.push_str(&rest[..at]);
        let after = &rest[at + 2..];

        let Some(end) = after.find('}') else {
            // No closing brace, so it was never a placeholder.
            out.push_str(&rest[at..]);
            return out;
        };

        let name = &after[..end];
        match values.iter().find(|(key, _)| *key == name) {
            Some((_, value)) => out.push_str(value),
            None => {
                let _ = write!(out, "%{{{name}}}");
            }
        }

        rest = &after[end + 1..];
    }

    out.push_str(rest);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_unsupplied_placeholder_stays_visible() {
        assert_eq!(interpolate("%{a} and %{b}", &[("a", "1")]), "1 and %{b}");
    }

    #[test]
    fn text_without_placeholders_is_untouched() {
        assert_eq!(interpolate("plain", &[("a", "1")]), "plain");
    }

    #[test]
    fn an_unclosed_placeholder_is_literal() {
        assert_eq!(interpolate("100%{ of it", &[]), "100%{ of it");
    }

    #[test]
    fn a_value_is_not_itself_interpolated() {
        // Otherwise a value containing a placeholder could pull in another value.
        assert_eq!(
            interpolate("%{a}", &[("a", "%{b}"), ("b", "boom")]),
            "%{b}"
        );
    }

    #[test]
    fn repeated_placeholders_all_resolve() {
        assert_eq!(interpolate("%{n}/%{n}", &[("n", "2")]), "2/2");
    }
}
