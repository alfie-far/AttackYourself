#!/usr/bin/env node
import { readFile, mkdtemp, mkdir } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ActivationController, IAM_ACTIVATION_POLICY } from './src/activation.mjs';
import { IAM_LABELLING_RULESET, labelObservation } from './src/labelling.mjs';
import { EpisodeController } from './src/episode.mjs';
import { EpisodeJournal, replayJournal } from './src/journal.mjs';
import { MisleadingPermissionStrategy } from './src/strategy.mjs';
import { SyntheticScpTool } from './src/fixture-tools.mjs';
import { NoMemory } from './src/memory.mjs';

const root=dirname(fileURLToPath(import.meta.url));
const load=async(name)=>JSON.parse(await readFile(join(root,'fixtures',name),'utf8'));
const args=process.argv.slice(2);
if(args.includes('--help')) {
  console.log('Usage: node demo.mjs [--out /path/to/episode.jsonl]');
  console.log('Offline, dependency-free. No AWS credentials, LLM calls or attacks.');
  process.exit(0);
}
if(args.length && (args.length!==2||args[0]!=='--out'||!args[1])){
  console.error('Expected --out <journal-path> (or no arguments)'); process.exit(2);
}
const [fixture,identityObservation,scpObservation]=await Promise.all([
  load('lambda-iam-world.json'),load('identity-allow.json'),load('scp-deny.json'),
]);
const worldRef=`${fixture.world.id}@${fixture.world.revision}`;
if(identityObservation.worldRef!==worldRef||scpObservation.worldRef!==worldRef)throw Error('Fixture World version mismatch');
const labelled=labelObservation(identityObservation,IAM_LABELLING_RULESET);
const activation=new ActivationController(IAM_ACTIVATION_POLICY);
const mandate=activation.consider(labelled);
if(!mandate)throw Error('Expected synthetic trigger did not activate');
// Repeat the identical input to demonstrate deterministic in-process deduplication.
const duplicateSuppressed=activation.consider(labelled)===null;
const out=args.length?resolve(args[1]):join(await (async()=>{
  const directory=join(root,'.episodes');
  await mkdir(directory,{recursive:true});
  return mkdtemp(join(directory,'run-'));
})(),'episode.jsonl');
const tool=new SyntheticScpTool(scpObservation);
const journal=new EpisodeJournal(out);
const investigator=new EpisodeController({
  journal,
  strategy:new MisleadingPermissionStrategy(),
  tools:{inspect_synthetic_scp:tool},
  memory:new NoMemory(),
});

console.log('\nATTACKYOURSELF: INVESTIGATION EPISODE 001 (SYNTHETIC)');
console.log('='.repeat(72));
console.log(`World:               ${worldRef}`);
console.log('Fixture:             Lambda role identity Allow + applicable SCP Deny');
console.log(`Ruleset:             ${labelled.ruleset}`);
console.log(`Matched rules:       ${labelled.matchedRules.join(', ')}`);
console.log(`Labels:              ${labelled.labels.join(', ')}`);
console.log(`Trigger:             ${mandate.triggerRef}`);
console.log(`Duplicate suppressed: ${duplicateSuppressed}`);
console.log(`Mandate:             ${mandate.mandate}`);
console.log(`Allowed capabilities: ${mandate.permittedTools.join(', ')}`);
console.log(`Budget:              ${mandate.limits.maxDecisions} decisions; ${mandate.limits.maxToolCalls} tool calls; ${mandate.limits.maxDurationMs} ms`);
console.log(`Journal:             ${out}`);

const result=await investigator.run(mandate,[identityObservation]);
const loaded=await replayJournal(out);
if(JSON.stringify(result)!==JSON.stringify(loaded.projection))throw Error('Replay did not match live projection');

console.log('\nRECORDED DECISION TIMELINE (FROM JOURNAL, NOT MODEL NARRATION)');
for(const event of loaded.events){
  let explanation='';
  const d=event.data;
  if(event.type==='decision.proposed')explanation=`${d.decision.kind.toUpperCase()}: ${d.decision.reason}`;
  else if(event.type==='hypothesis.recorded')explanation=`${d.hypothesis.id} revision ${d.hypothesis.revision}: ${d.hypothesis.status}`;
  else if(event.type==='observation.requested')explanation=`${d.tool}: ${d.reason}`;
  else if(event.type==='observation.received')explanation=`${d.observation.id} (${d.observation.kind}, ${d.observation.source.kind})`;
  else if(event.type==='episode.terminated')explanation=`${d.status.toUpperCase()}: ${d.reason}`;
  else if(event.type==='episode.activated')explanation=`${d.mandate.id}`;
  else if(event.type==='episode.contextualised')explanation=`${d.observations.length} initial observations; ${d.memories.length} recalled memories`;
  console.log(`${String(event.seq).padStart(2,'0')} ${event.type.padEnd(25)} ${explanation}`);
}
console.log('\nVERIFIED EPISODE RESULT');
console.log(JSON.stringify({
  episodeId:result.episodeId, worldRef:result.worldRef, status:result.status,
  toolCalls:result.toolCalls, decisions:result.decisions,
  observations:result.observations.map(({id,kind,source})=>({id,kind,source:source.kind})),
  hypotheses:result.hypotheses,
  termination:result.termination,
  journalEvents:loaded.events.length,
  journalHashChain:'PASS',
  replayMatchesOriginal:true,
  realAWSQueries:0,
  modelCalls:0,
},null,2));
if(result.status!=='completed'||result.hypotheses[0]?.status!=='rejected'||tool.calls!==1)process.exitCode=1;
