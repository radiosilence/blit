// Build, check and publish blit.cc.
package main

import (
	"context"
	"fmt"
	"strings"
	"sync"

	"dagger/blit/internal/dagger"
)

const (
	base    = "ghcr.io/radiosilence/nano-web:latest"
	image   = "ghcr.io/radiosilence/blit"
	account = "radiosilence"
	project = "blit"

	deployRepo   = "jaritanet"
	deployBranch = "main"
	deployConfig = "packages/infra/Pulumi.main.yaml"

	// k8s nodes are amd64; without this a call from an arm64 Mac would push arm64.
	platform = dagger.Platform("linux/amd64")
)

// Matches docker/metadata-action's type=sha, which the deployment config expects.
func tag(sha string) string {
	if len(sha) > 7 {
		sha = sha[:7]
	}
	return "sha-" + sha
}

type Blit struct {
	// +private
	Source *dagger.Directory
}

func New(
	// +defaultPath="/"
	// Replaces .dockerignore. Also what lets the dependency layer survive the
	// full-source overlay: the source carries no node_modules to clobber it.
	// +ignore=["**/node_modules","dist",".git",".task","dagger/internal","dagger/dagger.gen.go",".claude"]
	source *dagger.Directory,
) *Blit {
	return &Blit{Source: source}
}

// Node and aube per mise.toml, with dependencies installed.
func (m *Blit) Deps() *dagger.Container {
	return dag.Container().
		From("ghcr.io/jdx/mise:latest").
		WithEnvVariable("MISE_DATA_DIR", "/mise").
		WithEnvVariable("PATH", "/mise/shims:/src/node_modules/.bin:$PATH", dagger.ContainerWithEnvVariableOpts{Expand: true}).
		WithWorkdir("/src").
		WithFile("/src/mise.toml", m.Source.File("mise.toml")).
		WithExec([]string{"mise", "install"}).
		// Manifests before sources: editing a template must not reinstall the world.
		WithFile("/src/package.json", m.Source.File("package.json")).
		WithFile("/src/aube-lock.yaml", m.Source.File("aube-lock.yaml")).
		WithFile("/src/aube-workspace.yaml", m.Source.File("aube-workspace.yaml")).
		WithMountedCache("/root/.cache/aube", dag.CacheVolume("aube")).
		WithExec([]string{"aube", "install", "--frozen-lockfile"}).
		// Fonts and icons are merged into the output directly, so keeping them out
		// here means changing one does not invalidate the generator.
		WithDirectory("/src", m.Source.WithoutDirectory("src/static"))
}

// The generated site.
func (m *Blit) Build() *dagger.Directory {
	rendered := m.Deps().
		// generate.ts digests the compiled stylesheet into its URL, so css comes first.
		WithExec([]string{"tailwindcss", "--input", "src/styles/app.css", "--output", "dist/style.css", "--minify"}).
		WithExec([]string{"node", "scripts/generate.ts"}).
		Directory("/src/dist")

	return rendered.WithDirectory(".", m.Source.Directory("src/static"))
}

func (m *Blit) Lint(ctx context.Context) (string, error) {
	return m.Deps().WithExec([]string{"oxlint"}).Stdout(ctx)
}

func (m *Blit) Typecheck(ctx context.Context) (string, error) {
	return m.Deps().WithExec([]string{"tsc", "--noEmit"}).Stdout(ctx)
}

func (m *Blit) FormatCheck(ctx context.Context) (string, error) {
	return m.Deps().WithExec([]string{"oxfmt", "--check"}).Stdout(ctx)
}

// Whether the module itself is gofmt-clean. oxfmt does not read Go, so without
// this the build definition would be the only unchecked code in the repository.
func (m *Blit) GofmtCheck(ctx context.Context) (string, error) {
	out, err := dag.Container().
		From("golang:1.26-alpine").
		WithMountedDirectory("/mod", m.Source.Directory("dagger")).
		WithWorkdir("/mod").
		WithExec([]string{"gofmt", "-l", "."}).
		Stdout(ctx)
	if err != nil {
		return "", err
	}
	if strings.TrimSpace(out) != "" {
		return "", fmt.Errorf("gofmt: needs formatting:\n%s", out)
	}
	return "gofmt clean", nil
}

// Lint, typecheck and format check, concurrently.
func (m *Blit) Check(ctx context.Context) (string, error) {
	checks := []func(context.Context) (string, error){
		m.Lint, m.Typecheck, m.FormatCheck, m.GofmtCheck,
	}

	out := make([]string, len(checks))
	errs := make([]error, len(checks))

	var wg sync.WaitGroup
	for i, check := range checks {
		wg.Add(1)
		go func() {
			defer wg.Done()
			out[i], errs[i] = check(ctx)
		}()
	}
	wg.Wait()

	for _, err := range errs {
		if err != nil {
			return "", err
		}
	}
	return strings.Join(out, "\n"), nil
}

