import { createLambdaDescriptorWorld } from './examples/lambda-resource-world.js';

const world = createLambdaDescriptorWorld();
console.log(JSON.stringify({
  world: world.world,
  sources: world.sources.map(({ id, mediaType, origin }) => ({ id, mediaType, origin })),
  assertions: world.assertions,
  interpretations: world.interpretations,
}, null, 2));
console.log('\nSynthetic description only — no live AWS resource has been inspected.');
