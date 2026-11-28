import { createHash } from 'node:crypto';
import { requireNonEmpty } from './contracts.mjs';

/**
 * A cheap, deterministic activation controller. It does not investigate and
 * cannot authorise a tool. Its seen-set provides in-process deduplication;
 * stable episode IDs permit durable deduplication by the journal writer.
 */
export class ActivationController {
  /** @param {{id: string, version: number, triggerLabel: string, mandate: string, permittedTools: string[], limits: {maxDecisions:number,maxToolCalls:number,maxDurationMs:number}}} policy */
  constructor(policy) {
    requireNonEmpty(policy?.id, 'activation policy ID');
    requireNonEmpty(policy?.triggerLabel, 'activation trigger label');
    requireNonEmpty(policy?.mandate, 'activation mandate');
    if (!Number.isSafeInteger(policy.version) || policy.version < 1) throw new TypeError('Invalid activation policy version');
    this.policy = structuredClone(policy);
    this.seen = new Set();
  }

  /** @param {import('./contracts.mjs').LabelledObservation} labelled */
  consider(labelled) {
    if (!labelled.labels.includes(this.policy.triggerLabel)) return null;
    const key = [this.policy.id, this.policy.version, labelled.worldRef, labelled.observationId].join('|');
    if (this.seen.has(key)) return null;
    const episodeId = `episode-${createHash('sha256').update(key).digest('hex').slice(0,12)}`;
    this.seen.add(key);
    return {
      id: episodeId,
      worldRef: labelled.worldRef,
      triggerRef: labelled.observationId,
      activationPolicy: `${this.policy.id}@${this.policy.version}`,
      classification: structuredClone(labelled),
      mandate: this.policy.mandate,
      evidenceRefs: [labelled.observationId],
      permittedTools: [...this.policy.permittedTools],
      limits: structuredClone(this.policy.limits),
    };
  }
}

export const IAM_ACTIVATION_POLICY = Object.freeze({
  id:'policy-iam-effective-access', version:1,
  triggerLabel:'question.effective-s3-access',
  mandate:'Examine whether the synthetic Lambda role has effective S3 read access and revise the hypothesis when contradictory evidence arrives.',
  permittedTools:['inspect_synthetic_scp'],
  limits:{maxDecisions:8,maxToolCalls:2,maxDurationMs:120_000},
});
