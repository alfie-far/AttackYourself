import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { labelObservation, IAM_LABELLING_RULESET } from '../src/labelling.mjs';
import { ActivationController, IAM_ACTIVATION_POLICY } from '../src/activation.mjs';
import { EpisodeController } from '../src/episode.mjs';
import { EpisodeJournal, replayJournal, loadJournal, projectJournal } from '../src/journal.mjs';
import { SyntheticScpTool } from '../src/fixture-tools.mjs';
import { MisleadingPermissionStrategy } from '../src/strategy.mjs';
import { NoMemory } from '../src/memory.mjs';

const fixtureDir=join(dirname(fileURLToPath(import.meta.url)),'../fixtures');
const load=async name=>JSON.parse(await readFile(join(fixtureDir,name),'utf8'));
async function setup(overrides={}) {
  const [identity,scp]=await Promise.all([load('identity-allow.json'),load('scp-deny.json')]);
  const labels=labelObservation(identity,IAM_LABELLING_RULESET);
  const activation=new ActivationController(IAM_ACTIVATION_POLICY);
  const mandate={...activation.consider(labels),...overrides};
  const dir=await mkdtemp(join(tmpdir(),'attackyourself-episode-'));
  const file=join(dir,'episode.jsonl');
  const tool=new SyntheticScpTool(scp);
  function controller({strategy=new MisleadingPermissionStrategy(),tools={inspect_synthetic_scp:tool},memory=new NoMemory(),nowMs}={}) {
    return new EpisodeController({journal:new EpisodeJournal(file),strategy,tools,memory,nowMs});
  }
  return {identity,scp,labels,activation,mandate,file,tool,controller};
}

const fixedClock={clock:(()=>{let counter=0; return()=>new Date(Date.UTC(2026,10,22,0,0,counter++)).toISOString();})()};

describe('low-cost observation labels and activation',()=>{
  it('classifies the identity Allow but does not call it effective access',async()=>{
    const {identity,labels}=await setup();
    assert.deepEqual(labels.labels,['iam.identity-allow-declared','question.effective-s3-access']);
    assert.deepEqual(labels.matchedRules,['identity-allow-s3-read']);
    assert.equal(labels.ruleset,'aws-iam-observation@1');
    assert.deepEqual(labelObservation(identity,IAM_LABELLING_RULESET),labels);
    assert.ok(!labels.labels.some(x=>x.includes('vulnerable')||x.includes('effective-access-proven')));
  });
  it('does not trigger for a nonmatching observation',async()=>{
    const {identity}=await setup();
    const changed={...identity,kind:'aws.lambda.runtime_update'};
    const labels=labelObservation(changed,IAM_LABELLING_RULESET);
    assert.deepEqual(labels.labels,[]);
    assert.equal(new ActivationController(IAM_ACTIVATION_POLICY).consider(labels),null);
  });
  it('deduplicates a trigger and records exact ruleset and activation policy',async()=>{
    const {labels,activation,mandate}=await setup();
    assert.equal(activation.consider(labels),null);
    assert.equal(mandate.classification.ruleset,'aws-iam-observation@1');
    assert.equal(mandate.activationPolicy,'policy-iam-effective-access@1');
    assert.equal(new ActivationController(IAM_ACTIVATION_POLICY).consider(labels).id,mandate.id);
  });
  it('changes reproducible label outputs when a ruleset version changes',async()=>{
    const {identity}=await setup();
    const revised={...IAM_LABELLING_RULESET,version:2};
    assert.equal(labelObservation(identity,revised).ruleset,'aws-iam-observation@2');
  });
  it('rejects malformed labels and duplicate rule identifiers',async()=>{
    const {identity}=await setup();
    assert.throws(()=>labelObservation(identity,{id:'x',version:1,rules:[{id:'dup',match:{kind:identity.kind},labels:['x']},{id:'dup',match:{kind:identity.kind},labels:['y']}]}),/Duplicate rule ID/);
  });
});

