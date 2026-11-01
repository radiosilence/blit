//! Extraction against the compiler.
//!
//! A msgid has to be the string the template looks up at runtime, which is what
//! rustc makes of the literal Askama copies into generated code. Each template
//! here records the ids it is asked for while rendering, and the test compares
//! them with what extraction reads from the same source.

use std::cell::RefCell;

use askama::Template;
use askama_gettext::{Message, Translate, Translator};
use askama_parser::Syntax;

macro_rules! round_trip {
    ($name:ident, $source:literal) => {
        #[test]
        fn $name() {
            #[derive(Template)]
            #[template(source = $source, ext = "txt")]
            struct Page {
                asked: RefCell<Vec<String>>,
            }

            impl Translate for Page {
                fn translator(&self) -> Translator<'_> {
                    unreachable!("only __ is called, and it is overridden")
                }

                fn __(&self, msgid: &str) -> Message {
                    self.asked.borrow_mut().push(msgid.to_owned());
                    Message::new(msgid)
                }
            }

            let page = Page {
                asked: RefCell::default(),
            };
            page.render().unwrap();

            let extracted: Vec<String> =
                askama_gettext::extract::from_str($source, "t.txt", &Syntax::default())
                    .unwrap()
                    .into_iter()
                    .map(|message| message.id)
                    .collect();

            assert_eq!(extracted, page.asked.into_inner());
        }
    };
}

round_trip!(plain, r#"{{ __("plain") }}"#);
round_trip!(
    escapes,
    r#"{{ __("a\\nb") }}{{ __("tab\there") }}{{ __("it\'s \"so\"") }}{{ __("nl\nnul\0") }}{{ __("\u{e9}\x41\r") }}"#
);
