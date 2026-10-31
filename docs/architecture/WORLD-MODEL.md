# World Model: Environments, Interfaces and Curriculum

**Status:** proposed architecture; a general World registry or curriculum engine is not currently implemented.

## A World is not an MCP server

A **World** defines an environment with state, rules, dynamic behaviour, entities, observable consequences, unknowns, boundaries and objectives. An **MCP tool or gateway** exposes a capability to *observe or act upon* that World. The tool's schema describes its interface, not the full environment or the authority to act.

This enables deliberate **World Engineering**: design synthetic Worlds, isolated AWS labs and (only with formal authorisation) real assessment environments to teach and test increasingly disciplined adversarial reasoning.

## Components of a World

| Component | Purpose |
| --- | --- |
| Identity/version | Stable World ID, owner, revision and type |
| Environment | Cloud accounts, identities, resources, relationships and application state |
| Rules | Constraints, prerequisites and known consequences |
| Dynamics | How the state can change and how a change propagates |
| Capabilities | Typed, versioned, bounded read and action interfaces |
| Observability | Returned data, telemetry, errors, provenance and blind spots |
| Governance | Scope, principals, allowed operations, budgets and emergency stops |
| Reset/cleanup | Safe restoration and independently verifiable postconditions |
| Curriculum | Progressively complex tasks with measurable success criteria |

Example *declared*, **non-executable** World definition:

~~~yaml
worldId: lab-iam-s3-01
revision: 1
kind: isolated-aws-lab
objective: construct an IAM-to-S3 reachability hypothesis
environment:
  accountRef: authorised-lab-account
  region: ap-southeast-2
  selector: "AttackYourself=true"
capabilities:
  - name: observe_scoped_resource
    mode: read-only
  - name: inspect_iam_relationship
    mode: read-only
curriculum:
  level: hypothesis-generation
execution:
  activeProbes: disabled
~~~

World metadata is not a validated schema, proof that live AWS resources match, or execution permission.

## Observation and action contracts

Observations should carry a World and target revision, capability/schema version, invocation/correlation ID, source, time, data completeness, errors and scope. Keep **declared**, **observed** and **inferred** information separate. The current static Lambda fixture reports simulated data, not verified AWS configuration.

Active tools additionally need checked arguments, explicit owner approval, least-privilege identity, scope/temporal policy, time/cost/attempt limits, recorded consequences and verified cleanup. Agent-facing descriptions are not enforcement.

~~~mermaid
flowchart LR
  W["World state and rules"] --> C["Narrow MCP/tool capability"]
  C --> O["Observation with provenance"]
  O --> K["Knowledge and hypothesis graph"]
  K -. "Next permitted observation" .-> C
~~~

Do not leak synthetic ground truth through agent-visible tools when testing whether the agent can infer it.

## Classes of World

1. **Synthetic World:** resettable and measurable, with independent ground truth.
2. **Isolated AWS lab:** real AWS API responses and telemetry against explicitly scoped lab resources.
3. **Authorised assessment World:** a real environment with formal permission, risk review, tighter operational guardrails, audit and cleanup.

Progression between classes is not automatic. A safe synthetic task does not grant permission to operate in a real target.

## Curricula: designing courses for Worlds

| Stage | What the agent learns | Evaluation |
| --- | --- | --- |
| Observe | Report facts with sources | Unsupported assertion rate |
| Infer | Form testable graph hypotheses | Support and falsifiability of edges |
| Plan | Draft bounded candidate Attack Plans | Typed/semantic validation |
| Discipline | Handle denial, missing prerequisites and safety limits | Actual bounded behaviour and safe stops |
| Adapt | Revise beliefs after negative or contradictory evidence | Calibration and performance on unseen Worlds |

Increase complexity by introducing uncertain resource relationships, partially visible state, multiple identities, competing controls and misleading signals. Evaluate transfer on **held-out Worlds** rather than rehearsed scenarios.

World fidelity, agent-quality outcomes and target-control effectiveness remain distinct measurements.

## Open design questions

What is the smallest useful World schema? How is hidden state represented? How should World revisions invalidate old observations or approvals? What can synthetic results predict about an AWS lab? Which reset/cleanup guarantees can be independently demonstrated?

See [Agentic Cognition](./AGENTIC-COGNITION.md), [Plan Compilation](./PLAN-COMPILATION.md), [Reference Architecture](../REFERENCE-ARCHITECTURE.md) and [Glossary](../domain/GLOSSARY.md).
