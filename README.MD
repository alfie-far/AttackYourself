# AttackYourself

AttackYourself is an AWS security-control assessment and agentic-systems
research project: a laboratory for constructing, educating and governing
adversarial intelligence. Agents explore controlled Worlds, form evidence-backed
hypotheses and propose reviewable Attack Plans; authorised, policy-bounded
execution then measures what target security controls actually do.

The product should be treated as a continuous purple-team report, not as a
single opaque security score. Findings need to be grounded in what actually
happened and the evidence collected during each authorized scenario.

The architectural thesis is:

> **AttackYourself builds evidence-backed adversarial hypotheses in controlled
> Worlds, transforms reviewed Attack Plans into policy-bounded Attack Pipelines,
> executes authorised Attack Deployments, and evaluates the resulting evidence.**

The core control loop is:

```text
Reason -> Validate -> Authorise -> Execute -> Observe -> Evaluate
```

## Project vision and architecture

- [Product vision](./docs/PRODUCT-VISION.md) explains the security-control
  assurance mission and expanded adversarial-intelligence research thesis.
- [Reference architecture](./docs/REFERENCE-ARCHITECTURE.md) defines the
  architectural planes, trust boundaries, and the Attack Plan / Attack Pipeline
  / Attack Deployment model.
- [World Model](./docs/architecture/WORLD-MODEL.md) defines environments,
  capability interfaces and progressive curricula.
- [Agentic Cognition](./docs/architecture/AGENTIC-COGNITION.md) defines
  evidence-sensitive hypotheses, graphs, memory and cognitive feedback.
- [Plan Compilation](./docs/architecture/PLAN-COMPILATION.md) explains the
  typed proposal, human-review and execution-authorisation boundary.
- [Domain Glossary](./docs/domain/GLOSSARY.md) defines canonical terms.
- [Determinism and Curriculum](./docs/research/DETERMINISM-AND-CURRICULUM.md)
  records the research influence and testable hypotheses.
- [Roadmap](./docs/ROADMAP.md) describes the product/research milestones and a
  separate track for implementation experiments such as AgentCore examples.
- [SDLC approach](./docs/SDLC.md) describes how product intent, AI-assisted
  development, deterministic verification, delivery, observability, and
  feedback fit together.
- [`AGENTS.md`](./AGENTS.md) contains concise repository-wide implementation
  guidance. [`CLAUDE.md`](./CLAUDE.md) imports the same guidance.
- [`AttackYourself/AGENTS.md`](./AttackYourself/AGENTS.md) contains detailed
  AgentCore configuration and infrastructure guidance.

## Reference architecture at a glance

AttackYourself separates adversarial reasoning from authority and execution.

- **Control Plane** — Attack Plans, scenario library, target definitions,
  policies, guardrails, and deployment constraints.
- **Agentic Reasoning Plane** — source-aware knowledge and hypotheses, attack
  graphs, memory, uncertainty and bounded cognitive feedback.
- **Execution Plane** — Attack Pipelines, policy-gated tools, probes,
  simulations, cleanup, and Attack Deployment lifecycle.
- **Target & Observability Plane** — explicitly authorised AWS targets and the
  telemetry or detection systems that observe them.
- **Evaluation & Outcome Plane** — execution evidence, control effectiveness,
  scorecards, findings, and recommendations.

AgentCore is currently used as part of the reference implementation, but the
architecture is intentionally expressed in AttackYourself concepts rather than
in terms of any single agent platform.

## Current proof

The repository now contains a working deployed observation circuit:

```text
Operator
   |
   v
AgentCore Runtime / AdversaryAgent
   |
   v
Bedrock model
   |
   v
MCP tool selection
   |
   v
AttackGateway
   |
   v
SimulationEnvironment Lambda
   |
   v
Structured environment observation
   |
   v
Agent response
```

The deployed agent can inspect a **static simulation fixture**, not live AWS
resource state, through the explicitly exposed `describe_simulation_environment` capability and report what
that capability returns.

This proves the runtime -> reasoning -> gateway -> tool -> observation path.
It does **not** mean the full reference architecture is implemented. Reusable
Attack Plans, adaptive Attack Pipelines, Attack Deployment lifecycle, policy
enforcement for active attack capabilities, telemetry correlation, and
evidence-backed scorecards remain roadmap items. A persistent World model,
knowledge graph, curriculum engine, plan compiler and human approval workflow
are also **design proposals**, not implemented capabilities.

## Current repository

The AgentCore reference implementation is in
[`AttackYourself/`](./AttackYourself/):

- `app/AdversaryAgent/` — TypeScript Strands agent runtime
- `agentcore/agentcore.json` — AgentCore runtime, gateway, and target
  configuration
- `agentcore/.llm-context/` — configuration types and validation constraints
- `agentcore/cdk/` — AWS CDK infrastructure and tests
- `tools/` — tool schemas exposed through the gateway

There is no root `package.json`. Run package commands from the applicable
application or infrastructure directory.

## Prerequisites

- Node.js 22 and npm
- The [AgentCore CLI](https://github.com/aws/agentcore-cli)
- AWS credentials with the required Bedrock AgentCore access for local AWS
  model use or deployment

Deployment also requires a configured AWS target. The checked-in
`AttackYourself/agentcore/aws-targets.json` is currently empty.

## Local development

Install dependencies and type-check the agent:

```bash
cd AttackYourself/app/AdversaryAgent
npm ci
npm run build
```

Run the agent locally from the AgentCore project directory:

```bash
cd AttackYourself
agentcore validate
agentcore dev
```

In another terminal, invoke the local agent:

```bash
cd AttackYourself
agentcore invoke --dev "What can you do?"
```

The agent uses a Bedrock model configured in
`app/AdversaryAgent/model/load.ts` and an MCP client configured in
`app/AdversaryAgent/mcp_client/client.ts` to reach `AttackGateway`.

## Tests and infrastructure checks

The agent package currently provides a TypeScript build check but no test
script. Run the CDK tests and build with:

```bash
cd AttackYourself/agentcore/cdk
npm ci
npm test
npm run build
```

## Commits

Changes are not committed automatically. To authorize a commit, include a
standalone directive in your request specifying its scope, for example:

```text
COMMIT: the documentation changes from this task
```

Commits follow Conventional Commits. The full safeguards and staging rules are
in [`AGENTS.md`](./AGENTS.md).

## Configuration and deployment

Read `AttackYourself/AGENTS.md` before changing AgentCore configuration or
infrastructure. The JSON configuration is the source of truth; check the
matching types in `agentcore/.llm-context/` and run `agentcore validate` after
editing it.

Only deploy to AWS targets that are explicitly authorized for this project.
Review the target and proposed changes before running deployment commands.
Never place credentials in source files; local environment files are ignored
by Git.
