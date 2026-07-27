//! Evaluating a catalogue's `plural=` expression.
//!
//! A `Plural-Forms` header carries a C expression in one variable — `n==1 ? 0 :
//! n%10>=2 && n%10<=4 ? 1 : 2` — which maps a count to a `msgstr[n]` index.
//! Nothing in this crate uses it to render: [`crate::plural`] gets that from CLDR,
//! deliberately. What it is used for is checking, and checking needs it evaluated.
//!
//! Because a header is otherwise only checked for the number of slots it declares,
//! a catalogue can agree with CLDR about how many forms a language has and disagree
//! about which one a count takes. Headers are copied between projects constantly,
//! which is exactly how a wrong one arrives, and the damage lands on a translator:
//! their tool offers boxes in one order and the site selects them in another, so a
//! sentence ends up under a count it was not written for.
//!
//! The grammar is C's, restricted to what gettext allows — the ternary, the
//! boolean and comparison operators, the four arithmetic ones and `%`, over `n`
//! and integer literals. It is a parser rather than a pattern match on known
//! headers because the point is to accept whatever a catalogue actually contains
//! and say what it means.

use crate::error::{Error, Result};

/// A parsed `plural=` expression.
#[derive(Debug, Clone)]
pub struct Expression {
    root: Node,
}

#[derive(Debug, Clone)]
enum Node {
    Count,
    Literal(i64),
    Not(Box<Node>),
    Negate(Box<Node>),
    Binary(Op, Box<Node>, Box<Node>),
    Ternary(Box<Node>, Box<Node>, Box<Node>),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Op {
    Or,
    And,
    Equal,
    NotEqual,
    Less,
    LessOrEqual,
    Greater,
    GreaterOrEqual,
    Add,
    Subtract,
    Multiply,
    Divide,
    Remainder,
}

impl Expression {
    /// Parses a `plural=` expression.
    ///
    /// # Errors
    ///
    /// Fails if the expression is not in the subset gettext defines, or has
    /// anything left over once a complete expression has been read.
    pub fn parse(source: &str) -> Result<Self> {
        let tokens = tokenise(source)?;
        let mut parser = Parser {
            tokens: &tokens,
            at: 0,
            source,
        };

        let root = parser.ternary()?;
        if parser.at < parser.tokens.len() {
            return Err(Error::PluralExpression {
                expression: source.to_owned(),
                message: "trailing tokens after a complete expression".to_owned(),
            });
        }

        Ok(Self { root })
    }

    /// The `msgstr[n]` index this expression gives a count.
    ///
    /// `None` for a division or remainder by zero, which is the only way an
    /// otherwise well-formed expression has no answer.
    #[must_use]
    pub fn form(&self, count: u64) -> Option<i64> {
        #[expect(
            clippy::cast_possible_wrap,
            reason = "a count large enough to wrap is not a plural form anybody writes"
        )]
        evaluate(&self.root, count as i64)
    }
}

fn evaluate(node: &Node, count: i64) -> Option<i64> {
    Some(match node {
        Node::Count => count,
        Node::Literal(value) => *value,
        Node::Not(inner) => i64::from(evaluate(inner, count)? == 0),
        Node::Negate(inner) => evaluate(inner, count)?.checked_neg()?,
        Node::Ternary(condition, yes, no) => {
            if evaluate(condition, count)? == 0 {
                evaluate(no, count)?
            } else {
                evaluate(yes, count)?
            }
        }
        Node::Binary(op, left, right) => {
            // Short-circuiting, because C does and a header may rely on it to guard
            // a remainder.
            let left = evaluate(left, count)?;
            match op {
                Op::Or if left != 0 => return Some(1),
                Op::And if left == 0 => return Some(0),
                _ => {}
            }

            let right = evaluate(right, count)?;
            match op {
                Op::Or | Op::And => i64::from(right != 0),
                Op::Equal => i64::from(left == right),
                Op::NotEqual => i64::from(left != right),
                Op::Less => i64::from(left < right),
                Op::LessOrEqual => i64::from(left <= right),
                Op::Greater => i64::from(left > right),
                Op::GreaterOrEqual => i64::from(left >= right),
                Op::Add => left.checked_add(right)?,
                Op::Subtract => left.checked_sub(right)?,
                Op::Multiply => left.checked_mul(right)?,
                Op::Divide => left.checked_div(right)?,
                Op::Remainder => left.checked_rem(right)?,
            }
        }
    })
}

