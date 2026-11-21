# Semantic World Interpretation: First Executable Experiment

**Status:** implemented *offline research prototype*, not an autonomous AWS assessment capability. This experiment does not change the deployed AgentCore Runtime, Gateway or AWS permissions.

## Hypothesis

A World may begin as any source content that is describable: a story, incident report, architecture document, fictional scenario, AWS observation or other text. Rather than assuming one correct extraction, the system should preserve the source and construct **revisable interpretations** grounded in specific semantic assertions.

The iterative process is:

~~~text
World description + additional source passages
                      |
                      v
     Model-proposed semantic assertions
                      |
                      v
      Source-span/provenance validation
                      |
                      v
      Candidate interpretations with links
                      |
                      v
     Revisioned interpretation state
                      |
                      +--- new context ---> repeat
~~~

Crucially, more iterations do **not** guarantee truth. This experiment verifies what the interpreter *cited*, not whether it understood the meaning of those citations correctly. The reliability of evidence-link classifications and interpretations must be measured against independent reference cases.

## Where the code lives


Implementation: `AttackYourself/app/AdversaryAgent/semantic-world/`

| File | Responsibility |
| --- | --- |
| `contracts.ts` | Source, World, assertion, interpretation and revision types |
| `validation.ts` | Runtime checks for IDs, source anchors, World isolation and cited assertions |
| `engine.ts` | Append-only sources and assertions, revisioned interpretations, atomic rounds |
| `model-adapter.ts` | Untrusted LLM JSON extraction/proposal interface, strict source-span checking |
| `session.ts` | One complete extract → propose → validate → revise cycle |
| `fixture.ts` | Scripted fictional laboratory story and three sequential interpretations |
| `demo.ts` | Reproducible offline demonstration; no model or AWS calls |
| `tests/*.test.ts` | Provenance, hallucination, atomicity, World isolation and revision tests |

### Domain objects

**WorldDescription** provides identity, revision and a descriptive objective. **SourceDocument** carries arbitrary text, media type, source origin and captured time. These do not assume AWS ontology.

**SemanticAssertion** is an extracted subject–predicate–object statement (plus optional qualifiers and polarity) anchored to an *exact source substring*. It means **the source says this**, not **the proposition is independently true**.

**InterpretationProposal** links a proposition to supporting, challenging and refuting *assertion IDs*, plus assumptions and unanswered questions. **InterpretationRevision** records the system's status and version. Prior revisions and source content are never overwritten.

The engine calculates a simple, deliberately non-probabilistic evidence-link status:

| Status | Rule | Important caveat |
| --- | --- | --- |
| `underdetermined` | No cited supporting assertions | Could still be true; information missing |
| `candidate` | Some support, plus unverified assumptions | Not verified |
| `supported` | Support, no known challenges/refutations/assumptions | Means cited support exists, **not** proven truth |
| `contested` | At least one challenge | The challenge label is model-proposed |
| `rejected` | At least one refutation | Refutation semantics are not independently certified |

This is a starting point for **belief revision**, not a calibrated Bayesian engine. Status transitions are not automatic proof of convergence.

## Run

From the repository root:

~~~sh
cd AttackYourself/app/AdversaryAgent
npm ci
npm run test:world
npm run demo:world
~~~

The offline demonstration has three rounds:

1. Mara gives Eli a key; the agent's key-opens-door hypothesis is `candidate` because it needs an assumption.
2. A new passage says the laboratory door requires an active card; the hypothesis becomes `contested`.
3. A final passage explains that the key opens a cabinet, **not** the door; the hypothesis is revised to `rejected`, and an alternative cabinet interpretation is supported.

The demo uses **scripted assertions and hypotheses**, making source validation and revision behaviour repeatable. It is not evidence that a language model independently extracted the correct meaning.

## Connect an LLM (separate next step)

`ModelSemanticAdapter` is provider-neutral. Pass an implementation of `JsonTextGenerator`:

~~~typescript
const adapter = new ModelSemanticAdapter({
  generate: async (prompt: string) => {
    // Invoke an explicitly selected model/provider, returning JSON *text*.
    // Do not give this model arbitrary cloud-execution capabilities.
    return await yourStructuredCompletion(prompt);
  },
});

const session = new SemanticWorldSession(worldDescription, adapter);
const current = await session.consume(sourceDocument);
~~~

The model is asked to extract source-anchored assertions and then propose competing interpretations. `SemanticWorldSession` commits a round only after runtime validation of both the extracted source spans and the asserted evidence references. Invalid model output is rejected, with no partial round state persisted.

**The model's factual/semantic correctness is not established by these structural checks.** A valid quote can be misunderstood. A model can incorrectly label a citation as a refutation. Model-facing descriptions are untrusted, and a tool-result origin label is metadata rather than cryptographic proof of the actual tool invoker.

## Next experiments

1. Connect a JSON-output-capable model using the existing Strands/Bedrock integration and record the model/version in the run metadata.
2. Evaluate extraction against an **evaluator-only** answer key never included in prompts, memory or observation tools. Use stories outside security as well as technical Worlds.
3. Measure unsupported assertions, precision/recall of relations, correct evidence-role assignments, interpretation revisions and held-out World performance.
4. Add targeted contradiction cases, correlated sources and deliberately misleading passages; compare one-pass extraction with iterative revision.
5. Only once accuracy is measured, consider long-term storage, semantic graphs or AWS read-only World adapters.

No active attack tools, IAM policy changes, or live target operations belong in this experiment.

Related: [World Model](./WORLD-MODEL.md), [Agentic Cognition](./AGENTIC-COGNITION.md), [Plan Compilation](./PLAN-COMPILATION.md).
