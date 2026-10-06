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

- **Designed and led a new Elixir service** to replace the reviews domain in Fresha's
  monolith. Moved 90M rows with the marketplace live and took reads from a 5% canary to
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

- **Designed and led the service that took reviews out of the monolith.** A venue's
  rating decides where it ranks, so this is some of the most important data in the
  company.
  - Elixir, with its own Postgres and connection pooler, gRPC contracts for other
    services, GraphQL for the apps, and the frontend on top.
  - Owned delivery across web, iOS, Android and backend, then owned it in production.
    We took reads from a 5% canary to 100% in two days (me on the pager), and it now
    serves around 157M requests a week.
- **Moved around 90M rows with the marketplace live.** There's no downtime window on a
  marketplace, so we moved reads, then writes, over a sync that kept the old system
  authoritative, with parity monitored and every stage reversible.
  - A script wasn't going to survive that, so it got a proper migration tool: resumable with
    per-partition ETAs, throttled on the database's own vital signs, circuit-broken,
    immune to a single bad row, and with a diff mode that prints only where the two sides
    disagree. Fed from S3, Snowflake and a live Kafka mirror.
  - Ten teams had their hands in those tables, and agreeing the new boundary with all of
    them was as much of the job as the code.
- **Keeping the two systems in step uncovered years of silent data corruption**, from
  undocumented callers, forgotten background jobs and internal support tooling.
  Repaired the damage and replaced the support tools with safe ones, rather than just
  switching them off.
- **Fixed review attribution.** The monolith credited the invoice line, not whoever did
  the work, so about 120,000 reviews (one in 230) had moved the wrong person's rating.
  The new service attributes from the calendar booking, credits everyone on the
  appointment, and keeps people who've left.
- **Events and data.** Changes go out to Kafka through an outbox; during the migration the
  service mirrored the monolith's writes in live from its topics, behind a kill switch with
  dead-letter queues. Rating changes feed marketplace ranking, and the tables stream into
  Snowflake via logical replication and CDC, poisoned rows excluded so one bad record
  can't stall it.
- **Schema and APIs built around how they're read.** A denormalised line-item table so
  aggregates, facets and sorts never join across the domain, with covering, partial and
  GIN full-text indexes. The gRPC surface cut to seven calls with batch reads in one
  windowed query. GraphQL with cost ceilings, field-level redaction, role-based auth, and
  nullable roots so one failing field degrades a page instead of blanking it.
- **Built AI review replies end to end**: entitlement, generation in the business's
  own voice, moderation, publishing, and the partner UI. Everything is a draft until
  published, and billing reads the live balance so running out cancels replies rather
  than failing open. 2,343 published and 129 businesses on full automation in the first
  weeks.
- **Rebuilt consumer search** across the web app, gateway and search service, and
  deleted the old one: autocomplete, search history as its own service, server-side map
  clustering streamed as you pan, and distance to a venue's real boundary rather than a
  pin. Around 119M requests a week.
- **Loyalty was my first project**, and Fresha's largest consumer release to date:
  points, tiers, eligibility and the wallet, schema to UI. I learned Elixir on the way.
- **Shared libraries and standards.** Fixed leaks in the shared Elixir libraries and two
  paths that created atoms from runtime input (the BEAM never frees them, so enough
  traffic kills the node). Built CLDR locale handling, pluralisation and TypeScript
  codegen into the treatment taxonomy the marketplace searches against. Wrote the
  organisation's supply chain standard (SHA-pinned actions, pinned toolchains, isolated
  installs, no fetch-and-execute), with a first-party carve-out so people could follow
  it.
- **Other engineers.** 615 pull requests reviewed, mentoring through hard problems, and
  product-level input so the technical decisions matched what the business needed.
  Also built an internal Claude plugin marketplace, including a skill that takes a
  ticket to an opened pull request.

### Senior Full Stack Engineer, [Apolitical](https://apolitical.co) <small>2024</small>

_Key Skills: Next.js, NestJS, React, TypeScript, Kubernetes, Vite, Express, SCSS, GitHub
Actions_

- Built Next.js features and NestJS APIs for a move to a new architecture, and kept the
  legacy React frontends and Express microservices running until it landed.
- Debugged performance problems in services on Kubernetes and extended the GitHub
  Actions pipelines.

### Senior Cloud Native Engineer, [EngineerBetter](https://container-solutions.com) <small>2022–2024</small>

_Key Skills: AWS, Azure, Kubernetes, Terraform, Concourse, Docker, Go, Python, CSPM,
Cloud Foundry, BOSH_

- I wanted to step out of frontend work and broaden my skills, so I joined a small
  consultancy that helps companies move their infrastructure and processes onto
  continuous deployment, and their software onto cloud platforms built to run it. We
  took enterprise projects of real complexity and made them manageable, scalable and
  declarative, putting reproducibility and resistance to drift ahead of strict GitOps
  where the two disagreed.
- Wrote Kubernetes controllers in Go, and CI in Concourse, GitHub Actions and GitLab for
  estates where the pipeline is a large system of its own.
- Implemented Cloud Security Posture Management in several different ways for different
  clients. Azure Policy lagged badly behind the rest of Azure, its JSON was poorly
  documented, and it couldn't express something Credit Suisse needed for their CSPM to
  work at all. I went to Microsoft's Paddington office to make the case, and a few weeks
  later it could.
- Wrote Python tooling to audit code and deployments across enterprise estates too large
  for anyone to inspect by hand.
