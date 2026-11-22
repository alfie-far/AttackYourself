# AttackYourself — Product Vision

## The thesis

**AttackYourself is a laboratory for constructing, educating and governing adversarial intelligence. It provides agents with controlled worlds to explore, mechanisms for building evidence-backed knowledge, and feedback loops for developing attack hypotheses. These hypotheses can be transformed into reproducible Attack Plans and, following deterministic validation and human authorisation, executed as policy-bounded Attack Deployments.**

Its original purpose is equally important: to assess how real cloud-security controls **prevent, detect, alert on, contain and recover** from authorised adversarial exercises. Without attributable execution evidence, an agent's cleverness is only a hypothesis about its capabilities.

> **Central research question:** How do we design an agent's world, memory, feedback and curriculum so that useful adversarial reasoning emerges, while its execution remains explainable, reproducible and deterministically constrained?

These two goals reinforce one another. AttackYourself is both an experimental setting for reasoning and a mechanism for producing evidence-backed, continuously repeatable purple-team assessments.

## The operating model: informed continuously, investigating episodically

The platform should maintain **cheap, configurable, World-aware perception** rather than run an expensive reasoning agent for every event. Versioned labelling rules classify and correlate incoming observations; activation policy decides whether accumulated evidence or a periodic review justifies an **Investigation Episode**. Each episode is bounded by a mandate, World snapshot, independently enforced capabilities, budgets and explicit stopping criteria.

**Always-on perception. Conditional activation. Finite investigation. Persistent, evidence-qualified outcomes.**

This sharpens the project's research identity: investigate the *quality of inquiry* and production of falsifiable hypotheses, not the volume of alerts or scan findings. An episode may conclude inconclusively or without an Attack Plan. Investigation and test execution are separate authorities. A user-installed Investigation Unit may operate against authorised Worlds and connectors independently of the existing AdversaryAgent; neither service must know the other's implementation.

The World, epistemic, authority and cognitive **topologies** describe what exists, what is believed, what actions are permitted and how understanding changes. They are logical responsibilities, not new architectural planes. See [Investigation Episodes](./architecture/INVESTIGATION-EPISODES.md).

## From world experience to a governed exercise

~~~text
Constructed World + narrow MCP/tool interfaces
                     |
                     v
Observations with provenance
                     |
                     v
Knowledge / hypothesis graph + memory
                     |
                     v
Cognitive feedback loop
                     |
                     v
Candidate Attack Plan (not executable)
                     |
                     v
Schema + semantic + scope validation
                     |
                     v
Human review and explicit authorisation
                     |
                     v
Compiled, versioned Attack Pipeline
                     |
                     v
Attack Deployment (target + identity + policy + limits)
                     |
                     v
Controlled execution + target telemetry
                     |
                     v
Evidence-backed evaluation and learning
~~~

The established domain relationship remains **Attack Plan → Attack Pipeline → Attack Deployment**. The new cognitive work describes how an agent develops a credible *candidate* plan and how we govern its journey to executable form.

## Five complementary disciplines

These are *conceptual concerns*, not five services and not an additional architectural plane.

### World Engineering

An agent experiences a World through tools and observations. A World is an environment with state, dynamics, constraints, permitted capabilities and consequences; an MCP server is only an interface to some part of that World. We can design synthetic Worlds, instrumented AWS labs and approved assessment environments, then arrange them into increasingly demanding curricula. See [World Model](./architecture/WORLD-MODEL.md).

### Epistemic Engineering

An agent should distinguish **observed facts**, **inferences**, **hypotheses**, **memory** and **evidence**, with source attribution, validity and uncertainty. Graph structures help to explain potential attack paths, but graph edges must not silently promote conjecture to fact. A model-assigned confidence is not a statistically validated likelihood. See [Agentic Cognition](./architecture/AGENTIC-COGNITION.md).

### Cognitive Loop Engineering

A healthy loop asks what it knows, what it needs to know next and whether another bounded observation would meaningfully reduce uncertainty. The agent can construct and revise hypotheses, correct contradictions, recall prior experience and stop when further exploration lacks value or permission. Reflection by itself is not learning.

### Plan Engineering

