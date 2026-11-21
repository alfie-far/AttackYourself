import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ModelSemanticAdapter } from '../model-adapter.js';
import { laboratoryRounds, laboratoryWorld } from '../fixture.js';
import { SemanticValidationError } from '../validation.js';

const { source } = laboratoryRounds[0];
const quote = 'Mara gave Eli the key to the laboratory.';
const sample = {
  assertions: [{
    subject: 'mara', predicate: 'gave-key-to', object: 'eli', polarity: 'positive',
    start: 0, end: quote.length, quote,
  }],
};

describe('model-facing semantic extraction boundary', () => {
  it('accepts valid model suggestions and stamps server-owned IDs and provenance', async () => {
    const model = new ModelSemanticAdapter({ generate: async () => JSON.stringify(sample) });
    const output = await model.extract(laboratoryWorld, source);
    assert.equal(output[0].id, 'story-1:assertion-1');
    assert.equal(output[0].anchor.sourceId, source.id);
    assert.equal(output[0].anchor.quote, quote);
  });

  it('rejects hallucinated source quotes even when JSON is structurally valid', async () => {
    const madeUp = structuredClone(sample);
    madeUp.assertions[0].quote = 'Mara handed over the master access card.';
    const model = new ModelSemanticAdapter({ generate: async () => JSON.stringify(madeUp) });
    await assert.rejects(model.extract(laboratoryWorld, source), SemanticValidationError);
  });

  it('rejects unsupported Markdown-wrapped JSON or non-JSON output', async () => {
    const model = new ModelSemanticAdapter({ generate: async () => '```json\n{}\n```' });
    await assert.rejects(model.extract(laboratoryWorld, source), /single valid JSON/);
  });

  it('rejects model interpretations that cite nonexistent assertions', async () => {
    const model = new ModelSemanticAdapter({
      generate: async () => JSON.stringify({
        interpretations: [{
          id: 'h-1', proposition: 'The door is open.', supports: ['fabricated-assertion'],
          challenges: [], refutes: [], assumptions: [], openQuestions: [],
        }],
      }),
    });
    await assert.rejects(model.propose(laboratoryWorld, [], []), /Unknown or foreign assertion/);
  });

  it('accepts a proposed interpretation but does not claim to validate its meaning', async () => {
    const assertion = (await new ModelSemanticAdapter({ generate: async () => JSON.stringify(sample) }).extract(laboratoryWorld, source))[0];
    const model = new ModelSemanticAdapter({
      generate: async () => JSON.stringify({
        interpretations: [{
          id: 'h-door', proposition: 'The key may unlock the door.',
          supports: [assertion.id], challenges: [], refutes: [],
          assumptions: ['the key operates the laboratory door'], openQuestions: ['What lock does it fit?'],
        }],
      }),
    });
    const result = await model.propose(laboratoryWorld, [assertion], []);
    assert.deepEqual(result[0].supports, [assertion.id]);
    assert.equal(result[0].assumptions.length, 1);
  });
});

// The complete session can run against a provider stub; swap `generate` with
// a real model provider later without moving provenance enforcement into the model.
import { SemanticWorldSession } from '../session.js';

it('runs an end-to-end iterative extraction/reconciliation session with a scripted model', async () => {
  const firstQuote = 'Mara gave Eli the key to the laboratory.';
  const secondSource = laboratoryRounds[1].source;
  const secondQuote = secondSource.content;
  const scripted = [
    { assertions: [{subject:'mara',predicate:'gave-key-to',object:'eli',polarity:'positive',start:0,end:firstQuote.length,quote:firstQuote}] },
    { interpretations: [{id:'hyp-key',proposition:'The key may open the laboratory door.',supports:['story-1:assertion-1'],challenges:[],refutes:[],assumptions:['key is for the door'],openQuestions:['What lock?']}] },
    { assertions: [{subject:'door',predicate:'requires',object:'active-card',polarity:'positive',start:0,end:secondQuote.length,quote:secondQuote}] },
    { interpretations: [{id:'hyp-key',proposition:'The key may open the laboratory door.',supports:['story-1:assertion-1'],challenges:['story-2:assertion-1'],refutes:[],assumptions:['key is for the door'],openQuestions:['Is there a mechanical override?']}] },
  ];
  const observedPrompts: string[] = [];
  const model = new ModelSemanticAdapter({generate: async prompt => {
    observedPrompts.push(prompt);
    return JSON.stringify(scripted.shift());
  }});
  const session = new SemanticWorldSession(laboratoryWorld, model);
  const a = await session.consume(laboratoryRounds[0].source);
  assert.equal(a.interpretations[0].status,'candidate');
  const b = await session.consume(secondSource);
  assert.equal(b.interpretations[0].status,'contested');
  assert.equal(session.engine.getHistory('hyp-key').length,2);
  assert.equal(observedPrompts.length,4);
  assert.ok(!observedPrompts[0].includes('not the laboratory door'), 'hidden future passage leaked');
});

it('fails a semantic round atomically when model proposes a fabricated reference', async () => {
  const sequence = [
    sample,
    {interpretations:[{id:'bad',proposition:'invented',supports:['fake-id'],challenges:[],refutes:[],assumptions:[],openQuestions:[]}]},
  ];
  const session = new SemanticWorldSession(laboratoryWorld, new ModelSemanticAdapter({generate: async () => JSON.stringify(sequence.shift())}));
  await assert.rejects(session.consume(source),/Unknown or foreign assertion/);
  assert.deepEqual(session.engine.snapshot().sources,[]);
  assert.deepEqual(session.engine.snapshot().assertions,[]);
});
