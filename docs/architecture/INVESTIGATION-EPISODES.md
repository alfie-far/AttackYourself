# Investigation Units and Bounded Episodes

**Status:** proposed operating model and research direction. The current repository does **not** implement stream ingestion, a configurable labelling engine, an activation controller, persistent episodes, or an investigation service. The existing semantic World prototype is an offline research experiment; the AgentCore AdversaryAgent remains a separate runtime.

## Thesis

**Always-on perception; conditional activation; finite investigation; persistent, evidence-qualified outcomes.**

AttackYourself should not invoke an LLM on every stream event or keep an investigator reasoning forever. A lightweight, configurable observation pipeline maintains a World-aware record of incoming information. An activation controller periodically or conditionally creates **Investigation Episodes** with explicit mandates, permitted capabilities, budgets and termination criteria. The cognitive process *within* each episode is the principal area for experimentation.

An Investigation Unit may be installed by an operator in their own AWS account and connected to approved World descriptors, observation adapters, MCP tools and data sources. That deployment belongs to the operator. **The Investigation Unit is not the AdversaryAgent**: they may share an account, but neither should know the other's private implementation or acquire the other's permissions. A World, adapter or episode need not be AWS-specific.

This is a research architecture, **not** a claim that its events produce verified security findings, that the project is currently a scanner or triage service, or that installing the unit grants authority over an account.

## Four logical topologies

These are orthogonal responsibilities, not four mandatory services or new reference-architecture planes.

| Topology | Describes | Governing question |
| --- | --- | --- |
| World | Entities, capabilities, relationships, dynamics and applicable constraints | What exists or may be changing? |
| Epistemic | Observations, assertions, competing hypotheses, provenance, uncertainty and validity | What is believed, and on which evidence? |
| Authority | Mandates, permitted operations, credentials, policy, approval, identity and scope | What may be observed or tested, and by whom? |
| Cognitive | Questions, investigation strategy, memory, feedback, budgets and stopping | Which inquiry is worthwhile next? |

**A change in an investigator's knowledge is not necessarily a change in the World.** Discovering an old IAM policy today does not mean the policy changed today. A valid source citation proves what a source says, not that a proposition is true of live AWS.

## Proposed operating flow

~~~mermaid
flowchart TD
    S["Documents, resource descriptions, event streams"] --> N["Normalise + deduplicate observations"]
    N --> L["Versioned, cheap labelling rules"]
    L --> O["Observation ledger + World-aware state"]
    O --> T["Activation controller: schedule, trigger, threshold, request"]
    T -->|Mandate and budget| E["Finite Investigation Episode"]
    O -->|Snapshot and provenance| E
    E --> R["Episode record + hypotheses + candidate scenarios"]
    R --> U["Proposed World updates / unresolved questions"]
    U --> O
    R --> P["Independent review of candidate Attack Plans"]
    P -->|Separate approval and validation| X["Attack Pipeline -> authorised Attack Deployment"]
    X --> V["Target evidence and evaluation"]
    V --> O
~~~

The arrows describe **information flow**, not automatic permission to mutate World truth or to execute attacks. No episode or classifier may authorise an Attack Deployment.

### 1. Continuous perception: inexpensive and reproducible

Ingest explicitly configured World sources: authored descriptions, scoped read-only adapter responses, AWS event streams or external documents. Preserve the original source (or an access-controlled immutable reference), its declared origin, source identity and version, capture time, reported event/effective time, ingestion time, schema and completeness/error indicators.

Normalisation and labelling should generally be deterministic and cheap. **A Label is an observation classification, not an observed permission, security finding, fact, or model confidence score.** A classifier match may be certain while the security implications remain unknown.

Labelling is a **prewritten, versioned, tuneable ruleset**. The first implementation can be declarative rules, not an LLM. Optional model-based classification should be separately authorised, measured and cost-controlled. Ruleset changes must not silently rewrite historical evidence; retain the ruleset version and support explicit replay/reclassification.