describe('observable, replayable investigation episode',()=>{
  it('records actual decisions, one permitted tool response, hypothesis revision and a terminal result',async()=>{
    const {identity,mandate,file,tool,controller}=await setup();
    const result=await controller().run(mandate,[identity]);
    assert.equal(result.status,'completed');
    assert.equal(result.toolCalls,1);
    assert.equal(tool.calls,1);
    assert.equal(result.decisions,4);
    assert.equal(result.hypotheses.length,1);
    assert.equal(result.hypotheses[0].status,'rejected');
    assert.equal(result.hypotheses[0].revision,2);
    assert.deepEqual(result.hypotheses[0].evidenceRefs,['obs-identity-allow-001','obs-scp-deny-002']);
    const replay=await replayJournal(file);
    assert.deepEqual(replay.projection,result);
    assert.equal(replay.events.length,13);
    assert.deepEqual(replay.events.filter(x=>x.type==='hypothesis.recorded').map(x=>x.data.hypothesis.status),['candidate','rejected']);
    assert.equal(replay.events[0].data.mandate.classification.ruleset,'aws-iam-observation@1');
    assert.equal(tool.calls,1,'offline replay must not invoke any tool');
    assert.equal(replay.events.at(-1).type,'episode.terminated');
    assert.ok(replay.events.every(e=>e.hash.length===64));
  });
  it('records policy denial and never invokes an unauthorised tool',async()=>{
    const {identity,mandate,file,tool,controller}=await setup();
    const strategy={async next(){return {kind:'observe',reason:'Unsafe request',tool:'execute_attack',args:{}};}};
    const result=await controller({strategy}).run(mandate,[identity]);
    assert.equal(result.status,'policy_denied');
    assert.equal(tool.calls,0);
    assert.equal(result.toolCalls,0);
    assert.ok((await loadJournal(file)).some(e=>e.type==='capability.denied'));
  });
  it('rejects hypothesis evidence that does not exist',async()=>{
    const {identity,mandate,controller}=await setup();
    const strategy={async next(){return {kind:'hypothesise',reason:'Misleading claim',hypothesis:{id:'h',proposition:'Proven access',status:'supported',evidenceRefs:['fabricated-evidence-id'],assumptions:[]}};}};
    const result=await controller({strategy}).run(mandate,[identity]);
    assert.equal(result.status,'inconclusive');
    assert.equal(result.hypotheses.length,0);
  });
  it('refuses cross-World input before creating the journal',async()=>{
    const {identity,mandate,file,controller}=await setup();
    await assert.rejects(()=>controller().run(mandate,[{...identity,worldRef:'different-world@1'}]),/World mismatch/);
    await assert.rejects(()=>readFile(file),{code:'ENOENT'});
  });
  it('rejects a cross-World tool response and does not promote it as evidence',async()=>{
    const {identity,mandate,scp,controller}=await setup();
    const wrong={...scp,worldRef:'different-world@1'};
    const strategy=new MisleadingPermissionStrategy();
    const result=await controller({strategy,tools:{inspect_synthetic_scp:{async observe(){return wrong;}}}}).run(mandate,[identity]);
    assert.equal(result.status,'inconclusive');
    assert.equal(result.observations.length,1);
  });
  it('stops on a decision budget rather than reasoning indefinitely',async()=>{
    const {identity,mandate,controller}=await setup({limits:{maxDecisions:1,maxToolCalls:2,maxDurationMs:120000}});
    const result=await controller().run(mandate,[identity]);
    assert.equal(result.status,'budget_exhausted');
    assert.equal(result.decisions,1);
    assert.equal(result.toolCalls,0);
  });
  it('enforces a zero tool-call budget before entering the tool',async()=>{
    const {identity,mandate,controller,tool}=await setup({limits:{maxDecisions:8,maxToolCalls:0,maxDurationMs:120000}});
    const result=await controller().run(mandate,[identity]);
    assert.equal(result.status,'budget_exhausted');
    assert.equal(tool.calls,0);
  });
  it('stops when the time budget has expired',async()=>{
    const {identity,mandate,controller}=await setup({limits:{maxDecisions:8,maxToolCalls:2,maxDurationMs:1}});
    let calls=0;
    const result=await controller({nowMs:()=>calls++===0?0:100}).run(mandate,[identity]);
    assert.equal(result.status,'budget_exhausted');
  });
  it('returns an inconclusive outcome when permitted observation fails',async()=>{
    const {identity,mandate,controller}=await setup();
    const result=await controller({tools:{inspect_synthetic_scp:{async observe(){throw Error('Fixture unavailable');}}}}).run(mandate,[identity]);
    assert.equal(result.status,'inconclusive');
    assert.equal(result.hypotheses[0].status,'candidate');
    assert.equal(result.observations.length,1);
  });
  it('rejects an invalid decision rather than running arbitrary strategy output',async()=>{
    const {identity,mandate,controller}=await setup();
    const result=await controller({strategy:{async next(){return {kind:'execute',reason:'Unsafe'};}}}).run(mandate,[identity]);
    assert.equal(result.status,'inconclusive');
  });
  it('rejects a second episode writing over an existing journal',async()=>{
    const {identity,mandate,controller,file}=await setup();
    await controller().run(mandate,[identity]);
    const before=await readFile(file,'utf8');
    await assert.rejects(()=>controller().run(mandate,[identity]),{code:'EEXIST'});
    assert.equal(await readFile(file,'utf8'),before);
  });
});

