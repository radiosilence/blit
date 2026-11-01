//! Finds the `__` family — `__`, `__p`, `__n`, `__np` and their `h` variants — in
//! Askama templates.
//!
//! The templates are parsed by Askama's own parser, so this recognises no template
//! syntax of its own: if Askama's grammar changes, extraction follows rather than
//! drifting. All this file knows is which call names mean what, and that gettext
//! wants the English rather than an id.

use std::path::Path;

use crate::error::{Error, Result};
use askama_parser::node::{LetValueOrBlock, Node};
use askama_parser::{Ast, Expr, Syntax, WithSpan};

/// One `__`-family call found in a template.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Message {
    /// The English, which is also the `msgid`.
    pub id: String,
    /// gettext's `msgctxt`, when the call supplied one.
    pub context: Option<String>,
    /// gettext's `msgid_plural`, for the countable forms.
    pub plural: Option<String>,
    /// The template it was written in.
    pub file: String,
    /// The 1-based line, for the `#:` reference.
    pub line: usize,
}

/// The call shapes, mirroring gettext's own vocabulary.
///
/// `__h` is `__` for a message whose English contains inline markup — the sentence
/// stays whole so a translator can move the emphasis or the link where the language
/// needs it, rather than being split around it.
fn shape(name: &str) -> Option<(bool, bool)> {
    match name {
        // (takes a context first, takes a plural second)
        "__" | "__h" => Some((false, false)),
        "__p" | "__ph" => Some((true, false)),
        "__n" | "__nh" => Some((false, true)),
        "__np" | "__nph" => Some((true, true)),
        _ => None,
    }
}

/// Extracts every message from one template file.
///
/// # Errors
///
/// Fails if the file cannot be read, or for any reason [`from_str`] gives.
pub fn from_file(path: &Path, syntax: &Syntax<'_>) -> Result<Vec<Message>> {
    let source = std::fs::read_to_string(path)?;
    from_str(&source, &path.to_string_lossy(), syntax)
}

/// Extracts every message from template source.
///
/// # Errors
///
/// Fails if Askama cannot parse the source, or if a `__`-family call passes
/// anything but a string literal where the English, its context or its plural
/// goes: the message could not be extracted under the key it is looked up by.
/// That refuses gettext's marker pattern, `__(item.label)` with the English
/// marked elsewhere, by design: the English lives in the template. A call written
/// `self.__(…)` or `Self::__(…)` fails too, so there is one spelling to recognise.
pub fn from_str(source: &str, file: &str, syntax: &Syntax<'_>) -> Result<Vec<Message>> {
    let ast = Ast::from_str(source, None, syntax).map_err(|e| Error::Template {
        path: file.into(),
        message: e.to_string(),
    })?;

    let mut walker = Walker {
        source,
        file,
        found: Vec::new(),
    };
    walker.nodes(ast.nodes())?;
    Ok(walker.found)
}

/// Byte offset to 1-based line, so a `#:` reference points where it was written.
fn line_of(source: &str, offset: usize) -> usize {
    source[..offset.min(source.len())]
        .bytes()
        .filter(|b| *b == b'\n')
        .count()
        + 1
}

struct Walker<'s> {
    source: &'s str,
    file: &'s str,
    found: Vec<Message>,
}

type Expression<'a> = WithSpan<Box<Expr<'a>>>;

