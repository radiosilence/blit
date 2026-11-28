//! Writes Sando.toml's site, locales and fuzzy policy as constants for
//! `config.rs`.

fn main() {
    if let Err(error) = sando::build::configure() {
        panic!("{error}");
    }
}
