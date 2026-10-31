# Plan Compilation: Turning a Hypothesis into Governed Execution

**Status:** design only. A compiler, human approval workflow and active Attack Deployment controller are not yet implemented.

## The essential separation

A model may propose a plausible plan, but **a proposed plan is not executable authority**. AttackYourself translates a candidate into a typed, verifiable and independently approved workflow.

~~~mermaid
flowchart TB
  R["Reasoning + sourced observations"] --> C["Candidate Attack Plan"]
  C --> V["Schema, semantic and scope checks"]
  V --> H["Human review + authorisation"]
  H --> P["Compiled Attack Pipeline"]
  P --> X["Validate compiled graph against approval"]
  X --> D["Attack Deployment: target, identity, policy, limits"]
  D --> T["Constrained tool + target result"]
  T --> E["Evidence + independent evaluations"]
  E -. "Future revised candidate" .-> C
~~~

## Four artefacts

- **Candidate Attack Plan:** unapproved objective, hypotheses and source observations, target characteristics, candidate techniques, prerequisites, expected controls, evidence requirements, risks and cleanup.
- **Attack Plan:** reusable, versioned intent. Approval is tied to a specific plan version and execution envelope.
- **Attack Pipeline:** typed execution graph compiled from a validated plan; contains deterministic stages and enumerated agent-choice branches within approved bounds.
- **Attack Deployment:** one authorised run binding the Pipeline to concrete World/targets, IAM identity, capabilities, policies, budgets, time window, lifecycle and cleanup.

Illustrative **non-executable** candidate:

~~~json
{
  "schemaVersion": "draft-0",
  "planId": "scoped-iam-s3-test",
  "revision": 1,
  "worldRef": "lab-iam-s3-01@1",
  "objective": "Assess designated role access to a test object",
  "hypothesisRefs": ["hyp-1"],
  "observationRefs": ["obs-4", "obs-8"],
  "targetSelectors": ["approved-lab-bucket"],
  "candidateCapabilities": ["validate_target", "test_scoped_s3_read"],
  "expectedControls": ["IAM", "CloudTrail"],
  "evidenceRequirements": ["tool-result", "target-access-decision"],
  "stopConditions": ["scope-mismatch", "policy-denied", "budget-exceeded"],
  "cleanupRequirements": ["verify-no-test-state"]
}
~~~

It is a conceptual example, not a formal schema or configured probe.

## Deterministic validation and approvals

| Gate | Requirement | When it fails |
| --- | --- | --- |
| Schema | Valid types and version | Reject |
| References | World, hypotheses, observations, tools exist and are current | Reject or clarify |
| Semantics | Steps/prerequisites/evidence/cleanup are coherent | Reject |
| Scope | Resources/operations/identity fall inside owner-approved limits | Reject |
| Safety | Cost, rate, time, side effects and blast radius are acceptable | Escalate/reject |
| Review | An authorised human approves a precise candidate | Wait; do not execute |
| Compilation | Every graph branch is type-safe and permitted | Reject |
| Deployment | Target, identity, policy and freshness match approval | Reject/reapprove |

Bind approval to the **canonical plan digest, revision, World/target scope, capability IDs and revisions, parameters, execution identity, policy revision, time/budget limits, approver/expiry, evidence/cleanup and verified Pipeline digest or compiler version**. Material changes require renewed approval.

## Determinism without scripting away reasoning

Reasoning may choose *which authorised step* is informative next. Execution controls determine *which operations can ever take effect*. A Pipeline includes explicit step IDs, typed inputs/outputs, preconditions, allowed branches, retries, timeouts, stop states, event IDs and cleanup on all exits.

The exact workflow engine, state store and compiler representation are open ADR decisions. A LangGraph checkpoint may support long-running human review, but **it is not the agent's long-term memory nor the policy-session state**.

## Identity, temporal policy and target controls

A useful temporal invariant is **validation of target X must precede the probe of that same X within an authorised session**. The selected policy engine's actual supported operators, context and session lifetime must be verified during implementation.

Keep separate:
- **Harness enforcement:** what AttackYourself's agent and tools are permitted to attempt.
- **Target defensive controls:** what IAM, WAF and other protections actually prevent, detect or respond to.

**A harness-denied action does not establish target prevention** because the target may never receive it. Preserve policy decisions, tool invocations, target outcomes, evidence and cleanup under a correlated run ID.

Fail closed on missing approval, stale scope, unexpected identity, unsupported tool, unavailable policy evaluation or exceeded limits. The emergency stop must not depend on model cooperation.

## Open design decisions

Canonical schema and Pipeline IR, approval workflow and content digest, checkpoint store, policy-session binding, graph validity checks, evidence correlation, and validation of cleanup semantics.

Related: [World Model](./WORLD-MODEL.md), [Agentic Cognition](./AGENTIC-COGNITION.md), [Reference Architecture](../REFERENCE-ARCHITECTURE.md), [Glossary](../domain/GLOSSARY.md).
