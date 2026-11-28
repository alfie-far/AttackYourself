import { validateMandate, validateObservation, requireNonEmpty } from './contracts.mjs';
import { projectJournal } from './journal.mjs';
import { NoMemory } from './memory.mjs';

/** @param {unknown} error */
function message(error) { return error instanceof Error ? error.message : String(error); }

/**
 * Enforce a deadline even when an async strategy/tool does not cooperate.
 * Cancelling the signal is advisory; real adapters must guarantee read-only
 * calls and enforce their own per-request timeouts.
 * @template T
 * @param {(signal:AbortSignal)=>Promise<T>} operation
 * @param {number} timeoutMs
 */
async function withinDeadline(operation, timeoutMs) {
  const controller=new AbortController();
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(()=>operation(controller.signal)),
      new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Episode deadline exceeded'));},Math.max(1,timeoutMs));}),
    ]);
  } finally { clearTimeout(timer); }
}

/**
 * A bounded, append-only episode controller. The strategy proposes decisions;
 * deterministic enforcement decides what can actually be observed.
 */
export class EpisodeController {
  /**
   * @param {{journal:import('./journal.mjs').EpisodeJournal,
   *   strategy:{next:(state:object)=>Promise<object>},
   *   tools:Record<string,{observe:(args:Record<string,string>,context:{worldRef:string,signal:AbortSignal})=>Promise<object>}>,
   *   memory?:{recall:(context:object)=>Promise<Array<{id:string,summary:string,worldRef:string}>>},
   *   nowMs?:()=>number}} options
   */
  constructor({journal,strategy,tools,memory=new NoMemory(),nowMs=()=>Date.now()}) {
    this.journal=journal;
    this.strategy=strategy;
    this.tools=tools;
    this.memory=memory;
    this.nowMs=nowMs;
  }

