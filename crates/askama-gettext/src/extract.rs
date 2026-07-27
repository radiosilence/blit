//! Finds `__`, `__p`, `__n` and `__h` calls in Askama templates.
//!
//! The templates are parsed by Askama's own parser, so this recognises no template
//! syntax of its own: if Askama's grammar changes, extraction follows rather than
//! drifting. All this file knows is which call names mean what, and that gettext
//! wants the English rather than an id.

use std::path::Path;

use anyhow::{Context, Result};
use askama_parser::node::{BlockDef, FilterBlock, If, Let, LetValueOrBlock, Loop, Macro, Match, Node};
use askama_parser::{Ast, Expr, Syntax, WithSpan};

/// One call site. `context` is gettext's msgctxt, `plural` its msgid_plural.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Message {
    pub id: String,
    pub context: Option<String>,
    pub plural: Option<String>,
    pub file: String,
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
        "__n" => Some((false, true)),
        "__np" => Some((true, true)),
        _ => None,
    }
}

pub fn from_file(path: &Path, syntax: &Syntax<'_>) -> Result<Vec<Message>> {
    let source = std::fs::read_to_string(path)
        .with_context(|| format!("reading template {}", path.display()))?;
    from_str(&source, &path.to_string_lossy(), syntax)
}

pub fn from_str(source: &str, file: &str, syntax: &Syntax<'_>) -> Result<Vec<Message>> {
    let ast = Ast::from_str(source, None, syntax)
        .map_err(|e| anyhow::anyhow!("parsing {file}: {e}"))?;

    let mut found = Vec::new();
    for node in ast.nodes() {
        walk_node(node, source, file, &mut found);
    }
    Ok(found)
}

/// Byte offset to 1-based line, so a `#:` reference points where it was written.
fn line_of(source: &str, offset: usize) -> usize {
    source[..offset.min(source.len())].bytes().filter(|b| *b == b'\n').count() + 1
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
            let Loop { body, else_nodes, .. } = &**inner;
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
                let plural = if has_plural { args.next().and_then(literal) } else { None };

                out.push(Message {
                    id,
                    context,
                    plural,
                    file: file.to_owned(),
                    line: expr.span().byte_range().map_or(1, |r| line_of(source, r.start)),
                });
            }
        }

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
        Expr::Group(inner) | Expr::Unary(_, inner) | Expr::Try(inner) => {
            walk_expr(inner, source, file, out)
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

        assert_eq!(found[1].context.as_deref(), Some("Nav: language picker button"));
        assert_eq!(found[2].plural.as_deref(), Some("%{count} locales"));
        assert_eq!(found[0].line, 1);
        assert_eq!(found[4].line, 5);
    }

    #[test]
    fn ignores_a_non_literal_id() {
        assert!(extract("{{ __(some_variable) }}").is_empty());
    }
}
