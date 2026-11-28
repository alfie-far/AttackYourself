/**
 * Optional cross-episode recall port. Memory is context, never an observation,
 * proof, or authority. A future AgentCore Memory adapter can implement this
 * contract without replacing the authoritative Episode Journal.
 */
export class NoMemory {
  async recall(_context) { return []; }
}