- Between clients, contributed to Kubernetes External Secrets Operator, mostly by
  pairing with less experienced engineers and bringing them on, and to Compliance
  Framework, an open source CSPM auditing tool that has since been retired.

### Consultant Full Stack / Mobile Engineer, [Superbike Factory](https://superbikefactory.co.uk/) (Freelance) <small>2021–2024</small>

<small>Concurrent with EngineerBetter and ROXi</small>

_Key Skills: React Native, TypeScript, AWS CDK, Lambda, DynamoDB, API Gateway,
CloudFront, MobX-State-Tree, BitBucket Pipelines_

- A former manager needed an internal Android app built quickly and for a reasonable
  cost, and brought me in because I was the person he trusted to get it done well. It
  let bike delivery drivers view their jobs, upload notes and photos, do training with
  quizzes and video, and by the end of the project take the customer's payment.
- I enjoyed it because it was well defined and I was building all of it, app and
  infrastructure. His existing systems were on AWS, so I chose CDK, Lambda, DynamoDB,
  API Gateway and CloudFront for the backend and helped him integrate it with the
  services he already had. It was good to have free rein on a greenfield project again
  and make something fast, efficient and cheap to run.
- The frontend is React Native with MobX-State-Tree and a thin layer of AWS Amplify.
- The BitBucket pipeline deploys the infrastructure, reads the CloudFront outputs back
  and builds a working app against them. Everything is derived, so the only
  configuration a new environment needs comes from its own variables.
- Audited the existing infrastructure code and made it more secure in several places.

### Lead Developer, [ROXi](https://roxi.tv) <small>2020–2022</small>

_Key Skills: Swift, Java, WebSockets, React Native, TypeScript, Astro, React, Node.js,
AWS, MobX-State-Tree, Vite_

- Built several key projects from scratch.
- The core product was a React Native companion app for a TV app that ran inside a
  browser and couldn't host any kind of daemon. I came up with having the phone run a
  WebSocket server and talk to the television directly over the LAN, with low latency.
- Wrote the native WebSocket transport for both platforms as React Native modules, Java
  on Android and Swift on iOS, and made the iOS side thread-safe with Grand Central
  Dispatch.
- Built internal curation tools on MobX-State-Tree, Tailwind and Vite, and a statically
  generated e-commerce and account servicing site in Astro when Astro was new.

### Consultant Frontend Developer, [Sapien Interactive](https://bootbag.co) (Freelance) <small>2019–2024</small>

<small>Concurrent with ROXi, EngineerBetter and Superbike Factory</small>

_Key Skills: React Native, TypeScript, Firebase, MobX-State-Tree, Node.js, WebSockets_

- A former business partner brought me in to build the app for a new venture and
  restart an earlier project we'd worked on, in React Native, MobX-State-Tree and
  Firebase.
- I came to MobX-State-Tree sceptical, because I preferred the explicit, functional
  immutability of Redux. I approached it with an open mind, and once I understood MobX's
  observables and had moved the codebase from class components to functional components
  with hooks, wrapped in mobx-react observers, the simplicity and elegance won me over:
  observables for performance, mutable-style updates, flows for side effects, and very
  little boilerplate.

### Senior Mobile Developer, [Zopa Financial Services](https://zopa.com) <small>2018–2020</small>

_Key Skills: Swift, Kotlin, React Native, TypeScript, Redux, Java, Kafka, detox_

- My move into fintech, leading development of the credit card section of Zopa's app, in
  React Native with Redux as the data layer.
- Wrote native modules in Swift and Kotlin against Stripe's card issuing APIs while those
  APIs were still new.
- I learned a huge amount about React Native there. The team kept the codebase current
  and picked up new things like hooks as soon as they made sense, and put a heavy
  emphasis on well-reviewed, well-tested code, with detox and
  @testing-library/react-native.
- Learned the financial products in depth to be useful to the analysts and backend
  engineers, and fixed a few of their bugs along the way.

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

- Part of the team that owned the frontend, mainly the allocation UI controllers used to
  assign deliveries and bookings to couriers.
- Helped refactor the whole codebase onto React 16, Redux and redux-observable for side
  effects.
- Started taking on backend projects there, and took ownership of authentication
  (Auth0), authorisation (Lambda and JWT), user management, and automated API
  aggregation across Swagger, API Gateway and Apigee.

### Lead Frontend Developer, [SmartFocus](https://www.actito.com) <small>2015–2017</small>

_Key Skills: React, AngularJS, Redux, flux, Node.js, Express, WebSockets, ZeroMQ, Redis,
C++, C#, .NET, Qt_

- Lead engineer in the innovation and frontend teams at a London marketing technology
  company, building and rebuilding a large share of the frontend code and internal
  services.
- Architected and built three of their core products, shipped and forthcoming, in React,
  Redux and Node.js, and mentored the other engineers on them.
- Set patterns and practices that the wider technical team adopted.
- Whenever a problem needed solving, whether database architecture, system design, or UX
  and product design, I used what I knew and learned whatever else it took.

### Lead Frontend Developer, Bootbag <small>2014–2015</small>

_Key Skills: React, flux, WebSockets, CSS, HTML_

- Prototyped and built a startup's frontend in React, early enough that most of the
  patterns didn't exist yet.

### Technical Director, Links Creative <small>2013–2015</small>

_Key Skills: Django, PHP, AngularJS, jQuery, Node.js, Express, C#, .NET, Linux, nginx_

- Technical director of a small Brighton agency. Mostly Django, AngularJS, jQuery and
  PHP, taking projects from ideas in clients' heads to fully developed products.

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
