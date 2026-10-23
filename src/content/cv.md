# James Cleveland

senior full stack engineer

**e-mail:** [jc@blit.cc](mailto:jc@blit.cc)<br/>
**github:** [@radiosilence](https://github.com/radiosilence)<br/>
**location:** London or remote. I like working with people in
person, as long as there's some flexibility.

Polyglot engineer. Twenty-five years writing code, twenty of them paid for,
across frontend, backend, infrastructure, mobile and embedded: Elixir and Go
services, GraphQL gateways, React, native Swift and Kotlin, Rust tooling, and
Kubernetes declared in Terraform and Pulumi. I care more about how a system is
architected than what it’s written in.

I like greenfield, and I like taking something that works and making it what it
should have been. I started out freelancing, so I’m used to owning every bug and
making the product and UX decisions. Explaining my thinking is part of the job.
If I can’t get an idea across, I don’t understand it well enough yet, and
explaining it clearly is how I get the best ideas out of other people, often
better than mine.

My recent projects are AI-assisted. Without experience, these tools make it easy
to stop learning; with it, you know which questions to ask in order to get
things built quickly and without a loss of quality.

I’m the person people come to when something needs doing properly.

## Selected Work

- **Moved Fresha's reviews out of its monolith with the marketplace live.** 90M rows
  migrated with no downtime into an Elixir service I designed, which now serves 157M
  requests a week.
- **Got Microsoft to change Azure Policy.** It couldn't express a compliance check
  Credit Suisse's cloud security tooling needed, so I went to Microsoft and made the
  case. A few weeks later it could, for my client and everyone else.
- **Fixed a security hole in pip.** In 2013 it fetched packages over plain HTTP and
  verified nothing. I wrote the SSL certificate verification patch, which shipped in pip
  1.3 as the fix for CVE-2013-1629 with me credited in the release notes.
- **Built [kōan](https://koan.rocks)**, a music player and server: one Rust core linked
  directly into native apps for iOS, macOS and Android, a terminal UI and a server, with
  room correction, DLNA and playback handed between devices.

## Recent Work

### Senior Full Stack Engineer, [Fresha](https://fresha.com) <small>2025–Present</small>

<small>
World's largest beauty & wellness marketplace: 1 billion+ appointments, 120k+ partner
businesses across 120+ countries
</small>

_Key Skills: Elixir, Phoenix, Ecto, OTP, gRPC, GraphQL, TypeScript, Next.js, React,
PostgreSQL, Kafka, Snowflake, Datadog, Kubernetes_

- **Designed and led the service that took reviews out of Fresha's monolith.** Ratings
  decide where a venue ranks, so this is some of the company's most important data.
  Elixir with its own Postgres and a denormalised schema so aggregates, facets and sorts
  never join across domains; gRPC for other services; GraphQL with cost limits,
  field-level redaction and nullable roots for the apps; an outbox to Kafka feeding
  marketplace ranking. Moved 90M rows with no downtime and every stage reversible, using a
  resumable migration tool I wrote that throttles on the database's own health. Agreed
  the new boundary with the ten teams that depended on it, owned delivery across web,
  iOS, Android and backend, and took reads from a 5% canary to 100% in two days. It now
  serves 157M requests a week.
- **Rebuilt consumer search** across the web app, gateway and search service, then
  retired the old one: autocomplete, search history as its own service, and server-side
  map clustering streamed as you pan. Around 119M requests a week.
- **Built AI review replies end to end**, a paid feature for businesses: replies
  generated in the business's own voice, moderation, scheduled publishing, billing and
  the UI.
- **Shipped Loyalty**, Fresha's largest consumer release at the time (points, tiers and
  wallet, schema to UI), while learning Elixir.
- **Helped shape the organisation's approach to supply chain security**, hardened the shared
  Elixir libraries, mentored engineers, and built an internal Claude plugin marketplace,
  including a skill that takes a ticket to an opened pull request.

### Senior Full Stack Engineer, [Apolitical](https://apolitical.co) <small>2024</small>

_Key Skills: Next.js, NestJS, React, TypeScript, Kubernetes, Vite, Express, SCSS, GitHub
Actions_

- Built Next.js features and NestJS APIs for a move to a new architecture, and kept the
  existing React frontends and Express microservices running until the move was done.
- Debugged performance problems in services on Kubernetes and extended the GitHub
  Actions pipelines.

### Senior Cloud Native Engineer, [EngineerBetter](https://container-solutions.com) <small>2022–2024</small>

_Key Skills: AWS, Azure, Kubernetes, Terraform, Concourse, Docker, Go, Python, CSPM,
Cloud Foundry, BOSH_

- Consultancy moving enterprises onto continuous deployment and cloud platforms; I
  joined to broaden from frontend into infrastructure. Made large estates declarative and
  reproducible, favouring resistance to drift over strict GitOps where the two disagreed.
- Wrote Kubernetes controllers in Go, and CI in Concourse, GitHub Actions and GitLab for
  estates where the pipeline is a large system of its own.
- Implemented Cloud Security Posture Management for several clients. When Azure Policy
  couldn't express a check Credit Suisse needed, I made the case at Microsoft's
  Paddington office and they added it.
- Wrote Python tooling to audit code and deployments across estates too large to
  inspect by hand.
- Between clients, contributed to Kubernetes External Secrets Operator, mostly by
  pairing with less experienced engineers and bringing them on.

### Consultant Full Stack / Mobile Engineer, [Superbike Factory](https://superbikefactory.co.uk/) (Freelance) <small>2021–2024</small>

<small>Concurrent with EngineerBetter, ROXi and Sapien Interactive</small>

_Key Skills: React Native, Expo, TypeScript, AWS CDK, Lambda, DynamoDB, API Gateway,
CloudFront, MobX-State-Tree, BitBucket Pipelines_

- Built an Android app for bike delivery drivers and the AWS backend behind it, alone and
  from nothing: jobs, notes and photos, video training with quizzes, and taking the
  customer's payment. React Native on Expo, with CDK, Lambda, DynamoDB, API Gateway and
  CloudFront integrated into the client's existing AWS services.
- Audited the client's existing infrastructure and fixed a number of security holes in
  it.

### Lead Developer, [ROXi](https://roxi.tv) <small>2020–2022</small>

_Key Skills: Swift, Java, WebSockets, React Native, TypeScript, Astro, React, Node.js,
AWS, MobX-State-Tree, Vite_

- Came up with the architecture for the core product, a React Native companion to a TV
  app that ran in a browser and couldn't host a server: the phone runs a WebSocket server
  and talks to the TV directly over the LAN, with low latency.
- Wrote that transport as native modules in Java and Swift, thread-safe on iOS through
  Grand Central Dispatch.
- Built internal curation tools on MobX-State-Tree and Vite, and a statically generated
  e-commerce and account site in Astro when Astro was new.

### Consultant Frontend Developer, [Sapien Interactive](https://bootbag.co) (Freelance) <small>2019–2024</small>

<small>Concurrent with ROXi, EngineerBetter and Superbike Factory</small>

_Key Skills: React Native, TypeScript, Firebase, MobX-State-Tree, Node.js, WebSockets_

- Built the app for a new venture and revived an earlier one in React Native,
  MobX-State-Tree and Firebase, moving the codebase from class components to hooks.

### Senior Mobile Developer, [Zopa Financial Services](https://zopa.com) <small>2018–2020</small>

_Key Skills: Swift, Kotlin, React Native, TypeScript, Redux, Java, Kafka, detox_

- Led development of the credit card section of Zopa's app in React Native and Redux.
- Wrote native modules in Swift and Kotlin against Stripe's card issuing API while it was
  brand new and its documentation incomplete, translating Objective-C into Swift without
  knowing either language beforehand.
- Learned the credit products well enough to work directly with analysts and backend
  engineers, and contributed backend fixes.

## Open Source

Handwritten the old way, or architected by hand and written with AI: everything I make is
there for anyone with the curiosity to look.

### Created

- **[nano-web](https://github.com/radiosilence/nano-web)** <small>Rust ·
  240+★</small>: static file server that compresses every possible response ahead of
  time, so serving one is handing the kernel a buffer. It serves this site.
- **[jaritanet](https://github.com/radiosilence/jaritanet)** <small>TypeScript</small>:
  production-grade declarative infrastructure for my own services as one Pulumi stack,
  which builds a k3s cluster on a VPS and deploys into it in the same run, with no secret
  leaving the stack. Previewed on pull request, applied on merge, and it opens its own
  version bumps.
- **[kōan](https://koan.rocks)** <small>Rust/Swift/Kotlin ·
  [source](https://github.com/radiosilence/koan)</small>: music player and server. One
  Rust core linked into native SwiftUI and Android apps, a terminal UI and a server;
  per-output room correction, DLNA, playback handed between devices, and full
  OpenSubsonic compatibility.
- **[GrogLog](https://groglog.io)** <small>Rust/Swift/Kotlin ·
  [source](https://github.com/radiosilence/groglog)</small>: a free drink tracker for
  people cutting down, with no account, adverts or server. Reduction plans within UK
  clinical guidance and Apple Health data against the night before, on a Rust core shared
  by the iOS and Android apps.
- **MCP servers in Rust**: [fastmail-cli](https://github.com/radiosilence/fastmail-cli)
  <small>75+★</small>, which predates Fastmail's official MCP and does more,
  [tfl-mcp](https://github.com/radiosilence/tfl-mcp),
  [caldav-cli](https://github.com/radiosilence/caldav-cli) and
  [mainlynorfolk-mcp](https://github.com/radiosilence/mainlynorfolk-mcp), sharing a
  GraphQL transport I designed: one typed graph instead of a sprawl of flat tools, so a
  model asks for exactly the fields it needs, spends far fewer tokens, and can read why a
  query failed. [mcp-gateway](https://github.com/radiosilence/mcp-gateway) runs the OAuth
  flow and injects per-user secrets so they work as Claude connectors.
- **[watchwoman](https://github.com/radiosilence/watchwoman)** <small>Rust</small>: a
  drop-in watchman replacement that doesn't eat your RAM.
- **[blit.cc](https://github.com/radiosilence/blit)** <small>Rust</small>: this site. A
  static site generator with a content-hashed asset pipeline and a gettext
  implementation for Askama, 36 locales with plural rules checked against CLDR at build
  time. The browser gets HTML, CSS and a font, and the PDF is typeset at build time.
- **Earlier**: [xr](https://github.com/radiosilence/xr) <small>440+★</small>, a tiny
  XMLHttpRequest wrapper from before `fetch`, and
  [Ham](https://github.com/radiosilence/Ham) <small>380+★</small>, a PHP microframework
  from when that was a reasonable thing to write.

### Contributed

- **[pip](https://github.com/pypa/pip)**: [#789](https://github.com/pypa/pip/pull/789),
  SSL certificate verification, carried into [#791](https://github.com/pypa/pip/pull/791)
  and shipped in pip 1.3 as the fix for CVE-2013-1629.
- **Elsewhere**: [TanStack Router](https://github.com/TanStack/router) (static
  prerendering), [Django REST Framework](https://github.com/encode/django-rest-framework)
  (timedelta in the JSON encoder), [icu_ex](https://github.com/hansihe/icu_ex) (compact
  and percent number formatting for Elixir),
  [go-buildpack](https://github.com/cloudfoundry/go-buildpack) (Go version from
  `go.mod`), [ops](https://github.com/nanovms/ops) (unikernel packaging),
  [git-absorb](https://github.com/tummychow/git-absorb),
  [react-native-webview](https://github.com/react-native-webview/react-native-webview),
  [sorl-thumbnail](https://github.com/jazzband/sorl-thumbnail),
  [bowser](https://github.com/bowser-js/bowser).

## Skills

AI is changing how we learn and build with things - I've tried to be honest here about tools
I could use without LLM assistance. However, <em>for instance</em>, I use Rust for my personal
projects as I know enough about it to maintain it, review it, and spot if LLMs have done something
hideous or worked their way into an antipattern.

**Daily**: TypeScript, Elixir, GraphQL, Node.js, PostgreSQL, React, Next.js, Docker,
Git, GitHub Actions, Tailwind, CSS, bash/zsh, Linux, Pulumi, Vite, Zustand, agentic AI tooling and MCPs.

**Strong**: Go, Python, React Native, gRPC and Protobuf, Kubernetes, Astro,
Terraform, AWS (CDK, Lambda, API Gateway, DynamoDB, S3, CloudFront, Cognito,
ECS/Fargate, RDS, IAM, Route53, SQS, SES, CloudWatch), Redis, Memcached, Zod, esbuild, bun,
MobX-State-Tree, Redux, RxJS, WebSockets, Kafka, i18n, TDD/BDD.

**Worked with**: Rust, NestJS, Express, Swift, Java, Kotlin, Django, Flask, Celery, Cython, Twisted, MySQL,
MSSQL, MongoDB, CouchDB, Couchbase, ArgoCD, Ansible, Azure and Azure
Policy, Concourse, CircleCI, BitBucket Pipelines, GitLab CI, Traefik, Nginx, Apache,
ZeroMQ, Socket.IO, C#, .NET, C++, C, x86 assembly, Qt, PHP, AngularJS, jQuery,
SASS/LESS, Cloud Foundry, BOSH, Mesos/Marathon, unikernels, and many, many more...

## Education

### Computer Science & Cybernetics, University of Reading

- Completed two years and won a competition for my embedded systems work in the second,
  then left to start working. I learn best by building, and freelancing gave me more
  hands-on experience than lectures did.

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

### Senior Frontend Developer, [On The Dot](https://www.citysprint.co.uk) (formerly LastMileLink) <small>2017–2018</small>

_Key Skills: React, TypeScript, Redux, redux-observable, Go, Node.js, AWS Lambda, API
Gateway, Apigee, Auth0, Swagger_

- Part of the team that owned the frontend, mainly the allocation UI that controllers
  used to assign deliveries and bookings to couriers.
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
- Took on database architecture, system design, and UX and product design wherever a
  problem needed it, learning whatever else it took.

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

- Moved to Brighton and dropped myself in the deep end, learning to network, manage
  projects, and lean on technical skills that were improving as fast as the work
  demanded.

### Web Developer, Primrose London <small>2009–2010</small>

_Key Skills: PHP, Linux, Active Directory, Git_

- PHP and systems administration. Integrated the Linux servers with Active Directory and
  set up version control with Git.

### PHP Developer / Sysadmin, The Escape Committee <small>2007–2009</small>

_Key Skills: PHP, MySQL, Gentoo, Linux, Apache, Asterisk_

- Web development and systems administration, including working out the Asterisk phone
  systems.
