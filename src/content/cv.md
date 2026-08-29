# James Cleveland

senior full stack engineer

**e-mail:** [jc@blit.cc](mailto:jc@blit.cc)<br/>
**github:** [@radiosilence](https://github.com/radiosilence)<br/>
**location:** London, or remote. But I really do like interacting with humans as long as it is
genuinely flexible.

Polyglot engineer. Writing code for 25 years, professionally for about 20 of them, across
commercial frontend, backend, devops, mobile, and embedded. Elixir and Go services,
GraphQL gateways, React and Next.js, native Swift and Kotlin modules, Rust tooling,
Terraform, Pulumi and Kubernetes. Frankly I'm not super bothered about what language I am
using, as long as it has high quality libs and std and doesn't actively get in the way of
achieving the goal.

I enjoy greenfield work, or even taking something to the next level, and hard technical
problems I can own end to end. I started out freelancing so had to demonstrably own entire
products and make sure they worked properly. So, I want to argue about what a thing should
be, not just implement tickets.

Communicating complex technical solutions to stakeholders and fellow engineers in a way
they can relate to is key to my approach—if people can't understand what's happening, the
most appropriate solution is unlikely to be reached. I've mentored many people in my
career and it's important to impress upon them that whilst they may be brilliant, it's
about getting everyone else on board with what they're thinking and perceiving.

Big on declarative infrastructure using CI/CD and IaC. It is one thing to be able to
build something, it's another to be able to reproduce and scale it in a production
environment.

AI and agentic coding are useful tools, like anything else, engineers should be able to
develop the skills to use them expertly, but also understand that they are not necessarily
a panacea, or a substitute for lack of skill. I have embraced AI somewhat, and have had fun
building MCP servers and gateways in Rust and GraphQL in order to augment AI's abilities. I
think anything like this needs a form of critique and we shouldn't lose our heads, however
since modern Opus, given the right input, the results can be somewhat impressive.

As a natural creative, what drives me is a job where I wake up every day and build
something interesting. I have a huge amount of pride in what I do and can achieve, and am
known as the person you go to if you need something done properly.

## Selected Work

- **Architect and lead engineer of a new Elixir service** replacing the reviews domain in
  Fresha's monolith: ~90M rows migrated, production reads taken from 5% to 100% in two
  days, ~157M requests a week now.
- **A WebSocket server running on the handset**, written in Java and Swift as React
  Native modules, because the TV app it drove was confined to a browser context.
- **[nano-web](https://github.com/radiosilence/nano-web)**—in-memory static file server
  in Rust, 240+ stars, serving this site.
- **Got Microsoft to change Azure Policy**—it could not express a compliance check
  Credit Suisse's CSPM needed, so I went to their office for a meeting and managed to convince
  them to change it for the benefit of my client and I guess everyone else.
- **An Android app and the whole AWS backend behind it**—React Native, CDK, Lambda,
  DynamoDB, API Gateway—built from scratch for bike delivery drivers.
- **This big weird streaming GIF to emails project** I enjoy talking about it because it was mad.

## Recent Work

### Senior Full Stack Engineer, [Fresha](https://fresha.com) <small>Jan 2025–Present</small>

<small>
World's largest beauty & wellness marketplace: 1 billion+ appointments, 120k+ partner
businesses across 120+ countries
</small>

_Key Skills: Elixir, Phoenix, Ecto, OTP, gRPC, Protobuf, GraphQL, TypeScript, Next.js,
React, Zod, PostgreSQL, pgbouncer, Kafka, Snowflake, Datadog, Metabase, LiteLLM, GitHub
Actions, Docker, Kubernetes_

<small>2,021 pull requests authored across 58 repositories, 1,544 merged, 615 more
reviewed for other people, 648 issues written. The first six months of that was before
the company had any AI tooling worth the name.</small>

- **Reviews service** — architect and lead engineer of a new Elixir service taking the
  reviews domain out of the legacy monolith: customers' reviews of venues and of the
  individual staff who served them, on a marketplace where a venue's rating drives how it
  ranks. Its own Postgres schema and connection pooler, gRPC and protobuf contracts for
  other services, a GraphQL surface for clients, and the frontend on top.
- **Delivery and rollout** — delivery owner across web, iOS, Android and backend until
  June 2026. Then production owner through the rollout: reads from a 5% canary to 100% in
  two days, carrying the pager for it. Runs at around 157M requests a week.
- **Migration** — around 90M rows moved with the marketplace live. 30.1M reviews, 3.8M
  replies, and the join tables tying reviews to customer accounts (24.7M) and to the staff
  who did the work (31.2M). Reads cut over first, then writes, over a sync that ran
  continuously so the old system stayed authoritative until it didn't. Parity monitored
  throughout and every stage reversible. The new boundary agreed with around ten teams
  whose code still read and wrote the old tables.
- **Backfill engine** — moving that much data out of a live system needs a tool rather than
  a script. Restartable partway through with per-partition ETAs, incremental runs over a
  time window, and a full-replace mode for a clean reload. An adaptive throttle that read
  the database's own health and backed off before it could hurt production traffic.
  Per-batch statement timeouts, a circuit breaker, and per-row error isolation so one
  malformed record couldn't take down a run. A diff mode dumping only the rows where old
  and new disagreed. Fed from S3 history, Snowflake dumps and a live Kafka mirror; dropped
  the job queue for synchronous batching.
- **Sync drift** — the two systems kept diverging. Traced it to undocumented callers and
  background jobs still writing the old tables, and to internal support tasks that had been
  corrupting review data for years. Built repair jobs scoped to the window where the drift
  happened, targeted repair for individual staff records, and one-off backfills per edge
  case — plus replacement tasks for the support team to use instead of the ones causing it.
  Private replies stayed private throughout.
- **Events** — published the service's own changes to Kafka through an outbox, and consumed
  the monolith's event topics to mirror its writes live while it was still the source of
  truth, behind a kill switch. Dead letter topics with depth monitoring and every dropped
  message logged. A reply arriving before its parent review warns and skips rather than
  crashing the consumer. Re-emission back to the legacy topics gated on publish state, with
  unpublishing compensated. Cleared a failing dead-letter write that was blocking its own
  partition. Emitted the rating-change events that feed marketplace ranking, and the reply
  lifecycle events other teams consume.
- **Warehouse** — streamed the new tables into the data warehouse: Postgres logical
  replication, a change-data-capture connector and a Snowflake sink, with poisoned rows
  excluded so one bad record couldn't stall the pipeline.
- **Postgres** — a denormalised line-item table so rating aggregates, search facet counts
  and sorts read from one place instead of joining across the domain. Composite and
  covering indexes, a `btree_gin` composite, and a GIN index for full-text search over
  review bodies. Index predicates rather than query filters where the predicate was the
  win. Searches narrowed to one venue's own set before scanning. Each grouping paginated
  under its own LIMIT rather than one wide query. Autovacuum on a fixed insert threshold,
  seven dead or prefix-redundant indexes dropped, query-level monitoring on.
- **API surfaces** — cut the gRPC surface to seven calls, each scoped to what one caller
  actually needs, with batch reads made O(1) behind a single windowed query and the cost of
  each documented. Held the GraphQL side to the company's pagination standard: query cost
  ceilings, hardened cursor decoding, field-level redaction on anything the caller
  shouldn't see, role-based authorisation on reply mutations, and nullable root connections
  so one failing field degrades the page instead of blanking it. Schema drift and colliding
  migration versions both caught in CI, each opening its own correcting pull request.
- **AI replies** — the stack end to end: who is entitled to it, the generator, a reply voice
  built from the business's own description of itself, and the worker that publishes.
  Drafted first and then published or cancelled, so nothing goes out at a customer unseen.
  A moderation pipeline with the strategy chosen by flag. The model's own output decides
  what a review is eligible for. The business's remaining balance read live at every
  billing decision, and running out cancels scheduled replies rather than failing open.
  Partner side: a replies tab, an enhance action on drafts, and a countdown before a
  scheduled reply goes out. 2,343 replies published and 129 businesses on full automation
  in the first weeks.
- **Attribution** — the monolith credited a review to whoever was on the invoice line rather
  than the person who actually did the work: about 120,000 misattributed all-time, 0.44%,
  one in 230. The new service attributes from the calendar booking, keeps that attribution
  once made, records a row per person who worked on the appointment, preserves the others
  when a review is rewritten, and shows that a professional has left rather than dropping
  them silently. Moderation and dispute handling built alongside.
- **Operations** — Metabase parity dashboards, Datadog dashboards with I/O attribution, and
  on-call paging on error rate and latency. Progressive canary across all four components.
  Debugged the service into production through PgBouncer CA trust, socket options and IPv6
  bind, and a CPU ceiling that turned out to be the bug rather than tight sizing.
- **B2C search** — rebuilt across the SPA, the gateway and the search service. New
  autocomplete on type-specific paginated RPCs, with search history, recently viewed venues
  and professionals, country filtering, stable list keys, infinite scroll, and badge counts
  that survive a partial failure. Deleted the previous search outright.
- **Map search** — server-side spatial clustering consumed through GraphQL, streamed during
  pan and zoom behind a flag, tuned from feature-flag variants. Custom pins with contextual
  icons where a venue had no rating. Radius bounds clamped to stop a crash at full
  zoom-out, and a map-animation race fixed.
- **Relevance and geo** — distance measured to a venue's actual boundary rather than a
  single point, from a search centre that stays put as you type, and weighted differently
  for individual professionals than for venues. A search centred on one venue narrowed to
  the treatments that venue actually offers. Disputed territories handled in country lookup.
- **Search history** — its own service covering searches, venues, professionals, location
  suggestions and recently viewed. One unified write path replacing several, and Redis
  failures absorbed rather than pushed at the user.
- **Search service** — 146 pull requests, running at around 119M requests a week. Separate
  paginated autocomplete endpoints per result type, spatial clustering, a batch endpoint for
  professionals, filtering by a venue's facilities and by whether a treatment is offered to
  men, women or both.
- **Loyalty** — the largest consumer release to date, and my first project here. Points-based
  rewards with configurable discount amounts, the rules for which items a reward applies to
  and who qualifies, tiers, and the wallet — from schema through gateway resolvers to the
  UI. Led the parts I had context on, and picked up Elixir on the way.
- **B2C API gateway** — 436 pull requests. Resolver and schema architecture, Zod 4 for
  validation, generated schemas replaced with ones shaped to the domain, eager resolvers
  made lazy and batched. A proper deprecation lifecycle run on legacy fields and types.
  Marketplace rating badges moved onto the new reviews service. Moved it onto Temporal and
  `Intl`, trimming date-fns back to maths only.
- **Test suite** — migrated the gateway from Jest to Vitest across the whole codebase,
  porting the custom reporters onto the Vitest reporter API and modernising the suites
  behind it.
- **Supply chain** — pushed the organisation towards being genuinely harder to attack
  through its dependencies, rather than just patched. SHA-pinned actions, toolchains pinned
  through mise, a package manager with isolated installs and a build-script allowlist,
  exact pins and registry-only resolution, namespace locking kept mandatory, and
  registry-fetch-and-execute patterns killed out of the install path. Wrote the standard
  that carried it, including the first-party carve-out that stopped the policy being
  unworkable internally. Ordinary patching alongside it: koa (CVE-2026-27959), lodash,
  protobufjs, ws, the AWS SDK, Adyen Web 5 to 6.
- **B2C SPA** — 503 pull requests beyond search: an SSR image gallery on App Router
  parallel routes, scroll restoration and back-navigation on mobile web, and the analytics
  behind the search funnel.
- **B2B online reputation** — the partner-facing reviews surface: filtering, aggregate
  views, the AI replies tab, and client-side content moderation, on a new data-access
  layer.
- **Shared Elixir libraries** — fixed correctness and resource bugs in the libraries every
  other service depends on. A broker connection and a Redis process leaked on every failed
  health probe. Two paths were interning atoms from runtime input, which the BEAM never
  frees, so given enough traffic the node dies. Plus gRPC 1.0 support in the shared RPC
  client and the toolchain onto Elixir 1.20.2 / OTP 29.
- **Shared taxonomy library** — the treatment vocabulary the whole marketplace searches and
  displays against: CLDR and BCP-47 locale handling, correct pluralisation and gettext
  catalogue generation, validation rules on the source data, TypeScript codegen, and CI that
  regenerates it all and opens its own pull request.
- **AI platform** — LiteLLM proxy and Langfuse model configuration, content moderation
  keys, and an internal Claude plugin marketplace including a skill that takes a ticket
  through to an opened pull request.
- **Developer tooling** — custom ESLint rules for the marketplace codebase, JSON schema
  validation and deployment lock guards in the internal CLI, CODEOWNERS validation in CI,
  and shared actions for opt-in signed commits and flaky test reporting.
- **Review and mentoring** — 615 pull requests reviewed for other people, 648 issues
  written. Mentored engineers through complex problems, and worked at product level so
  technical decisions matched what the business needed.

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
  site. From my cupboard.
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

## Education

Full disclosure I droppped out of a degree in Computer Science & Cybernetics—University of Reading
despite winning various competitions for my work. Wasn't for me.

## Who is James?

I don't see programming and computers as simply a job, but part of who I am. I shoot
photography, mostly street portraits these days, which started out with urban exploration
in Berlin. I love cycling and the freedom it gives people. Music and audio matters to me. I go
out of my way to find weird little bands nobody has told me about yet, and I'd rather wander
into somewhere and chat to someone than have an algorithm hand it to me. I think technology can
still be a force by which you can regain control of your own existence, and people are starting to
realise this. So I run my own homelab, music collection...I've built my own audio player etc because
I don't think that humans should be at the behest of large corporations for something so close to
our hearts. Everyone should have a choice.

I'm a keen follower of current affairs, especially from a technical standpoint.

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