// The deployable image: the site layered onto nano-web.
func (m *Blit) Image() *dagger.Container {
	return dag.Container(dagger.ContainerOpts{Platform: platform}).
		From(base).
		WithDirectory("/public", m.Build()).
		WithEnvVariable("PORT", "3000").
		WithExposedPort(3000)
}

// The image, running. Identical to what gets pushed.
func (m *Blit) Serve() *dagger.Service {
	return m.Image().AsService(dagger.ContainerAsServiceOpts{UseEntrypoint: true})
}

// The working tree, formatted. Export over the source to apply.
func (m *Blit) Format() *dagger.Directory {
	return m.Deps().
		WithExec([]string{"oxfmt", "--write"}).
		Directory("/src").
		WithoutDirectory("node_modules").
		WithoutDirectory("dist")
}

// src/, with every catalogue synced against the source locale and the
// MessageKey union regenerated. Export over src/ to apply.
func (m *Blit) SyncLocales() *dagger.Directory {
	return m.Deps().
		WithExec([]string{"node", "scripts/sync-locales.ts"}).
		Directory("/src/src")
}

// Push to ghcr, returning the digest-pinned reference.
func (m *Blit) Publish(ctx context.Context, sha string, token *dagger.Secret) (string, error) {
	// Labels live here rather than on Image() so the sha cannot bust its cache.
	img := m.Image().
		WithLabel("org.opencontainers.image.source", "https://github.com/"+account+"/"+project).
		WithLabel("org.opencontainers.image.revision", sha).
		WithLabel("org.opencontainers.image.title", project).
		WithRegistryAuth("ghcr.io", account, token)

	ref, err := img.Publish(ctx, image+":"+tag(sha))
	if err != nil {
		return "", err
	}
	if _, err := img.Publish(ctx, image+":latest"); err != nil {
		return "", err
	}
	return ref, nil
}

// Publish, then point the deployment config at the new tag.
//
// Dagger's git API is read-only, so the push is a plain git invocation in a
// container — the one step the engine can neither model nor cache. dryRun stops
// short of it and returns the diff instead, which is what makes this safe to run
// locally against the real repository.
func (m *Blit) Deploy(
	ctx context.Context,
	sha string,
	ghcrToken *dagger.Secret,
	deployToken *dagger.Secret,
	// +optional
	dryRun bool,
) (string, error) {
	repo := dag.Container().
		From("alpine/git:latest").
		WithExec([]string{"apk", "add", "--no-cache", "yq"}).
		WithDirectory("/repo", dag.Git(
			"https://github.com/"+account+"/"+deployRepo,
			dagger.GitOpts{HTTPAuthUsername: "x-access-token", HTTPAuthToken: deployToken},
		).Branch(deployBranch).Tree()).
		WithWorkdir("/repo").
		WithExec([]string{"yq", "eval",
			fmt.Sprintf(`(.config."jaritanet:services".%s.args.image.tag) = "%s"`, project, tag(sha)),
			"-i", deployConfig}).
		WithExec([]string{"yq", "eval",
			fmt.Sprintf(`(.config."jaritanet:services".%s.args.httpPort) = 3000`, project),
			"-i", deployConfig})

	// Before publishing, so the flag means what it says: nothing is pushed anywhere.
	if dryRun {
		diff, err := repo.WithExec([]string{"git", "diff"}).Stdout(ctx)
		if err != nil {
			return "", err
		}
		return fmt.Sprintf("would publish %s:%s\n\n%s", image, tag(sha), diff), nil
	}

	ref, err := m.Publish(ctx, sha, ghcrToken)
	if err != nil {
		return "", err
	}

	push := fmt.Sprintf(`git diff --quiet -- %s && exit 0
git add %s
git commit -m "🚀 Update %s service to %s"
git push https://x-access-token:$DEPLOY_TOKEN@github.com/%s/%s HEAD:%s`,
		deployConfig, deployConfig, project, tag(sha), account, deployRepo, deployBranch)

	_, err = repo.
		WithSecretVariable("DEPLOY_TOKEN", deployToken).
		WithExec([]string{"git", "config", "user.name", "github-actions[bot]"}).
		WithExec([]string{"git", "config", "user.email", "github-actions[bot]@users.noreply.github.com"}).
		// Redeploying an unchanged sha leaves nothing staged, which git treats as an
		// error. The token is expanded by the shell here, so it never lands in a layer.
		WithExec([]string{"sh", "-c", push}).
		Sync(ctx)
	if err != nil {
		return "", err
	}
	return ref, nil
}