Illustrative **non-executable** labels:

~~~yaml
observationRef: obs-042
worldRef: lab-iam-01@3
source:
  kind: fixture
  ref: synthetic/iam-policy-change
  capturedAt: "2026-11-22T00:00:00Z"
labels:
  - domain: identity
    event: policy_changed
    subjectKind: iam_role
  - inquiry: recheck_effective_access
classification:
  ruleset: aws-iam-observation-v1
  rule: iam-policy-change
~~~

These values are synthetic. They do not establish that an actual IAM policy changed or that effective access exists.

For streams, account for duplication, retries, out-of-order delivery, missing data, late arrival and backfills. Use event identity and idempotency keys, source-specific watermarks or reconciliation windows where appropriate. Distinguish **event/effective time** from **observation time** and **ingestion time**. Avoid building a World snapshot by naively applying events in arrival order. Preserve history even when the materialised current view changes.

### 2. Activation: decide whether an episode is justified

The activation controller is not the investigator. It evaluates versioned activation policies over labels, affected World entities, pending questions, recent episodes and resource budgets.

Candidate triggers:

- **Periodic:** a scheduled review of unresolved, ageing questions.
- **Event-sensitive:** a meaningful change intersects a monitored relationship or unresolved hypothesis.
- **Contradiction:** new evidence disputes a currently supported interpretation.
- **Cumulative:** several low-significance observations collectively cross a threshold.
- **Operator-requested:** an explicitly scoped investigation is requested.

The controller should support deduplication, batching/coalescing, cooldowns, priority, rate and concurrency limits, and per-World budgets. It may decide **not** to investigate. A trigger is not a finding and is not authority to use tools. Active tests cannot be made eligible by modifying an activation rule.

### 3. Investigation: one bounded episode

An **Investigation Episode** is a finite run with an independently recorded contract. An episode should bind at least:

| Field | Purpose |
| --- | --- |
| Episode ID and trigger | Stable identity; why it started |
| World reference and consistency boundary | Snapshot/revision and as-of window; avoid silently mixing incompatible states |
| Mandate and questions | What the investigator is trying to establish or falsify |
| Evidence references | Provenance-labelled initial observations and prior relevant episode outcomes |
| Permitted capabilities and identity | Independently enforced read-only scope by default; no inherited attack authority |
| Policy and version | Checkable authority rules, including any expiry or approval requirements |
| Budgets | Max time, model tokens/cost, tool calls, concurrency and risk |
| Termination criteria | Answered, inconclusive, deferred, exhausted, denied, cancelled or expired |

Example **contract sketch, not a runnable schema**:

~~~yaml
episodeId: episode-001
worldRef: lab-iam-01@3
triggerRef: trigger-009
mandate: "Determine whether the observed policy change warrants a bounded access hypothesis."
questionRefs: [question-iam-01]
evidenceRefs: [obs-042]
capabilityPolicy:
  mode: read-only
  allowed: [inspect_scoped_iam_policy]
limits:
  maxToolCalls: 5
  maxDurationSeconds: 180
  maxModelTokens: 12000
exit:
  - answered
  - inconclusive
  - budget_exhausted
  - policy_denied
~~~

The internal cognitive topology is **deliberately unresolved**. A single model, investigator/critic pair, deterministic graph search or multiple agents could satisfy the same episode contract. Possible internal steps include forming competing hypotheses, selecting a permitted high-information observation, revising beliefs when evidence contradicts them, and deciding to stop. Do not presume that repeated reflection equals learning.

Episode transitions should be durable and distinguish `activated`, `contextualised`, `investigating`, `concluding` and terminal outcomes. Checkpoint/resume is distinct from long-term memory. An episode must be cancellable independently of model cooperation. A terminated episode never silently continues executing.

### 4. Publish outcomes without promoting conjecture

