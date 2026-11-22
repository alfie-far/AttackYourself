/**
 * World semantics are domain-neutral. A "World" may be fictional, technical,
 * documented, or observed. No class in this package authorises side effects.
 */
export interface WorldDescription {
  id: string;
  revision: number;
  title: string;
  description: string;
}

export interface SourceDocument {
  id: string;
  worldId: string;
  worldRevision: number;
  /** E.g. text/plain, text/markdown, application/json, application/ld+json. */
  mediaType: string;
  language?: string;
  content: string;
  origin: {
    kind: 'authored' | 'external-document' | 'tool-result';
    reference: string;
  };
  capturedAt: string;
}

/** The exact, byte-for-byte (UTF-16 string index) passage in a source. */
export interface SourceAnchor {
  sourceId: string;
  start: number;
  end: number;
  quote: string;
}

/** A source assertion is what the source *says*, not necessarily ground truth. */
export interface SemanticAssertion {
  id: string;
  worldId: string;
  worldRevision: number;
  subject: string;
  predicate: string;
  object: string;
  polarity: 'positive' | 'negative';
  /** Optional semantic dimensions: role, recipient, tense, time, conditions, etc. */
  qualifiers?: Record<string, string>;
  anchor: SourceAnchor;
}

/** The model identifies what assertions it believes support or undermine a reading. */
export interface InterpretationProposal {
  id: string;
  proposition: string;
  supports: string[];
  challenges: string[];
  refutes: string[];
  assumptions: string[];
  openQuestions: string[];
}

/**
 * These statuses describe the provenance of links supplied by an interpreter.
 * In particular 'supported' does not mean independently proven true.
 */
export type InterpretationStatus =
  | 'underdetermined'
  | 'candidate'
  | 'supported'
  | 'contested'
  | 'rejected';

export interface InterpretationRevision extends InterpretationProposal {
  worldId: string;
  worldRevision: number;
  revision: number;
  status: InterpretationStatus;
  recordedAt: string;
}

export interface InterpretationHistory {
  id: string;
  revisions: InterpretationRevision[];
}

export interface SemanticWorldSnapshot {
  world: WorldDescription;
  sources: SourceDocument[];
  assertions: SemanticAssertion[];
  interpretations: InterpretationRevision[];
}
