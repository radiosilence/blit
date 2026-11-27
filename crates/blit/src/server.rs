//! The HTTP face of the [`App`]: every locale × route at the address the static
//! site has always used, the assets at their hashed names, and `/healthz`.
//!
//! The server and the prerender both use [`router`], so a page has one way to be
//! rendered: on request.

use std::sync::Arc;
use std::time::Duration;

use axum::Router;
use axum::error_handling::HandleErrorLayer;
use axum::extract::{Path, State};
use axum::http::{HeaderName, HeaderValue, StatusCode, header};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use tower::{BoxError, ServiceBuilder};
use tower_http::catch_panic::CatchPanicLayer;
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::set_header::SetResponseHeaderLayer;
use tower_http::timeout::TimeoutLayer;

use crate::app::App;
use crate::config::{LOCALES, Locale};
use crate::routes::{ROUTES, Route, url};

/// Every request is a GET of a page or a file, so nothing needs a body.
const BODY_LIMIT: usize = 2 * 1024 * 1024;
const REQUEST_TIMEOUT: Duration = Duration::from_secs(30);
/// A page renders in well under a millisecond; this many at once is a flood.
const IN_FLIGHT: usize = 64;

/// The standard's policy (§8). The site loads no script, so `script-src` stays
/// `'self'` with nothing added.
const CSP: &str = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; \
    font-src 'self'; connect-src 'self'; form-action 'self'; frame-ancestors 'none'; \
    base-uri 'none'; object-src 'none'";

/// Hashed names never change their bytes; anything else may.
const IMMUTABLE: &str = "public, max-age=31536000, immutable";
const HOUR: &str = "public, max-age=3600";

pub fn router(app: Arc<App>) -> Router {
    let mut router = Router::new().route("/healthz", get(|| async { "ok" }));

    for locale in LOCALES {
        for route in ROUTES {
            let path = url(locale.code, route.slug);
            let handler = get(move |State(app): State<Arc<App>>| page(app, locale, route));
            // nano-web answers `/cv/` as `/cv`, so this does too.
            if path != "/" {
                router = router.route(&format!("{path}/"), handler.clone());
            }
            router = router.route(&path, handler);
        }
    }

    router
        .route("/{file}", get(asset))
        .with_state(app)
        // Innermost first, as §7 orders the perimeter.
        .layer(CatchPanicLayer::new())
        .layer(RequestBodyLimitLayer::new(BODY_LIMIT))
        .layer(TimeoutLayer::with_status_code(
            StatusCode::REQUEST_TIMEOUT,
            REQUEST_TIMEOUT,
        ))
        .layer(
            ServiceBuilder::new()
                .layer(HandleErrorLayer::new(|_: BoxError| async {
                    StatusCode::SERVICE_UNAVAILABLE
                }))
                .load_shed()
                .concurrency_limit(IN_FLIGHT),
        )
        .layer(header_layer(header::CONTENT_SECURITY_POLICY, CSP))
        .layer(header_layer(header::X_CONTENT_TYPE_OPTIONS, "nosniff"))
        .layer(header_layer(header::X_FRAME_OPTIONS, "DENY"))
        .layer(header_layer(header::REFERRER_POLICY, "no-referrer"))
}

fn header_layer(name: HeaderName, value: &'static str) -> SetResponseHeaderLayer<HeaderValue> {
    SetResponseHeaderLayer::overriding(name, HeaderValue::from_static(value))
}

async fn page(app: Arc<App>, locale: &'static Locale, route: &'static Route) -> Response {
    match app.render(locale, route) {
        Ok(html) => (
            [
                (header::CONTENT_TYPE, "text/html; charset=utf-8"),
                (header::CACHE_CONTROL, HOUR),
            ],
            html,
        )
            .into_response(),
        Err(e) => {
            tracing::error!(locale = locale.code, slug = route.slug, "rendering: {e:#}");
            (StatusCode::INTERNAL_SERVER_ERROR, "internal error").into_response()
        }
    }
}

async fn asset(State(app): State<Arc<App>>, Path(file): Path<String>) -> Response {
    let Some((body, hashed)) = app.assets.get(&file) else {
        return (StatusCode::NOT_FOUND, "not found").into_response();
    };
    (
        [
            (header::CONTENT_TYPE, content_type(&file)),
            (header::CACHE_CONTROL, if hashed { IMMUTABLE } else { HOUR }),
        ],
        body.to_vec(),
    )
        .into_response()
}

fn content_type(file: &str) -> &'static str {
    match file.rsplit_once('.').map(|(_, ext)| ext) {
        Some("css") => "text/css; charset=utf-8",
        Some("json") => "application/manifest+json",
        Some("png") => "image/png",
        Some("ico") => "image/x-icon",
        Some("woff2") => "font/woff2",
        Some("pdf") => "application/pdf",
        Some("txt") => "text/plain; charset=utf-8",
        _ => "application/octet-stream",
    }
}

#[cfg(test)]
mod tests {
    use std::path::Path;
    use std::sync::Arc;

    use axum::body::Body;
    use axum::http::{Request, StatusCode, header};
    use axum::response::Response;
    use tower::ServiceExt as _;

    use super::router;
    use crate::app::App;

    fn app() -> Arc<App> {
        let css = r#"@font-face{src:url("/geist-mono.woff2")}"#;
        Arc::new(App::load(Path::new(env!("CARGO_MANIFEST_DIR")), css).expect("the site loads"))
    }

    async fn get(app: &Arc<App>, path: &str) -> Response {
        router(app.clone())
            .oneshot(
                Request::get(path)
                    .body(Body::empty())
                    .expect("a valid request"),
            )
            .await
            .expect("the router is infallible")
    }

    #[tokio::test]
    async fn every_response_carries_the_security_headers() {
        let app = app();
        for path in ["/", "/fr-FR/cv", "/robots.txt", "/nowhere"] {
            let response = get(&app, path).await;
            for name in [
                header::CONTENT_SECURITY_POLICY,
                header::X_CONTENT_TYPE_OPTIONS,
                header::X_FRAME_OPTIONS,
                header::REFERRER_POLICY,
            ] {
                assert!(
                    response.headers().contains_key(&name),
                    "{path} lacks {name}"
                );
            }
        }
    }

    #[tokio::test]
    async fn pages_answer_with_and_without_a_trailing_slash() {
        let app = app();
        for path in ["/", "/cv", "/cv/", "/ja-JP", "/ja-JP/", "/ja-JP/cv"] {
            assert_eq!(get(&app, path).await.status(), StatusCode::OK, "{path}");
        }
    }

    #[tokio::test]
    async fn assets_answer_only_at_their_published_name() {
        let app = app();
        let response = get(&app, &app.assets.href("logo.png")).await;
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response.headers()[header::CACHE_CONTROL],
            "public, max-age=31536000, immutable"
        );
        assert_eq!(get(&app, "/logo.png").await.status(), StatusCode::NOT_FOUND);
        assert_eq!(get(&app, "/cv.pdf").await.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn healthz_answers_ok() {
        assert_eq!(get(&app(), "/healthz").await.status(), StatusCode::OK);
    }
}
