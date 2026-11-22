import type { SemanticWorldSnapshot, SourceDocument, WorldDescription, SemanticAssertion } from '../contracts.js';
import { SemanticWorldEngine } from '../engine.js';

/**
 * A descriptive World built from an authored, synthetic Lambda descriptor.
 * No AWS API is called and none of the declared properties is a verified observation.
 */
export function createLambdaDescriptorWorld(): SemanticWorldSnapshot {
  const world: WorldDescription = {
    id: 'lambda-descriptor-lab',
    revision: 1,
    title: 'One described AWS Lambda function',
    description: 'Learn to anchor semantic assertions to a technical resource description.',
  };

  // A source may be an arbitrary narrative or self-describing structured document.
  // Synthetic values only: never store function environment secrets here.
  const description = {
    resourceType: 'AWS::Lambda::Function',
    functionName: 'example-order-worker',
    runtime: 'nodejs22.x',
    region: 'ap-southeast-2',
    executionRole: 'arn:aws:iam::111122223333:role/example-order-worker-role',
    timeoutSeconds: 15,
  };
  const source: SourceDocument = {
    id: 'lambda-description-001',
    worldId: world.id,
    worldRevision: world.revision,
    mediaType: 'application/json',
    language: 'en',
    content: JSON.stringify(description, null, 2),
    origin: { kind: 'authored', reference: 'synthetic-example/lambda-descriptor' },
    capturedAt: '2026-11-22T00:00:00.000Z',
  };

  const quote = '"runtime": "nodejs22.x"';
  const start = source.content.indexOf(quote);
  if (start < 0) throw new Error('Synthetic resource description is missing runtime');
  const assertion: SemanticAssertion = {
    id: 'lambda-runtime-001',
    worldId: world.id,
    worldRevision: world.revision,
    subject: description.functionName,
    predicate: 'declares-runtime',
    object: description.runtime,
    polarity: 'positive',
    anchor: { sourceId: source.id, start, end: start + quote.length, quote },
  };

  const engine = new SemanticWorldEngine(world);
  engine.applyRound(source, [assertion], [{
    id: 'lambda-runtime-interpretation',
    proposition: 'The authored descriptor declares a Node.js 22 Lambda runtime.',
    supports: [assertion.id],
    challenges: [],
    refutes: [],
    assumptions: [],
    openQuestions: ['Does the currently deployed AWS function actually match this descriptor?'],
  }]);
  return engine.snapshot();
}