#[derive(Debug, Clone, PartialEq, Eq)]
enum Token {
    Count,
    Number(i64),
    Op(Op),
    Not,
    Question,
    Colon,
    Open,
    Close,
}

fn tokenise(source: &str) -> Result<Vec<Token>> {
    let bad = |message: &str| Error::PluralExpression {
        expression: source.to_owned(),
        message: message.to_owned(),
    };

    let bytes: Vec<char> = source.chars().collect();
    let mut tokens = Vec::new();
    let mut at = 0;

    while at < bytes.len() {
        let c = bytes[at];
        let next = bytes.get(at + 1).copied();

        // Two-character operators first, so `<=` is never read as `<` then `=`.
        let two = match (c, next) {
            ('=', Some('=')) => Some(Token::Op(Op::Equal)),
            ('!', Some('=')) => Some(Token::Op(Op::NotEqual)),
            ('<', Some('=')) => Some(Token::Op(Op::LessOrEqual)),
            ('>', Some('=')) => Some(Token::Op(Op::GreaterOrEqual)),
            ('&', Some('&')) => Some(Token::Op(Op::And)),
            ('|', Some('|')) => Some(Token::Op(Op::Or)),
            _ => None,
        };

        if let Some(token) = two {
            tokens.push(token);
            at += 2;
            continue;
        }

        let one = match c {
            ' ' | '\t' | '\n' | '\r' => {
                at += 1;
                continue;
            }
            'n' => Token::Count,
            '<' => Token::Op(Op::Less),
            '>' => Token::Op(Op::Greater),
            '+' => Token::Op(Op::Add),
            '-' => Token::Op(Op::Subtract),
            '*' => Token::Op(Op::Multiply),
            '/' => Token::Op(Op::Divide),
            '%' => Token::Op(Op::Remainder),
            '!' => Token::Not,
            '?' => Token::Question,
            ':' => Token::Colon,
            '(' => Token::Open,
            ')' => Token::Close,
            ';' => {
                // gettext writes the expression with a trailing semicolon as often
                // as not, and it is the end of it either way.
                break;
            }
            '0'..='9' => {
                let start = at;
                while at < bytes.len() && bytes[at].is_ascii_digit() {
                    at += 1;
                }
                let digits: String = bytes[start..at].iter().collect();
                let value = digits
                    .parse()
                    .map_err(|_| bad("a number too large to evaluate"))?;
                tokens.push(Token::Number(value));
                continue;
            }
            other => return Err(bad(&format!("unexpected `{other}`"))),
        };

        tokens.push(one);
        at += 1;
    }

    Ok(tokens)
}

struct Parser<'a> {
    tokens: &'a [Token],
    at: usize,
    source: &'a str,
}