// Both walks match every variant with no wildcard arm. A construct this does not
// descend into is a message that renders in English and is never offered to a
// translator, so a variant added to Askama's grammar fails this crate's build
// rather than being skipped.
impl Walker<'_> {
    fn nodes<'a>(&mut self, nodes: impl IntoIterator<Item = &'a Box<Node<'a>>>) -> Result<()> {
        nodes.into_iter().try_for_each(|node| self.node(node))
    }

    fn exprs<'a>(&mut self, exprs: impl IntoIterator<Item = &'a Expression<'a>>) -> Result<()> {
        exprs.into_iter().try_for_each(|expr| self.expr(expr))
    }

    fn node(&mut self, node: &Node<'_>) -> Result<()> {
        match node {
            Node::Expr(_, expr) => self.expr(expr),
            Node::Call(call) => {
                self.exprs(call.args.iter().flatten())?;
                self.nodes(&call.nodes)
            }
            Node::Let(inner) => match &inner.val {
                LetValueOrBlock::Value(expr) => self.expr(expr),
                LetValueOrBlock::Block { nodes, .. } => self.nodes(nodes),
            },
            Node::Compound(inner) => {
                self.expr(&inner.op.lhs)?;
                self.expr(&inner.op.rhs)
            }
            Node::If(inner) => {
                for branch in &inner.branches {
                    if let Some(test) = &branch.cond {
                        self.expr(&test.expr)?;
                    }
                    self.nodes(&branch.nodes)?;
                }
                Ok(())
            }
            Node::Match(inner) => {
                self.expr(&inner.expr)?;
                inner.arms.iter().try_for_each(|arm| self.nodes(&arm.nodes))
            }
            Node::Loop(inner) => {
                self.expr(&inner.iter)?;
                self.exprs(&inner.cond)?;
                self.nodes(inner.body.iter().chain(&inner.else_nodes))
            }
            Node::BlockDef(inner) => self.nodes(&inner.nodes),
            Node::Macro(inner) => {
                self.exprs(inner.args.iter().filter_map(|arg| arg.default.as_ref()))?;
                self.nodes(&inner.nodes)
            }
            Node::FilterBlock(inner) => {
                self.exprs(&inner.filters.arguments)?;
                self.nodes(&inner.nodes)
            }
            Node::Lit(_)
            | Node::Comment(_)
            | Node::Declare(_)
            | Node::Extends(_)
            | Node::Include(_)
            | Node::Import(_)
            | Node::Raw(_)
            | Node::Break(_)
            | Node::Continue(_) => Ok(()),
        }
    }

    fn expr(&mut self, expr: &Expression<'_>) -> Result<()> {
        match &***expr {
            Expr::Call(call) => {
                // `self.__(…)` and `Self::__(…)` render the same message, but one
                // spelling is what extraction recognises.
                let qualified = match &**call.path {
                    Expr::Var(name) => {
                        if let Some(shape) = shape(name) {
                            self.message(expr, name, shape, &call.args)?;
                        }
                        None
                    }
                    Expr::AssociatedItem(_, item) => Some(*item.name),
                    Expr::Path(path) => path.last().map(|last| *last.name),
                    _ => None,
                };
                if let Some(name) = qualified.filter(|name| shape(name).is_some()) {
                    return Err(self.error(expr, &format!("call `{name}` unqualified")));
                }
                // The receiver as well as the arguments: `__("x").link(...)` parses
                // as a call whose path is a method access on the call wanted here.
                self.expr(&call.path)?;
                self.exprs(&call.args)
            }
            Expr::Filter(filter) => self.exprs(&filter.arguments),
            Expr::BinOp(op) => {
                self.expr(&op.lhs)?;
                self.expr(&op.rhs)
            }
            Expr::Range(range) => self.exprs(range.lhs.iter().chain(&range.rhs)),
            Expr::Struct(value) => {
                self.expr(&value.path)?;
                self.exprs(value.fields.iter().filter_map(|field| field.value.as_ref()))?;
                self.exprs(&value.base)
            }
            Expr::LetCond(test) => self.expr(&test.expr),
            // Askama hands a macro's arguments to rustc as unparsed tokens, so a
            // call inside one renders but cannot be walked.
            Expr::RustMacro(_, tokens) => match tokens
                .split(|c: char| !(c.is_alphanumeric() || c == '_'))
                .find(|word| shape(word).is_some())
            {
                Some(name) => Err(self.error(expr, &format!("call `{name}` outside a macro"))),
                None => Ok(()),
            },
            Expr::Group(inner)
            | Expr::Unary(_, inner)
            | Expr::Try(inner)
            | Expr::AssociatedItem(inner, _)
            | Expr::As(inner, _)
            | Expr::NamedArgument(_, inner) => self.expr(inner),
            Expr::Index(lhs, rhs) | Expr::ArrayRepeat(lhs, rhs) => {
                self.expr(lhs)?;
                self.expr(rhs)
            }
            Expr::Array(items) | Expr::Tuple(items) | Expr::Concat(items) => self.exprs(items),
            Expr::BoolLit(_)
            | Expr::NumLit(..)
            | Expr::StrLit(_)
            | Expr::CharLit(_)
            | Expr::Var(_)
            | Expr::Path(_)
            | Expr::FilterSource
            | Expr::IsDefined(_)
            | Expr::IsNotDefined(_)
            | Expr::ArgumentPlaceholder => Ok(()),
        }
    }

    fn line(&self, expr: &Expression<'_>) -> usize {
        expr.span()
            .byte_range()
            .map_or(1, |r| line_of(self.source, r.start))
    }

    fn error(&self, expr: &Expression<'_>, message: &str) -> Error {
        Error::Template {
            path: self.file.into(),
            message: format!("line {}: {message}", self.line(expr)),
        }
    }

    fn message(
        &mut self,
        call: &Expression<'_>,
        name: &str,
        (has_context, has_plural): (bool, bool),
        args: &[Expression<'_>],
    ) -> Result<()> {
        let line = self.line(call);

        let mut args = args.iter();
        let mut take = |role: &str| {
            args.next().and_then(literal).ok_or_else(|| {
                self.error(
                    call,
                    &format!(
                        "`{name}` takes a string literal for its {role}, so the message \
                         can be extracted under the key it is looked up by"
                    ),
                )
            })
        };

        let context = has_context.then(|| take("context")).transpose()?;
        let id = take("English")?;
        let plural = has_plural.then(|| take("plural")).transpose()?;

        // A .po string escapes only \n, \r, \t, \\ and \". Any other control
        // character would be written raw, which gettext tools reject, and \x04 is
        // the separator gettext keys a context with.
        let unwritable = [context.as_deref(), Some(id.as_str()), plural.as_deref()]
            .into_iter()
            .flatten()
            .any(|text| {
                text.chars()
                    .any(|c| c.is_control() && !matches!(c, '\n' | '\r' | '\t'))
            });
        if unwritable {
            return Err(self.error(
                call,
                &format!("`{name}` has a control character a .po file cannot hold"),
            ));
        }

        self.found.push(Message {
            id,
            context,
            plural,
            file: self.file.to_owned(),
            line,
        });
        Ok(())
    }
}