  /** @param {import('./contracts.mjs').EpisodeMandate} inputMandate @param {Array<import('./contracts.mjs').Observation>} inputObservations */
  async run(inputMandate,inputObservations) {
    const mandate=validateMandate(inputMandate);
    const observations=inputObservations.map(validateObservation);
    if(observations.some(x=>x.worldRef!==mandate.worldRef))throw new Error('Input observation World mismatch');
    if(new Set(observations.map(x=>x.id)).size!==observations.length)throw new Error('Duplicate input observation IDs');
    if(mandate.evidenceRefs.some(id=>!observations.some(x=>x.id===id)))throw new Error('Missing mandate evidence');
    const startedAt=this.nowMs();
    if(!Number.isFinite(startedAt))throw new Error('Clock returned nonfinite value');
    let toolCalls=0;
    const hypotheses=new Map();
    const evidence=new Map(observations.map(x=>[x.id,x]));
    await this.journal.initialise();
    await this.journal.record('episode.activated',{mandate});
    const terminate=async(status,reason)=>{
      await this.journal.record('episode.terminated',{status,reason,toolCalls});
      return projectJournal(this.journal.events);
    };
    let experiences=[];
    try {
      const remaining=mandate.limits.maxDurationMs-(this.nowMs()-startedAt);
      if(remaining<=0)return terminate('budget_exhausted','Episode time budget exhausted before memory recall');
      experiences=await withinDeadline(signal=>this.memory.recall({worldRef:mandate.worldRef,mandate:mandate.mandate,signal}),remaining);
      if(!Array.isArray(experiences)||experiences.length>20)throw new Error('Memory recall must return at most 20 experiences');
      for(const item of experiences) {
        requireNonEmpty(item?.id,'memory.id');
        requireNonEmpty(item?.summary,'memory.summary');
        if(item.summary.length>4000)throw new Error('Memory summary exceeds safe size');
        if(item.worldRef!==mandate.worldRef)throw new Error('Cross-World memory denied');
      }
    } catch(error) {
      await this.journal.record('memory.failed',{error:message(error)});
      return terminate('inconclusive','Memory lookup failed; no investigation was attempted');
    }
    await this.journal.record('episode.contextualised',{observations,memories:structuredClone(experiences)});
    await this.journal.record('episode.investigating',{});
    for(let step=0;step<mandate.limits.maxDecisions;step++) {
      let remaining=mandate.limits.maxDurationMs-(this.nowMs()-startedAt);
      if(remaining<=0)return terminate('budget_exhausted','Episode time budget exhausted');
      const state=structuredClone({mandate,observations:[...evidence.values()],hypotheses:[...hypotheses.values()],memories:experiences,remainingToolCalls:mandate.limits.maxToolCalls-toolCalls,step});
      let decision;
      try {
        decision=await withinDeadline(signal=>this.strategy.next(state,{signal}),remaining);
      } catch(error) {
        await this.journal.record('strategy.failed',{error:message(error)});
        return terminate('inconclusive','Investigation strategy failed or timed out');
      }
      if(!decision||typeof decision!=='object'||!['hypothesise','revise','observe','conclude'].includes(decision.kind)||typeof decision.reason!=='string'||!decision.reason.trim()) {
        await this.journal.record('strategy.invalid',{kind:decision?.kind??null});
        return terminate('inconclusive','Invalid strategy decision');
      }
      await this.journal.record('decision.proposed',{step,decision:structuredClone(decision)});
      if(decision.kind==='hypothesise'||decision.kind==='revise') {
        const h=decision.hypothesis;
        if(!h||typeof h.id!=='string'||!h.id||typeof h.proposition!=='string'||!h.proposition.trim()||!['candidate','contested','rejected','supported'].includes(h.status)||!Array.isArray(h.evidenceRefs)||h.evidenceRefs.length===0||!Array.isArray(h.assumptions)||h.assumptions.some(x=>typeof x!=='string')||h.evidenceRefs.some(id=>!evidence.has(id))) {
          await this.journal.record('hypothesis.denied',{reason:'Missing or ungrounded evidence / invalid hypothesis'});
          return terminate('inconclusive','Hypothesis did not satisfy deterministic evidence checks');
        }
        const prior=hypotheses.get(h.id);
        if((decision.kind==='hypothesise'&&prior)||(decision.kind==='revise'&&!prior)) {
          await this.journal.record('hypothesis.denied',{reason:'Invalid hypothesis lifecycle'});
          return terminate('inconclusive','Invalid hypothesis lifecycle');
        }
        const revised={...structuredClone(h),revision:(prior?.revision??0)+1};
        hypotheses.set(revised.id,revised);
        await this.journal.record('hypothesis.recorded',{hypothesis:revised,reason:decision.reason});
      } else if(decision.kind==='observe') {
        const tool=decision.tool;
        if(typeof tool!=='string'||!mandate.permittedTools.includes(tool)||!Object.hasOwn(this.tools,tool)) {
          await this.journal.record('capability.denied',{tool:typeof tool==='string'?tool:null,reason:'Tool outside mandate/registry'});
          return terminate('policy_denied','The requested capability is not permitted');
        }
        if(toolCalls>=mandate.limits.maxToolCalls) {
          await this.journal.record('budget.exhausted',{kind:'tool_calls'});
          return terminate('budget_exhausted','Tool call budget exhausted');
        }
        if(!decision.args||typeof decision.args!=='object'||Array.isArray(decision.args)||Object.entries(decision.args).some(([k,v])=>!k||typeof v!=='string')){
          await this.journal.record('capability.denied',{tool,reason:'Invalid tool arguments'});
          return terminate('policy_denied','Invalid tool arguments');
        }
        toolCalls++;
        await this.journal.record('observation.requested',{tool,args:decision.args,reason:decision.reason});
        remaining=mandate.limits.maxDurationMs-(this.nowMs()-startedAt);
        if(remaining<=0)return terminate('budget_exhausted','Episode time budget exhausted before tool execution');
        try {
          const raw=await withinDeadline(signal=>this.tools[tool].observe(structuredClone(decision.args),{worldRef:mandate.worldRef,signal}),remaining);
          const observed=validateObservation(raw);
          if(observed.worldRef!==mandate.worldRef)throw new Error('Tool returned a cross-World observation');
          if(evidence.has(observed.id))throw new Error('Tool returned a duplicate observation ID');
          // Evidence only enters the context after validation and journalling.
          await this.journal.record('observation.received',{tool,observation:observed});
          evidence.set(observed.id,observed);
        } catch(error) {
          await this.journal.record('observation.failed',{tool,error:message(error)});
          return terminate('inconclusive','The permitted observation failed or timed out');
        }
      } else {
        if(!['completed','inconclusive'].includes(decision.outcome)) {
          await this.journal.record('strategy.invalid',{kind:'conclude',outcome:decision.outcome});
          return terminate('inconclusive','Invalid conclusion status');
        }
        await this.journal.record('episode.concluding',{reason:decision.reason,hypothesisRefs:[...hypotheses.keys()]});
        return terminate(decision.outcome,decision.reason);
      }
    }
    await this.journal.record('budget.exhausted',{kind:'decisions'});
    return terminate('budget_exhausted','Decision step budget exhausted');
  }
}
