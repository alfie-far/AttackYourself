import { SemanticWorldEngine } from './engine.js';
import { laboratoryRounds, laboratoryWorld } from './fixture.js';

const engine = new SemanticWorldEngine(laboratoryWorld);

for (const [index, round] of laboratoryRounds.entries()) {
  engine.ingest(round.source, round.assertions);
  for (const proposal of round.interpretations) engine.interpret(proposal);
  const interpretations = engine.snapshot().interpretations;
  console.log(`\nRound ${index + 1}: ${round.source.content}`);
  for (const interpretation of interpretations) {
    console.log(`  ${interpretation.id} v${interpretation.revision} [${interpretation.status}]: ${interpretation.proposition}`);
    console.log(`    supports=${interpretation.supports.join(',') || '-'} challenges=${interpretation.challenges.join(',') || '-'} refutes=${interpretation.refutes.join(',') || '-'}`);
  }
}
console.log('\nThis is a scripted provenance/revision demonstration, NOT autonomous semantic extraction or an AWS assessment.');
