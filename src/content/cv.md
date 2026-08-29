# James Cleveland

senior full stack engineer

**e-mail:** [jc@blit.cc](mailto:jc@blit.cc)<br/>
**github:** [@radiosilence](https://github.com/radiosilence)<br/>
**location:** London, or remote

Polyglot engineer. Writing code for 25 years, professionally for about 19 of them,
across commercial frontend, backend, devops, mobile and embedded.
Elixir and Go services, GraphQL gateways, React and Next.js, native Swift and Kotlin
modules, Rust tooling, Terraform and Kubernetes.

The work I like best is greenfield, and hard technical problems I can own end to end.
I freelanced early and it stuck, so I want to argue about what a thing should be, not
just implement the ticket.

Communicating complex technical solutions to stakeholders and fellow engineers in a way
they can relate to is key to my approach—if people can't understand what's happening,
the most appropriate solution is unlikely to be reached. I've mentored somewhere around
twenty engineers over the years.

Big on declarative infrastructure using CI/CD and IaC. It is one thing to be able to
build something, it's another to be able to reproduce and scale it in a production
environment.

AI and agentic coding are useful tools, like anything else, engineers should be able to
develop the skills to use them expertly, but also understand that they are not
necessarily a panacea, or a substitute for lack of skill. I have embraced AI somewhat,
and have had fun building MCP servers in Rust in order to augment AI's abilities.

As a natural creative, what drives me is a job where I wake up every day and build
something interesting.

## Selected Work

- **Architect and lead engineer of a new Elixir service** replacing the reviews domain in
  Fresha's monolith: ~90M rows migrated, production reads taken from 5% to 100% in two
  days, ~157M requests a week now.
- **A WebSocket server running on the handset**, written in Java and Swift as React
  Native modules, because the TV app it drove was confined to a browser context.
- **[nano-web](https://github.com/radiosilence/nano-web)**—in-memory static file server
  in Rust, 240+ stars, serving this site.
- **Got Microsoft to change Azure Policy**—it could not express a compliance check
  Credit Suisse's CSPM needed.
- **An Android app and the whole AWS backend behind it**—React Native, CDK, Lambda,
  DynamoDB, API Gateway—built from scratch for bike delivery drivers.

## Recent Work

### Senior Full Stack Engineer, [Fresha](https://fresha.com) <small>Jan 2025–Present</small>

<small>
World's largest beauty & wellness marketplace: 1 billion+ appointments, 120k+ partner
businesses across 120+ countries
</small>

_Key Skills: Elixir, Phoenix, Ecto, OTP, gRPC, Protobuf, GraphQL, TypeScript, Next.js,
React Server Components, Zod, PostgreSQL, pgbouncer, Kafka, Datadog, Metabase, LiteLLM,
GitHub Actions, Docker, Kubernetes_

<small>2,021 pull requests authored across 58 repositories, 1,544 merged, 615 more
reviewed for other people, 648 issues written. The first six months of that was before
the company had any AI tooling worth the name.</small>

**Ownership**

- Architect and lead engineer of `app-reviews`, a new Elixir service replacing the
  reviews domain in the legacy monolith. Its own Postgres schema and pgbouncer instance,
  gRPC and protobuf contracts for internal callers, a GraphQL gateway surface, and the
  frontend. 405 pull requests in that repo.
- Delivery owner for Improved Reviews 2026 across web, iOS, Android and backend, until I
  handed delivery over in June 2026 to concentrate on building the service.
- Production owner through the rollout. Reads went from a 5% canary to 100% in two days,
  and I carried the pager for it.
- It runs at around 157M requests a week, roughly 260/s, across its gRPC and GraphQL
  surfaces.
- Agreed the new service boundary with around ten codeowning teams still reading and
  writing the old tables.
- Loyalty platform, the largest B2C release to date and my first project here: gateway
  and frontend mostly, leading the parts I had context on, and picking up Elixir on it.

**Migration and backfill**

- Migrated around 90 million rows: 30.1M reviews, 3.8M replies, 24.7M review to account
  links, 31.2M review to employee links, with parity monitored continuously against the
  legacy source rather than checked once at the end.
- Phased the cutover, reads first and writes second, over a continuous sync process, so
  each stage stayed reversible.
- Built the backfill as a resumable engine: restartable from a given shard with per-shard
  ETAs, incremental `--since` windows, a REPLACE mode for clean historical loads, and
  deterministic reads so a re-run lands the same rows.
- Gave it an adaptive throttle driven by live RDS health with named pacing profiles, a
  statement timeout and a timeout circuit breaker per batch, and per-row error isolation
  so one bad record could not take down a run.
- Dropped Oban for a synchronous batch backfill once the concurrency was doing more harm
  than good.
- Pulled service attribution out of a Snowflake dump, review and reply history out of S3,
  and added a `--patch` dump mode that emits only the discrepancies between source and
  mirror.
- Wrote scoped, idempotent reconciliation: targeted attribution repair for named
  employees, heals windowed to a drift range, and repair for rows a workspace disconnect
  had nulled.
- Traced persistent sync drift to undocumented callers and background processes still
  writing to the old tables. Several weeks finding them one at a time and rebuilding the
  synchronisation around each.
- Found undocumented internal tasks that had been corrupting review data for years; wrote
  healing tasks, supported replacements for the CX team to use instead, and targeted
  backfills per edge case.
- Kept private replies private across the backfill, which the naive path would have
  exposed.

**Events, Kafka and the warehouse**

- Kafka outbox emission on the reviews stream, with the outbox connector rolled through
  staging and production.
- Live mirror of the monolith's writes off the legacy topics, behind an Unleash
  kill-switch, so the new service stayed current while the old one was still authoritative.
- Declared the consumers' dead letter topics, monitored DLQ depth, logged every ingest
  drop, and fixed a failing dead-letter produce that was wedging its own partition.
- Made out-of-order mirror replies warn and skip instead of erroring, gated legacy
  re-emission on publish state, and compensated unpublish.
- Emitted the domain events other teams build on: `location_rating_changed` feeding
  marketplace ranking, `professional_rating_changed`, and reply lifecycle events carrying
  the parent review's body, rating, appointment and customer.
- Stood up the warehouse CDC pipeline: Postgres publication and replica identity, the DB
  connector and Snowpipe sink, `review_services` mirrored across, and poisoned rows
  excluded so one bad record could not stall the connector.

**Postgres and performance**

- Added `review_items`, a unified line-item table with rating and customer mirrored onto
  it, and moved the rating aggregates, facet counts and sorts to read off it.
- Indexed for the actual queries: composite and covering indexes for filtered provider
  reads, a `btree_gin` composite for search, a GIN index for full-text review body
  search, and index predicates instead of query filters where the predicate was the win.
- Narrowed searches to their provider set, bounded common-term search to the ordered page
  index, and read each key's first page under its own LIMIT rather than one wide query.
- Turned the gRPC batch reads O(1) with a windowed `GetReviews`, and documented the
  complexity of each RPC alongside it.
- Tuned autovacuum on the large tables, vacuumed on a fixed insert threshold rather than
  a scale factor, and dropped seven indexes that were dead or prefix-redundant.
- Enabled DBM query metrics, and alerted on Postgres's own signals where Datadog could
  not see what mattered.

**API surfaces**

- Slimmed the gRPC surface to seven RPCs, each with its own scope key.
- Held the GraphQL surface to the org pagination standard, with cost ceilings, hardened
  cursor decoding, `isEditable` redaction, role-based authz on reply mutations, and
  nullable root connection fields so a partial failure degrades instead of blanking the
  page.
- Enforced `schema.graphql` drift in CI, with the check opening its own correcting pull
  request.
- Stitched reviews into the partners gateway: location, provider and appointment onto
  reviews and replies, and the employee and location rating summaries onto their parents.
- Gated schema migrations in CI against the base tip so two branches could not land
  colliding versions.

**AI features**

- Built the AI auto-reply backend end to end: entitlement gate, generator, voice and
  publish worker.
- Draft-first write surface, so a reply is created as a draft with its own read fields and
  then published or cancelled, rather than posting straight to a customer.
- Reply voice built on ElevenLabs, turning a business's own description into the prompt.
- AI moderation pipeline with the strategy selected by flag.
- Review-level tier gating driven by the model's output, the concierge balance read live
  at every billing decision, and quota gating that cancels scheduled replies and stops
  generating drafts rather than failing open.
- 2,343 AI replies published and 129 businesses on full automation in the first weeks
  after launch.
- The partner-facing side of it: an AI replies tab, an Enhance action on partner drafts,
  and a countdown on scheduled replies so a business can cancel before it goes out.

**Correctness**

- Fixed an attribution bug in the redesign instead of carrying it over. The monolith
  credited a review to the employee on the invoice line item rather than whoever performed
  the booking: about 120,000 reviews misattributed all-time, 0.44%, one in 230. The new
  service attributes from the calendar booking.
- Made professional attribution sticky and additive, with one row per account that
  actually performed a line item, sibling attribution preserved across writes, and a
  departed professional's disconnection surfaced on the review instead of silently
  vanishing.
- Stopped a single NUL byte poisoning an entire summaries object.
- Built the moderation and dispute surfaces: a moderations table and its index, rejected
  reviews shown to their author and their venue, every pass audited, and the dispute
  lifecycle migrated in.

**Operations**

- Metabase dashboards diffing old against new, Datadog dashboards with I/O attribution,
  and on-call paging on `reviews-rpc` error rate and latency.
- Got the service booting and staying up in production: PgBouncer CA trust, Bandit socket
  options and IPv6 bind, a `Chart.lock` so the first deploy rendered at all, and a CPU
  ceiling that turned out to be the bug rather than merely tight.
- Progressive canary across all four components, and a health check returning the
  platform's own `:healthy` contract.
- Adopted Torque (sonic-rs) as the JSON standard and moved the images to debian-slim.

**Platform work beyond reviews**

- Fixed correctness and resource bugs in the shared Elixir libraries other teams build on:
  AMQP and Redis connection leaks in health probes, atom table exhaustion in the check
  runner, atom interning on feature flag cache lookups, gRPC 1.0 support in the shared RPC
  client, and the toolchain onto Elixir 1.20.2 / OTP 29.
- Took the shared taxonomy library through CLDR and BCP-47 locale handling, proper
  pluralisation and gettext PO generation, data validation rules, TypeScript codegen, and
  CI codegen that regenerates the source data and opens its own pull request.
- Internal AI platform work: LiteLLM proxy and Langfuse model configuration, content
  moderation keys, and an internal Claude plugin marketplace including a `/ticket` skill
  that takes a ticket through to an opened pull request.
- Wrote the supply chain standard for first-party packages: internal packages carved out
  of the cooldown, exact pins and registry-only, namespace locking kept mandatory.
- Developer tooling across the org: custom ESLint rules for the marketplace codebase,
  JSON schema validation and deployment lock guards in the internal CLI, CODEOWNERS
  validation in CI, fixes to the Tilt local environment, and CI actions including opt-in
  signed commits and a flaky test reporter.

**Frontend and marketplace**

- 503 pull requests in the B2C SPA: the autocomplete rewritten onto the geolocation API
  with search history, infinite scroll and stable keys, map pins and popovers, the venue
  and professional toggle in search filters, the loyalty rewards catalogue and claim
  flow, and amenities and highlights on venue pages.
- 436 in the B2C API gateway: resolver and schema architecture, Zod 4 for validation,
  replacing generated schemas with ones shaped to the domain, converting eager resolvers
  to lazy batched ones, and moving the marketplace's rating badges onto the new service.
- 146 in marketplace search, itself running at around 119M requests a week: type-specific
  paginated autocomplete RPCs, spatial clustering, a batch professionals endpoint,
  location feature filtering and distance sorting.
- Search history as its own service across five dimensions, with recently viewed
  locations and professionals, standalone geolocation history, and Redis failures absorbed
  rather than propagated to the user.
- The B2B Online Reputation surface: KPI strip, reviews histogram, rating and content-type
  filters, the ReviewsV2 data-access foundation, and client-side content moderation.

**People**

- Reviewed 615 pull requests for other people and wrote 648 issues.
- Mentored engineers through complex problems, and worked at product level so technical
  decisions matched what the business needed.

### Senior Full Stack Engineer, [Apolitical](https://apolitical.co) <small>Apr 2024–Aug 2024</small>

_Key Skills: Next.js, NestJS, React, TypeScript, Kubernetes, Vite, Express, SCSS, GitHub
Actions_

- Next.js and TypeScript features for a migration onto a new architecture, with the
  NestJS APIs behind them.
- Maintained legacy React frontends and Express microservices through the migration.
- Debugged performance problems in services running on Kubernetes, and extended the
  existing GitHub Actions pipelines.

### Senior Cloud Native Engineer, [EngineerBetter](https://container-solutions.com) <small>Jan 2022–Jan 2024</small>

_Key Skills: AWS, Azure, Kubernetes, Terraform, Concourse, Docker, Go, Python, CSPM,
Cloud Foundry, BOSH_

- Cloud native consultancy: moving enterprise platforms onto declarative infrastructure
  and continuous deployment, with reproducibility and resistance to drift prioritised
  over strict GitOps where the two conflicted.
- Implemented Cloud Security Posture Management policy across cloud platforms. Azure
  Policy was badly out of step with how the rest of Azure worked, its JSON was poorly
  documented, and it couldn't express something Credit Suisse needed for their CSPM to
  work at all—I made the case to Microsoft at their Paddington office and they shipped
  the change to the platform a few weeks later.
- Wrote Python tooling that audited code and deployments across enterprise estates too
  large to inspect by hand.
- CI in Concourse, GitHub Actions and GitLab, at a scale where the pipeline is a system
  in its own right.
- Contributed to Kubernetes External Secrets Operator, mostly pairing with and bringing
  on less experienced engineers, and to Compliance Framework, a verified CSPM auditing
  tool.

### Consultant Full Stack / Mobile Engineer, [Superbike Factory](https://superbikefactory.co.uk/) (Freelance) <small>Jan 2021–Apr 2023</small>

<small>Concurrent with EngineerBetter and ROXi</small>

_Key Skills: React Native, TypeScript, AWS CDK, Lambda, DynamoDB, API Gateway,
CloudFront, MobX-State-Tree, BitBucket Pipelines_

- Built an internal Android app and all of its infrastructure from scratch for bike
  delivery drivers: job viewing, notes and photo upload, training with quizzes and
  video, and taking customer payment.
- Greenfield and serverless throughout—CDK, Lambda, DynamoDB, API Gateway,
  CloudFront—integrating with the existing systems rather than replacing them.
- React Native client with MobX-State-Tree and a thin layer of AWS Amplify.
- BitBucket pipeline deploying the infrastructure, reading CloudFront outputs back out of
  it and building the app against them: a new environment needs no manual configuration.
- Audited the existing infrastructure code and shipped the security fixes.

### Lead Developer, [ROXi](https://roxi.tv) <small>Jan 2020–Jan 2022</small>

_Key Skills: Swift, Java, WebSockets, React Native, TypeScript, Astro, React, Node.js,
AWS, MobX-State-Tree, Vite_

- Companion App in React Native. The TV app ran inside a browser context, so control
  went over a WebSocket server running on the phone itself, talking to the television
  directly across the LAN.
- Wrote the native WebSocket transport for both platforms as React Native modules—Java
  on Android, Swift on iOS, using Grand Central Dispatch to get the threading right.
- Internal curation tooling on MobX-State-Tree, Tailwind and Vite.
- Statically generated e-commerce site with account servicing in Astro, when Astro was
  new.

### Consultant Frontend Developer, [Sapien Interactive](https://bootbag.co) (Freelance) <small>Jan 2020–Jan 2024</small>

<small>Concurrent with ROXi, EngineerBetter and Superbike Factory</small>

_Key Skills: React Native, TypeScript, Firebase, MobX-State-Tree, Node.js, WebSockets_

- Brought in by a former business partner to build the app for a new venture and to
  restart an earlier one, in React Native and Firebase.
- Moved the codebase from class components and Redux to functional components with
  hooks, wrapped in mobx-react observers.
- Came to MobX-State-Tree sceptical, because I preferred the explicit functional
  immutability I was used to in Redux, and it won me over: observables, mutable-style
  updates and flows for side effects, with a fraction of the boilerplate.

### Senior Mobile Developer, [Zopa Financial Services](https://zopa.com) <small>Jan 2018–Jan 2020</small>

_Key Skills: Swift, Kotlin, React Native, TypeScript, Redux, Java, Kafka, detox_

- Led the credit card section of Zopa's app, React Native and Redux.
- Native modules in Swift and Kotlin against Stripe's card issuing APIs while those APIs
  were new.
- Kept the codebase current, picking up hooks once they made sense for it.
- detox and @testing-library/react-native for coverage.
- Learned the financial products in enough detail to be useful to the analysts and
  backend engineers, and fixed backend bugs where that was the fastest route.

## Open Source

- **[nano-web](https://github.com/radiosilence/nano-web)** <small>Rust ·
  240+★</small>—in-memory static file server for SPAs and static content. Serves this
  site.
- **[jaritanet](https://github.com/radiosilence/jaritanet)** <small>TypeScript</small>—my
  own infrastructure as a single Pulumi program: it provisions a Hetzner VPS, installs
  k3s on it, reads the kubeconfig back as an output of the same run that consumes it,
  and deploys into the cluster it just built, so there is no secret round-trip and
  nothing for a human to rotate. Cilium as the CNI so NetworkPolicies are actually
  enforced, Traefik terminating Let's Encrypt TLS over DNS-01, and a
  censorship-resistant proxy layer—Xray VLESS-REALITY, Hysteria2, unbound,
  tailscale—running as hostNetwork DaemonSets rather than systemd units, so the host
  itself runs k3s and sshd and nothing else. Xray owns `:443` and passes unmatched
  traffic to Traefik, so the public site and the proxy share a port. It runs this site,
  Navidrome, and an MCP gateway with Hydra and Postgres behind it, with VictoriaMetrics
  and Grafana watching all of it. GitHub Actions previews the stack on a pull request and
  applies it on merge, and a scheduled job tracks upstream component versions and opens
  the bump itself.
- **[fastmail-cli](https://github.com/radiosilence/fastmail-cli)** <small>Rust ·
  65+★</small>—CLI and MCP server for Fastmail over JMAP, CardDAV and GraphQL, with
  attachment text extraction and masked email.
- **MCP servers in Rust**—[tfl-mcp](https://github.com/radiosilence/tfl-mcp),
  [codeowners-lsp](https://github.com/radiosilence/codeowners-lsp),
  [mcp-gateway](https://github.com/radiosilence/mcp-gateway),
  [caldav-cli](https://github.com/radiosilence/caldav-cli),
  [mainlynorfolk-mcp](https://github.com/radiosilence/mainlynorfolk-mcp). All share a
  GraphQL transport I designed for them: one typed, introspectable graph instead of a
  sprawl of flat tools, so a model can discover what exists and ask for exactly the
  fields it needs. It costs far fewer tokens and it fails in ways a model can read.
- **[koan](https://github.com/radiosilence/koan)** <small>Rust · 25★</small>—bit-perfect
  terminal music player: Ratatui TUI, gapless playback, Subsonic and Navidrome
  streaming, ReplayGain, spectrum analyser.
- **[watchwoman](https://github.com/radiosilence/watchwoman)** <small>Rust</small>—a
  drop-in watchman replacement that doesn't eat your RAM.
- **[blit.cc](https://github.com/radiosilence/blit)** <small>Rust</small>—this site. A
  static site generator with a content-hashed asset pipeline that fails the build on an
  unreferenced or hand-written path, and `askama_gettext`, a gettext implementation for
  Askama covering 36 locales with CLDR plural rules, checked against CLDR at build time
  so a catalogue can't disagree with it silently. Nothing reaches the browser but HTML,
  CSS and a font—the locale picker is `command`/`commandfor` and a native `<dialog>`.
- **[pip](https://github.com/pypa/pip)**—opened
  [#789](https://github.com/pypa/pip/pull/789) in 2013 arguing that pip had to verify
  SSL certificates, at a point where it fetched packages over plain HTTP and checked
  nothing. Shipped in pip 1.3 as the fix for CVE-2013-1629, credited by name in the
  release notes.
- **Contributions elsewhere**—[TanStack
  Router](https://github.com/TanStack/router) (static prerendering fix, and docs),
  [Django REST Framework](https://github.com/encode/django-rest-framework) (timedelta
  support in the JSON encoder), [git-absorb](https://github.com/tummychow/git-absorb)
  (darwin arm64 build target),
  [react-native-webview](https://github.com/react-native-webview/react-native-webview),
  [ops](https://github.com/nanovms/ops) (unikernel packaging fixes),
  [go-buildpack](https://github.com/cloudfoundry/go-buildpack) (take the Go version from
  `go.mod`), [icu_ex](https://github.com/hansihe/icu_ex) (compact notation and percent
  styles for Elixir number formatting),
  [sorl-thumbnail](https://github.com/jazzband/sorl-thumbnail),
  [bowser](https://github.com/bowser-js/bowser).
- **Earlier**—[xr](https://github.com/radiosilence/xr) <small>440+★</small>,
  [Ham](https://github.com/radiosilence/Ham) <small>380+★</small>, a PHP microframework
  from when that was a reasonable thing to write,
  [subdown](https://github.com/radiosilence/subdown) <small>19★</small>,
  [servers.py](https://github.com/radiosilence/servers.py) <small>13★</small>,
  [python-nginx](https://github.com/radiosilence/python-nginx) <small>12★</small>,
  [redux-rx-http](https://github.com/radiosilence/redux-rx-http) <small>12★</small>.

## Skills

**Daily**—TypeScript, Elixir, Rust, GraphQL, Node.js, PostgreSQL, React, Next.js,
Docker, Git, GitHub Actions, Tailwind, CSS, bash/zsh, Linux, agentic AI tooling and MCP.

**Strong**—Go, Python, React Native, Swift, Kotlin, Java, gRPC and Protobuf, Kubernetes,
Terraform, AWS (CDK, Lambda, API Gateway, DynamoDB, S3, CloudFront, Cognito,
ECS/Fargate, RDS, IAM, Route53, SQS, SES, CloudWatch), Redis, Zod, Vite, esbuild, bun,
Zustand, MobX-State-Tree, Redux, RxJS, WebSockets, i18n, TDD/BDD.

**Worked with**—Astro, NestJS, Express, Django, Flask, Celery, Cython, Twisted, MySQL,
MSSQL, MongoDB, CouchDB, Couchbase, Memcached, Pulumi, ArgoCD, Ansible, Azure and Azure
Policy, Concourse, CircleCI, BitBucket Pipelines, GitLab CI, Traefik, Nginx, Apache,
Kafka, ZeroMQ, Socket.IO, C#, .NET, C++, C, x86 assembly, Qt, PHP, AngularJS, jQuery,
SASS/LESS, Cloud Foundry, BOSH, Mesos/Marathon, unikernels, Vagrant, SVN.

Some of that last list is archaeology. It's there for the range, not because I'd pick
Marathon for anything today.

## Education

Diploma, Computer Science & Cybernetics—University of Reading.

## Who is James?

I don't see programming and computers as simply a job, but part of who I am. I shoot a
lot of photography—these days mostly street portraits, which took a while to get
confident enough to do, and which started out with urban exploration in Berlin. I'm an
avid cyclist, mainly fixed but also gravel. I'm out at London club nights, and I go out
of my way to see smaller bands nobody's told me about yet—discovering music by wandering
into it beats having an algorithm hand it to me, which is most of the reason I built my
own music player and the homelab it runs on. I'm a keen follower of current affairs,
especially from a technical standpoint, and I think a lot about where things are going.

## Less Recent Work

### Senior Frontend Developer, [On The Dot](https://www.citysprint.co.uk) <small>Jul 2017–Jan 2018</small>

_Key Skills: React, TypeScript, Redux, redux-observable, Go, Node.js, AWS Lambda, API
Gateway, Apigee, Auth0, Swagger_

- Built the allocation UI that controllers used to assign deliveries and bookings to
  couriers.
- Modernised the codebase onto React 16, Redux and redux-observable for side effects.
- Owned authentication (Auth0), authorisation (Lambda and JWT), user management, and API
  aggregation across Swagger, API Gateway and Apigee.

### Lead Frontend Developer, [SmartFocus](https://www.actito.com) <small>Mar 2015–Jan 2017</small>

_Key Skills: React, AngularJS, Redux, flux, Node.js, Express, WebSockets, ZeroMQ, Redis,
C++, C#, .NET, Qt_

- Led engineering across the innovation and frontend teams, building and rebuilding
  frontend systems and the internal services behind them.
- Architected and built three products—shipped and forthcoming—and mentored the
  engineers working on them.
- Set patterns and practices the wider technical team adopted.
- Worked across database and system architecture, UX and product design wherever that
  was what the problem needed.

### Lead Frontend Developer, Bootbag <small>Jan 2014–Jan 2015</small>

_Key Skills: React, flux, WebSockets, CSS, HTML_

- Prototyped and built a startup's frontend in React, early enough that most of the
  patterns didn't exist yet.

### Technical Director, Links Creative <small>Jan 2013–Jan 2015</small>

_Key Skills: Django, PHP, AngularJS, jQuery, Node.js, Express, C#, .NET, Linux, nginx_

- Technical director of a small Brighton agency, taking client ideas through to shipped
  products in Django, AngularJS, jQuery and PHP.

### Web Developer, Freelance <small>Jan 2010–Jan 2013</small>

_Key Skills: PHP, Django, Flask, AngularJS, jQuery, Node.js, Linux, nginx, Apache_

- Dropped in at the deep end when I moved to Brighton: learned to network, project
  manage, and lean on rapidly improving technical skills to meet demand. Where the
  product instinct came from.
