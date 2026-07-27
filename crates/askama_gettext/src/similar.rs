//! How alike two message ids are.
//!
//! Used to decide whether a message that has left the templates and one that has
//! arrived are the same sentence reworded, so a translation can follow the English
//! it was written for instead of being thrown away.
//!
//! The measure is how much of the two strings is common subsequence, as a share of
//! their combined length — what `difflib` calls a ratio, and what the familiar 0.6
//! cutoff was chosen against. Edit distance is the other obvious choice and is the
//! wrong one here: replacing a short word with a long one costs an edit per
//! character, so "read my CV" → "read my resume" scores 0.57 and a plain reword
//! falls under the bar it should clear.
//!
//! It is deliberately not clever beyond that — no stemming, no tokenising, no
//! weighting. A wrong pairing hands a translator someone else's sentence to fix, so
//! being subtle costs more than missing a match.

/// Length of the longest common subsequence, in characters rather than bytes so a
/// rewritten accent costs one edit and not the width of its encoding.
fn common(a: &[char], b: &[char]) -> usize {
    // Two rows rather than the full matrix: the ids are sentences, but this runs for
    // every departed × arrived pair in a catalogue.
    let mut previous = vec![0usize; b.len() + 1];
    let mut current = vec![0usize; b.len() + 1];

    for from in a {
        for (j, to) in b.iter().enumerate() {
            current[j + 1] = if from == to {
                previous[j] + 1
            } else {
                current[j].max(previous[j + 1])
            };
        }

        std::mem::swap(&mut previous, &mut current);
    }

    previous[b.len()]
}

/// How much of the two strings is shared, from 0.0 to 1.0.
///
/// Two empty strings are identical rather than a division by zero.
#[allow(
    clippy::cast_precision_loss,
    reason = "lengths of message ids; f64 is exact far beyond any of them"
)]
pub(crate) fn ratio(a: &str, b: &str) -> f64 {
    let a: Vec<char> = a.chars().collect();
    let b: Vec<char> = b.chars().collect();

    let total = a.len() + b.len();
    if total == 0 {
        return 1.0;
    }

    2.0 * common(&a, &b) as f64 / total as f64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn identical_strings_are_identical() {
        assert!((ratio("read my CV", "read my CV") - 1.0).abs() < f64::EPSILON);
        assert!((ratio("", "") - 1.0).abs() < f64::EPSILON);
    }

    #[test]
    fn a_reworded_sentence_stays_close() {
        // The case this exists for: a few words changed, the sentence recognisable.
        assert!(ratio("read my CV", "read my resume") > 0.6);
        assert!(ratio("Book now", "Book a table now") > 0.6);
        assert!(ratio("change language", "change the language") > 0.6);
    }

    #[test]
    fn different_sentences_are_not() {
        assert!(ratio("change language", "senior full stack engineer") < 0.6);
        assert!(ratio("close", "github") < 0.6);
        assert!(ratio("read my CV", "book a table") < 0.6);
    }

    #[test]
    fn nothing_in_common_scores_zero() {
        assert!(ratio("abc", "xyz").abs() < f64::EPSILON);
    }

    #[test]
    fn an_accent_costs_one_character_not_its_encoding() {
        // Over bytes, é is two edits and drags a near-identical pair under the bar.
        assert!(ratio("wymaga sprawdzenia", "wymaga sprawdzeniá") > 0.9);
    }

    #[test]
    fn a_short_word_becoming_a_long_one_is_still_the_same_sentence() {
        // Edit distance scores this 0.57 and loses the translation. The whole
        // reason this is a subsequence ratio rather than a distance.
        assert!(ratio("read my CV", "read my resume") > 0.6);
    }
}
