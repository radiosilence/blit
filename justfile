# blit — blit.cc, generated in Rust and served as HTML, CSS and a font

dist := "dist"
# Tailwind's output is an input to generate, which rewrites it; keeping it out of
# dist gives that rewrite a fixed input and leaves dist owned by generate alone.
build_dir := ".build"
image := "ghcr.io/radiosilence/blit"
# Both architectures come out of one build. Nothing in the image is
# architecture-specific — dist/ is bytes and the base image is already a manifest
# list — so there is no RUN for qemu to emulate and no second compile to parallelise.
platforms := "linux/amd64,linux/arm64"
# Debug builds compile several times faster, which is what the watch loop wants.
# CI sets CI=true and gets an optimised binary.
profile := if env("CI", "") != "" { "--release" } else { "" }

_default:
    @just --list

# Generate the whole site into dist/
build: generate

# Depends on css because it hashes the compiled stylesheet into its filename.
[doc("Render every locale × page to dist/")]
generate: css
    cargo run {{ profile }} --quiet --bin blit

# Compile Tailwind
css: _plugins
    tailwindcss --input src/styles/app.css --output {{ build_dir }}/style.css --minify

# Tailwind resolves `@plugin "@tailwindcss/typography"` through node_modules beside
# the stylesheet, and the plugin is a mise tool rather than a project dependency.
# A symlink lets the stylesheet keep saying what it means without a package.json.
_plugins:
    @test -L node_modules || ln -sfn "$(mise where npm:@tailwindcss/typography)/node_modules" node_modules

# nano-web is the server the image runs, so dev resolves URLs exactly as production
# does; --dev drops the year-long caching it serves with, so a rebuild is picked up.
# It is not in mise.toml, which pins what the build needs, and nothing in
# `just build` or CI touches a server.
[doc("Rebuild on change, serve on :3000")]
dev:
    #!/usr/bin/env bash
    set -euo pipefail
    if ! command -v nano-web >/dev/null; then
        echo "nano-web is not on PATH. It serves dist/ for \`just dev\` and is not part of" >&2
        echo "the build toolchain, so it is not pinned in mise.toml." >&2
        echo "https://github.com/radiosilence/nano-web" >&2
        exit 1
    fi
    trap 'kill $(jobs -p) 2>/dev/null' EXIT
    nano-web serve {{ dist }} --port 3000 --dev &
    # Catalogues are written through a .tmp beside them, which is not a change.
    watchexec --watch crates --watch generator --watch src --ignore '*.tmp' -- just dev-build

# Kept out of `build` because extraction writes to src/, and a CI build that
# mutates its own input leaves a dirty tree. The watch loop sees the catalogues it
# writes, and settles because an unchanged catalogue is not rewritten.
[doc("Sync catalogues then build; dev only, since it writes to src/")]
dev-build: i18n-sync build

# Remove generated output
clean:
    rm -rf {{ dist }} {{ build_dir }} target

# Extract messages from the templates into every catalogue
i18n-sync:
    cargo run --quiet --bin blit-i18n

# Lint with clippy
lint:
    cargo clippy --workspace --all-targets -- -D warnings

# Format with rustfmt
fmt:
    cargo fmt --all

# Check formatting
fmt-check:
    cargo fmt --all --check

# Run the test suite
test:
    cargo test --workspace

# Lint, formatting, tests, the workflows and the changelog
check: lint fmt-check test changelog-check
    actionlint

# Fetches the advisory database, so it is kept out of `check`, which works offline.
# Ignores live in deny.toml, where the CI job and the weekly run both read them.
[doc("Check Cargo.lock against the RustSec advisory database")]
audit:
    cargo deny check advisories

# Everything CI verifies: checks, the advisory audit, then a full build
ci: check audit build

# Install the git hooks
hooks:
    lefthook install

# Write CHANGELOG.md from changelog.d/. `just changelog --stdout` prints it instead.
changelog *args:
    python3 scripts/changelog.py {{ args }}

# A pull request adds fragments without regenerating CHANGELOG.md, so usually only
# the fragments and the numbered sections are checked. A commit that does write it,
# as cutting a numbered section does, must write exactly what the fragments make.
# HEAD^1 is the base branch on a pull request's merge commit and the previous
# commit on main, so CI checks out two commits.
[doc("Check the changelog fragments, and CHANGELOG.md where the last commit writes it")]
changelog-check:
    #!/usr/bin/env bash
    set -euo pipefail
    python3 -m unittest scripts/test_changelog.py
    if git rev-parse -q --verify HEAD^1 >/dev/null && ! git diff --quiet HEAD^1 HEAD -- CHANGELOG.md; then
        python3 scripts/changelog.py --check
    else
        python3 scripts/changelog.py --lint
    fi

