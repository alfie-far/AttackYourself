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

| Milestone | AttackYourself capability | Proof |
| --- | --- | --- |
| **0 — Foundation** | Agent -> constrained tool -> target information | End-to-end circuit works |
| **1 — Observe** | Real, read-only environment inspection | Agent reasons over actual bounded AWS state |
| **2 — Plan** | Reusable Attack Plan model | Security scenarios exist independently of implementation |
| **3 — Pipeline** | Executable attack workflows | Plans become policy-bounded execution graphs |
| **4 — Deploy** | Attack Deployment lifecycle | A pipeline safely targets a concrete authorised environment |
| **5 — Correlate** | Security telemetry and execution evidence | Actions correlate with CloudTrail, GuardDuty, or other signals |
| **6 — Evaluate** | Evidence-backed scorecards | Prevention, detection, containment, evidence, and recovery are measured |
| **7 — Adapt** | Evidence-driven adversarial reasoning | The agent chooses permitted alternate paths based on observations |
| **8 — Campaigns** | Multiple pipelines coordinated toward an objective | Bounded purple-team exercises emerge from reusable plans |

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

The observation identity should remain least-privilege and read-only.

### Milestone 2 — Plan

**Goal:** Define a reusable Attack Plan model.

A plan should express objective, prerequisites, target characteristics,
candidate techniques, expected controls, evidence requirements, stop
conditions, cleanup requirements, and optional ATT&CK mappings.

A plan should be versioned and reusable independently of any one AWS account or
concrete deployment.

### Milestone 3 — Pipeline

**Goal:** Turn Attack Plans into executable, policy-bounded Attack Pipelines.

A pipeline should combine deterministic stages with explicit decision points,
agent-selected branches within allowed bounds, typed capability contracts,
evidence collection points, stop semantics, and cleanup.

The pipeline defines the permitted execution graph while allowing the agent to
adapt within that graph based on observations.

### Milestone 4 — Deploy

**Goal:** Introduce Attack Deployment lifecycle.

A deployment binds a pipeline to an authorised account, region, target scope,
policy set, identities, budgets, limits, run identifier, and cleanup state.

The same reusable pipeline should be safely instantiable against different
explicitly authorised targets.

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

### Milestone 7 — Adapt

**Goal:** Use observations to drive bounded adversarial adaptation.

The system may generate alternative hypotheses and choose another permitted
branch, but it must not expand its authority beyond the predefined execution
envelope.

### Milestone 8 — Campaigns

**Goal:** Coordinate multiple Attack Pipelines toward a broader authorised
security objective.

Potential capabilities include multi-stage campaigns, cross-scenario evidence,
attack-path graph construction, campaign-level stop conditions, and
longitudinal resilience trends.

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
