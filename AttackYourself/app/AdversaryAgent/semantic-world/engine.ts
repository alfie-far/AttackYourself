import type {
  InterpretationHistory,
  InterpretationProposal,
  InterpretationRevision,
  InterpretationStatus,
  SemanticAssertion,
  SemanticWorldSnapshot,
  SourceDocument,
  WorldDescription,
} from './contracts.js';
import { SemanticValidationError, validateAssertion, validateProposal, validateSource, validateWorld } from './validation.js';

function deriveStatus(proposal: InterpretationProposal): InterpretationStatus {
  if (proposal.refutes.length > 0) return 'rejected';
  if (proposal.challenges.length > 0) return 'contested';
  if (proposal.supports.length === 0) return 'underdetermined';
  if (proposal.assumptions.length > 0) return 'candidate';
  return 'supported';
}

/**
 * Append-only source/observation store and revisioned interpretations.
 * Interpretations are still proposed by a human/model. The engine checks
 * provenance and computes evidence-link status, NOT semantic truth.
 */
export class SemanticWorldEngine {
  readonly world: WorldDescription;
  private readonly sources = new Map<string, SourceDocument>();
  private readonly assertions = new Map<string, SemanticAssertion>();
  private readonly histories = new Map<string, InterpretationHistory>();
  private readonly clock: () => string;

  constructor(world: WorldDescription, clock: () => string = () => new Date().toISOString()) {
    validateWorld(world);
    this.world = structuredClone(world);
    this.clock = clock;
  }

  private validateIngest(source: SourceDocument, extracted: SemanticAssertion[]): void {
    validateSource(this.world, source);
    if (this.sources.has(source.id)) throw new SemanticValidationError(`Source already ingested: ${source.id}`);
    if (extracted.length > 500) throw new SemanticValidationError('Too many assertions in one source');
    const seen = new Set<string>();
    // Validate the *entire* batch before modifying state.
    for (const assertion of extracted) {
      validateAssertion(this.world, source, assertion);
      if (seen.has(assertion.id) || this.assertions.has(assertion.id)) {
        throw new SemanticValidationError(`Duplicate assertion ID: ${assertion.id}`);
      }
      seen.add(assertion.id);
    }
  }

  ingest(source: SourceDocument, extracted: SemanticAssertion[]): void {
    this.validateIngest(source, extracted);
    this.sources.set(source.id, structuredClone(source));
    for (const assertion of extracted) this.assertions.set(assertion.id, structuredClone(assertion));
  }

  /**
   * Atomically ingest a new document and the interpreter's next candidate set.
   * If a model invents an assertion ID or a source quote, none of the round lands.
   */
  applyRound(source: SourceDocument, extracted: SemanticAssertion[], proposals: InterpretationProposal[]): void {
    this.validateIngest(source, extracted);
    if (proposals.length > 50) throw new SemanticValidationError('Too many proposals in one round');
    const allowed = new Set([...this.assertions.keys(), ...extracted.map(x => x.id)]);
    const ids = new Set<string>();
    for (const proposal of proposals) {
      validateProposal(proposal, allowed);
      if (ids.has(proposal.id)) throw new SemanticValidationError(`Duplicate proposal: ${proposal.id}`);
      ids.add(proposal.id);
    }
    // No model-supplied value can invalidate the round after these checks.
    this.ingest(source, extracted);
    for (const proposal of proposals) this.interpret(proposal);
  }

  /** Submit a new interpretation or an explicit revision of an existing one. */
  interpret(proposal: InterpretationProposal): InterpretationRevision {
    validateProposal(proposal, new Set(this.assertions.keys()));
    const prior = this.histories.get(proposal.id);
    const next: InterpretationRevision = {
      ...structuredClone(proposal),
      worldId: this.world.id,
      worldRevision: this.world.revision,
      revision: (prior?.revisions.length ?? 0) + 1,
      status: deriveStatus(proposal),
      recordedAt: this.clock(),
    };
    if (prior) prior.revisions.push(next);
    else this.histories.set(proposal.id, { id: proposal.id, revisions: [next] });
    return structuredClone(next);
  }

  getHistory(id: string): InterpretationRevision[] {
    return structuredClone(this.histories.get(id)?.revisions ?? []);
  }

  /** Only the latest revision per proposition is presented as current. */
  snapshot(): SemanticWorldSnapshot {
    return structuredClone({
      world: this.world,
      sources: [...this.sources.values()],
      assertions: [...this.assertions.values()],
      interpretations: [...this.histories.values()].map(h => h.revisions.at(-1)!),
    });
  }
}
