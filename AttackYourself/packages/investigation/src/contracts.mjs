/**
 * Public, provider-independent experiment contracts. The input source is a
 * declared synthetic fixture, not a verified observation of an AWS account.
 * JSDoc types keep the first-run experiment dependency-free on Node 22.
 *
 * @typedef {{id: string, revision: number, title?: string, kind?: string}} WorldDescription
 * @typedef {{id: string, worldRef: string, kind: string, subject: string,
 *   occurredAt: string, ingestedAt: string,
 *   source: {kind: string, reference: string}, facts: Record<string,string>}} Observation
 * @typedef {{id: string, version: number, rules: Array<{id: string, match: {
 *   kind: string, facts?: Record<string,string>}, labels: string[]}>}} LabellingRuleset
 * @typedef {{observationId: string, worldRef: string, ruleset: string, labels: string[], matchedRules: string[]}} LabelledObservation
 * @typedef {{id: string, worldRef: string, triggerRef: string, mandate: string,
 *   activationPolicy?: string, classification?: LabelledObservation,
 *   evidenceRefs: string[], permittedTools: string[], limits: {
 *   maxDecisions: number, maxToolCalls: number, maxDurationMs: number}}} EpisodeMandate
 * @typedef {{id: string, proposition: string, status: 'candidate'|'contested'|'rejected'|'supported',
 *   revision: number, evidenceRefs: string[], assumptions: string[]}} Hypothesis
 * @typedef {{id: string, summary: string, worldRef: string}} RecalledExperience
 * @typedef {{kind:'hypothesise'|'revise'|'observe'|'conclude', reason: string,
 *   hypothesis?: Omit<Hypothesis,'revision'>, tool?: string, args?: Record<string,string>,
 *   outcome?: 'completed'|'inconclusive'}} InvestigationDecision
 * @typedef {{seq: number, at: string, type: string, data: object, prevHash: string|null, hash: string}} JournalEvent
 */

/** @param {unknown} value @param {string} name */
export function requireNonEmpty(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} must be a non-empty string`);
  return value;
}

/** @param {Observation} observation */
export function validateObservation(observation) {
  if (!observation || typeof observation !== 'object') throw new TypeError('Observation must be an object');
  for (const key of ['id', 'worldRef', 'kind', 'subject', 'occurredAt', 'ingestedAt']) requireNonEmpty(observation[key], `observation.${key}`);
  if (!observation.source || typeof observation.source !== 'object') throw new TypeError('Observation source is required');
  requireNonEmpty(observation.source.kind, 'observation.source.kind');
  requireNonEmpty(observation.source.reference, 'observation.source.reference');
  if (!observation.facts || typeof observation.facts !== 'object' || Array.isArray(observation.facts)) throw new TypeError('Observation facts must be an object');
  if (Object.entries(observation.facts).some(([key, value]) => !key || typeof value !== 'string')) throw new TypeError('Observation facts must contain only string values');
  for (const field of ['occurredAt', 'ingestedAt']) {
    if (!Number.isFinite(Date.parse(observation[field]))) throw new TypeError(`Invalid ${field}`);
  }
  return structuredClone(observation);
}

/** @param {EpisodeMandate} mandate */
export function validateMandate(mandate) {
  requireNonEmpty(mandate?.id, 'mandate.id');
  requireNonEmpty(mandate?.worldRef, 'mandate.worldRef');
  requireNonEmpty(mandate?.triggerRef, 'mandate.triggerRef');
  requireNonEmpty(mandate?.mandate, 'mandate.mandate');
  if (mandate.activationPolicy !== undefined) requireNonEmpty(mandate.activationPolicy, 'mandate.activationPolicy');
  if (mandate.classification !== undefined) {
    const c=mandate.classification;
    if(c.observationId!==mandate.triggerRef||c.worldRef!==mandate.worldRef)throw new TypeError('Mandate classification must match World and trigger');
    requireNonEmpty(c.ruleset,'mandate.classification.ruleset');
    if(!Array.isArray(c.labels)||!c.labels.every(x=>typeof x==='string'&&x))throw new TypeError('Invalid mandate labels');
  }
  if (!Array.isArray(mandate.evidenceRefs) || mandate.evidenceRefs.length === 0 || !mandate.evidenceRefs.every(x=>typeof x==='string'&&x)) throw new TypeError('mandate.evidenceRefs required');
  if (!Array.isArray(mandate.permittedTools) || !mandate.permittedTools.every(x=>typeof x==='string'&&x)) throw new TypeError('mandate.permittedTools must be a string array');
  for (const key of ['maxDecisions','maxToolCalls','maxDurationMs']) {
    const value = mandate.limits?.[key];
    if (!Number.isSafeInteger(value) || value < (key === 'maxToolCalls' ? 0 : 1)) throw new TypeError(`Invalid ${key}`);
  }
  return structuredClone(mandate);
}
