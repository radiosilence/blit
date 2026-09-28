# James Cleveland

senior full stack engineer

**e-mail:** [jc@blit.cc](mailto:jc@blit.cc)<br/>
**github:** [@radiosilence](https://github.com/radiosilence)<br/>
**location:** London, or remote. Happy to be in an office. I like working with people in
person, where the flexibility is real.

Polyglot engineer. Twenty-five years of writing code, twenty of them paid for, across
commercial frontend, backend, devops, mobile and embedded. Elixir and Go services,
GraphQL gateways, React and Next.js, native Swift and Kotlin modules, Rust tooling,
Terraform, Pulumi and Kubernetes. The language matters less than people think. What
matters is a good standard library, libraries written by someone who cared, and nothing
standing between me and the thing that needs to exist.

I like greenfield, and I like taking a thing that works and making it the thing it should
have been. Hard problems I can own from one end to the other. I started out freelancing,
where there is nobody to hand the product to and every bug is yours by lunchtime, and
that never left. So I want to argue about what a thing should be. Not just build the
ticket.

Most of engineering is explaining. A solution nobody else can follow doesn't get built, or
gets built wrong, and either way you've lost. I've mentored a lot of people, and I tell
all of them the same thing: being right is the easy half. The hard half is getting
everyone else to see it.

Declarative infrastructure, CI and IaC. Not because it's fashionable. Building a thing
once is a trick; building it again, on demand, in production, is engineering.

AI and agentic coding are tools. Worth learning properly, worth no reverence at all. I've
built MCP servers and gateways in Rust and GraphQL to make the models better at their
jobs, and I've watched them be genuinely impressive and genuinely wrong in the same
afternoon. Everything they produce needs a critic. Given the right input, the results are
real.

What I want is to wake up and build something interesting. I take a great deal of pride
in the work, and I'm the person people come to when something has to be done properly.

## Selected Work

- **Architect and lead engineer of a new Elixir service** replacing the reviews domain in
  Fresha's monolith. 90M rows moved with the marketplace live, reads from a 5% canary to
  100% in two days, 157M requests a week now.
- **A WebSocket server running on the phone**, in Java and Swift as React Native modules,
  because the television it drove was locked inside a browser and something had to do
  the talking.
- **[nano-web](https://github.com/radiosilence/nano-web)**—in-memory static file server
  in Rust. 240+ stars. Serving this page from a cupboard.
- **Got Microsoft to change Azure Policy.** It couldn't express a compliance check Credit
  Suisse's CSPM needed, so I went to their office and made the case. They changed the
  platform. For my client, and for everyone else on it.
- **Found the hole in pip.** In 2013 it fetched packages over plain HTTP and verified
  nothing. I argued it had to check SSL certificates. Shipped in pip 1.3 as the fix for
  CVE-2013-1629, credited by name in the release notes.
- **An Android app and the entire AWS backend behind it**—React Native, CDK, Lambda,
  DynamoDB, API Gateway—from nothing, for bike delivery drivers.

## Recent Work
### Senior Full Stack Engineer, [Fresha](https://fresha.com) <small>2025–Present</small>

<small>
World's largest beauty & wellness marketplace: 1 billion+ appointments, 120k+ partner
businesses across 120+ countries
</small>

_Key Skills: Elixir, Phoenix, Ecto, OTP, gRPC, Protobuf, GraphQL, TypeScript, Next.js,
React, Zod, PostgreSQL, pgbouncer, Kafka, Snowflake, Datadog, Metabase, LiteLLM, GitHub
Actions, Docker, Kubernetes_

- **Reviews service** — a venue's rating decides where it ranks, which makes the reviews
  table the most load-bearing thing in the building. It lived in the monolith. I designed
  and led the Elixir service that took it out: its own Postgres schema and connection
  pooler, gRPC and protobuf contracts for the other services, a GraphQL surface for
  clients, and the frontend on top. Delivery owner across web, iOS, Android and backend,
  then production owner through the rollout. A progressive canary across all four
  components, reads from 5% to 100% in two days, and I held the pager. Around 157M
  requests a week.
- **Migration** — around 90M rows, marketplace live, no downtime window because a
  marketplace doesn't have one. Reads first, then writes, over a sync that kept the old
  system authoritative until it wasn't needed. Parity monitored throughout. Every stage
  reversible. Ten teams still had their hands in those tables and each had to agree where
  the new edge was, which is not engineering, and is most of the job. A script won't move
  that much out of a live system, so I built the tool: restarts where it stopped with
  per-partition ETAs, a throttle that reads the database's own vital signs and backs off
  before production feels it, a circuit breaker, one bad row unable to kill a run, and a
  diff mode that prints only what the two sides disagree about. Fed from S3 history,
  Snowflake dumps and a live Kafka mirror.
- **Sync drift** — the two systems would not stay in step, and why was the interesting
  part. Undocumented callers. Background jobs nobody remembered. Internal support tasks
  that had been corrupting review data for years without anyone noticing. I repaired the
  windows where it happened, built targeted repair for individual staff records, then
  handed the support team tools that did their job without doing that, because removing
  a broken thing without replacing it just moves the damage. Private replies stayed
  private throughout.
- **Attribution** — the monolith credited a review to whoever was on the invoice line.
  Not to whoever did the work. About 120,000 reviews all-time, one in 230, went to the
  wrong person, and on this marketplace the wrong person's rating moved. The new service
  attributes from the calendar booking, keeps that attribution once made, records a row
  for everyone who worked on the appointment, and says when a professional has left
  rather than pretending they were never there.
- **Events and warehouse** — the service's own changes go out to Kafka through an outbox.
  While the monolith was still the source of truth, its topics were consumed to mirror
  every write live, behind a kill switch. Dead-letter topics with depth monitoring. A
  reply arriving before its parent review warns and skips, because ordering across two
  systems is not something you get to assume. Rating-change events feed marketplace
  ranking. The new tables stream into Snowflake through Postgres logical replication and
  a change-data-capture connector, poisoned rows excluded so one bad record can't stall
  the pipeline.
- **Postgres and operations** — a denormalised line-item table so rating aggregates,
  search facet counts and sorts read from one place instead of joining across the domain.
  Composite and covering indexes, GIN full-text search over review bodies, index
  predicates rather than query filters where the predicate was the win, autovacuum on a
  fixed insert threshold, seven dead or prefix-redundant indexes dropped. Datadog with
  I/O attribution, Metabase parity dashboards, paging on error rate and latency. Getting
  it into production meant PgBouncer CA trust, IPv6 bind, and a CPU ceiling that turned
  out to be the bug rather than the sizing.
- **API surfaces** — the gRPC surface cut to seven calls, each shaped to what one caller
  actually needs, with batch reads made O(1) behind a single windowed query. GraphQL held
  to the company's pagination standard: query cost ceilings, hardened cursor decoding,
  field-level redaction, role-based authorisation on reply mutations, and nullable root
  connections so one failing field degrades the page instead of blanking it. Schema drift
  and colliding migration versions both caught in CI, each opening its own correcting
  pull request. On the B2C gateway, generated schemas replaced with ones shaped to the
  domain, eager resolvers made lazy and batched, and a proper deprecation lifecycle run
  on the legacy fields.
- **AI replies** — the whole stack. Who's entitled to it, the generator, a reply voice
  built from the business's own description of itself, moderation with the strategy
  chosen by flag, and the worker that publishes. Everything is drafted before it is
  published or cancelled, so nothing goes out at a customer unseen. The business's
  remaining balance is read live at every billing decision, and running out cancels
  scheduled replies rather than failing open. Partner side: a replies tab, an enhance
  action on drafts, and a countdown before a scheduled reply goes out. 2,343 replies
  published and 129 businesses on full automation in the first weeks.
- **Search** — consumer search rebuilt across the SPA, the gateway and the search
  service, and the previous search deleted outright, which is the part people skip.
  Type-specific paginated autocomplete. Search history as its own service, with Redis
  failures absorbed rather than handed to the user. Server-side spatial clustering
  streamed while you pan and zoom. Distance measured to a venue's actual boundary rather
  than a pin, and weighted differently for a person than for a building. The search
  service runs at around 119M requests a week.
- **Loyalty** — my first project here and the largest consumer release to date. Points,
  tiers, the rules for which items a reward applies to and who qualifies, and the wallet,
  from schema through gateway resolvers to the UI. I led the parts I had context on and
  learned Elixir on the way.
- **Shared libraries** — the Elixir libraries every other service depends on, which is
  the least glamorous work available and the highest leverage. A broker connection and a
  Redis process leaked on every failed health probe. Two paths interned atoms from
  runtime input, which the BEAM never frees, so given enough traffic the node dies. Also
  the treatment taxonomy the whole marketplace searches against: CLDR and BCP-47 locale
  handling, correct pluralisation, gettext catalogues and TypeScript codegen, with CI that
  regenerates the lot and opens its own pull request.
- **Supply chain** — an organisation that is harder to attack through its dependencies,
  rather than one that is merely patched. SHA-pinned actions, toolchains pinned through
  mise, isolated installs with a build-script allowlist, exact pins and registry-only
  resolution, and registry-fetch-and-execute patterns killed out of the install path. I
  wrote the standard that carried it, including the first-party carve-out without which
  nobody could have followed it. A rule nobody can follow is not a rule.
- **Other engineers** — 615 pull requests reviewed for other people. Mentoring through
  the hard problems, and working at product level so the technical decisions matched
  what the business needed rather than what was easiest to build. The gateway migrated
  from Jest to Vitest, custom ESLint rules for the marketplace codebase, and an internal
  Claude plugin marketplace including a skill that takes a ticket through to an opened
  pull request.

### Senior Full Stack Engineer, [Apolitical](https://apolitical.co) <small>2024</small>

_Key Skills: Next.js, NestJS, React, TypeScript, Kubernetes, Vite, Express, SCSS, GitHub
Actions_

- Next.js and TypeScript features for a migration onto a new architecture, and the
  NestJS APIs behind them.
- The legacy React frontends and Express microservices kept alive through the
  migration. Someone has to.
- Performance problems debugged in services running on Kubernetes, and the existing
  GitHub Actions pipelines extended.

### Senior Cloud Native Engineer, [EngineerBetter](https://container-solutions.com) <small>2022–2024</small>

_Key Skills: AWS, Azure, Kubernetes, Terraform, Concourse, Docker, Go, Python, CSPM,
Cloud Foundry, BOSH_

- Cloud native consultancy. Enterprise platforms moved onto declarative infrastructure
  and continuous deployment, with reproducibility and resistance to drift put ahead of
  strict GitOps where the two disagreed.
- Cloud Security Posture Management policy across cloud platforms. Azure Policy was
  badly out of step with the rest of Azure, its JSON was poorly documented, and it
  couldn't express something Credit Suisse needed for their CSPM to work at all. I made
  the case to Microsoft at their Paddington office. A few weeks later the platform could.
- Python tooling that audited code and deployments across enterprise estates too large
  for anyone to inspect by hand.
- CI in Concourse, GitHub Actions and GitLab, at a scale where the pipeline is a system
  in its own right.
- Contributions to Kubernetes External Secrets Operator, mostly by pairing with less
  experienced engineers and bringing them on, and to Compliance Framework, a verified
  CSPM auditing tool.

### Consultant Full Stack / Mobile Engineer, [Superbike Factory](https://superbikefactory.co.uk/) (Freelance) <small>2021–2024</small>

<small>Concurrent with EngineerBetter and ROXi</small>

_Key Skills: React Native, TypeScript, AWS CDK, Lambda, DynamoDB, API Gateway,
CloudFront, MobX-State-Tree, BitBucket Pipelines_

- An internal Android app and all of its infrastructure, from nothing, for bike delivery
  drivers: job viewing, notes and photo upload, training with quizzes and video, and
  taking the customer's payment.
- Greenfield and serverless throughout—CDK, Lambda, DynamoDB, API Gateway,
  CloudFront—integrating with what already existed rather than replacing it.
- React Native with MobX-State-Tree and a thin layer of AWS Amplify.
- A BitBucket pipeline that deploys the infrastructure, reads the CloudFront outputs back
  out of it and builds the app against them. A new environment needs no hands.
- Audited the existing infrastructure code and shipped the security fixes.

### Lead Developer, [ROXi](https://roxi.tv) <small>2020–2022</small>

_Key Skills: Swift, Java, WebSockets, React Native, TypeScript, Astro, React, Node.js,
AWS, MobX-State-Tree, Vite_

- Companion app in React Native. The TV app lived inside a browser and couldn't be
  reached, so the phone ran a WebSocket server and spoke to the television directly
  across the LAN.
- The native WebSocket transport for both platforms as React Native modules—Java on
  Android, Swift on iOS, Grand Central Dispatch to get the threading right.
- Internal curation tooling on MobX-State-Tree, Tailwind and Vite.
- A statically generated e-commerce site with account servicing in Astro, when Astro was
  new.

### Consultant Frontend Developer, [Sapien Interactive](https://bootbag.co) (Freelance) <small>2019–2024</small>

<small>Concurrent with ROXi, EngineerBetter and Superbike Factory</small>

_Key Skills: React Native, TypeScript, Firebase, MobX-State-Tree, Node.js, WebSockets_

- Brought in by a former business partner to build the app for a new venture and restart
  an earlier one, in React Native and Firebase.
- The codebase moved from class components and Redux to functional components with
  hooks, wrapped in mobx-react observers.
- I came to MobX-State-Tree sceptical, because I liked the explicit immutability I knew
  from Redux, and it won. Observables, mutable-style updates, flows for side effects, a
  fraction of the boilerplate.

### Senior Mobile Developer, [Zopa Financial Services](https://zopa.com) <small>2018–2020</small>

_Key Skills: Swift, Kotlin, React Native, TypeScript, Redux, Java, Kafka, detox_

- Led the credit card section of Zopa's app, React Native and Redux.
- Native modules in Swift and Kotlin against Stripe's card issuing APIs while those APIs
  were new.
- Kept the codebase current, and picked up hooks when they made sense for it rather than
  the day they appeared.
- detox and @testing-library/react-native for coverage.
- Learned the financial products well enough to be useful to the analysts and backend
  engineers, and fixed backend bugs where that was the shortest route.

## Open Source

Handwritten the old way, or architected by hand and written with AI: everything I make is
there for anyone with the curiosity to look.

- **[nano-web](https://github.com/radiosilence/nano-web)** <small>Rust ·
  240+★</small>—in-memory static file server for SPAs and static content. Serves this
  site. From my cupboard.
- **[jaritanet](https://github.com/radiosilence/jaritanet)** <small>TypeScript</small>—my
  own infrastructure as a single Pulumi program. It provisions a Hetzner VPS, installs
  k3s on it, reads the kubeconfig back as an output of the same run that consumes it, and
  deploys into the cluster it just built. No secret round-trip, nothing for a human to
  rotate. Cilium as the CNI so NetworkPolicies are actually enforced, Traefik terminating
  Let's Encrypt TLS over DNS-01, and a censorship-resistant proxy layer—Xray
  VLESS-REALITY, Hysteria2, unbound, tailscale—running as hostNetwork DaemonSets rather
  than systemd units, so the host itself runs k3s and sshd and nothing else. Xray owns
  `:443` and passes unmatched traffic to Traefik, so the public site and the proxy share
  a port. It runs this site, Navidrome, and an MCP gateway with Hydra and Postgres behind
  it, with VictoriaMetrics and Grafana watching all of it. GitHub Actions previews the
  stack on a pull request and applies it on merge, and a scheduled job tracks upstream
  component versions and opens the bump itself.
- **[fastmail-cli](https://github.com/radiosilence/fastmail-cli)** <small>Rust ·
  65+★</small>—CLI and MCP server for Fastmail over JMAP, CardDAV and GraphQL, with
  attachment text extraction and masked email. Predates the official Fastmail MCP, largely
  because I knew what I wanted out of it and couldn't be bothered waiting to find out if
  they'd want the same.
- **MCP servers in Rust**—[tfl-mcp](https://github.com/radiosilence/tfl-mcp), which
  wraps TfL's REST API into a fully associated graph. Bots love it.
  [codeowners-lsp](https://github.com/radiosilence/codeowners-lsp),
  [mcp-gateway](https://github.com/radiosilence/mcp-gateway),
  [caldav-cli](https://github.com/radiosilence/caldav-cli),
  [mainlynorfolk-mcp](https://github.com/radiosilence/mainlynorfolk-mcp). All share a
  GraphQL transport I designed for them: one typed, introspectable graph instead of a
  sprawl of flat tools, so a model can find what exists and ask for exactly the fields it
  needs. Far fewer tokens, and it fails in ways a model can read.
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
  CSS and a font. The locale picker is `command`/`commandfor` and a native `<dialog>`.
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
Zustand, MobX-State-Tree, Redux, RxJS, WebSockets, Kafka, i18n, TDD/BDD.

**Worked with**—Astro, NestJS, Express, Django, Flask, Celery, Cython, Twisted, MySQL,
MSSQL, MongoDB, CouchDB, Couchbase, Memcached, Pulumi, ArgoCD, Ansible, Azure and Azure
Policy, Concourse, CircleCI, BitBucket Pipelines, GitLab CI, Traefik, Nginx, Apache,
ZeroMQ, Socket.IO, C#, .NET, C++, C, x86 assembly, Qt, PHP, AngularJS, jQuery,
SASS/LESS, Cloud Foundry, BOSH, Mesos/Marathon, unikernels, Vagrant, SVN.

## Education

Full disclosure: I dropped out of Computer Science & Cybernetics at the University of
Reading, despite winning various competitions for my work along the way. It wasn't for
me.

## Who is James?

Computers aren't a job I go to. They're part of how I'm built. I shoot photography,
street portraits mostly these days, which began as urban exploration in Berlin and slowly
turned the lens on the people. I cycle, and I care about the freedom it gives people.
Music and audio matter to me. I go out of my way to find weird little bands nobody has
told me about yet, and I would rather wander into somewhere and talk to a person than
have an algorithm hand it to me. I still think technology can be the thing that gives you
back control of your own existence, and people are starting to notice. So I run my own
homelab and my own music collection, and I built my own audio player, because nothing
this close to the heart should live at the pleasure of a large corporation. Everyone
should have a choice.

I follow current affairs closely, especially where the technology is.

## Less Recent Work

### Senior Frontend Developer, [On The Dot](https://www.citysprint.co.uk) <small>2017–2018</small>

_Key Skills: React, TypeScript, Redux, redux-observable, Go, Node.js, AWS Lambda, API
Gateway, Apigee, Auth0, Swagger_

- The allocation UI that controllers used to assign deliveries and bookings to couriers.
- The codebase modernised onto React 16, Redux and redux-observable for side effects.
- Authentication (Auth0), authorisation (Lambda and JWT), user management, and API
  aggregation across Swagger, API Gateway and Apigee. All mine.

### Lead Frontend Developer, [SmartFocus](https://www.actito.com) <small>2015–2017</small>

_Key Skills: React, AngularJS, Redux, flux, Node.js, Express, WebSockets, ZeroMQ, Redis,
C++, C#, .NET, Qt_

- Led engineering across the innovation and frontend teams: frontend systems built and
  rebuilt, and the internal services behind them.
- Three products architected and built, shipped and forthcoming, and the engineers on
  them mentored.
- Patterns and practices the wider technical team adopted.
- Database and system architecture, UX and product design, wherever that was what the
  problem needed.

### Lead Frontend Developer, Bootbag <small>2014–2015</small>

_Key Skills: React, flux, WebSockets, CSS, HTML_

- A startup's frontend prototyped and built in React, early enough that most of the
  patterns didn't exist yet.

### Technical Director, Links Creative <small>2013–2015</small>

_Key Skills: Django, PHP, AngularJS, jQuery, Node.js, Express, C#, .NET, Linux, nginx_

- Technical director of a small Brighton agency. Client ideas taken through to shipped
  products in Django, AngularJS, jQuery and PHP.

### Web Developer, Freelance <small>2010–2013</small>

_Key Skills: PHP, Django, Flask, AngularJS, jQuery, Node.js, Linux, nginx, Apache_

- Moved to Brighton and landed in the deep end. Learned to network, to manage a project,
  and to lean on technical skills that were improving as fast as the work demanded.
  That's where the product instinct came from.

### PHP Developer / Sysadmin, The Escape Committee <small>2007–2009</small>

_Key Skills: PHP, MySQL, Gentoo, Linux, Apache, Asterisk_

- Web development and systems administration, including working out the Asterisk phone
  systems.
