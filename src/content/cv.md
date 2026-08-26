# James Cleveland

senior full stack engineer

**e-mail:** [jc@blit.cc](mailto:jc@blit.cc)<br/>
**github:** [@radiosilence](https://github.com/radiosilence)<br/>
**location:** London, or remote

Sixteen years of shipping production code at every layer of the stack: Elixir and Go
services, GraphQL gateways, React and Next.js frontends, native Swift and Kotlin
modules, Rust tooling, Terraform and Kubernetes. Breadth is easy to claim on a CV. The
part worth checking is the depth underneath it — I have built and run things at each of
those layers rather than working next to someone who did.

The work I'm best at is the work people would rather avoid: entangled legacy that has to
come apart without losing data, greenfield where the architecture is still an open
question, and products where deciding what to build matters as much as building it.
Freelancing early on made the product instinct permanent — I want to argue about what a
thing should be, not just implement the ticket.

I use agentic tooling heavily and build my own, and I'm equally willing to say no to it.
Generation being cheap makes judgement the scarce part, not the other way round.

## Selected Work

- **Extracted the reviews domain out of a heavily entangled monolith at Fresha, solo** —
  27M reviews and 20M replies moved onto a new Elixir service while the marketplace
  stayed live, with the monitoring and backfill tooling to find and heal what a
  migration that size inevitably breaks.
- **Ran a WebSocket server on the handset** to get low-latency LAN control of a TV app
  that was stuck in a browser context, with the native Java and Swift transport written
  as React Native modules.
- **[nano-web](https://github.com/radiosilence/nano-web)** — in-memory static file
  server in Rust, 240+ stars, serving this site in production.
- **Persuaded Microsoft to extend Azure Policy** during an engagement, adding the scope
  needed to express compliance checks the tool could not previously represent.
- **Built an Android app and its entire AWS backend from nothing**, alone, for delivery
  drivers at Superbike Factory — CDK, Lambda, DynamoDB, API Gateway, deployed by a
  pipeline with no manual configuration anywhere in it.

## Recent Work

### Senior Full Stack Engineer, [Fresha](https://fresha.com) <small>Jan 2025–Present</small>

<small>
  World's largest beauty & wellness marketplace: 1 billion+ appointments, 120k+
  partner businesses across 120+ countries
</small>

_Key Skills: Elixir, Phoenix, Ecto, GraphQL, gRPC, Protobuf, TypeScript, Next.js, React
Server Components, Zod, PostgreSQL, Metabase, GitHub Actions, Docker_

- Extracted the entire reviews domain out of the monolith as my final project: a new
  standalone Elixir service with its own schema, gRPC contracts for internal callers,
  GraphQL gateway surface and the customer-facing frontend — near single-handedly.
- Moved 27 million reviews and 20 million replies onto it while the marketplace stayed
  live, using a phased cutover that switched reads first and writes second, backed by a
  continuous sync process, so the transition stayed recoverable at every stage.
- Worked through the data reality rather than the diagram: found undocumented internal
  workflows that had been corrupting review data for years, built healing tasks and
  supported replacements for the CX team, and wrote surgical backfills for each edge
  case as it surfaced.
- Built Metabase dashboards that monitored discrepancies between old and new systems
  continuously, so drift was caught by the dashboard rather than by a customer.
- Negotiated with every codeowning team that touched the old tables to make sure the new
  boundary served their use cases instead of breaking them.
- Joined onto the customer loyalty platform, the largest B2C release to date, working
  mostly across the gateway and frontend and taking the lead on the parts I had context
  on — while learning Elixir well enough to be trusted with backend work on it.
- Rebuilt schema and resolver quality across the codebase: moved validation to Zod,
  replaced generated-then-abandoned schemas with ones that described the domain, and
  made existing resolvers lazy and batched instead of eagerly fetching everything.
- Built AI tooling that colleagues adopted, and argued as hard for the limits as for the
  uses — particularly for treating AI-assisted development as a supply-chain surface
  that needs deliberate mitigation rather than trust.
- Mentored engineers through complex problems, and stayed close enough to the product
  side to make technical decisions that accounted for what the business actually needed.

### Senior Full Stack Engineer, [Apolitical](https://apolitical.co) <small>Apr 2024–Aug 2024</small>

_Key Skills: Next.js, NestJS, React, TypeScript, Kubernetes, Vite, Express, SCSS, GitHub Actions_

- Built features in Next.js and TypeScript as part of a migration onto a new
  architecture, and APIs in NestJS behind them.
- Kept legacy React frontends and Express microservices running while the migration
  proceeded around them.
- Debugged performance problems in services running on Kubernetes.
- Extended the existing GitHub Actions pipelines.

### Senior Cloud Native Engineer, [EngineerBetter](https://container-solutions.com) <small>Jan 2022–Jan 2024</small>

_Key Skills: AWS, Azure, Kubernetes, Terraform, Concourse, Docker, Go, Python, CSPM, Cloud Foundry, BOSH_

- Consultancy work taking enterprise platforms from hand-tended toward reproducible:
  declarative infrastructure, continuous deployment, and resilience to drift in
  preference to GitOps purity where the two conflicted.
- Implemented Cloud Security Posture Management policy across cloud platforms —
  including convincing Microsoft, in a meeting at their Paddington office, to add scope
  to Azure Policy so that checks we needed could be expressed at all.
- Wrote Python tooling that audited client code and deployments at enterprise scale.
- Built CI in Concourse, GitHub Actions and GitLab for projects large enough that the
  pipeline was itself a system to be designed.
- Contributed to Kubernetes External Secrets Operator, mostly pairing with and bringing
  on less experienced engineers, and to Compliance Framework, a verified CSPM auditing
  tool.

### Full Stack / Mobile Engineer, [Superbike Factory](https://superbikefactory.co.uk/) (Freelance) <small>Jan 2021–Apr 2023</small>

<small>Concurrent with EngineerBetter and ROXi</small>

_Key Skills: React Native, TypeScript, AWS CDK, Lambda, DynamoDB, API Gateway, CloudFront, MobX-State-Tree, BitBucket Pipelines_

- Built an internal Android app and all of its infrastructure from scratch for bike
  delivery drivers: job viewing, notes and photo upload, training with quizzes and
  video, and taking customer payment.
- Chose a serverless shape — CDK, Lambda, DynamoDB, API Gateway — to keep a low-traffic
  internal tool cheap to run and cheap to leave alone, integrating with existing systems
  rather than replacing them.
- Wrote the client in React Native with MobX-State-Tree and a thin layer of AWS Amplify.
- Built a BitBucket pipeline that deploys the infrastructure, reads CloudFront outputs
  back out of it, and builds the app against them, so a new environment needs no manual
  configuration at all.
- Audited the existing infrastructure code and shipped the security fixes it needed.

### Lead Developer, [ROXi](https://roxi.tv) <small>Jan 2020–Jan 2022</small>

_Key Skills: React Native, TypeScript, WebSockets, Java, Swift, Astro, React, Node.js, AWS, MobX-State-Tree, Vite_

- Built the Companion App in React Native, solving the TV app's browser-context
  constraints by running a WebSocket server on the phone itself and talking to the
  television directly over the LAN.
- Wrote the native WebSocket transport for both platforms as React Native modules — Java
  on Android, Swift on iOS, using Grand Central Dispatch to get the threading right.
- Built the internal curation tooling on MobX-State-Tree, Tailwind and Vite.
- Designed and built a statically generated e-commerce site with account servicing in
  Astro, when Astro was new.

### Frontend Developer, [Sapien Interactive](https://bootbag.co) (Freelance) <small>Jan 2020–Jan 2024</small>

<small>Concurrent with ROXi, EngineerBetter and Superbike Factory</small>

_Key Skills: React Native, TypeScript, Firebase, MobX-State-Tree, Node.js, WebSockets_

- Brought in by a former business partner to build the app for a new venture and to
  restart an earlier one, in React Native and Firebase.
- Moved the codebase from class components and Redux to functional components with
  hooks, wrapped in mobx-react observers.
- Came to MobX-State-Tree sceptical — I preferred explicit functional immutability — and
  changed my mind on the evidence: observables, mutable-style updates and flows for
  side effects got the same guarantees with far less ceremony.

### Senior Mobile Developer, [Zopa Financial Services](https://zopa.com) <small>Jan 2018–Jan 2020</small>

_Key Skills: React Native, TypeScript, Redux, Swift, Kotlin, Java, Kafka, detox_

- Led development of the credit card section of Zopa's app in React Native and Redux.
- Wrote the native modules in Swift and Kotlin against Stripe's card issuing APIs while
  those APIs were brand new.
- Kept the codebase current, adopting hooks as soon as it was sensible rather than as
  soon as it was possible.
- Tested it properly — detox and @testing-library/react-native, thoroughly reviewed.
- Learned the financial products in enough detail to be useful to the analysts and
  backend engineers, and fixed backend bugs where that was the fastest route.

## Open Source

- **[nano-web](https://github.com/radiosilence/nano-web)** <small>Rust · 240+★</small> —
  in-memory static file server for SPAs and static content. Serves this site.
- **[fastmail-cli](https://github.com/radiosilence/fastmail-cli)** <small>Rust · 65+★</small>
  — CLI and MCP server for Fastmail over JMAP, CardDAV and GraphQL, with attachment text
  extraction and masked email.
- **MCP servers in Rust** —
  [tfl-mcp](https://github.com/radiosilence/tfl-mcp),
  [codeowners-lsp](https://github.com/radiosilence/codeowners-lsp),
  [mcp-gateway](https://github.com/radiosilence/mcp-gateway),
  [caldav-cli](https://github.com/radiosilence/caldav-cli),
  [mainlynorfolk-mcp](https://github.com/radiosilence/mainlynorfolk-mcp). All share a
  GraphQL transport I designed for them: one typed, introspectable graph instead of a
  sprawl of flat tools, so a model can discover what exists and ask for exactly the
  fields it needs. It costs far fewer tokens and it fails in ways a model can read.
- **[koan](https://github.com/radiosilence/koan)** <small>Rust · 25★</small> —
  bit-perfect terminal music player: Ratatui TUI, gapless playback, Subsonic and
  Navidrome streaming, ReplayGain, spectrum analyser.
- **[watchwoman](https://github.com/radiosilence/watchwoman)** <small>Rust</small> — a
  drop-in watchman replacement that doesn't eat your RAM.
- **[blit.cc](https://github.com/radiosilence/blit)** <small>Rust</small> — this site.
  A static site generator with a content-hashed asset pipeline that fails the build on
  an unreferenced or hand-written path, and `askama_gettext`, a gettext implementation
  for Askama covering 36 locales with CLDR plural rules, checked against CLDR at build
  time so a catalogue can't disagree with it silently. Nothing reaches the browser but
  HTML, CSS and a font — the locale picker is `command`/`commandfor` and a native
  `<dialog>`.
- **Earlier** — [xr](https://github.com/radiosilence/xr) <small>440+★</small>,
  [subdown](https://github.com/radiosilence/subdown) <small>19★</small>,
  [servers.py](https://github.com/radiosilence/servers.py) <small>13★</small>,
  [python-nginx](https://github.com/radiosilence/python-nginx) <small>12★</small>,
  [redux-rx-http](https://github.com/radiosilence/redux-rx-http) <small>12★</small>, and
  a contribution to pip.

## Skills

**Daily** — TypeScript, React, Next.js, Node.js, GraphQL, Rust, PostgreSQL, Docker, Git,
GitHub Actions, Tailwind, CSS, bash/zsh, Linux, agentic AI tooling and MCP.

**Strong** — Elixir, Go, Python, React Native, Swift, Kotlin, Java, gRPC and Protobuf,
Kubernetes, Terraform, AWS (CDK, Lambda, API Gateway, DynamoDB, S3, CloudFront, Cognito,
ECS/Fargate, RDS, IAM, Route53, SQS, SES, CloudWatch), Redis, Zod, Vite, esbuild, bun,
Zustand, MobX-State-Tree, Redux, RxJS, WebSockets, i18n, TDD/BDD.

**Worked with** — Astro, NestJS, Express, Django, Flask, Celery, Cython, Twisted,
MySQL, MSSQL, MongoDB, CouchDB, Couchbase, Memcached, Pulumi, ArgoCD, Ansible, Azure and
Azure Policy, Concourse, CircleCI, BitBucket Pipelines, GitLab CI, Traefik, Nginx,
Apache, Kafka, ZeroMQ, Socket.IO, C#, .NET, C++, C, x86 assembly, Qt, PHP, AngularJS,
jQuery, SASS/LESS, Cloud Foundry, BOSH, Mesos/Marathon, unikernels, Vagrant, SVN.

Sixteen years is long enough that some of that list is archaeology. It's here because
the range is the point, not because I'd reach for Marathon tomorrow.

## Education

Diploma, Computer Science & Cybernetics.

## Who is James?

Programming isn't a job I go to, it's most of how I think. Outside it I shoot
photography — street and portrait, which took a while to get confident enough for, and
which started with urban exploration in Berlin. I ride fixed, and gravel when there's
somewhere to ride it. I go to London club nights, and I go out of my way to see small
bands nobody has told me about yet: finding music by wandering into it beats having an
algorithm hand it to me, which is most of why I built my own music player and the
homelab it runs on. I follow what's happening in the world closely, particularly where
it collides with technology.

## Less Recent Work

### Senior Frontend Developer, [On The Dot](https://www.citysprint.co.uk) <small>Jul 2017–Jan 2018</small>

_Key Skills: React, TypeScript, Redux, redux-observable, Go, Node.js, AWS Lambda, API Gateway, Apigee, Auth0, Swagger_

- Built the allocation UI that controllers used to assign deliveries and bookings to
  couriers.
- Modernised the codebase onto React 16, Redux and redux-observable for side effects.
- Owned authentication (Auth0), authorisation (Lambda and JWT), user management, and API
  aggregation across Swagger, API Gateway and Apigee.

### Lead Frontend Developer, [SmartFocus](https://www.actito.com) <small>Mar 2015–Jan 2017</small>

_Key Skills: React, AngularJS, Redux, flux, Node.js, Express, WebSockets, ZeroMQ, Redis, C++, C#, .NET, Qt_

- Led engineering across the innovation and frontend teams, building and rebuilding
  frontend systems and the internal services behind them.
- Architected and built three products — shipped and forthcoming — and mentored the
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

- Moved to Brighton and went freelance with more enthusiasm than experience, learning to
  find work, run projects and stay ahead of what clients needed — which is where the
  product instinct came from.
