//! blit.cc, served: renders each page on request from the same routes the
//! static site is prerendered from (`blit-prerender`).

use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;

use anyhow::{Context as _, Result};
use tokio::sync::Notify;
use tracing_subscriber::EnvFilter;

use blit::app::App;

/// How long a stopping pod keeps serving while the ingress drops its endpoint.
const DRAIN: Duration = Duration::from_secs(5);
/// How long in-flight requests get once it stops accepting, inside the
/// grace period.
const DEADLINE: Duration = Duration::from_secs(10);

/// Read once at start; a malformed value stops the server naming the variable.
struct Config {
    addr: SocketAddr,
}

impl Config {
    fn from_env() -> Result<Self> {
        let addr = match std::env::var("BLIT_ADDR") {
            Ok(value) => value
                .parse()
                .with_context(|| format!("BLIT_ADDR is not an address and port: {value:?}"))?,
            Err(_) => SocketAddr::from(([127, 0, 0, 1], 3000)),
        };
        Ok(Self { addr })
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_writer(std::io::stderr)
        .with_env_filter(
            EnvFilter::try_from_default_env().unwrap_or_else(|_| "blit=info,warn".into()),
        )
        .init();

    let config = Config::from_env()?;
    let app = Arc::new(App::open()?);
    let router = blit::server::router(app);

    let listener = tokio::net::TcpListener::bind(config.addr)
        .await
        .with_context(|| format!("binding {}", config.addr))?;
    tracing::info!(addr = %config.addr, "listening");

    let stopping = Arc::new(Notify::new());
    let server = axum::serve(listener, router).with_graceful_shutdown({
        let stopping = stopping.clone();
        async move {
            shutdown().await;
            stopping.notify_one();
        }
    });

    tokio::select! {
        result = server => result.context("serving")?,
        () = async {
            stopping.notified().await;
            tokio::time::sleep(DEADLINE).await;
        } => tracing::warn!("requests still in flight at the shutdown deadline"),
    }
    Ok(())
}

/// Waits for SIGTERM, then serves on for [`DRAIN`]; or for Ctrl-C, which stops
/// at once.
async fn shutdown() {
    let term = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut signal) => {
                signal.recv().await;
                tracing::info!("SIGTERM: draining");
                tokio::time::sleep(DRAIN).await;
            }
            Err(e) => {
                tracing::warn!("no SIGTERM handler: {e}");
                std::future::pending::<()>().await;
            }
        }
    };
    tokio::select! {
        _ = tokio::signal::ctrl_c() => {}
        () = term => {}
    }
}