An episode may publish:

- **Episode Record:** mandate, World/version, decision and observation trace, actual cost, tools used, limitations and termination reason.
- **Hypotheses and scenarios:** evidence links, assumptions, alternative explanations, falsifiers and remaining questions. An attack scenario is **not** an approved Attack Plan.
- **Proposed World revisions:** validated source-grounded assertions and interpretations; publication to a shared World requires independent integrity/consistency checks, not a model's assertion.
- **Candidate Attack Plans:** optional, typed and explicitly non-executable until the existing [Plan Compilation](./PLAN-COMPILATION.md) and approval process applies.

A run that stopped safely, rejected a tempting hypothesis, or concluded **inconclusive** is a meaningful outcome. Do not report missing traces as proof of no errors, or interpret harness-policy denial as target-side prevention.

## Open source and portability

Aim to distribute **World Packs** (portable, versioned descriptions and fixtures), **Adapters** (bounded observation contracts) and **Investigation Strategies** (skills or policies) separately from operator credentials, private telemetry and runtime deployments. A user should eventually be able to run a deterministic synthetic World and replay an episode **without AWS credentials, a paid model or an installed AdversaryAgent**.

A deployed AWS Investigation Unit is an opt-in implementation: the user explicitly configures target scope, connectors, secrets and budget, and owns its infrastructure. A World Pack never implicitly executes code, installs an MCP server, grants IAM access, initiates scans, or propagates itself to other accounts. Third-party executable adapters require their own trust, review and authorisation.

The core World contracts should remain independent of Bedrock and AgentCore. Model providers, storage, streaming transports and cloud workflow services are adapters, not part of World identity. Bedrock and AgentCore are candidate backends, **not mandatory dependencies for first use**.

## Evaluation: quality of inquiry, not quantity of alerts

Treat an episode as an experimental unit with a reproducible World snapshot, strategy/version, evidence and budgets. Compare against controlled baselines and held-out Worlds. Proposed dimensions:

| Dimension | What to measure |
| --- | --- |
| Grounding | Unsupported assertions and invented evidence links |
| Revision discipline | Correct response to conflicting/new evidence |
| Efficiency | Meaningful information gained per observation and cost |
| Selection | Unnecessary, redundant or missed episodes |
| Scope compliance | Proper denial and stopping without unauthorised effects |
| Reproducibility | Ability to audit or replay classifications, triggers and episode reasoning |
| Scenario quality | Falsifiability, provenance and validity of proposed experiments |

Do not confuse deterministic label matching with calibrated model confidence. Maintain distinct measurements for **investigator reasoning**, **harness/authority enforcement** and **target control effectiveness**.

## First vertical slice and open questions

Start with **one synthetic Lambda/IAM World**, a deterministic labelling ruleset and two observations: an apparent IAM permission and a later contradictory explicit deny. Show that the controller activates **one** read-only episode, the investigator revises rather than merely repeats its hypothesis, and an episode record captures its conclusion and stopping reason. No cloud deployment, attack tool or new agent is required for this proof.

Then validate a user-owned, read-only AWS adapter and stream ingress without coupling World Engineering to the deployed adversary agent.

Open design decisions include: portable World Pack format; label taxonomy and schema; event-time consistency/replay; trigger hysteresis and episode deduplication; epistemic state storage; multi-investigator isolation; cognitive episode strategies; outcome promotion policy; and evaluation methodology. These should be tested rather than treated as resolved technology choices.

Related: [World Model](./WORLD-MODEL.md), [Agentic Cognition](./AGENTIC-COGNITION.md), [Semantic World Experiment](./SEMANTIC-WORLD-EXPERIMENT.md), [Plan Compilation](./PLAN-COMPILATION.md), [Reference Architecture](../REFERENCE-ARCHITECTURE.md), [Glossary](../domain/GLOSSARY.md), [Roadmap](../ROADMAP.md).
