# AttackYourself Roadmap

This roadmap separates the **AttackYourself product and research story** from
technology-specific exploration.

AttackYourself should grow only when a capability advances the core idea:
reusable, policy-bounded adversarial validation backed by execution evidence.
Agent platform features can be explored separately as reference deployments or
examples when they do not naturally belong in the product story.

## Product and research track

```text
FOUNDATION
    |
    v
OBSERVE
    |
    v
PLAN
    |
    v
PIPELINE
    |
    v
DEPLOY
    |
    v
CORRELATE
    |
    v
EVALUATE
    |
    v
ADAPT
    |
    v
CAMPAIGNS
```

| Milestone | AttackYourself capability | Added research objective |
| --- | --- | --- |
| **0 — Foundation** | Agent → bounded tool → structured fixture | Demonstrate a working circuit, not live AWS verification |
| **1 — Observe** | Real, read-only scoped AWS observation | **Construct a World model from tool observations** |
| **2 — Plan** | Reusable Attack Plan model | **Generate hypotheses with provenance and explicit uncertainty** |
| **3 — Pipeline** | Typed, executable bounded workflow | **Compile candidate plans into validated execution graphs** |
| **4 — Deploy** | Authorised Attack Deployment | **Bind human approval, identity, scope and temporal policy** |
| **5 — Correlate** | Execution plus defensive telemetry | **Convert World interactions into preserved evidence** |
| **6 — Evaluate** | Evidence-backed security assessment | **Measure both agent reasoning quality and target security-control effectiveness** |
| **7 — Adapt** | Evidence-driven adversarial reasoning | **Demonstrate useful feedback, learning and correction** |
| **8 — Campaigns** | Coordinated reusable pipelines | **Apply experience across increasingly complex Worlds** |

### Milestone 0 — Foundation

**Goal:** Prove the complete agent-to-tool circuit.

The current deployment demonstrates hosted adversarial reasoning, MCP tool
discovery and invocation, a constrained gateway, a Lambda-backed capability, and
a streamed response.

**Status: proven.**

### Milestone 1 — Observe

**Goal:** Replace static environment description with real, read-only,
explicitly bounded AWS observation.

Potential capabilities:

- discover resources only within authorised scope
- tag-based resource selection such as `AttackYourself=true`
- inspect relevant IAM and resource configuration
- identify enabled security controls
- return structured observations to the agent

The observation identity should remain least-privilege and read-only. Every
result should identify its World, source and limitations. Static simulation
fixtures must not be mistaken for actual AWS findings. See
[World Model](./architecture/WORLD-MODEL.md).

### Milestone 2 — Plan

**Goal:** Define a reusable Attack Plan model.

A plan should express objective, prerequisites, target characteristics,
candidate techniques, expected controls, evidence requirements, stop
conditions, cleanup requirements, and optional ATT&CK mappings.

A plan should be versioned and reusable independently of any one AWS account or
concrete deployment. Record observed premises, unverified hypotheses, explicit
uncertainty and traceable candidate artefacts. A candidate is not executable.

### Milestone 3 — Pipeline

**Goal:** Turn Attack Plans into executable, policy-bounded Attack Pipelines.

A pipeline should combine deterministic stages with explicit decision points,
agent-selected branches within allowed bounds, typed capability contracts,
evidence collection points, stop semantics, and cleanup.

The pipeline defines the permitted execution graph while allowing the agent to
adapt within that graph based on observations. Add deterministic schema,
semantic/scope validation and explicit human approval before active execution.
See [Plan Compilation](./architecture/PLAN-COMPILATION.md).

### Milestone 4 — Deploy

**Goal:** Introduce Attack Deployment lifecycle.

A deployment binds a pipeline to an authorised account, region, target scope,
policy set, identities, budgets, limits, run identifier, and cleanup state.

The same reusable pipeline should be safely instantiable against different
explicitly authorised targets. Approval must bind target, identity, capabilities,
policy and limits, with session-specific prerequisites where appropriate.

