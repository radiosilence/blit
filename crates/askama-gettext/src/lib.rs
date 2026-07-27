//! gettext for Askama templates.
//!
//! The English lives in the template — `__("Book now")`, never an id — and
//! extraction reads it back with Askama's own parser. Plural selection comes from
//! CLDR rather than the catalogue's `Plural-Forms` expression, which gettext tools
//! need but nothing here evaluates.

pub mod extract;
pub mod html;

pub use extract::Message;
pub use html::Interpolated;
