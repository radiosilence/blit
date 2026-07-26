/**
 * Build, check and publish blit.cc.
 */
import {
  argument,
  Container,
  dag,
  Directory,
  func,
  object,
  type Platform,
  Secret,
  Service,
} from "@dagger.io/dagger";

const BASE = "ghcr.io/radiosilence/nano-web:latest";
const IMAGE = "ghcr.io/radiosilence/blit";

const ACCOUNT = "radiosilence";
const PROJECT = "blit";
const DEPLOY_REPO = "jaritanet";
const DEPLOY_BRANCH = "main";
const DEPLOY_CONFIG = "packages/infra/Pulumi.main.yaml";

// k8s nodes are amd64; without this a call from an arm64 Mac would push arm64.
const PLATFORM = "linux/amd64" as Platform;

// Matches docker/metadata-action's type=sha, which the deployment config expects.
const tag = (sha: string) => `sha-${sha.slice(0, 7)}`;

@object()
export class Blit {
  source: Directory;

  constructor(
    @argument({
      defaultPath: "/",
      // Replaces .dockerignore. Also what lets the dependency layer survive the
      // full-source overlay: the source carries no node_modules to clobber it.
      ignore: ["**/node_modules", "dist", ".git", ".task", "dagger/sdk", ".claude"],
    })
    source: Directory,
  ) {
    this.source = source;
  }

  /**
   * Node and aube per mise.toml, with dependencies installed.
   */
  @func()
  deps(): Container {
    return (
      dag
        .container()
        .from("ghcr.io/jdx/mise:latest")
        .withEnvVariable("MISE_DATA_DIR", "/mise")
        .withEnvVariable("PATH", "/mise/shims:/src/node_modules/.bin:$PATH", { expand: true })
        .withWorkdir("/src")
        .withFile("/src/mise.toml", this.source.file("mise.toml"))
        .withExec(["mise", "install"])
        // Manifests before sources: editing a template must not reinstall the world.
        .withFile("/src/package.json", this.source.file("package.json"))
        .withFile("/src/aube-lock.yaml", this.source.file("aube-lock.yaml"))
        .withFile("/src/aube-workspace.yaml", this.source.file("aube-workspace.yaml"))
        .withMountedCache("/root/.cache/aube", dag.cacheVolume("aube"))
        .withExec(["aube", "install", "--frozen-lockfile"])
        .withDirectory("/src", this.source)
    );
  }

  /**
   * The generated site.
   */
  @func()
  build(): Directory {
    return (
      this.deps()
        // generate.ts digests the compiled stylesheet into its URL, so css comes first.
        .withExec([
          "tailwindcss",
          "--input",
          "src/styles/app.css",
          "--output",
          "dist/style.css",
          "--minify",
        ])
        .withExec(["node", "scripts/generate.ts"])
        .withExec(["cp", "-R", "src/static/.", "dist/"])
        .directory("/src/dist")
    );
  }

  @func()
  async lint(): Promise<string> {
    return this.deps().withExec(["oxlint"]).stdout();
  }

  @func()
  async typecheck(): Promise<string> {
    return this.deps().withExec(["tsc", "--noEmit"]).stdout();
  }

  @func()
  async formatCheck(): Promise<string> {
    return this.deps().withExec(["oxfmt", "--check"]).stdout();
  }

  /**
   * Lint, typecheck and format check, concurrently.
   */
  @func()
  async check(): Promise<string> {
    const results = await Promise.all([this.lint(), this.typecheck(), this.formatCheck()]);
    return results.join("\n");
  }

  /**
   * The deployable image: the site layered onto nano-web.
   */
  @func()
  image(): Container {
    return dag
      .container({ platform: PLATFORM })
      .from(BASE)
      .withDirectory("/public", this.build())
      .withEnvVariable("PORT", "3000")
      .withExposedPort(3000);
  }

  /**
   * The image, running. Identical to what gets pushed.
   */
  @func()
  serve(): Service {
    return this.image().asService({ useEntrypoint: true });
  }

  /**
   * The working tree, formatted. Export over the source to apply.
   */
  @func()
  format(): Directory {
    return this.deps()
      .withExec(["oxfmt", "--write"])
      .directory("/src")
      .withoutDirectory("node_modules")
      .withoutDirectory("dist");
  }

  /**
   * src/, with every catalogue synced against the source locale and the
   * MessageKey union regenerated. Export over src/ to apply.
   */
  @func()
  syncLocales(): Directory {
    return this.deps().withExec(["node", "scripts/sync-locales.ts"]).directory("/src/src");
  }

  /**
   * Push to ghcr, returning the digest-pinned reference.
   */
  @func()
  async publish(sha: string, token: Secret): Promise<string> {
    // Labels live here rather than on image() so the sha can't bust its cache.
    const image = this.image()
      .withLabel("org.opencontainers.image.source", `https://github.com/${ACCOUNT}/${PROJECT}`)
      .withLabel("org.opencontainers.image.revision", sha)
      .withLabel("org.opencontainers.image.title", PROJECT)
      .withRegistryAuth("ghcr.io", ACCOUNT, token);

    const ref = await image.publish(`${IMAGE}:${tag(sha)}`);
    await image.publish(`${IMAGE}:latest`);
    return ref;
  }

  /**
   * Publish, then point the deployment config at the new tag.
   *
   * Dagger's git API is read-only, so the push is a plain git invocation in a
   * container — the one step the engine can neither model nor cache. dryRun
   * stops short of it and returns the diff instead, which is what makes this
   * safe to run locally against the real repository.
   */
  @func()
  async deploy(
    sha: string,
    ghcrToken: Secret,
    deployToken: Secret,
    dryRun = false,
  ): Promise<string> {
    const ref = await this.publish(sha, ghcrToken);

    const repo = dag
      .container()
      .from("alpine/git:latest")
      .withExec(["apk", "add", "--no-cache", "yq"])
      .withDirectory(
        "/repo",
        dag
          .git(`https://github.com/${ACCOUNT}/${DEPLOY_REPO}`)
          .withAuthToken(deployToken)
          .branch(DEPLOY_BRANCH)
          .tree(),
      )
      .withWorkdir("/repo")
      .withExec([
        "yq",
        "eval",
        `(.config."jaritanet:services".${PROJECT}.args.image.tag) = "${tag(sha)}"`,
        "-i",
        DEPLOY_CONFIG,
      ])
      .withExec([
        "yq",
        "eval",
        `(.config."jaritanet:services".${PROJECT}.args.httpPort) = 3000`,
        "-i",
        DEPLOY_CONFIG,
      ]);

    if (dryRun) return `${ref}\n\n${await repo.withExec(["git", "diff"]).stdout()}`;

    const pushed = repo
      .withSecretVariable("DEPLOY_TOKEN", deployToken)
      .withExec(["git", "config", "user.name", "github-actions[bot]"])
      .withExec(["git", "config", "user.email", "github-actions[bot]@users.noreply.github.com"])
      // Redeploying an unchanged sha leaves nothing staged, which git treats as an
      // error. The token is expanded by the shell here, so it never lands in a layer.
      .withExec([
        "sh",
        "-c",
        `git diff --quiet -- ${DEPLOY_CONFIG} && exit 0
         git add ${DEPLOY_CONFIG}
         git commit -m "🚀 Update ${PROJECT} service to ${tag(sha)}"
         git push https://x-access-token:$DEPLOY_TOKEN@github.com/${ACCOUNT}/${DEPLOY_REPO} HEAD:${DEPLOY_BRANCH}`,
      ]);

    await pushed.sync();
    return ref;
  }
}