/// The string a literal compiles to.
///
/// Askama copies a literal's source into the Rust it generates, so the id the
/// template looks up at runtime is whatever rustc makes of that source. Extraction
/// has to arrive at the same string, escapes and all, or the catalogue holds a
/// message nothing ever asks for. A `b""` or `c""` literal is not a `&str` and is
/// refused.
fn literal(expr: &Expression<'_>) -> Option<String> {
    let Expr::StrLit(lit) = &***expr else {
        return None;
    };
    if lit.prefix.is_some() {
        return None;
    }

    let mut out = String::with_capacity(lit.content.len());
    let mut chars = lit.content.chars();
    while let Some(c) = chars.next() {
        match c {
            '\\' => out.push(match chars.next()? {
                'n' => '\n',
                'r' => '\r',
                't' => '\t',
                '0' => '\0',
                'x' => {
                    let hex: String = chars.by_ref().take(2).collect();
                    char::from(u8::from_str_radix(&hex, 16).ok()?)
                }
                'u' => {
                    let hex: String = chars.by_ref().skip(1).take_while(|c| *c != '}').collect();
                    char::from_u32(u32::from_str_radix(&hex, 16).ok()?)?
                }
                // \\, \" and \' stand for themselves.
                other => other,
            }),
            c => out.push(c),
        }
    }
    Some(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn extract(source: &str) -> Vec<Message> {
        from_str(source, "t.html", &Syntax::default()).unwrap()
    }

    #[test]
    fn finds_every_shape() {
        let found = extract(
            r#"{{ __("james cleveland") }}
{{ __p("Nav: language picker button", "close") }}
{{ __n("%{count} locale", "%{count} locales", count) }}
{{ __h("Read the <a href=\"/cv\">CV</a>") }}
{% if x %}{{ __("inside an if") }}{% endif %}
{% for a in b %}{{ __("inside a loop") }}{% endfor %}
{% block c %}{{ __("inside a block") }}{% endblock %}
<a title="{{ __("in an attribute") }}">x</a>
{{ ignore_me("not a message") }}"#,
        );

        let ids: Vec<&str> = found.iter().map(|m| m.id.as_str()).collect();
        assert_eq!(
            ids,
            [
                "james cleveland",
                "close",
                "%{count} locale",
                "Read the <a href=\"/cv\">CV</a>",
                "inside an if",
                "inside a loop",
                "inside a block",
                "in an attribute",
            ]
        );

        assert_eq!(
            found[1].context.as_deref(),
            Some("Nav: language picker button")
        );
        assert_eq!(found[2].plural.as_deref(), Some("%{count} locales"));
        assert_eq!(found[0].line, 1);
        assert_eq!(found[4].line, 5);
    }

    #[test]
    fn finds_every_method_the_trait_offers() {
        // Translate has eight methods and this match has to know all of them: one
        // it does not recognise renders correctly in the source language and is
        // never extracted, so it can never be translated.
        let found = extract(
            r#"{{ __("a") }}
{{ __p("ctx", "b") }}
{{ __n("c", "cs", n) }}
{{ __np("ctx", "d", "ds", n) }}
{{ __h("e") }}
{{ __ph("ctx", "f") }}
{{ __nh("g", "gs", n) }}
{{ __nph("ctx", "h", "hs", n) }}"#,
        );

        let ids: Vec<&str> = found.iter().map(|m| m.id.as_str()).collect();
        assert_eq!(ids, ["a", "b", "c", "d", "e", "f", "g", "h"]);

        // The h variants carry the same context and plural as their plain twins.
        assert_eq!(found[6].plural.as_deref(), Some("gs"));
        assert_eq!(found[7].plural.as_deref(), Some("hs"));
        assert_eq!(found[7].context.as_deref(), Some("ctx"));
    }

    #[test]
    fn finds_a_call_used_as_a_receiver() {
        // `__h(...).link(...)` is a method call whose receiver is the message.
        let found = extract(r#"{{ __h("read my <cv>CV</cv>").link("cv", urls.cv)|safe }}"#);
        assert_eq!(found.len(), 1, "{found:?}");
        assert_eq!(found[0].id, "read my <cv>CV</cv>");
    }

    fn fails(source: &str) -> String {
        from_str(source, "t.html", &Syntax::default())
            .unwrap_err()
            .to_string()
    }

    #[test]
    fn a_non_literal_argument_is_an_error_naming_its_line() {
        // Each would extract under a key the runtime lookup never uses: no id at
        // all, the id without its context, or a countable message without its plural.
        assert!(fails("\n{{ __(some_variable) }}").contains("line 2"));
        assert!(fails(r#"{{ __p(ctx, "close") }}"#).contains("context"));
        assert!(fails(r#"{{ __n("one", others, n) }}"#).contains("plural"));
        assert!(fails(r#"{{ __(b"bytes") }}"#).contains("English"));
    }

    #[test]
    fn a_qualified_call_is_an_error_rather_than_missed() {
        assert!(fails(r#"{{ self.__("x") }}"#).contains("unqualified"));
        assert!(fails(r#"{{ Self::__p("c", "x") }}"#).contains("unqualified"));
    }

    #[test]
    fn a_call_inside_a_macro_is_an_error_rather_than_missed() {
        assert!(fails(r#"{{ format!("{} :", __("github")) }}"#).contains("macro"));
        // Only the bare names: a longer identifier is not one of them.
        assert_eq!(
            extract(r#"{{ format!("{}", __hello) }}"#),
            Vec::<Message>::new()
        );
    }

    #[test]
    fn a_control_character_a_po_file_cannot_hold_is_an_error() {
        assert!(fails(r#"{{ __("a\0b") }}"#).contains("control character"));
        assert!(fails(r#"{{ __p("c\x04", "b") }}"#).contains("control character"));
        assert_eq!(extract(r#"{{ __("a\tb") }}"#)[0].id, "a\tb");
    }

    #[test]
    fn finds_calls_in_conditions_subjects_and_iterators() {
        let found = extract(
            r#"{% if __("in a condition").to_string().is_empty() %}{% endif %}
{% match __("in a match") %}{% when _ %}{% endmatch %}
{% for c in __("in an iterator").to_string().chars() %}{% endfor %}
{% for c in xs if c == __("in a loop filter") %}{% endfor %}
{% macro m(a = __("in a default")) %}{% endmacro %}"#,
        );
        let ids: Vec<&str> = found.iter().map(|m| m.id.as_str()).collect();
        assert_eq!(
            ids,
            [
                "in a condition",
                "in a match",
                "in an iterator",
                "in a loop filter",
                "in a default"
            ]
        );
    }
}
