import { validateObservation } from './contracts.mjs';

/**
 * Precisely named, read-only fixture capability. There is NO AWS SDK, shell,
 * network client, attack probe, or hidden cross-account access.
 */
export class SyntheticScpTool {
  /** @param {import('./contracts.mjs').Observation} fixture */
  constructor(fixture) { this.fixture=validateObservation(fixture); this.calls=0; }
  /** @param {Record<string,string>} args @param {{worldRef:string,signal:AbortSignal}} context */
  async observe(args,context) {
    this.calls++;
    if(context.signal.aborted)throw new Error('Cancelled');
    if(context.worldRef!==this.fixture.worldRef)throw new Error('Fixture World mismatch');
    if(args.roleArn!==this.fixture.subject||args.action!==this.fixture.facts.action)throw new Error('Fixture query outside synthetic scope');
    return structuredClone(this.fixture);
  }
}
