//! Choosing a plural form, from CLDR rather than from the catalogue.
//!
//! A `.po` file carries a `Plural-Forms` header — `nplurals=3; plural=n==1 ? 0 : …`
//! — which is a C expression a translator's tooling evaluates. Nothing here
//! evaluates it. CLDR already knows which form a count takes in every language, and
//! it is kept current in a way a header copied between projects is not.
//!
//! What the header is still good for is agreement, in two parts. It says how many
//! `msgstr[n]` slots a translator is offered, and which one a given count lands in.
//! CLDR answers both. When either disagrees one of them is wrong, and [`Forms::check`]
//! and [`Forms::check_expression`] refuse to continue rather than write to a slot
//! nobody will translate, or number the slots differently from the tool a translator
//! fills them in with.

use icu_locale_core::Locale;
use icu_plurals::{PluralCategory, PluralRules};

use crate::error::{Error, Result};
use crate::expression::Expression;

/// CLDR's canonical order, which is also the order gettext numbers `msgstr[n]`.
///
/// Spelled out rather than taken from `PluralCategory::all()`, which yields
/// alphabetically — `[Few, Many, One, Other, Two, Zero]`. Position here *is* the
/// msgstr index, so alphabetical order would file Arabic's `zero` under `msgstr[5]`
/// and Polish's `one` under `msgstr[2]`, quietly, in every catalogue.
const CANONICAL: [PluralCategory; 6] = [
    PluralCategory::Zero,
    PluralCategory::One,
    PluralCategory::Two,
    PluralCategory::Few,
    PluralCategory::Many,
    PluralCategory::Other,
];

/// The plural categories a whole number can land in, in CLDR order.
///
/// The position of a category in this list is its `msgstr[n]` index, which is what
/// makes gettext's numbered slots and CLDR's named categories line up.
pub struct Forms {
    rules: PluralRules,
    categories: Vec<PluralCategory>,
}

impl Forms {
    /// Resolves the plural rules for a locale.
    ///
    /// # Errors
    ///
    /// Fails if the locale is not a well-formed language tag, or if CLDR has no
    /// plural rules for it.
    ///
    /// ```
    /// # use askama_gettext::plural::Forms;
    /// // English has two forms, Japanese one, Polish three, Arabic six.
    /// assert_eq!(Forms::new("en-GB")?.count(), 2);
    /// assert_eq!(Forms::new("ja-JP")?.count(), 1);
    /// assert_eq!(Forms::new("pl-PL")?.count(), 3);
    /// assert_eq!(Forms::new("ar-EG")?.count(), 6);
    /// # Ok::<(), askama_gettext::Error>(())
    /// ```
    pub fn new(locale: &str) -> Result<Self> {
        let tag: Locale = locale
            .parse()
            .map_err(|_| Error::Locale(locale.to_owned()))?;

        let rules = PluralRules::try_new_cardinal((&tag).into())
            .map_err(|_| Error::NoPluralRules(locale.to_owned()))?;

        /*
         * Sampled over integers rather than taken from `categories()`, which lists
         * categories reachable only by fractions: CLDR gives Polish four, but a
         * whole number is only ever one, few or many — and gettext's three slots
         * are those three. Counting things is what plurals are for here.
         */
        let reachable: Vec<_> = (0u64..=200).map(|n| rules.category_for(n)).collect();
        let categories = CANONICAL
            .into_iter()
            .filter(|category| reachable.contains(category))
            .collect();

        Ok(Self { rules, categories })
    }

    /// How many `msgstr[n]` slots this language has.
    #[must_use]
    pub fn count(&self) -> usize {
        self.categories.len()
    }

    /// The `msgstr[n]` index a count selects.
    ///
    /// ```
    /// # use askama_gettext::plural::Forms;
    /// let polish = Forms::new("pl-PL")?;
    /// assert_eq!(polish.index(1), 0);  // one
    /// assert_eq!(polish.index(2), 1);  // few
    /// assert_eq!(polish.index(36), 2); // many
    /// # Ok::<(), askama_gettext::Error>(())
    /// ```
    #[must_use]
    pub fn index(&self, count: u64) -> usize {
        let category = self.rules.category_for(count);
        self.categories
            .iter()
            .position(|form| *form == category)
            .unwrap_or(0)
    }

