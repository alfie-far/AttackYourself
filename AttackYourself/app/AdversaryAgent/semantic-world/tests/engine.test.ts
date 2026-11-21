import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { InterpretationProposal, SemanticAssertion, SourceDocument } from '../contracts.js';
import { SemanticWorldEngine } from '../engine.js';
import { laboratoryRounds, laboratoryWorld } from '../fixture.js';
import { SemanticValidationError } from '../validation.js';

const [first, second, third] = laboratoryRounds;

function newEngine(): SemanticWorldEngine {
  return new SemanticWorldEngine(laboratoryWorld, () => '2026-01-01T00:00:00.000Z');
}

describe('source-grounded iterative interpretation', () => {
  it('retains competing readings and revises one hypothesis from candidate to contested to rejected', () => {
    const engine = newEngine();
    engine.ingest(first.source, first.assertions);
    for (const i of first.interpretations) engine.interpret(i);
    assert.deepEqual(engine.snapshot().interpretations.map(x => [x.id, x.status]), [
      ['h-door-key', 'candidate'], ['h-credentials', 'supported'],
    ]);

    engine.ingest(second.source, second.assertions);
    engine.interpret(second.interpretations[0]);
    assert.equal(engine.snapshot().interpretations.find(x => x.id === 'h-door-key')?.status, 'contested');

    engine.ingest(third.source, third.assertions);
    for (const i of third.interpretations) engine.interpret(i);
    const snapshot = engine.snapshot();
    assert.equal(snapshot.interpretations.find(x => x.id === 'h-door-key')?.status, 'rejected');
    assert.equal(snapshot.interpretations.find(x => x.id === 'h-cabinet-key')?.status, 'supported');
    assert.deepEqual(engine.getHistory('h-door-key').map(x => x.status), ['candidate', 'contested', 'rejected']);
    assert.equal(snapshot.assertions.length, 6);
    assert.equal(snapshot.sources.length, 3);
  });

  it('requires verbatim source anchors and preserves atomicity on failure', () => {
    const engine = newEngine();
    const forged = structuredClone(first.assertions);
    forged[1].anchor.quote = 'The door was unlocked.';
    assert.throws(() => engine.ingest(first.source, forged), SemanticValidationError);
    assert.deepEqual(engine.snapshot().sources, []);
    assert.deepEqual(engine.snapshot().assertions, []);
  });

  it('rejects foreign World sources and observations', () => {
    const engine = newEngine();
    const foreignSource: SourceDocument = { ...first.source, worldId: 'another-world' };
    assert.throws(() => engine.ingest(foreignSource, first.assertions), /another World/);
    const foreignAssertion: SemanticAssertion = { ...first.assertions[0], worldRevision: 2 };
    assert.throws(() => engine.ingest(first.source, [foreignAssertion]), /another World/);
  });

  it('does not accept invented or cross-world assertion references', () => {
    const engine = newEngine();
    engine.ingest(first.source, first.assertions);
    const ungrounded: InterpretationProposal = {
      id: 'invented', proposition: 'The laboratory is public.',
      supports: ['another-world:obs-3'], challenges: [], refutes: [],
      assumptions: [], openQuestions: [],
    };
    assert.throws(() => engine.interpret(ungrounded), /Unknown or foreign assertion/);
    assert.equal(engine.getHistory('invented').length, 0);
  });

  it('marks claims with no cited support as underdetermined', () => {
    const engine = newEngine();
    const r = engine.interpret({
      id: 'h-unresolved', proposition: 'The key opens the laboratory door.',
      supports: [], challenges: [], refutes: [], assumptions: [],
      openQuestions: ['What does the key open?'],
    });
    assert.equal(r.status, 'underdetermined');
  });

  it('does not rewrite previous revisions or allow snapshot mutation to alter state', () => {
    const engine = newEngine();
    engine.ingest(first.source, first.assertions);
    engine.interpret(first.interpretations[0]);
    const snapshot = engine.snapshot();
    snapshot.assertions[0].object = 'fabricated';
    snapshot.interpretations[0].status = 'supported';
    engine.ingest(second.source, second.assertions);
    engine.interpret(second.interpretations[0]);
    const history = engine.getHistory('h-door-key');
    assert.equal(history[0].status, 'candidate');
    assert.deepEqual(history[0].challenges, []);
    assert.deepEqual(history[1].challenges, ['a-card-required']);
    assert.equal(engine.snapshot().assertions[0].object, 'eli');
  });

  it('rejects contradictory evidence roles and duplicate source ingestion', () => {
    const engine = newEngine();
    engine.ingest(first.source, first.assertions);
    assert.throws(() => engine.ingest(first.source, first.assertions), /already ingested/);
    const p = structuredClone(first.interpretations[0]);
    p.challenges.push('a-key-gift');
    assert.throws(() => engine.interpret(p), /conflicting evidence roles/);
  });

  it('does not require a security-specific ontology', () => {
    const engine = newEngine();
    const book = { ...first.source, id: 'story-book', content: 'The dragon guarded the bridge.' };
    const claim = {
      ...first.assertions[0], id: 'fantasy-1', subject: 'dragon', predicate: 'guarded',
      object: 'bridge', anchor: {sourceId: 'story-book', start: 0, end: 30, quote: 'The dragon guarded the bridge.'},
    };
    engine.ingest(book, [claim]);
    assert.equal(engine.snapshot().assertions[0].predicate, 'guarded');
  });
});
