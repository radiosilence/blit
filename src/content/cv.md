# James Cleveland

senior full stack engineer

**e-mail:** [jc@blit.cc](mailto:jc@blit.cc)<br/> **github:**
[@radiosilence](https://github.com/radiosilence)<br/> **location:** London, or remote

Experienced polyglot engineer. I've been writing code for 25 years and professionally
for about 19 of them, across commercial frontend, backend, devops, mobile and embedded.
Elixir and Go services, GraphQL gateways, React and Next.js, native Swift and Kotlin
modules, Rust tooling, Terraform and Kubernetes. I've shipped production code in all of
it.

Lives for problem solving and optimising. The work I like best is greenfield, where
nothing has been decided yet, and hard technical problems I can own end to end. Also
anything where working out what to build matters as much as building it—I freelanced
early and it stuck, so I want to argue about what a thing should be, not just implement
the ticket.

Communicating complex technical solutions to stakeholders and fellow engineers in a way
they can relate to is key to my approach—if people can't understand what's happening,
the most appropriate solution is unlikely to be reached. I've mentored somewhere around
twenty engineers over the years, and most of it comes back to that.

Big on reproducible, declarative infrastructure using CI/CD and IaC.

I have the experience to get the most out of agentic tooling, and I build my own—mostly
MCP servers in Rust. I'll also push back on it when that's the right call.

As a natural creative, what drives me is a job where I wake up every day and build
something interesting.

## Selected Work

- **27 million reviews and 20 million replies out of an entangled monolith** and onto a
  new Elixir service at Fresha, without taking the marketplace down.
- **A WebSocket server running on the handset**, because the TV app it talked to was
  stuck inside a browser context and nothing else was fast enough.
- **[nano-web](https://github.com/radiosilence/nano-web)**—in-memory static file server
  in Rust, 240+ stars, serving this site.
- **Got Microsoft to change Azure Policy**, after arguing it couldn't express what a
  client's compliance checks actually needed.
- **An Android app and the entire AWS backend behind it**, built from scratch for bike
  delivery drivers.

## Recent Work

### Senior Full Stack Engineer, [Fresha](https://fresha.com) <small>Jan 2025–Present</small>

<small>
World's largest beauty & wellness marketplace: 1 billion+ appointments, 120k+ partner
businesses across 120+ countries
</small>

_Key Skills: Elixir, Phoenix, Ecto, GraphQL, gRPC, Protobuf, TypeScript, Next.js, React
Server Components, Zod, PostgreSQL, Metabase, GitHub Actions, Docker_

- Extracted the entire reviews domain out of the monolith, near single-handedly: a new
  standalone Elixir service with its own schema, gRPC contracts for internal callers,
  GraphQL gateway surface, and the customer-facing frontend on top.
- Moved 27 million reviews and 20 million replies onto it while the marketplace stayed
  live, using a phased cutover that switched reads first and writes second, backed by a
  continuous sync process, so the transition stayed recoverable at every stage.
- Worked with around ten codeowning teams that touched the old tables to make sure the
  new system did what each of them needed before anything switched over.
- Spent several weeks on the thing that kept going wrong: data drifting back out of sync
  because of undocumented callers and processes still writing to the old tables that
  nobody had a record of. Found them one at a time and fixed the synchronisation around
  each.
- Dug into how the data was actually being used, not how it was supposed to be: found
  undocumented internal tasks that had been mangling review data for years, built
  healing tasks and proper replacements for the CX team to use instead, and wrote
  surgical backfills for every edge case as it turned up.
- Built Metabase dashboards monitoring discrepancies between the old and new systems, so
  we found the drift before customers did.
- Joined onto the customer loyalty platform, the largest B2C release to date, working
  mostly across the gateway and frontend and taking the lead on the parts I had context
  on, and picked up enough Elixir on the way to be doing backend work in it.
- Pushed general quality across the codebase alongside all of that: Zod for validation
  everywhere, taking sloppy generated schemas and making them something appropriate to
  the domain, and rewriting eager resolvers to be lazy and batched.
- Built my own AI tooling and helped colleagues get a lot more out of theirs, while
  pushing back where it mattered—particularly on treating AI-assisted development as a
  supply chain risk that needs a deliberate approach rather than trust.
- Mentored engineers through complex problems, and stayed involved at product level so
  technical decisions accounted for what the business actually wanted.

### Senior Full Stack Engineer, [Apolitical](https://apolitical.co) <small>Apr 2024–Aug 2024</small>

_Key Skills: Next.js, NestJS, React, TypeScript, Kubernetes, Vite, Express, SCSS, GitHub
Actions_

- Built features in Next.js and TypeScript as part of a migration onto a new
  architecture, and APIs in NestJS behind them.
- Kept legacy React frontends and Express microservices running while the migration
  proceeded around them.
- Debugged performance problems in services running on Kubernetes, and extended the
  existing GitHub Actions pipelines.

### Senior Cloud Native Engineer, [EngineerBetter](https://container-solutions.com) <small>Jan 2022–Jan 2024</small>

_Key Skills: AWS, Azure, Kubernetes, Terraform, Concourse, Docker, Go, Python, CSPM,
Cloud Foundry, BOSH_

- Consultancy work taking enterprise platforms from hand-tended toward reproducible:
  declarative infrastructure, continuous deployment, and resilience to drift in
  preference to GitOps purity where the two conflicted.
- Implemented Cloud Security Posture Management policy across cloud platforms. Azure
  Policy was badly out of step with how the rest of Azure worked, its JSON was poorly
  documented, and it couldn't express something Credit Suisse needed for their CSPM to
  work at all—I made the case to Microsoft at their Paddington office and they shipped
  the change to the platform a few weeks later.
- Wrote Python tooling that audited code and deployments across enterprise estates too
  large to inspect by hand.
- Built CI in Concourse, GitHub Actions and GitLab, on projects big enough that the
  pipeline was a system in its own right.
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
- Had free rein on a completely greenfield project, and used IaC, CDK, Lambda, DynamoDB
  and API Gateway to make something fast, efficient and cheap to run that slotted into
  the existing systems.
- Wrote the client in React Native with MobX-State-Tree and a thin layer of AWS Amplify.
- Built a BitBucket pipeline that deploys the infrastructure, reads CloudFront outputs
  back out of it, and builds the app against them, so a new environment needs no manual
  configuration at all.
- Audited the existing infrastructure code and shipped the security fixes it needed.

### Lead Developer, [ROXi](https://roxi.tv) <small>Jan 2020–Jan 2022</small>

_Key Skills: Swift, Java, WebSockets, React Native, TypeScript, Astro, React, Node.js,
AWS, MobX-State-Tree, Vite_

- Built the Companion App in React Native, solving the TV app's browser-context
  constraints by running a WebSocket server on the phone itself and talking to the
  television directly over the LAN.
- Wrote the native WebSocket transport for both platforms as React Native modules—Java
  on Android, Swift on iOS, using Grand Central Dispatch to get the threading right.
- Built the internal curation tooling on MobX-State-Tree, Tailwind and Vite.
- Designed and built a statically generated e-commerce site with account servicing in
  Astro, when Astro was new.

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

- Led development of the credit card section of Zopa's app in React Native and Redux.
- Wrote the native modules in Swift and Kotlin against Stripe's card issuing APIs while
  those APIs were brand new, in a regulated environment where getting it wrong is
  expensive.
- Kept the codebase well-maintained and up to date, picking up things like hooks as soon
  as it made sense to.
- Tested it properly—detox and @testing-library/react-native, thoroughly reviewed.
- Learned the financial products in enough detail to be useful to the analysts and
  backend engineers, and fixed backend bugs where that was the fastest route.

## Open Source

- **[nano-web](https://github.com/radiosilence/nano-web)** <small>Rust ·
  240+★</small>—in-memory static file server for SPAs and static content. Serves this
  site.
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
- **Earlier**—[xr](https://github.com/radiosilence/xr) <small>440+★</small>,
  [subdown](https://github.com/radiosilence/subdown) <small>19★</small>,
  [servers.py](https://github.com/radiosilence/servers.py) <small>13★</small>,
  [python-nginx](https://github.com/radiosilence/python-nginx) <small>12★</small>,
  [redux-rx-http](https://github.com/radiosilence/redux-rx-http) <small>12★</small>, and
  a contribution to pip.

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

Some of that last list is archaeology at this point. It's there because that much range
is worth knowing about, not because I'd pick Marathon for anything today.

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
