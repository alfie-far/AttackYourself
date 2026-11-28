# Investigation Episode 001 — The Misleading Permission

**Status:** executable offline research demonstration. **Not** a cloud scanner, live AWS investigator, AgentCore deployment, authorised attack plan or proof of effective IAM permissions.

**What this proves:** a synthetic World observation can be labelled cheaply, activate a *finite* investigation, produce concrete decisions and tool observations, revise a hypothesis on contradictory evidence, and terminate with a replayable journal. An interchangeable **scripted** strategy drives the decisions. **It does not prove autonomous LLM reasoning or genuine security control effectiveness.**

## First use (Node.js 22+, no dependencies or AWS account)

```bash
cd AttackYourself/packages/investigation
npm test
npm run demo
# Copy the printed journal path into:
npm run replay -- /path/to/episode.jsonl
```

`npm run demo` creates a new `.episodes/run-*/episode.jsonl` for each run. These untracked output directories are ignored by Git. You may choose an output path explicitly: `npm run demo -- --out /tmp/episode-001.jsonl`. An existing journal is **never overwritten**: remove or select a different path intentionally.

The demo shows all decisions in order, based on **recorded events** rather than a generated retrospective account. The normal run contains:

```text
01 episode.activated
02 episode.contextualised      [1 initial observation; no recalled memory]
03 episode.investigating
04 decision.proposed           HYPOTHESISE
05 hypothesis.recorded         revision 1: candidate
06 decision.proposed           OBSERVE
07 observation.requested       inspect_synthetic_scp
08 observation.received        obs-scp-deny-002
09 decision.proposed           REVISE
10 hypothesis.recorded         revision 2: rejected
11 decision.proposed           CONCLUDE
12 episode.concluding
13 episode.terminated          completed
```

The printed results include the actual decisions, evidence references, final status, tool-call count and confirmation that journal replay matches the live projection. **No AWS SDK, HTTP client, Bedrock inference or active probing exists in this package.**

## Three cleanly separated responsibilities

| Component | File | What it does |
| --- | --- | --- |
| Cheap labelling | `src/labelling.mjs` | Deterministically classifies a sourced observation using a versioned, configurable ruleset. No inference about effective access. |
| Activation controller | `src/activation.mjs` | Matches the trigger label, suppresses duplicate activations within the controller, and produces a scoped episode mandate. |
| Episode controller | `src/episode.mjs` | Enforces World isolation, declared evidence, allowed tools, budgets, recorded decisions and terminal outcomes. The strategy can **propose**, never grant authority. |
| Strategy | `src/strategy.mjs` | An intentionally scripted, replaceable investigator using the data it sees, **not hidden fixture truth**. |
| Tool | `src/fixture-tools.mjs` | Read-only synthetic SCP observation, inaccessible without a permitted tool name and valid fixture scope. |
| Journal + replay | `src/journal.mjs` | Append-only hash-linked JSONL. Offline replay validates hashes and reconstructs state without running the investigator or tools. |
| Memory port | `src/memory.mjs` | Replaceable `recall(context)` interface. The default `NoMemory` returns no experiences. Memories are never accepted as supporting evidence by themselves. |

The fixture's identity-based `Allow` means **only that the synthetic statement declares an Allow**. The later *synthetic* SCP explicitly denies the same `s3:GetObject` action under a declared applicability assumption. The investigator rejects the original *possible-access* hypothesis for **those stated conditions**. A real AWS permission evaluation has many more dimensions. This is an epistemic correction demonstration, not an IAM evaluator.

### Journal versus memory

The journal is the authoritative record of the episode's actual decisions, observations and transitions. The memory port is a separate source of **contextual previous experience**, optionally retrievable before an episode. A future AgentCore Memory adapter can implement that port, but its summaries/reflections must not replace the journal, provide fresh evidence or grant permission. The episode contract is also independent of whatever AWS means by conversational “episodic memory”.

### Integrity and portability limits

- JSONL records have sequence numbers and SHA-256 predecessor hashes. This detects ordinary tampering/truncation and replay divergence, but **does not provide tamper-proof storage**: someone able to rewrite the entire file can recompute all hashes. Real deployments need trusted append-only storage/anchors.
- In-process trigger deduplication and journal `wx` file creation stop accidental repeats; this is **not distributed exactly-once delivery**. Persistent idempotency, transactional claims, queues and leases are future work.
- Controller deadline racing bounds the wait for a response, but JavaScript cannot forcibly stop a non-cooperating tool that ignores cancellation. Real connectors must enforce independent timeouts, IAM, resource scope and cancellation. The demo's only connector is read-only and synthetic.
- Source `kind`/timestamps are provenance **declarations**, not cryptographic attestation. Do not accept untrusted claims as verified AWS observations.
- The package is intentionally independent of the deployed `AdversaryAgent` and from AWS. `worldRef` refers to the same `lambda-descriptor-lab@1` educational World concept as the existing semantic-world example, but this experiment does not replace or import that existing module. A shared `world-core` extraction is future work.
- The local JSONL journal may include sensitive observations when future adapters are added. Avoid real secrets and implement deliberate redaction, access controls and retention before connecting live sources.

## Test cases

`npm test` covers deterministic labels, trigger deduplication, event provenance, successful episode replay, denied tools, invalid hypotheses, cross-World leakage, decision/tool/time budgets, tool failures, invalid strategy output, journal overwrite prevention, optional memory isolation, and journal tampering/truncation.

## Next experiments

1. Run the same episode contract against a **model-backed** strategy while keeping the observations frozen; report unsupported assertions, decision costs, and correctness of hypothesis revision.
2. Add optional **AgentCore Memory** recall and compare investigator performance with and without memory on held-out Worlds. Never use recalled knowledge as current evidence.
3. Extract a reusable World SDK and develop streamed observation/activation adapters, followed by independently governed, read-only AWS observation.
4. Add signed/anchored journal persistence and controlled replay fixtures for independent evaluators.

Related architecture: `docs/architecture/INVESTIGATION-EPISODES.md`, `docs/architecture/SEMANTIC-WORLD-EXPERIMENT.md` and `docs/architecture/AGENTIC-COGNITION.md` (paths relative to the repository root).
