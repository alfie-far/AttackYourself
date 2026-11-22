import type { SemanticWorldSnapshot, SourceDocument, WorldDescription } from './contracts.js';
import { SemanticWorldEngine } from './engine.js';
import { ModelSemanticAdapter } from './model-adapter.js';

/**
 * One reasoning cycle: untrusted source -> extracted assertions -> proposals
 * -> deterministic provenance checks -> append-only revised World view.
 * No AWS calls, attack capabilities, or hidden fixture answers are involved.
 */
export class SemanticWorldSession {
  readonly engine: SemanticWorldEngine;
  private busy = false;

  constructor(world: WorldDescription, private readonly adapter: ModelSemanticAdapter) {
    this.engine = new SemanticWorldEngine(world);
  }

  async consume(source: SourceDocument): Promise<SemanticWorldSnapshot> {
    if (this.busy) throw new Error('Concurrent semantic interpretation rounds are not supported');
    this.busy = true;
    try {
      return await this.consumeOnce(source);
    } finally {
      this.busy = false;
    }
  }

  private async consumeOnce(source: SourceDocument): Promise<SemanticWorldSnapshot> {
    const extracted = await this.adapter.extract(this.engine.world, source);
    const before = this.engine.snapshot();
    const proposals = await this.adapter.propose(
      before.world,
      [...before.assertions, ...extracted],
      before.interpretations,
    );
    this.engine.applyRound(source, extracted, proposals);
    return this.engine.snapshot();
  }
}