### Milestone 5 — Correlate

**Goal:** Connect execution with defensive telemetry.

Potential evidence sources include CloudTrail, GuardDuty, Security Hub,
CloudWatch, application telemetry, SIEM, and external alerting.

AttackYourself should be able to explain not only what it attempted, but what
the defensive environment observed in response.

### Milestone 6 — Evaluate

**Goal:** Produce evidence-backed control assessments.

Evaluation dimensions may include attack execution, prevention, detection,
alerting, containment, evidence preservation, recovery, and cleanup.

The control-level evidence is more important than a single aggregate score.
Keep agent/harness evaluation separate from target control effectiveness:
a harness-policy denial is not a target IAM prevention result.

### Milestone 7 — Adapt

**Goal:** Use observations to drive bounded adversarial adaptation.

The system may generate alternative hypotheses and choose another permitted
branch, but it must not expand its authority beyond the predefined execution
envelope. Measure correction from contradictory observations, memory value,
calibration and information efficiency on unfamiliar Worlds.

### Milestone 8 — Campaigns

**Goal:** Coordinate multiple Attack Pipelines toward a broader authorised
security objective.

Potential capabilities include multi-stage campaigns, cross-scenario evidence,
attack-path graph construction, campaign-level stop conditions, and
longitudinal resilience trends.

## Cross-cutting research programme

The milestones above incorporate these research objectives **without
implying that the associated services already exist**:

- Define a minimal World/observation model with provenance, limits, and
  hidden ground truth for synthetic tests.
- Experiment with distinct observations, inferences, hypotheses, graphs,
  long-term memory and a candidate-only cognitive feedback loop.
- Design a curriculum for observing, reasoning, planning, discipline and
  adaptation. Evaluate on held-out Worlds rather than rehearsed scenarios.
- Compare structured state, episodic memory and feedback against a baseline
  using plan validity, calibration, unsupported claims, information gain and
  correct safe-stopping metrics.
- Design and validate typed plan compilation, human authorisation, narrowed
  identity, runtime and temporal policy before active probes.
- Keep workflow checkpoints, long-term agent memory, and policy-session
  history separate. One cannot silently substitute for another.

See [World Model](./architecture/WORLD-MODEL.md),
[Agentic Cognition](./architecture/AGENTIC-COGNITION.md),
[Plan Compilation](./architecture/PLAN-COMPILATION.md) and
[Determinism and Curriculum](./research/DETERMINISM-AND-CURRICULUM.md).

## Near-term focus

```text
Static observation
       |
       v
Real read-only observation
       |
       v
Reusable Attack Plan schema
       |
       v
First policy-bounded Attack Pipeline
```

That sequence preserves the core safety boundary while turning the current
working circuit into a reusable security-validation system.

## Reference implementation and platform exploration track

This track is deliberately separate from the AttackYourself milestones.

The rule is:

> Use a platform feature in AttackYourself when the product genuinely needs
> the capability. Otherwise demonstrate the feature through a focused example
> deployment.

A future examples area could look like:

```text
examples/
  agentcore-runtime/
  agentcore-gateway/
  agentcore-policy/
  agentcore-memory/
  agentcore-evaluations/
  agentcore-knowledge/
  agentcore-observability/
```

Examples should demonstrate a correct use case rather than forcing every
available AgentCore feature into the AttackYourself architecture.

Potential mappings include:

| Need or experiment | Candidate AgentCore feature |
| --- | --- |
| Hosted agent execution | Runtime |
| MCP capability gateway | Gateway |
| Deterministic tool authorisation | Policy Engine / Cedar |
| Stateful reasoning across runs | Memory, if a genuine product need emerges |
| Threat or control reference material | Knowledge Base, if retrieval is useful |
| Agent behaviour regression testing | Evaluators / datasets |
| Continuous behaviour assessment | Online evaluation |
| Runtime diagnostics | Logs / traces / observability |

This keeps AttackYourself coherent while still allowing the repository to grow
into a portfolio of correctly motivated agent-platform experiments.