describe('memory is contextual, never evidence or authority',()=>{
  it('allows a bounded cross-episode memory port without changing the journal contract',async()=>{
    const {identity,mandate,controller,file}=await setup();
    const memory={async recall({worldRef}){return [{id:'experience-1',summary:'Ask about SCPs when assessing effective access',worldRef}];}};
    const result=await controller({memory}).run(mandate,[identity]);
    assert.equal(result.status,'completed');
    const events=await loadJournal(file);
    assert.equal(events.find(e=>e.type==='episode.contextualised').data.memories.length,1);
    assert.equal(result.observations.length,2,'memory is not inserted as source evidence');
  });
  it('refuses to turn a memory ID into evidential proof',async()=>{
    const {identity,mandate,controller}=await setup();
    const memory={async recall({worldRef}){return [{id:'memory-1',summary:'Might be true',worldRef}];}};
    const strategy={async next(){return {kind:'hypothesise',reason:'Memory alone',hypothesis:{id:'h',proposition:'Access is proven',status:'supported',evidenceRefs:['memory-1'],assumptions:[]}};}};
    const result=await controller({memory,strategy}).run(mandate,[identity]);
    assert.equal(result.status,'inconclusive');
    assert.equal(result.hypotheses.length,0);
  });
  it('bounds memory retrieval to the episode deadline',async()=>{
    const {identity,mandate,controller}=await setup({limits:{maxDecisions:8,maxToolCalls:2,maxDurationMs:10}});
    const memory={async recall(){return new Promise(()=>{});}};
    const started=Date.now();
    const result=await controller({memory}).run(mandate,[identity]);
    assert.equal(result.status,'inconclusive');
    assert.equal(result.decisions,0);
    assert.ok(Date.now()-started<1000,'memory timeout should release the episode controller');
  });
  it('rejects an unbounded memory response',async()=>{
    const {identity,mandate,controller}=await setup();
    const memory={async recall({worldRef}){return Array.from({length:21},(_,i)=>({id:`memory-${i}`,summary:'Historical context',worldRef}));}};
    const result=await controller({memory}).run(mandate,[identity]);
    assert.equal(result.status,'inconclusive');
    assert.equal(result.decisions,0);
  });
  it('rejects cross-World recalled experiences',async()=>{
    const {identity,mandate,controller}=await setup();
    const memory={async recall(){return [{id:'mem',summary:'Cross-tenant',worldRef:'other-world@1'}];}};
    const result=await controller({memory}).run(mandate,[identity]);
    assert.equal(result.status,'inconclusive');
    assert.equal(result.decisions,0);
  });
});

describe('journal integrity and offline replay',()=>{
  it('rejects edits to a hash-linked record',async()=>{
    const {identity,mandate,file,controller}=await setup();
    await controller().run(mandate,[identity]);
    const original=await readFile(file,'utf8');
    await writeFile(file,original.replace('candidate','supported'));
    await assert.rejects(()=>replayJournal(file),/hash mismatch/);
  });
  it('rejects truncated journal and missing final event',async()=>{
    const {identity,mandate,file,controller}=await setup();
    await controller().run(mandate,[identity]);
    const raw=await readFile(file,'utf8');
    await writeFile(file,raw.slice(0,-1));
    await assert.rejects(()=>replayJournal(file),/incomplete/);
  });
  it('refuses to project an incomplete journal as a finished episode',async()=>{
    const {identity,mandate,file,controller}=await setup();
    await controller().run(mandate,[identity]);
    const events=await loadJournal(file);
    assert.equal(projectJournal(events.slice(0,-1)).termination,null);
  });
});