    /// Confirms a catalogue's declared `nplurals` matches CLDR.
    ///
    /// # Errors
    ///
    /// Returns [`Error::PluralMismatch`] when they disagree.
    pub fn check(&self, locale: &str, declared: usize) -> Result<()> {
        if declared == self.count() {
            return Ok(());
        }

        Err(Error::PluralMismatch {
            locale: locale.to_owned(),
            declared,
            actual: self.count(),
            categories: format!("{:?}", self.categories),
        })
    }

    /// Confirms a catalogue's `plural=` expression selects the forms CLDR does.
    ///
    /// The count alone is not enough: a header can declare the right number of
    /// slots and still put a count in the wrong one, which nothing renders but a
    /// translator's tooling reads. Agreement is checked by evaluating rather than
    /// by comparing text, so a header written differently from the familiar one is
    /// fine as long as it means the same thing.
    ///
    /// # Errors
    ///
    /// Returns [`Error::PluralExpression`] if the expression cannot be read, and
    /// [`Error::PluralExpressionMismatch`] naming the smallest count they differ on.
    pub fn check_expression(&self, locale: &str, expression: &str) -> Result<()> {
        let parsed = Expression::parse(expression)?;

        // Enough to cover the mod-10 and mod-100 cycles every CLDR rule turns on,
        // several times over, plus the small counts they special-case.
        for count in 0..=1000 {
            let declared = parsed.form(count).ok_or_else(|| Error::PluralExpression {
                expression: expression.to_owned(),
                message: format!("no value for n={count}"),
            })?;

            let actual = self.index(count);
            if usize::try_from(declared) != Ok(actual) {
                return Err(Error::PluralExpressionMismatch {
                    locale: locale.to_owned(),
                    count,
                    declared,
                    actual,
                });
            }
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn arabic_uses_every_category() {
        let ar = Forms::new("ar-EG").unwrap();
        assert_eq!(ar.count(), 6);
        // zero, one, two, few, many, other
        assert_eq!(ar.index(0), 0);
        assert_eq!(ar.index(1), 1);
        assert_eq!(ar.index(2), 2);
        assert_eq!(ar.index(3), 3);
        assert_eq!(ar.index(11), 4);
        assert_eq!(ar.index(100), 5);
    }

    #[test]
    fn polish_forms_are_in_gettext_order() {
        // one, few, many — the order Plural-Forms numbers them, not alphabetical.
        let pl = Forms::new("pl-PL").unwrap();
        assert_eq!(pl.index(1), 0);
        assert_eq!(pl.index(2), 1);
        assert_eq!(pl.index(5), 2);
    }

    #[test]
    fn a_language_without_plurals_always_picks_the_first_slot() {
        let ja = Forms::new("ja-JP").unwrap();
        assert_eq!(ja.count(), 1);
        for n in [0, 1, 2, 5, 100] {
            assert_eq!(ja.index(n), 0);
        }
    }

    #[test]
    fn a_region_subtag_does_not_change_the_rules() {
        assert_eq!(
            Forms::new("nl-BE").unwrap().count(),
            Forms::new("nl-NL").unwrap().count()
        );
    }

    #[test]
    fn an_expression_that_selects_what_cldr_selects_is_accepted() {
        Forms::new("pl-PL")
            .unwrap()
            .check_expression(
                "pl-PL",
                "n==1 ? 0 : n%10>=2 && n%10<=4 && (n%100<10 || n%100>=20) ? 1 : 2;",
            )
            .unwrap();
        Forms::new("fr-FR")
            .unwrap()
            .check_expression("fr-FR", "n > 1")
            .unwrap();
    }

    #[test]
    fn the_right_number_of_forms_in_the_wrong_order_is_still_caught() {
        // English's expression on French. Both are nplurals=2, so the count check
        // passes and only evaluating them apart tells them apart — at n=0, which
        // French puts in the singular and English does not.
        let error = Forms::new("fr-FR")
            .unwrap()
            .check_expression("fr-FR", "n != 1")
            .unwrap_err();

        assert!(
            matches!(error, Error::PluralExpressionMismatch { count: 0, .. }),
            "{error}"
        );
    }

    #[test]
    fn disagreement_is_an_error_not_a_guess() {
        let pl = Forms::new("pl-PL").unwrap();
        assert!(pl.check("pl-PL", 3).is_ok());
        assert!(matches!(
            pl.check("pl-PL", 2),
            Err(Error::PluralMismatch {
                declared: 2,
                actual: 3,
                ..
            })
        ));
    }

    #[test]
    fn an_unknown_locale_is_rejected() {
        assert!(matches!(Forms::new("not a tag"), Err(Error::Locale(_))));
    }
}
