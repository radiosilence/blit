//! The HTTP face of the [`App`]: every locale × route at the address the static
//! site has always used, the CV's PDF, the assets at their hashed names, and
//! `/healthz`.
//!
//! `sdo build` crawls this same server into `dist/`, so a page has one way to be
//! rendered: on request.

use std::sync::Arc;
use std::time::Duration;

use axum::Router;
use axum::error_handling::HandleErrorLayer;
use axum::extract::State;
use axum::http::{HeaderName, HeaderValue, StatusCode, header};
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use tower::limit::GlobalConcurrencyLimitLayer;
use tower::{BoxError, ServiceBuilder};
use tower_http::catch_panic::CatchPanicLayer;
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::set_header::SetResponseHeaderLayer;
use tower_http::timeout::TimeoutLayer;

use crate::app::App;
use crate::config::{LOCALES, Locale};
use crate::routes::{CV_PDF, ROUTES, Route, url};

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

/// What a page may be cached for. A page's address never carries a hash, so
/// it is cached for the same hour as any other unhashed name.
const HOUR: &str = sando::HOUR;

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

    // An unhashed name, so served for an hour rather than a year.
    let assets = app.assets.service();
    let router = router
        .route(CV_PDF, get(cv_pdf))
        .fallback_service(assets)
        .with_state(app);
    perimeter(router)
}

/// §7's perimeter, innermost first, and §8's headers.
///
/// `Router::layer` wraps each route separately, so the in-flight limit is a
/// [`GlobalConcurrencyLimitLayer`], whose one semaphore every route shares; a
/// plain `concurrency_limit` would give each of the ~145 routes 64 slots of its
/// own.
fn perimeter(router: Router) -> Router {
    router
        .layer(CatchPanicLayer::new())
        .layer(RequestBodyLimitLayer::new(BODY_LIMIT))
        .layer(TimeoutLayer::with_status_code(
            StatusCode::SERVICE_UNAVAILABLE,
            REQUEST_TIMEOUT,
        ))
        .layer(
            ServiceBuilder::new()
                .layer(HandleErrorLayer::new(|_: BoxError| async {
                    StatusCode::SERVICE_UNAVAILABLE
                }))
                .load_shed()
                .layer(GlobalConcurrencyLimitLayer::new(IN_FLIGHT)),
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

async fn cv_pdf(State(app): State<Arc<App>>) -> Response {
    (
        [
            (header::CONTENT_TYPE, "application/pdf"),
            (header::CACHE_CONTROL, HOUR),
        ],
        app.cv_pdf.clone(),
    )
        .into_response()
}

#[cfg(test)]
mod tests {
    use std::path::Path;
    use std::sync::Arc;

    use axum::body::Body;
    use axum::http::{Request, StatusCode, header};
    use axum::response::Response;
    use tower::ServiceExt as _;

    use super::{IN_FLIGHT, perimeter, router};
    use crate::app::App;

    /// The site with its assets published as `sdo` publishes them, and a
    /// stylesheet standing in for Tailwind's. The directory is served from
    /// for as long as the caller holds it.
    fn app() -> (Arc<App>, tempfile::TempDir) {
        let root = Path::new(env!("CARGO_MANIFEST_DIR"));
        let staging = tempfile::tempdir().expect("a staging directory");
        for entry in std::fs::read_dir(root.join("assets")).expect("the assets") {
            let path = entry.expect("an asset").path();
            std::fs::copy(
                &path,
                staging.path().join(path.file_name().expect("a name")),
            )
            .expect("staging an asset");
        }
        let css = r#"@font-face{src:url("/geist-mono.woff2")}"#;
        std::fs::write(staging.path().join("style.css"), css).expect("staging the stylesheet");
        let published = tempfile::tempdir().expect("a published directory");
        let fixed = ["favicon.ico".to_owned(), "robots.txt".to_owned()];
        let options = sando::pipeline::Options {
            fixed: &fixed,
            origin: None,
        };
        sando::pipeline::publish(staging.path(), published.path(), options)
            .expect("the assets publish");
        let assets = sando::Assets::open(published.path()).expect("the manifest reads");
        let app = Arc::new(App::load(root, assets).expect("the site loads"));
        (app, published)
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
        let (app, _published) = app();
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
        let (app, _published) = app();
        for path in ["/", "/cv", "/cv/", "/ja-JP", "/ja-JP/", "/ja-JP/cv"] {
            assert_eq!(get(&app, path).await.status(), StatusCode::OK, "{path}");
        }
    }

    #[tokio::test]
    async fn assets_answer_only_at_their_published_name() {
        let (app, _published) = app();
        let response = get(&app, &app.assets.href("logo.png")).await;
        assert_eq!(response.status(), StatusCode::OK);
        assert_eq!(
            response.headers()[header::CACHE_CONTROL],
            "public, max-age=31536000, immutable"
        );
        assert_eq!(get(&app, "/logo.png").await.status(), StatusCode::NOT_FOUND);
        let pdf = get(&app, "/cv.pdf").await;
        assert_eq!(pdf.status(), StatusCode::OK);
        assert_eq!(pdf.headers()[header::CACHE_CONTROL], "public, max-age=3600");
    }

    #[tokio::test]
    async fn a_request_past_the_in_flight_limit_is_shed_across_routes() {
        use std::sync::atomic::{AtomicUsize, Ordering};
        use std::time::Duration;

        use axum::Router;
        use axum::routing::get;
        use tokio::sync::Semaphore;

        let gate = Arc::new(Semaphore::new(0));
        let entered = Arc::new(AtomicUsize::new(0));
        let mut routes = Router::new();
        for n in 0..=IN_FLIGHT {
            let (gate, entered) = (gate.clone(), entered.clone());
            routes = routes.route(
                &format!("/{n}"),
                get(move || async move {
                    entered.fetch_add(1, Ordering::SeqCst);
                    let _held = gate.acquire().await.expect("the gate stays open");
                    "done"
                }),
            );
        }
        let router = perimeter(routes);

        let held: Vec<_> = (0..IN_FLIGHT)
            .map(|n| {
                let request = Request::get(format!("/{n}")).body(Body::empty());
                tokio::spawn(router.clone().oneshot(request.expect("a valid request")))
            })
            .collect();
        tokio::time::timeout(Duration::from_secs(5), async {
            while entered.load(Ordering::SeqCst) < IN_FLIGHT {
                tokio::task::yield_now().await;
            }
        })
        .await
        .expect("every held request reaches its handler");

        let shed = router
            .clone()
            .oneshot(
                Request::get(format!("/{IN_FLIGHT}"))
                    .body(Body::empty())
                    .expect("a valid request"),
            )
            .await
            .expect("the router is infallible");
        assert_eq!(
            shed.status(),
            StatusCode::SERVICE_UNAVAILABLE,
            "a request on a route of its own still counts against the shared limit"
        );

        gate.add_permits(IN_FLIGHT);
        for request in held {
            let response = request
                .await
                .expect("the task completes")
                .expect("infallible");
            assert_eq!(response.status(), StatusCode::OK);
        }
    }

    #[tokio::test]
    async fn healthz_answers_ok() {
        let (app, _published) = app();
        assert_eq!(get(&app, "/healthz").await.status(), StatusCode::OK);
    }
}
