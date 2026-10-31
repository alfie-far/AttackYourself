# Agentic Cognition

**Status:** proposed research and architecture. The current repository does **not** implement a persistent knowledge graph, durable memory or the complete cognitive loop described here.

## 1. Purpose and Scope

AttackYourself studies how an agent becomes better at exploring a bounded World, distinguishing what it knows from what it suspects, and producing evidence-backed **candidate Attack Plans**. It does not assume that articulate reasoning is correct. The agent can propose; **only independent domain checks and authorised humans can approve execution**.

This is a deeper specification of the existing **B. Agentic Reasoning Plane**. It does not create a sixth architectural plane.

## 2. The Agent's Perception of a World

A World includes environmental state, rules, identities, assets and consequences. The agent only encounters the subset exposed through authorised MCP tools and observation interfaces, supplemented by appropriately scoped context and memory.

An observation should identify the World, revision, target, tool/schema, source, timestamp, request scope and limitations. Declared fixture content, actual AWS state and inferred relationships must remain distinct.

An MCP gateway is an *interface to a World*, not a complete World representation or a source of execution authority. See [World Model](./WORLD-MODEL.md).

## 3. Knowledge and Epistemic State

| Kind | Meaning | Proof status |
| --- | --- | --- |
| **Observation** | Scoped and sourced tool response | Establishes only what the source reliably reports |
| **Inference** | Derived claim citing assumptions and premises | Valid only to the extent premises and derivation hold |
| **Hypothesis** | Falsifiable, unverified proposed relationship | Not evidence of actual target behaviour |
| **Memory** | Retained knowledge or experience, possibly stale | May inform reasoning; never an authorisation or current-state proof |
| **Evidence** | Preserved attributable records of an attempted action or result | Can support specified assessment conclusions |

A conceptual cognitive-state representation:

~~~text
CognitiveState
  worldRef / worldRevision / goal
  authorisedObservationScope
  observations[]    # source, time, tool, completeness
  claims[]          # observed/inferred/hypothetical, premises, confidence
  graphEdges[]      # typed relation, provenance, validity
  hypotheses[]      # prediction, falsifier, information need
  memoryRefs[]      # origin, scope, age, retention
  pendingQuestions[]
  toolTimeCostBudget
  candidatePlanRefs[]
  workflowCheckpointRef
~~~

**Model-rated confidence is not calibrated statistical probability.** Calibration requires repeatable experiments against independently established outcomes.

## 4. Hypothesis Generation and Attack Graphs

Suppose an observation links Lambda A to Role B and another shows an S3 permission statement related to Bucket D. The proposition that B *can actually read D* is still a **hypothesis**: resource policies, session constraints, permission boundaries, explicit denies and request context can change the result.

Graph edges must distinguish **observed, inferred and hypothetical** relationships. Each inferred path records its premises, source time, known blind spots and possible falsifiers. A plausible attack graph is not authority to try the path.

## 5. Memory and Experience

Useful memory categories:

- **Working/checkpoint state:** current goal and durable workflow progress, including a pause for human review.
- **Episodic:** prior runs, tool outcomes, surprises and lessons, with provenance.
- **Semantic:** reusable security concepts and abstracted knowledge.
- **Procedural:** planning strategies, never credentials or delegated permissions.

Memory read/write operations must preserve source, age, World, sensitivity and retention decisions. Historical success is not a current target observation. **Workflow checkpoints, long-term agent memory and temporal-policy session history are three different kinds of state**, with different lifetimes and authority. None is an approval mechanism.

LangGraph, Strands, AgentCore Memory and graph stores are candidates for later ADRs, not decisions imposed by this document.

## 6. The Cognitive Feedback Loop

~~~mermaid
flowchart TB
    W["World Model and Observations"] --> K["Knowledge and Hypothesis Graph"]
    M["Memory and Prior Experience"] --> K
    K --> C["Cognitive Feedback Loop"]
    C --> R["Proposed Attack Plan"]
    R --> V["Validation and Human Review"]
    V --> P["Attack Pipeline"]
    P --> D["Authorised Attack Deployment"]
    D --> E["Execution Evidence"]
    E --> K
~~~

This is a **conceptual information-flow loop**, not a deployed graph. Inside the cognitive loop, the agent must also be able to select another permitted read-only observation, suspend for review or stop with explicit uncertainty.

A healthy loop updates its understanding in response to the actual world, not merely in response to its own successive explanations.

## 7. Exploration and Information Gain

Rank potential inquiries by **expected information value**, relevance to the objective, ability to distinguish hypotheses, quality of available evidence, execution risk, scope and remaining time/tool budget.

A high-interest but disallowed action remains disallowed. Expected information gain is initially a heuristic; calling a plan statistically likely demands measured success on specified trials.

## 8. Uncertainty and Contradictions

Retain contradictory observations along with timestamps and provenance. Mark dependent inferences and graph edges *contested* or *stale*. Do not erase inconvenient evidence or silently convert a hypothesis into an observed fact.

When safe and useful, request an authorised observation to resolve ambiguity. Otherwise report the uncertainty. A World may drift between observation, plan review and deployment; plans need freshness checks.

## 9. Stopping Conditions and Goal Progress

Stop or request human attention when the objective is answered, information gain is low, evidence is insufficient, budgets expire, prerequisites fail, scope is ambiguous, contradictions cannot be resolved safely, approval is denied or cleanup cannot be guaranteed.

**A safe stop is a valid result.** A policy denial is not an invitation to route around the same restriction. Track progress through supported claims, reduced uncertainty, verified prerequisites and the quality of candidate plans—not the number of tool calls or amount of generated text.

## 10. Human Review and Execution Handoff

A candidate plan should present World/target scope, observations and graph paths, hypotheses and falsifiers, uncertainties, proposed techniques, expected target defences, possible side effects, evidence requirements, stop conditions and cleanup.

The human approves a **versioned, typed artefact with specified scope and limits**, not an opaque reasoning trace. Independent validation and compilation must precede active execution; material edits require reapproval. See [Plan Compilation](./PLAN-COMPILATION.md).

## 11. Evaluation of Cognitive Behaviour

| Dimension | Suggested measurement |
| --- | --- |
| Grounding | Unsupported claims and graph edges |
| Calibration | Claimed confidence against repeatable outcomes |
| Efficiency | Meaningful uncertainty reduction per observation, cost and time |
| Plan quality | Candidate plans passing schema/semantic validation |
| Discipline | Safe stops, correct treatment of denied operations |
| Adaptation | Revision quality following contradictory observations |
| Generalisation | Held-out World performance after memory/curriculum exposure |

Measure **agent/harness correctness separately from target defensive effectiveness**: the agent can behave properly while exposing a genuine vulnerability, or behave poorly even against a secure target.

## 12. Open Research Questions

- Do structured graphs outperform well-structured text?
- When does episodic memory improve transfer, and when does it introduce stale assumptions?
- How do we prevent unproductive self-reflection?
- Can we measure information gain and confidence calibration reproducibly?
- Does progressive curriculum improve performance in unfamiliar Worlds?
- Which cognitive transitions should be model-based, and which should be deterministic?
- How can feedback revise future plans without implicitly extending execution authority?

Related: [World Model](./WORLD-MODEL.md), [Plan Compilation](./PLAN-COMPILATION.md), [Determinism and Curriculum](../research/DETERMINISM-AND-CURRICULUM.md), [Glossary](../domain/GLOSSARY.md).
