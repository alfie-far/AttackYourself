import { createHash } from 'node:crypto';
import { mkdir, writeFile, appendFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

/** @param {object} entry */
function digest(entry) { return createHash('sha256').update(JSON.stringify(entry)).digest('hex'); }

/**
 * Append-only, hash-linked JSONL record. Hash chaining detects accidental
 * modification; it is not a cryptographic guarantee against an attacker able
 * to rewrite the whole file. A separate trusted anchor would be required.
 */
export class EpisodeJournal {
  /** @param {string} filePath @param {{clock?:()=>string}} options */
  constructor(filePath, {clock=()=>new Date().toISOString()}={}) {
    this.filePath=filePath;
    this.clock=clock;
    this.events=[];
    this.initialised=false;
  }

  async initialise() {
    if (this.initialised) throw new Error('Journal already initialised');
    await mkdir(dirname(this.filePath),{recursive:true});
    await writeFile(this.filePath,'',{flag:'wx'});
    this.initialised=true;
  }

  /** @param {string} type @param {object} data */
  async record(type,data) {
    if (!this.initialised) throw new Error('Journal not initialised');
    if(typeof type!=='string'||!type) throw new TypeError('Event type required');
    const entry={
      seq:this.events.length+1,
      at:this.clock(),
      type,
      data:structuredClone(data),
      prevHash:this.events.at(-1)?.hash ?? null,
    };
    const event={...entry,hash:digest(entry)};
    await appendFile(this.filePath,JSON.stringify(event)+'\n');
    this.events.push(event);
    return structuredClone(event);
  }
}

/**
 * Validate a JSONL journal without invoking any investigative tool.
 * @param {string} filePath
 */
export async function loadJournal(filePath) {
  const raw=await readFile(filePath,'utf8');
  if (!raw.endsWith('\n') || !raw.trim()) throw new Error('Journal empty or incomplete line');
  const events=[];
  for(const line of raw.trimEnd().split('\n')) {
    const event=JSON.parse(line);
    const {hash,...entry}=event;
    if(event.seq!==events.length+1) throw new Error(`Journal sequence mismatch at ${event.seq}`);
    if(event.prevHash!==(events.at(-1)?.hash ?? null)) throw new Error(`Journal parent hash mismatch at ${event.seq}`);
    if(hash!==digest(entry)) throw new Error(`Journal content hash mismatch at ${event.seq}`);
    events.push(event);
  }
  return events;
}

/**
 * Deterministic journal projection: reconstructs decisions and evidence, not
 * the LLM's unstored mental state. It does NOT reexecute tools or network calls.
 * @param {Array<import('./contracts.mjs').JournalEvent>} events
 */
export function projectJournal(events) {
  const result={episodeId:null,worldRef:null,status:'unknown',observations:[],hypotheses:[],toolCalls:0,decisions:0,termination:null};
  const evidence=new Map();
  const hypotheses=new Map();
  const terminal=new Set(['completed','inconclusive','budget_exhausted','policy_denied','error','cancelled']);
  for(const event of events) {
    if (result.termination) throw new Error('Events after episode termination');
    const {type,data}=event;
    if (type==='episode.activated') {
      if(result.episodeId)throw new Error('Duplicate activation');
      result.episodeId=data.mandate.id;
      result.worldRef=data.mandate.worldRef;
      result.status='activated';
    } else if (!result.episodeId) throw new Error('Events before activation');
    else if(type==='episode.contextualised') {
      result.status='contextualised';
      for(const observation of data.observations) {
        if(observation.worldRef!==result.worldRef)throw new Error('Journal World mismatch');
        if(evidence.has(observation.id))throw new Error('Duplicate observation');
        evidence.set(observation.id,observation);
      }
    } else if(type==='episode.investigating') result.status='investigating';
    else if(type==='decision.proposed')result.decisions++;
    else if(type==='hypothesis.recorded') {
      const hypothesis=data.hypothesis;
      if(hypothesis.evidenceRefs.some(id=>!evidence.has(id)))throw new Error('Unbacked hypothesis evidence');
      const previous=hypotheses.get(hypothesis.id);
      if(hypothesis.revision!==(previous?.revision??0)+1)throw new Error('Hypothesis revision mismatch');
      hypotheses.set(hypothesis.id,hypothesis);
    } else if(type==='observation.received') {
      if(data.observation.worldRef!==result.worldRef)throw new Error('Tool observation World mismatch');
      if(evidence.has(data.observation.id))throw new Error('Duplicate tool observation');
      evidence.set(data.observation.id,data.observation);
    } else if(type==='observation.requested')result.toolCalls++;
    else if(type==='episode.concluding') result.status='concluding';
    else if(type==='episode.terminated') {
      if(!terminal.has(data.status)) throw new Error('Invalid terminal state');
      result.termination={status:data.status,reason:data.reason};
      result.status=data.status;
    }
  }
  result.observations=[...evidence.values()];
  result.hypotheses=[...hypotheses.values()];
  return result;
}

/** @param {string} filePath */
export async function replayJournal(filePath) {
  const events=await loadJournal(filePath);
  const projection=projectJournal(events);
  if(!projection.termination)throw new Error('Episode has not reached terminal state');
  return {events,projection};
}
