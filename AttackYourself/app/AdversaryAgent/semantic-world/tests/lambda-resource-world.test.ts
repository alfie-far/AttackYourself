import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createLambdaDescriptorWorld } from '../examples/lambda-resource-world.js';

/** This example deliberately performs no live AWS calls or model invocations. */
describe('simple self-describing Lambda World', () => {
  it('constructs an authored JSON SourceDocument with a valid source-anchored claim', () => {
    const snapshot = createLambdaDescriptorWorld();
    assert.equal(snapshot.sources.length, 1);
    assert.equal(snapshot.sources[0].origin.kind, 'authored');
    assert.equal(snapshot.sources[0].mediaType, 'application/json');
    assert.equal(snapshot.assertions.length, 1);
    const { anchor } = snapshot.assertions[0];
    assert.equal(snapshot.sources[0].content.slice(anchor.start, anchor.end), anchor.quote);
    assert.equal(snapshot.assertions[0].object, 'nodejs22.x');
    assert.equal(snapshot.interpretations[0].status, 'supported');
    assert.deepEqual(snapshot.interpretations[0].supports, [snapshot.assertions[0].id]);
    assert.ok(snapshot.interpretations[0].openQuestions.some(q => q.includes('deployed AWS')));
  });
});
