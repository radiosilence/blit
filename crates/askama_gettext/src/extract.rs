//! Finds the `__` family — `__`, `__p`, `__n`, `__np` and their `h` variants — in
//! Askama templates.
//!
//! The templates are parsed by Askama's own parser, so this recognises no template
//! syntax of its own: if Askama's grammar changes, extraction follows rather than
//! drifting. All this file knows is which call names mean what, and that gettext
//! wants the English rather than an id.

use std::path::Path;

use crate::error::{Error, Result};
use askama_parser::node::{
    BlockDef, FilterBlock, If, Let, LetValueOrBlock, Loop, Macro, Match, Node,
};
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
/// Fails if the file cannot be read or Askama cannot parse it.
pub fn from_file(path: &Path, syntax: &Syntax<'_>) -> Result<Vec<Message>> {
    let source = std::fs::read_to_string(path)?;
    from_str(&source, &path.to_string_lossy(), syntax)
}

/// Extracts every message from template source.
///
/// # Errors
///
/// Fails if Askama cannot parse the source.
pub fn from_str(source: &str, file: &str, syntax: &Syntax<'_>) -> Result<Vec<Message>> {
    let ast = Ast::from_str(source, None, syntax).map_err(|e| Error::Template {
        path: file.into(),
        message: e.to_string(),
    })?;

    let mut found = Vec::new();
    for node in ast.nodes() {
        walk_node(node, source, file, &mut found);
    }
    Ok(found)
}

/// Byte offset to 1-based line, so a `#:` reference points where it was written.
fn line_of(source: &str, offset: usize) -> usize {
    source[..offset.min(source.len())]
        .bytes()
        .filter(|b| *b == b'\n')
        .count()
        + 1
}

fn walk_node(node: &Node<'_>, source: &str, file: &str, out: &mut Vec<Message>) {
    match node {
        Node::Expr(_, expr) => walk_expr(expr, source, file, out),
        Node::Call(call) => {
            for arg in call.args.iter().flatten() {
                walk_expr(arg, source, file, out);
            }
            for node in &call.nodes {
                walk_node(node, source, file, out);
            }
        }
        Node::Let(inner) => {
            let Let { val, .. } = &**inner;
            match val {
                LetValueOrBlock::Value(expr) => walk_expr(expr, source, file, out),
                LetValueOrBlock::Block { nodes, .. } => {
                    for node in nodes {
                        walk_node(node, source, file, out);
                    }
                }
            }
        }
        Node::If(inner) => {
            let If { branches, .. } = &**inner;
            for branch in branches {
                for node in &branch.nodes {
                    walk_node(node, source, file, out);
                }
            }
        }
        Node::Match(inner) => {
            let Match { arms, .. } = &**inner;
            for arm in arms {
                for node in &arm.nodes {
                    walk_node(node, source, file, out);
                }
            }
        }
        Node::Loop(inner) => {
            let Loop {
                body, else_nodes, ..
            } = &**inner;
            for node in body.iter().chain(else_nodes) {
                walk_node(node, source, file, out);
            }
        }
        Node::BlockDef(inner) => {
            let BlockDef { nodes, .. } = &**inner;
            for node in nodes {
                walk_node(node, source, file, out);
            }
        }
        Node::Macro(inner) => {
            let Macro { nodes, .. } = &**inner;
            for node in nodes {
                walk_node(node, source, file, out);
            }
        }
        Node::FilterBlock(inner) => {
            let FilterBlock { nodes, .. } = &**inner;
            for node in nodes {
                walk_node(node, source, file, out);
            }
        }
        _ => {}
    }
}

fn literal(expr: &WithSpan<Box<Expr<'_>>>) -> Option<String> {
    match &***expr {
        Expr::StrLit(lit) => Some(lit.content.replace("\\\"", "\"").replace("\\n", "\n")),
        _ => None,
    }
}

fn walk_expr(expr: &WithSpan<Box<Expr<'_>>>, source: &str, file: &str, out: &mut Vec<Message>) {
    if let Expr::Call(call) = &***expr {
        let name = match &**call.path {
            Expr::Var(name) => Some(*name),
            _ => None,
        };

        if let Some((has_context, has_plural)) = name.and_then(shape) {
            let mut args = call.args.iter();
            let context = if has_context {
                args.next().and_then(literal)
            } else {
                None
            };

            // A non-literal id cannot be extracted, and a caller that passes one has
            // moved the English out of the template — which is the thing to avoid.
            if let Some(id) = args.next().and_then(literal) {
                let plural = if has_plural {
                    args.next().and_then(literal)
                } else {
                    None
                };

                out.push(Message {
                    id,
                    context,
                    plural,
                    file: file.to_owned(),
                    line: expr
                        .span()
                        .byte_range()
                        .map_or(1, |r| line_of(source, r.start)),
                });
            }
        }

        // The receiver as well as the arguments: `__("x").link(...)` parses as a
        // call whose path is a method access on the call we are looking for.
        walk_expr(&call.path, source, file, out);
        for arg in &call.args {
            walk_expr(arg, source, file, out);
        }
        return;
    }

    // Anything that can wrap a call — a filter's input, a binary operand, a group.
    match &***expr {
        Expr::Filter(filter) => {
            for arg in &filter.arguments {
                walk_expr(arg, source, file, out);
            }
        }
        Expr::BinOp(op) => {
            walk_expr(&op.lhs, source, file, out);
            walk_expr(&op.rhs, source, file, out);
        }
        // Anything holding exactly one sub-expression that could be a call:
        // a group, a unary operand, a `?`, a field access, a cast, a named argument.
        Expr::Group(inner)
        | Expr::Unary(_, inner)
        | Expr::Try(inner)
        | Expr::AssociatedItem(inner, _)
        | Expr::As(inner, _)
        | Expr::NamedArgument(_, inner) => walk_expr(inner, source, file, out),
        Expr::Index(lhs, rhs) => {
            walk_expr(lhs, source, file, out);
            walk_expr(rhs, source, file, out);
        }
        Expr::Array(items) | Expr::Tuple(items) | Expr::Concat(items) => {
            for item in items {
                walk_expr(item, source, file, out);
            }
        }
        _ => {}
    }
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

    #[test]
    fn ignores_a_non_literal_id() {
        assert!(extract("{{ __(some_variable) }}").is_empty());
    }
}
