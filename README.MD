# AttackYourself

AttackYourself is an AWS security-control assessment project. Its goal is to
run tightly scoped attack simulations and report, with execution evidence, how
well an environment prevents, detects, contains, and recovers from them.

The product should be treated as a continuous purple-team report, not as a
single opaque security score. Findings need to be grounded in what actually
happened and the evidence collected during each authorized scenario.

## Project vision and development approach

- [Product vision](./docs/PRODUCT-VISION.md) describes the scorecard and the
  proposed bounded AgentCore attack-simulation architecture.
- [SDLC approach](./docs/SDLC.md) describes how product intent, AI-assisted
  development, deterministic verification, delivery, observability, and
  feedback fit together.
- [`AGENTS.md`](./AGENTS.md) contains concise repository-wide implementation
  guidance. [`CLAUDE.md`](./CLAUDE.md) imports the same guidance.
- [`AttackYourself/AGENTS.md`](./AttackYourself/AGENTS.md) contains detailed
  AgentCore configuration and infrastructure guidance.

## Current repository

The AgentCore project is in [`AttackYourself/`](./AttackYourself/):

- `app/AdversaryAgent/` — TypeScript Strands agent runtime
- `agentcore/agentcore.json` — AgentCore runtime and resource configuration
- `agentcore/.llm-context/` — configuration types and validation constraints
- `agentcore/cdk/` — AWS CDK infrastructure and tests

The current repository is an early scaffold; the controlled attack-simulation
tool, gateway policy enforcement, target environment, and evidence-backed
scorecard described in the vision are not yet implemented. Treat the vision
as the intended direction, not as a description of existing capabilities.

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
`app/AdversaryAgent/model/load.ts` and an Exa MCP endpoint configured in
`app/AdversaryAgent/mcp_client/client.ts`.

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