Natural-language proposals become typed, versioned and reviewable artefacts. Deterministic validation, independent scope checks and human approval precede compilation into constrained execution graphs. Approval is bound to *specific* content, targets, identities and limits. See [Plan Compilation](./architecture/PLAN-COMPILATION.md).

### Governed Execution

The agent's reasoning freedom cannot become permission to invoke arbitrary capabilities. A deployment binds identity, target scope, tool contracts, policy and temporal prerequisites, time and cost budgets, telemetry and cleanup. **Reasoning is not authority.** A successful harness policy denial is an assurance about our execution boundary, **not** evidence that the target's IAM, WAF or other controls would have stopped an attack.

## Security assessment as measurable feedback

The output should be an evidence-backed scenario assessment rather than one opaque aggregate score. Consider a future *hypothetical* test: can an approved simulated Lambda role access a test S3 object?

| Dimension | Question | Evidence required |
| --- | --- | --- |
| Execution | Was the authorised probe attempted? | Identified tool invocation and target result |
| Prevention | Did the **target** IAM/resource policy prevent the operation? | Target access decision |
| Detection | Did an applicable control detect it? | Correlated finding in a defined window |
| Alerting | Was an actionable notification delivered? | Delivery record and timestamp |
| Containment | Was the activity restricted? | Recorded response and observed effect |
| Evidence | Could the activity be reconstructed? | Preserved, attributable timeline |
| Recovery | Was intended state restored? | Verified cleanup/recovery |

**Not tested**, **inconclusive** and **not applicable** must remain explicit outcomes. An absence of an alert is not automatically proof of a detection failure without establishing coverage and observation windows. Agent/harness compliance and target defensive effectiveness are separate evaluations.

## Curriculum and the question of disciplined agency

Robert Sapolsky's *Determined: A Science of Life Without Free Will* provides a philosophical prompt: could improving the environment, learning curriculum, memory and feedback yield more disciplined behaviour than continually instructing an agent to follow rules?

This is **inspiration, not a scientific claim that LLMs learn like humans or that deterministic systems are always predictable**. We can test the engineering hypothesis experimentally on controlled and held-out Worlds. The distinction that matters is between exploratory probabilistic reasoning and independently constrained, auditable execution. See [Determinism and Curriculum](./research/DETERMINISM-AND-CURRICULUM.md).

## Boundaries and current state

**Demonstrated:** a TypeScript Strands adversary on Bedrock AgentCore Runtime invokes a narrow MCP Gateway/Lambda capability and interprets a structured **static simulation-environment fixture**. That verifies an end-to-end agent → gateway → tool → response circuit. It is *not* live scoped AWS discovery or evidence that CloudTrail, GuardDuty or IAM protections worked.

**Implemented offline experiment:** the standalone semantic World prototype constructs source-anchored assertions and revisioned interpretations from synthetic descriptions; it does not operate as a deployed investigation service.

**Not yet implemented:** a deployable Investigation Unit, continuous labelling, episode activation/persistence, general World registry and curricula, real scoped AWS observation, persistent hypothesis/knowledge graphs, long-term memory, durable cognitive loops, typed plan compilation, human approval lifecycle, active policy-bounded deployments, correlated target evidence and scorecards.

**Next proof:** first establish a reproducible, synthetic **label → trigger → finite episode → evidence-qualified outcome** slice independent of the AdversaryAgent. Then connect least-privilege, read-only observation of explicitly authorised AWS resources. Neither step executes attacks. See [Roadmap](./ROADMAP.md).

**Non-goals:** unrestricted autonomous exploitation, testing without owner authorisation, automatic authority gained from model output, replacing evidence with memory or confidence, or marketing-driven aggregate scores.

## Read next

[Reference Architecture](./REFERENCE-ARCHITECTURE.md) ·
[World Model](./architecture/WORLD-MODEL.md) ·
[Investigation Episodes](./architecture/INVESTIGATION-EPISODES.md) ·
[Agentic Cognition](./architecture/AGENTIC-COGNITION.md) ·
[Plan Compilation](./architecture/PLAN-COMPILATION.md) ·
[Domain Glossary](./domain/GLOSSARY.md) ·
[Roadmap](./ROADMAP.md) ·
[Original AgentCore notes (historical)](./history/agentcore-initial-spike.md)
