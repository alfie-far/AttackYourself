# AttackYourself Domain Glossary

**Status:** conceptual vocabulary. Mentioning a domain concept does not imply that a service or class has been implemented.

| Term | Definition |
| --- | --- |
| **World** | Versioned environment with state, rules, dynamics, observability, boundaries and a learning or assessment objective. Not synonymous with MCP. |
| **World definition** | Declared metadata about an environment; not a live observation or grant of authority. |
| **Capability** | Narrow, typed, versioned observation or action exposed through tools, MCP or a gateway. |
| **Observation** | What a scoped tool reported, with timestamp, provenance, limitations and context. |
| **Inference** | Derived claim with explicit source premises and uncertainty. |
| **Hypothesis** | Falsifiable proposition about an attack path or expected outcome that is not verified. |
| **Knowledge / attack graph** | Typed relations, with edges marked observed, inferred or hypothetical and linked to supporting material. |
| **Memory** | Retained experience or knowledge that can inform reasoning but may be stale; not an authority source. |
| **Evidence** | Preserved, attributable result that supports a *specific* assessed claim. |
| **Cognitive loop** | Bounded observe → update → hypothesise → inquire/stop/plan feedback process. |
| **Curriculum** | Progressive sequence of Worlds and tasks with defined competencies and independent measurements. |
| **Candidate Attack Plan** | Unapproved, non-executable proposal of intent, hypotheses, prerequisites, techniques and expected controls. |
| **Attack Plan** | Reusable, versioned intent and conditions for a security assessment. An approval applies to a specific version and scope. |
| **Attack Pipeline** | Validated typed execution graph derived from a Plan, including deterministic gates and bounded agent-selected branches. |
| **Attack Deployment** | Concrete authorised instance of a Pipeline bound to target, identity, tools, policy, limits, lifecycle and cleanup. |
| **Harness policy** | AttackYourself's independent enforcement of what its own adversary tools may attempt. |
| **Target security control** | IAM, resource policies, detection/alerting, WAF, containment or recovery being assessed on the target. |
| **Workflow checkpoint** | Durable orchestration state for resuming a workflow; distinct from long-term memory and temporal-policy session history. |
| **Temporal policy** | Runtime constraint conditioned on relevant preceding events in a policy session, where the implementation supports it. |
| **Assessment** | Evidence-backed conclusion about a specified target-control outcome, with uncertainty and coverage explicit. |

## Architectural invariants

1. **Reasoning is not authority.** Memory, model output, inferred graphs and hypotheses cannot approve real side effects.
2. **World != MCP interface.** Tools provide a view or capability, not the entire state or rules of the environment.
3. **Observation != inference != hypothesis != memory != evidence.** Maintain epistemic status and provenance.
4. **Candidate Plan != approved Plan != Pipeline != Deployment.** Each stage has explicit, independently checked semantics and permission.
5. **Harness denial != target prevention.** A request blocked before reaching the target does not test target security controls.
6. **Static declared World != verified live AWS state.** A simulated fixture is not proof of real resource configurations.
7. **Probabilistic reasoning != probabilistic authority.** Execution constraints are enforced deterministically.
8. **Research aspiration != delivered behaviour.** Label designs, experiments, implemented functionality and proven results separately.

Related: [Product Vision](../PRODUCT-VISION.md), [Reference Architecture](../REFERENCE-ARCHITECTURE.md), [World Model](../architecture/WORLD-MODEL.md), [Agentic Cognition](../architecture/AGENTIC-COGNITION.md), [Plan Compilation](../architecture/PLAN-COMPILATION.md).
