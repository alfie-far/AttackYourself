import { requireNonEmpty, validateObservation } from './contracts.mjs';

/**
 * Deterministic, versioned labelling. No model invocation and no finding is
 * inferred: a rule match is only a classification of the incoming source.
 * @param {import('./contracts.mjs').Observation} observation
 * @param {import('./contracts.mjs').LabellingRuleset} ruleset
 * @returns {import('./contracts.mjs').LabelledObservation}
 */
export function labelObservation(observation, ruleset) {
  const value = validateObservation(observation);
  requireNonEmpty(ruleset?.id, 'ruleset.id');
  if (!Number.isSafeInteger(ruleset.version) || ruleset.version < 1 || !Array.isArray(ruleset.rules)) throw new TypeError('Invalid ruleset');
  const labels = new Set();
  const matchedRules = [];
  const seen = new Set();
  for (const rule of ruleset.rules) {
    requireNonEmpty(rule?.id, 'rule.id');
    if (seen.has(rule.id)) throw new TypeError('Duplicate rule ID');
    seen.add(rule.id);
    requireNonEmpty(rule.match?.kind, 'rule.match.kind');
    if (!Array.isArray(rule.labels) || !rule.labels.every(label => typeof label === 'string' && label)) throw new TypeError('Invalid rule labels');
    if (rule.match.kind !== value.kind) continue;
    if (Object.entries(rule.match.facts ?? {}).some(([key, expected]) => value.facts[key] !== expected)) continue;
    matchedRules.push(rule.id);
    for (const label of rule.labels) labels.add(label);
  }
  return {
    observationId: value.id,
    worldRef: value.worldRef,
    ruleset: `${ruleset.id}@${ruleset.version}`,
    labels: [...labels].sort(),
    matchedRules: matchedRules.sort(),
  };
}

export const IAM_LABELLING_RULESET = Object.freeze({
  id: 'aws-iam-observation', version: 1,
  rules: [
    {
      id: 'identity-allow-s3-read',
      match: {kind: 'aws.iam.identity_statement', facts: {effect:'Allow',action:'s3:GetObject'}},
      labels: ['iam.identity-allow-declared','question.effective-s3-access'],
    },
    {
      id: 'scp-deny-s3-read',
      match: {kind: 'aws.organizations.scp_statement', facts: {effect:'Deny', action:'s3:GetObject'}},
      labels: ['iam.scp-deny-declared','question.reconsider-access'],
    },
  ],
});