# Build the site, then its container image. PUSH=true pushes it.
docker-build: build docker-image

# dist/ is the whole build context, so CI builds the site in one job and the image
# from its artefact in another. It pushes IMAGE:<full sha>, which nothing deploys;
# docker-promote adds the tags the deployment reads once the commit has passed.
#
# SHA defaults to HEAD. CI supplies it, because on a pull_request the checked-out
# HEAD is a merge commit that nothing downstream knows about. CACHE_FROM and
# CACHE_TO point buildx at a shared cache; unset, it uses the local one. PUSH is
# compared as a string because GitHub expressions render booleans as "true"/"false".
#
# --platform only applies to a push: a manifest list is a registry object, and
# --load has nowhere to put one, so a local build takes the host's architecture,
# which is the only one you could run anyway.
[doc("Build the container image from an existing dist/. PUSH=true pushes it.")]
docker-image:
    #!/usr/bin/env bash
    set -euo pipefail
    sha=${SHA:-$(git rev-parse HEAD)}
    args=(
        --file Dockerfile
        --tag "{{ image }}:$sha"
        --label "org.opencontainers.image.revision=$sha"
        --label "org.opencontainers.image.created=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
        --label "org.opencontainers.image.version=sha-${sha:0:7}"
    )
    if [ -n "${CACHE_FROM:-}" ]; then args+=(--cache-from "$CACHE_FROM"); fi
    if [ -n "${CACHE_TO:-}" ]; then args+=(--cache-to "$CACHE_TO"); fi
    if [ "${PUSH:-}" = true ]; then
        args+=(--platform {{ platforms }} --push)
    else
        args+=(--load)
    fi
    docker buildx build {{ dist }} "${args[@]}"

# sha-<short> is what the deployment pins. A retag copies no layers, so what ships
# is byte for byte what was built and checked.
#
# Runs finish out of order, so `latest` moves only forward: not onto a commit behind
# the one it holds now, read from its revision label. A missing tag, a tag without
# the label, or a labelled commit that history no longer leads to (gone, or
# diverged after a force-push) moves it. Any other failure is retried, then fails
# the recipe: moving on a guess can put `latest` behind.
[doc("Tag the pushed IMAGE:<sha> as sha-<short>, and as latest unless latest is newer")]
docker-promote:
    #!/usr/bin/env bash
    set -euo pipefail
    image={{ image }}
    sha=${SHA:-$(git rev-parse HEAD)}
    tag=sha-${sha:0:7}
    tmp=$(mktemp -d)
    attempt() {
        for n in 1 2 3; do
            "$@" && return 0
            sleep $((n * 10))
        done
        return 1
    }
    read_tag() {
        if docker buildx imagetools inspect "$image:latest" --format '{{{{json .Image}}' > "$tmp/tag.json" 2> "$tmp/tag.err"; then
            held=$(jq -r '[.. | objects | .config.Labels?["org.opencontainers.image.revision"]? // empty][0] // empty' "$tmp/tag.json")
        elif grep -qF "$image:latest: not found" "$tmp/tag.err"; then
            held=
        else
            cat "$tmp/tag.err" >&2
            return 1
        fi
    }
    compare() {
        if gh api "repos/${image#ghcr.io/}/compare/$held...$sha" --jq .status > "$tmp/compare.out" 2> "$tmp/compare.err"; then
            status=$(cat "$tmp/compare.out")
        elif grep -q 'HTTP 404' "$tmp/compare.err"; then
            status=gone
        else
            cat "$tmp/compare.err" >&2
            return 1
        fi
    }
    attempt read_tag || { echo "cannot read $image:latest" >&2; exit 1; }
    tags=(--tag "$image:$tag" --tag "$image:latest")
    if [ -n "$held" ] && [ "$held" != "$sha" ]; then
        attempt compare || { echo "cannot compare $held with $sha" >&2; exit 1; }
        case "$status" in
            ahead) ;;
            gone|diverged) echo "latest holds $held, which history no longer leads to ($status); moving it" ;;
            *)
                echo "latest holds $held, which $tag does not descend from ($status); leaving it"
                tags=(--tag "$image:$tag")
                ;;
        esac
    fi
    docker buildx imagetools create "${tags[@]}" "$image:$sha"

# This says a build exists; what a version is, where the pin lives and how to write
# it belong to the deployment. Its updater resolves this branch's head to the tag
# docker-promote wrote and moves the pin from there. GH_TOKEN needs `actions: write`
# on the deployment repository.
[doc("Ask the jaritanet deployment to pick up the newest build")]
deploy-update:
    gh workflow run update-apps.yml --repo radiosilence/jaritanet
    @echo "asked radiosilence/jaritanet to update; it resolves this branch's head itself"
