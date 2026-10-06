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

- **I designed and led a new Elixir service** to replace the reviews domain in Fresha's
  monolith. I moved 90M rows with the marketplace live and took reads from a 5% canary to
  100% in two days. It now handles 157M requests a week.
- **A WebSocket server running on a phone**, written in Java and Swift as React Native
  modules, because the TV app it controlled was stuck inside a browser and couldn't be
  reached any other way.
- **[nano-web](https://github.com/radiosilence/nano-web)**—an in-memory static file
  server in Rust, 240+ stars. It serves this page, from a cupboard.
- **Got Microsoft to change Azure Policy.** It couldn't express a compliance check Credit
  Suisse's CSPM needed, so I went to their office and made the case, and they changed the
  platform for my client and everyone else on it.
- **Found the hole in pip.** In 2013 it fetched packages over plain HTTP and verified
  nothing. I argued it had to check SSL certificates, and that shipped in pip 1.3 as the
  fix for CVE-2013-1629, with me credited by name in the release notes.
- **An Android app and the entire AWS backend behind it**, built from nothing for bike
  delivery drivers in React Native, CDK, Lambda, DynamoDB and API Gateway.

## Recent Work
### Senior Full Stack Engineer, [Fresha](https://fresha.com) <small>2025–Present</small>

<small>
World's largest beauty & wellness marketplace: 1 billion+ appointments, 120k+ partner
businesses across 120+ countries
</small>

_Key Skills: Elixir, Phoenix, Ecto, OTP, gRPC, Protobuf, GraphQL, TypeScript, Next.js,
React, Zod, PostgreSQL, pgbouncer, Kafka, Snowflake, Datadog, Metabase, LiteLLM, GitHub
Actions, Docker, Kubernetes_

- **I designed and led the service that took reviews out of the monolith.** A venue's
  rating decides where it ranks, so on a marketplace this is about as load-bearing as
  data gets.
  - Elixir with its own Postgres and connection pooler, gRPC and protobuf contracts for
    the other backend services, GraphQL for the apps, and the frontend on top.
  - I owned delivery across web, iOS, Android and backend, then owned it in production: a
    progressive canary across all four, reads from 5% to 100% in two days, with me on the
    pager.
  - It handles around 157M requests a week.
- **I moved around 90M rows out from under the live marketplace**, with no downtime
  window, because a marketplace doesn't have one.
  - Reads moved first, then writes, over a sync that kept the old system authoritative
    until we no longer needed it, with parity monitored and every stage reversible.
  - A script won't move that much data out of a live system, so I built a proper tool: it
    resumes where it stopped with per-partition ETAs, watches the database's own load and
    backs off before production notices, has a circuit breaker, can't be killed by one bad
    row, and has a diff mode that prints only where the two sides disagree. It fed from S3
    history, Snowflake dumps and a live Kafka mirror.
  - Ten teams still touched those tables, and getting all of them to agree on where the
    new boundary sat was as much of the job as the code.
- **Keeping the two systems in step turned up years of hidden damage.**
  - Undocumented callers, background jobs nobody remembered, and internal support tooling
    that had been quietly corrupting review data for years. I repaired the affected
    windows and replaced the support tools with ones that did the same job safely, rather
    than switching the old ones off and leaving support without them.
  - The monolith credited each review to whoever was on the invoice line, not whoever did
    the work: about 120,000 reviews, one in 230, had gone to the wrong person and moved
    the wrong person's rating. The new service attributes from the calendar booking,
    credits everyone who worked on the appointment, and records when a professional has
    left instead of pretending they were never there.
- **Underneath, the data plumbing and Postgres work.**
  - The service publishes its changes to Kafka through an outbox. While the monolith was
    still the source of truth I mirrored its writes in live from its topics, behind a kill
    switch, with dead-letter topics and depth monitoring.
  - Rating changes feed marketplace ranking, and the tables stream into Snowflake through
    Postgres logical replication and change data capture, with poisoned rows excluded so
    one bad record can't stall the pipeline.
  - A denormalised line-item table lets rating aggregates, search facet counts and sorts
    read from one place instead of joining across the domain, backed by composite and
    covering indexes, partial indexes where the predicate was the win, and GIN full-text
    search over review bodies.
  - I cut the gRPC surface to seven calls, each shaped to what its caller needs, with
    batch reads served by a single windowed query. The GraphQL side has query cost
    ceilings, field-level redaction, role-based authorisation on reply mutations, and
    nullable root connections so one failing field degrades a page instead of blanking it.
  - Datadog with I/O attribution, Metabase parity dashboards, and paging on error rate and
    latency.
- **I built AI-drafted review replies end to end.**
  - Who's entitled to them, the generator, a reply voice built from the business's own
    description of itself, moderation, and the worker that publishes.
  - Every reply is a draft until it's published or cancelled, so nothing reaches a
    customer unseen. The business's remaining balance is read live at every billing
    decision, so running out cancels scheduled replies rather than failing open.
  - Partners get a replies tab, an enhance action on drafts, and a countdown before a
    scheduled reply goes out.
  - In the first weeks, 2,343 replies were published and 129 businesses moved to full
    automation.
- **I rebuilt consumer search** across the web app, the gateway and the search service,
  and deleted the old one outright.
  - Paginated autocomplete by result type, and search history as its own service that
    absorbs Redis failures rather than handing them to the user.
  - Server-side map clustering streamed as you pan and zoom, and distance measured to a
    venue's actual boundary rather than a pin.
  - The search service runs at around 119M requests a week.
- **Before that, my first project here was loyalty**, Fresha's largest consumer release
  to date: points, tiers, reward eligibility and the wallet, from schema through gateway
  resolvers to the UI. I led the parts I had context on and learned Elixir on the way.
- **I also work on what everyone else depends on.**
  - In the shared Elixir libraries I fixed a broker connection and a Redis process that
    leaked on every failed health probe, and two paths that created atoms from runtime
    input, which the BEAM never frees, so with enough traffic the node dies.
  - I worked on the treatment taxonomy the whole marketplace searches against, with CLDR
    and BCP-47 locale handling, proper pluralisation, gettext catalogues and TypeScript
    codegen that CI regenerates on its own.
  - I wrote the organisation's supply chain standard: SHA-pinned actions, toolchains
    pinned through mise, isolated installs with a build-script allowlist, exact pins and
    registry-only resolution, and no fetch-and-execute in the install path, with a
    first-party carve-out so people could follow it.
  - I've reviewed 615 pull requests for other engineers, mentored people through hard
    problems, and worked at product level so technical decisions fit what the business
    needed rather than what was easiest to build.
  - I built an internal Claude plugin marketplace, including a skill that takes a ticket
    through to an opened pull request.

### Senior Full Stack Engineer, [Apolitical](https://apolitical.co) <small>2024</small>

_Key Skills: Next.js, NestJS, React, TypeScript, Kubernetes, Vite, Express, SCSS, GitHub
Actions_

- Built Next.js and TypeScript features for the move to a new architecture, and the
  NestJS APIs behind them, while keeping the legacy React frontends and Express
  microservices running through the migration.
- Debugged performance problems in services on Kubernetes and extended the GitHub
  Actions pipelines.

### Senior Cloud Native Engineer, [EngineerBetter](https://container-solutions.com) <small>2022–2024</small>

_Key Skills: AWS, Azure, Kubernetes, Terraform, Concourse, Docker, Go, Python, CSPM,
Cloud Foundry, BOSH_

- Cloud native consultancy. I moved enterprise platforms onto declarative
  infrastructure and continuous deployment, putting reproducibility and resistance to
  drift ahead of strict GitOps where the two disagreed. Along the way I wrote Kubernetes
  controllers in Go.
- Cloud Security Posture Management policy across cloud platforms. Azure Policy lagged
  badly behind the rest of Azure, its JSON was poorly documented, and it couldn't express
  something Credit Suisse needed for their CSPM to work at all. I made the case to
  Microsoft at their Paddington office, and a few weeks later it could.
- Wrote Python tooling to audit code and deployments across enterprise estates too large
  for anyone to inspect by hand.
- CI in Concourse, GitHub Actions and GitLab for estates where the pipeline is a large
  system of its own.
- Contributed to Kubernetes External Secrets Operator, mostly by pairing with less
  experienced engineers and bringing them on, and to Compliance Framework, a verified
  CSPM auditing tool.

### Consultant Full Stack / Mobile Engineer, [Superbike Factory](https://superbikefactory.co.uk/) (Freelance) <small>2021–2024</small>

<small>Concurrent with EngineerBetter and ROXi</small>

_Key Skills: React Native, TypeScript, AWS CDK, Lambda, DynamoDB, API Gateway,
CloudFront, MobX-State-Tree, BitBucket Pipelines_

- A former manager brought me in because I was the person he trusted to get it built.
- Built an internal Android app and all of its infrastructure from nothing, for bike
  delivery drivers: job viewing, notes and photo upload, training with quizzes and video,
  and taking the customer's payment.
- Greenfield and serverless throughout (CDK, Lambda, DynamoDB, API Gateway, CloudFront),
  integrating with what was already there rather than replacing it.
- React Native with MobX-State-Tree and a thin layer of AWS Amplify.
- The BitBucket pipeline deploys the infrastructure, reads the CloudFront outputs back
  and builds the app against them, so a new environment needs nobody to touch it.
- Audited the existing infrastructure code and shipped the security fixes.

### Lead Developer, [ROXi](https://roxi.tv) <small>2020–2022</small>

_Key Skills: Swift, Java, WebSockets, React Native, TypeScript, Astro, React, Node.js,
AWS, MobX-State-Tree, Vite_

- Built the companion app in React Native. The TV app lived inside a browser and
  couldn't be reached, so I had the phone run a WebSocket server and talk to the
  television directly over the LAN.
- Wrote the native WebSocket transport for both platforms as React Native modules: Java
  on Android, Swift on iOS, with Grand Central Dispatch to get the threading right.
- Internal curation tooling on MobX-State-Tree, Tailwind and Vite.
- A statically generated e-commerce site with account servicing in Astro, back when
  Astro was new.

### Consultant Frontend Developer, [Sapien Interactive](https://bootbag.co) (Freelance) <small>2019–2024</small>

<small>Concurrent with ROXi, EngineerBetter and Superbike Factory</small>

_Key Skills: React Native, TypeScript, Firebase, MobX-State-Tree, Node.js, WebSockets_

- A former business partner brought me in to build the app for a new venture and restart
  an earlier one, in React Native and Firebase.
- Moved the codebase from class components and Redux to functional components with
  hooks, wrapped in mobx-react observers.
- I came to MobX-State-Tree sceptical, because I liked the explicit immutability I knew
  from Redux, and it won me over: observables, mutable-style updates, flows for side
  effects, and a fraction of the boilerplate.

### Senior Mobile Developer, [Zopa Financial Services](https://zopa.com) <small>2018–2020</small>

_Key Skills: Swift, Kotlin, React Native, TypeScript, Redux, Java, Kafka, detox_

- Led the credit card section of Zopa's app, in React Native and Redux.
- Wrote native modules in Swift and Kotlin against Stripe's card issuing APIs while those
  APIs were still new.
- Kept the codebase current, picking up hooks when they made sense for it rather than the
  day they appeared.
- Test coverage with detox and @testing-library/react-native.
- Learned the financial products well enough to be useful to the analysts and backend
  engineers, and fixed backend bugs myself when that was the quickest route.

## Open Source

Handwritten the old way, or architected by hand and written with AI: everything I make is
there for anyone with the curiosity to look.

- **[nano-web](https://github.com/radiosilence/nano-web)** <small>Rust ·
  240+★</small>—in-memory static file server for SPAs and static content. It serves
  this site, from my cupboard.
- **[jaritanet](https://github.com/radiosilence/jaritanet)** <small>TypeScript</small>—my
  own infrastructure as a single Pulumi program. It provisions a Hetzner VPS, installs
  k3s on it, reads the kubeconfig back as an output of the same run that consumes it, and
  deploys into the cluster it just built, so there's no secret round-trip and nothing for
  a human to rotate. Cilium as the CNI so NetworkPolicies are actually enforced, Traefik terminating
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
  needs. It uses far fewer tokens, and when it fails, a model can read why.
- **[koan](https://github.com/radiosilence/koan)** <small>Rust · Swift · 25★</small>—a music
  player and server on one Rust core: native SwiftUI apps for macOS and iOS with the core
  linked in-process through uniffi FFI, a Ratatui terminal UI, and a headless server with a
  web UI, public share links, an OpenSubsonic-compatible API and an MCP server. Bit-perfect
  CoreAudio output, gapless playback, 1TB+ libraries. Local and Subsonic/Navidrome libraries
  merge into one, streamed through an aggressive local cache. The server pushes a playlist to
  the linked phone or Mac over WebSocket, so an assistant using the MCP can build one from the
  library and have it start playing there. Deployed on my own k3s cluster as a versioned
  Pulumi component package.
- **[GrogLog](https://github.com/radiosilence/groglog)** <small>Swift</small>—an iOS app: a
  private, offline drink diary for cutting down, free, with no account, no adverts and
  nothing sent anywhere. SQLite via GRDB, Lock Screen and Home Screen widgets, Shortcuts
  integration.
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

- Built the allocation UI controllers used to assign deliveries and bookings to
  couriers.
- Moved the codebase onto React 16, Redux and redux-observable for side effects.
- Authentication (Auth0), authorisation (Lambda and JWT), user management, and API
  aggregation across Swagger, API Gateway and Apigee were all mine.

### Lead Frontend Developer, [SmartFocus](https://www.actito.com) <small>2015–2017</small>

_Key Skills: React, AngularJS, Redux, flux, Node.js, Express, WebSockets, ZeroMQ, Redis,
C++, C#, .NET, Qt_

- Led engineering across the innovation and frontend teams, building and rebuilding
  frontend systems and the internal services behind them.
- Architected and built three products, shipped and forthcoming, and mentored the
  engineers on them.
- Set patterns and practices the wider technical team adopted.
- Worked on database and system architecture, UX and product design, wherever the
  problem needed it.

### Lead Frontend Developer, Bootbag <small>2014–2015</small>

_Key Skills: React, flux, WebSockets, CSS, HTML_

- Prototyped and built a startup's frontend in React, early enough that most of the
  patterns didn't exist yet.

### Technical Director, Links Creative <small>2013–2015</small>

_Key Skills: Django, PHP, AngularJS, jQuery, Node.js, Express, C#, .NET, Linux, nginx_

- Ran the technical side of a small Brighton agency, taking client ideas through to
  shipped products in Django, AngularJS, jQuery and PHP.

### Web Developer, Freelance <small>2010–2013</small>

_Key Skills: PHP, Django, Flask, AngularJS, jQuery, Node.js, Linux, nginx, Apache_

- Moved to Brighton and landed in the deep end. I learned to network, to manage a
  project, and to lean on technical skills that were improving as fast as the work
  demanded, and that's where the product instinct came from.

### Web Developer, Primrose London <small>2009–2010</small>

_Key Skills: PHP, Linux, Active Directory, Git_

- PHP and systems administration. Integrated the Linux servers with Active Directory and
  set up version control with Git.

### PHP Developer / Sysadmin, The Escape Committee <small>2007–2009</small>

_Key Skills: PHP, MySQL, Gentoo, Linux, Apache, Asterisk_

- Web development and systems administration, including working out the Asterisk phone
  systems.
