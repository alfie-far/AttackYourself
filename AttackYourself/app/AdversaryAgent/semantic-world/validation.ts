import type {
  InterpretationProposal,
  SemanticAssertion,
  SourceDocument,
  WorldDescription,
} from './contracts.js';

export class SemanticValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SemanticValidationError';
  }
}

function requireText(value: unknown, name: string, maxLength = 10_000): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > maxLength) {
    throw new SemanticValidationError(`${name} must be non-empty text of at most ${maxLength} characters`);
  }
}

function requireId(value: unknown, name: string): asserts value is string {
  requireText(value, name, 120);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(value)) {
    throw new SemanticValidationError(`${name} is not a valid ID`);
  }
}

function requireStrings(value: unknown, name: string, maxCount = 100): asserts value is string[] {
  if (!Array.isArray(value) || value.length > maxCount) {
    throw new SemanticValidationError(`${name} must be an array of at most ${maxCount} strings`);
  }
  for (const [index, item] of value.entries()) requireText(item, `${name}[${index}]`, 1000);
  if (new Set(value).size !== value.length) throw new SemanticValidationError(`${name} contains duplicates`);
}

export function validateWorld(world: WorldDescription): void {
  requireId(world.id, 'World ID');
  if (!Number.isSafeInteger(world.revision) || world.revision < 1) {
    throw new SemanticValidationError('World revision must be a positive integer');
  }
  requireText(world.title, 'World title', 500);
  requireText(world.description, 'World description', 5000);
}

export function validateSource(world: WorldDescription, source: SourceDocument): void {
  requireId(source.id, 'Source ID');
  if (source.worldId !== world.id || source.worldRevision !== world.revision) {
    throw new SemanticValidationError('Source belongs to another World or World revision');
  }
  requireText(source.mediaType, 'Source media type', 150);
  requireText(source.content, 'Source content', 100_000);
  if (source.language !== undefined) requireText(source.language, 'Source language', 50);
  if (!source.origin || !['authored', 'external-document', 'tool-result'].includes(source.origin.kind)) {
    throw new SemanticValidationError('Source origin kind is invalid');
  }
  requireText(source.origin.reference, 'Source origin reference', 1000);
  if (!Number.isFinite(Date.parse(source.capturedAt))) {
    throw new SemanticValidationError('Source capturedAt must be a valid date');
  }
}

export function validateAssertion(
  world: WorldDescription,
  source: SourceDocument,
  assertion: SemanticAssertion,
): void {
  requireId(assertion.id, 'Assertion ID');
  if (assertion.worldId !== world.id || assertion.worldRevision !== world.revision) {
    throw new SemanticValidationError('Assertion belongs to another World or revision');
  }
  for (const key of ['subject', 'predicate', 'object'] as const) {
    requireText(assertion[key], `Assertion ${key}`, 1000);
  }
  if (!['positive', 'negative'].includes(assertion.polarity)) {
    throw new SemanticValidationError('Invalid assertion polarity');
  }
  if (assertion.qualifiers !== undefined) {
    const entries = Object.entries(parseRecord(assertion.qualifiers, 'Assertion qualifiers'));
    if (entries.length > 50) throw new SemanticValidationError('Too many qualifiers');
    for (const [key, value] of entries) {
      requireText(key, 'Qualifier key', 100);
      requireText(value, 'Qualifier value', 1000);
    }
  }
  const { anchor } = assertion;
  if (!anchor || anchor.sourceId !== source.id) {
    throw new SemanticValidationError('Assertion cites the wrong source');
  }
  if (
    !Number.isSafeInteger(anchor.start) ||
    !Number.isSafeInteger(anchor.end) ||
    anchor.start < 0 ||
    anchor.end <= anchor.start ||
    anchor.end > source.content.length ||
    source.content.slice(anchor.start, anchor.end) !== anchor.quote
  ) {
    throw new SemanticValidationError(`Assertion ${assertion.id} has an unverified source quote/span`);
  }
}

export function validateProposal(proposal: InterpretationProposal, assertionIds: ReadonlySet<string>): void {
  requireId(proposal.id, 'Interpretation ID');
  requireText(proposal.proposition, 'Proposition', 5000);
  for (const name of ['supports', 'challenges', 'refutes', 'assumptions', 'openQuestions'] as const) {
    requireStrings(proposal[name], name);
  }
  const allEvidence = [...proposal.supports, ...proposal.challenges, ...proposal.refutes];
  if (new Set(allEvidence).size !== allEvidence.length) {
    throw new SemanticValidationError('An assertion cannot play conflicting evidence roles in one interpretation');
  }
  for (const id of allEvidence) {
    if (!assertionIds.has(id)) throw new SemanticValidationError(`Unknown or foreign assertion reference: ${id}`);
  }
}

export function parseRecord(value: unknown, name: string): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== 'object') {
    throw new SemanticValidationError(`${name} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function parseModelJson(raw: string): Record<string, unknown> {
  if (raw.length > 100_000) throw new SemanticValidationError('Model output too large');
  try {
    return parseRecord(JSON.parse(raw) as unknown, 'Model output');
  } catch (error) {
    if (error instanceof SemanticValidationError) throw error;
    throw new SemanticValidationError('Model must return a single valid JSON object, with no Markdown fences');
  }
}
