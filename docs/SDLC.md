That changes the architecture considerably. DORA’s current research is heading in exactly this direction: AI tends to amplify the engineering system around it; strong platforms, APIs, documentation, testing and delivery practices make AI much more useful, while weak foundations simply let teams create problems faster. 

I’d build the greenfield SDLC in six layers

1. Intent becomes machine-readable context. Don’t begin with Jira ticket → developer → code. Capture the feature as requirements, acceptance criteria, ADRs, domain terminology, API contracts, schemas, architectural constraints and security requirements. AI can help turn rough product ideas into these artefacts, challenge assumptions, find missing cases and keep documentation synchronised. The important part is that this information lives with the product and is version-controlled. You are effectively creating the project’s memory.
2. Development becomes agent-assisted rather than merely autocomplete-assisted. Give the developer/agent access to the repository, architecture, conventions, tests, API schemas, deployment model and relevant organisational knowledge. An engineer should be able to say, “Implement this acceptance criterion,” and have the agent inspect the system, propose a plan, implement a bounded change, update tests and documentation, and produce a reviewable diff. Humans move increasingly from typing code to specifying, reviewing and steering. But small changes still matter: DORA continues to identify small batches, CI, test automation, documentation quality and fast feedback as fundamental capabilities. 
3. Verification becomes substantially more automated than generation. This is crucial. Once AI makes code cheap to produce, verification becomes the scarce resource. Every change should automatically encounter formatting, linting, type checking, unit tests, integration tests, contract tests, security analysis, dependency checks and architectural rules. AI can generate tests, inspect failed pipelines, review diffs and look for semantic problems, but deterministic controls should remain authoritative wherever possible. AI can say, “this looks insecure”; the pipeline should say, “this violates policy and therefore cannot ship.”
4. Delivery should be boringly automated. Infrastructure as code, ephemeral environments, automated database migrations, feature flags, progressive rollout, rollback, secrets management and immutable artefacts should exist from the beginning. Builds should also carry evidence about where they came from. SLSA, for example, formalises this through build provenance: what built an artefact, using which process and inputs, with higher levels adding signed provenance and hardened build environments.  AI should never become an alternative deployment mechanism that quietly bypasses this path.
5. Observability becomes part of product design rather than something added after the first outage. Instrument traces, structured logs, metrics, domain events, deployment metadata and SLOs from day one. Give each request enough context to answer questions like: which customer, which workflow, which deployment, which component and which downstream dependency were involved? OpenTelemetry’s semantic conventions are useful precisely because common naming lets telemetry be correlated across systems and platforms.  Once AI itself enters production, capture model/agent operations and tool executions too; OpenTelemetry is already standardising GenAI operations such as agent invocation, tool execution and retrieval. 
6. Close the loop. Production should feed development. Incidents, failed requests, customer complaints, unusual traces, expensive queries, security findings and SLO violations become structured engineering inputs. An operational agent can correlate an alert with a deployment, inspect traces, retrieve the relevant ADR and code, suggest likely causes, construct a reproduction and draft a fix. Eventually it might execute low-risk remediation. That creates a loop of observe → understand → propose → verify → change → observe again, rather than treating monitoring as a dashboard people occasionally look at.

The interesting bit is what happens when you stop thinking of these as six independent tools.

You get something like:


                     PRODUCT INTENT
                           │
                           ▼
                Specs / ADRs / Contracts
                           │
                           ▼
 Human ───────► AI-assisted engineering ◄──── Organisational Memory
                           │
                           ▼
              Deterministic Verification
             tests / policy / security
                           │
                           ▼
              Trusted Build + Provenance
                           │
                           ▼
                Automated Deployment
                           │
                           ▼
                    Production
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
        Observability              User feedback
              │                         │
              └────────────┬────────────┘
                           ▼
                AI analysis / learning
                           │
                           └──────────► back to intent




And that is where the platform angle gets really interesting.

The greenfield application shouldn’t create its own bespoke CI generator, agent permissions system, telemetry conventions, deployment mechanism, secrets pattern, security policies and AI context system. Instead, it should become the first consumer of reusable platform capabilities.

So while building Product A, you deliberately extract things like a service template, infrastructure modules, CI/CD workflow, observability package, agent instructions, standard ADR format, security controls, deployment policy, environment provisioning, dependency management and operational runbooks.

That is how a greenfield product contributes to the platform rather than merely consuming one.

Your platform therefore gradually becomes:


Developer / Agent
       │
       ▼
┌───────────────────────────────┐
│ Engineering Platform          │
│                               │
│ Service templates             │
│ Organisational knowledge      │
│ Agent skills + instructions   │
│ Tool / MCP access             │
│ CI/CD                         │
│ Test infrastructure           │
│ Security policies             │
│ Infrastructure provisioning   │
│ Secrets / identity            │
│ Observability                 │
│ Software provenance           │
│ Operational automation        │
└───────────────┬───────────────┘
                │
                ▼
           Products


Which is very close to the platform thesis we developed earlier: the platform increasingly becomes the place where the organisation encodes how engineering is supposed to work, eventually serving as an execution substrate for humans and agents rather than merely a pile of developer tooling. Platform Organisation Thesis.txt

There is one distinction I would make extremely explicit from the beginning:

AI handles ambiguity; automation handles authority.

Use AI for understanding vague requirements, investigating systems, generating candidate implementations, correlating signals, reviewing changes, explaining failures and proposing actions.

Use deterministic systems for permissions, deployment gates, schema validation, financial constraints, data-access rules, production changes and other invariants.


AI proposes
      ↓
Domain validates
      ↓
Policy authorises
      ↓
Automation executes
      ↓
Telemetry records
      ↓
AI + humans learn



