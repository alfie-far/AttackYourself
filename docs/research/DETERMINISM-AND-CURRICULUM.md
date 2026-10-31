# Determinism and Curriculum: Designing Disciplined Agents

**Status:** philosophical motivation and research proposals, not experimental results.

## The Sapolsky connection

Robert Sapolsky's *Determined: A Science of Life Without Free Will* makes it interesting to ask how prior conditions, experiences and environment influence behaviour. For AttackYourself, the useful *engineering analogy* is to design controlled Worlds, repeated feedback, memory and a curriculum that makes useful, disciplined reasoning more reliable.

This analogy is **not proof that LLM learning is equivalent to human learning**, that the free-will debate is settled, or that a deterministic system must be predictable in practice. Our goal is **predictable execution boundaries around non-deterministic-looking reasoning**, without needing to reduce agents to fixed scripts.

## Separate testable hypotheses

**Hypothesis A — planning quality:** given the same bounded tools and objective, provenance-aware epistemic state, relevant memory and structured curriculum increase the validity, grounding and uncertainty calibration of candidate Attack Plans on unseen Worlds.

**Hypothesis B — operational discipline:** deterministic validation, explicit approval, typed capabilities, least-privilege identity and runtime policy prevent unauthorised side effects, even when an agent proposes an invalid or prohibited action.

A model announcing that it followed a rule is not evidence that the rule was enforced.

## A proposed curriculum

| Stage | Task | Competency tested |
| --- | --- | --- |
| Observation | Report IAM/S3 facts from scoped tools | Distinguish source observations from conjecture |
| Inference | Build a role-to-resource hypothesis graph | Preserve valid premises and falsifiability |
| Planning | Draft a candidate Attack Plan | Pass schema/semantic checks and disclose uncertainty |
| Discipline | Encounter tool denial and missing prerequisites | Stop appropriately; no unauthorised side effect |
| Adaptation | Receive conflicting or negative evidence | Revise hypotheses and confidence |
| Generalisation | Face a previously unseen World | Transfer rather than recall scripted answers |

Start with resettable synthetic Worlds, where hidden ground truth makes measurement possible and no real target needs to be attacked. Explicitly authorised AWS labs come later.

## Experiment methodology

Compare controlled groups: baseline prompting, explicit structured observations/hypotheses, structured state plus episodic memory, and structured state plus curriculum/feedback. Keep model, tool contracts, budgets and task distributions comparable. Use repeated, randomised held-out Worlds and independent graders where appropriate.

Useful metrics include unsupported assertions, accuracy and provenance of graph edges, hypothesis falsifiability, confidence calibration against observed outcomes, information value per tool call, plan validity, cost/latency, boundary compliance and performance on unfamiliar Worlds.

Failure modes to watch: stale memory leading to bias, graphs that make incorrect relationships look rigorous, endless reflection consuming time without improving uncertainty, answer leakage through simulator data and curriculum overfitting. Negative results are research findings, **not** grounds for relaxing the execution safety boundary.

## Research versus architecture

- **Inspiration:** Sapolsky's work and the question of how environments shape behaviour.
- **Hypothesis:** curriculum, memory and feedback can improve measured adversarial reasoning.
- **Engineering requirement:** independent authority must govern real side effects.
- **Finding:** only repeatable evidence from implemented experiments establishes an effect.

See [World Model](../architecture/WORLD-MODEL.md), [Agentic Cognition](../architecture/AGENTIC-COGNITION.md), [Plan Compilation](../architecture/PLAN-COMPILATION.md) and [Roadmap](../ROADMAP.md).
