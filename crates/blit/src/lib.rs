//! blit.cc as an application: routes answered by pages that render templates.
//! The `blit` binary serves it; `blit-prerender` crawls that server into static
//! files; `blit-i18n` keeps the catalogues in step with the templates.

pub mod app;
pub mod assets;
pub mod config;
pub mod cv;
pub mod layout;
pub mod pages;
pub mod routes;
pub mod server;