impl Parser<'_> {
    fn bad(&self, message: &str) -> Error {
        Error::PluralExpression {
            expression: self.source.to_owned(),
            message: message.to_owned(),
        }
    }

    fn peek(&self) -> Option<&Token> {
        self.tokens.get(self.at)
    }

    fn eat(&mut self, token: &Token) -> bool {
        if self.peek() == Some(token) {
            self.at += 1;
            return true;
        }
        false
    }

    /// `a ? b : c`, right-associative as in C.
    fn ternary(&mut self) -> Result<Node> {
        let condition = self.binary(0)?;

        if !self.eat(&Token::Question) {
            return Ok(condition);
        }

        let yes = self.ternary()?;
        if !self.eat(&Token::Colon) {
            return Err(self.bad("a `?` without its `:`"));
        }
        let no = self.ternary()?;

        Ok(Node::Ternary(
            Box::new(condition),
            Box::new(yes),
            Box::new(no),
        ))
    }

    /// Precedence climbing over the binary operators, loosest level first.
    fn binary(&mut self, level: usize) -> Result<Node> {
        const LEVELS: [&[Op]; 6] = [
            &[Op::Or],
            &[Op::And],
            &[Op::Equal, Op::NotEqual],
            &[Op::Less, Op::LessOrEqual, Op::Greater, Op::GreaterOrEqual],
            &[Op::Add, Op::Subtract],
            &[Op::Multiply, Op::Divide, Op::Remainder],
        ];

        let Some(ops) = LEVELS.get(level) else {
            return self.unary();
        };

        let mut left = self.binary(level + 1)?;

        while let Some(Token::Op(op)) = self.peek() {
            let op = *op;
            if !ops.contains(&op) {
                break;
            }

            self.at += 1;
            let right = self.binary(level + 1)?;
            left = Node::Binary(op, Box::new(left), Box::new(right));
        }

        Ok(left)
    }

    fn unary(&mut self) -> Result<Node> {
        if self.eat(&Token::Not) {
            return Ok(Node::Not(Box::new(self.unary()?)));
        }

        if self.eat(&Token::Op(Op::Subtract)) {
            return Ok(Node::Negate(Box::new(self.unary()?)));
        }

        self.primary()
    }

    fn primary(&mut self) -> Result<Node> {
        match self.peek().cloned() {
            Some(Token::Count) => {
                self.at += 1;
                Ok(Node::Count)
            }
            Some(Token::Number(value)) => {
                self.at += 1;
                Ok(Node::Literal(value))
            }
            Some(Token::Open) => {
                self.at += 1;
                let inner = self.ternary()?;
                if !self.eat(&Token::Close) {
                    return Err(self.bad("a `(` without its `)`"));
                }
                Ok(inner)
            }
            Some(_) => Err(self.bad("an operator where a value was expected")),
            None => Err(self.bad("the expression ends early")),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn forms(expression: &str, counts: &[u64]) -> Vec<i64> {
        let parsed = Expression::parse(expression).unwrap();
        counts.iter().map(|n| parsed.form(*n).unwrap()).collect()
    }

    #[test]
    fn the_headers_this_project_actually_carries() {
        // Polish, straight out of a catalogue, semicolon and all.
        let polish = "n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2;";
        assert_eq!(forms(polish, &[1, 2, 4, 5, 22, 25]), [0, 1, 1, 2, 1, 2]);

        // The pair that shares a form count and disagrees about zero.
        assert_eq!(forms("n != 1", &[0, 1, 2]), [1, 0, 1]);
        assert_eq!(forms("n > 1", &[0, 1, 2]), [0, 0, 1]);

        assert_eq!(forms("0", &[0, 1, 99]), [0, 0, 0]);
    }

    #[test]
    fn precedence_is_cs() {
        // `n % 10 == 1` is `(n % 10) == 1`, not `n % (10 == 1)` — which would be a
        // remainder by zero for every n, and is the reason this is parsed.
        assert_eq!(forms("n % 10 == 1", &[1, 11, 2]), [1, 1, 0]);
        assert_eq!(forms("1 + 2 * 3", &[0]), [7]);
        assert_eq!(forms("(1 + 2) * 3", &[0]), [9]);
        assert_eq!(forms("n > 1 && n < 5", &[0, 2, 9]), [0, 1, 0]);
        // || is looser than &&
        assert_eq!(forms("n == 0 || n > 1 && n < 5", &[0, 3, 9]), [1, 1, 0]);
    }

    #[test]
    fn a_ternary_nests_to_the_right() {
        assert_eq!(forms("n==0 ? 0 : n==1 ? 1 : 2", &[0, 1, 7]), [0, 1, 2]);
    }

    #[test]
    fn a_guard_short_circuits_rather_than_dividing_by_zero() {
        // C evaluates the right side only if it has to, and a header may lean on
        // that. Without short-circuiting this has no answer at n=0.
        assert_eq!(forms("n != 0 && 10 % n == 0", &[0, 5, 3]), [0, 1, 0]);
    }

    #[test]
    fn dividing_by_zero_has_no_answer_rather_than_panicking() {
        assert_eq!(Expression::parse("10 / n").unwrap().form(0), None);
        assert_eq!(Expression::parse("10 % n").unwrap().form(0), None);
    }

    #[test]
    fn unary_operators() {
        assert_eq!(forms("!n", &[0, 1, 2]), [1, 0, 0]);
        assert_eq!(forms("!!n", &[0, 3]), [0, 1]);
        assert_eq!(forms("-1 + 2", &[0]), [1]);
    }

    #[test]
    fn what_is_not_an_expression_is_refused() {
        for bad in [
            "n +",
            "(n",
            "n ? 1",
            "n == ",
            "frobnicate(n)",
            "n 1",
            "",
            "* 2",
        ] {
            assert!(Expression::parse(bad).is_err(), "accepted `{bad}`");
        }
    }
}
