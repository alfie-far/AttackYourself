import type {
  InterpretationProposal,
  SemanticAssertion,
  SourceDocument,
  WorldDescription,
} from './contracts.js';

/** Scripted extraction: the engine can be tested without claiming an LLM got these right. */
export const laboratoryWorld: WorldDescription = {
  id: 'lab-story',
  revision: 1,
  title: 'The laboratory key',
  description: 'Fictional story whose interpretation changes as new passages arrive.',
};

function source(id: string, content: string): SourceDocument {
  return {
    id,
    worldId: laboratoryWorld.id,
    worldRevision: laboratoryWorld.revision,
    mediaType: 'text/plain',
    language: 'en',
    content,
    origin: { kind: 'authored', reference: 'AttackYourself synthetic curriculum' },
    capturedAt: '2026-01-01T00:00:00.000Z',
  };
}

function assertion(
  id: string,
  document: SourceDocument,
  quote: string,
  subject: string,
  predicate: string,
  object: string,
  polarity: 'positive' | 'negative' = 'positive',
): SemanticAssertion {
  const start = document.content.indexOf(quote);
  if (start < 0) throw new Error(`Fixture quote is not in document ${document.id}`);
  return {
    id,
    worldId: laboratoryWorld.id,
    worldRevision: laboratoryWorld.revision,
    subject,
    predicate,
    object,
    polarity,
    anchor: { sourceId: document.id, start, end: start + quote.length, quote },
  };
}

export interface ScriptedRound {
  source: SourceDocument;
  assertions: SemanticAssertion[];
  interpretations: InterpretationProposal[];
}

const first = source(
  'story-1',
  "Mara gave Eli the key to the laboratory. Only authorised researchers may enter. Eli's credentials had expired.",
);
const second = source('story-2', 'The laboratory door requires an active access card.');
const third = source(
  'story-3',
  'The key Mara gave Eli opens a storage cabinet inside the laboratory, not the laboratory door.',
);

const keyOpensDoor = 'The key may allow Eli to open the laboratory door.';
const credentialImplication = 'Eli lacks currently valid researcher credentials.';

export const laboratoryRounds: ScriptedRound[] = [
  {
    source: first,
    assertions: [
      assertion('a-key-gift', first, 'Mara gave Eli the key to the laboratory.', 'mara', 'gave-key-to', 'eli'),
      assertion('a-entry-rule', first, 'Only authorised researchers may enter.', 'laboratory', 'entry-requires', 'authorised-researcher'),
      assertion('a-credentials', first, "Eli's credentials had expired.", 'eli', 'credential-status', 'expired'),
    ],
    interpretations: [
      {
        id: 'h-door-key', proposition: keyOpensDoor,
        supports: ['a-key-gift'], challenges: [], refutes: [],
        assumptions: ['the given key is for the exterior laboratory door'],
        openQuestions: ['Which lock does the key operate?'],
      },
      {
        id: 'h-credentials', proposition: credentialImplication,
        supports: ['a-entry-rule', 'a-credentials'], challenges: [], refutes: [],
        assumptions: [], openQuestions: ['Is any alternative authorisation possible?'],
      },
    ],
  },
  {
    source: second,
    assertions: [
      assertion('a-card-required', second, 'The laboratory door requires an active access card.', 'laboratory-door', 'requires', 'active-access-card'),
    ],
    interpretations: [
      {
        id: 'h-door-key', proposition: keyOpensDoor,
        supports: ['a-key-gift'], challenges: ['a-card-required'], refutes: [],
        assumptions: ['the given key is for the exterior laboratory door'],
        openQuestions: ['Could the key still be a physical override?'],
      },
    ],
  },
  {
    source: third,
    assertions: [
      assertion('a-cabinet-key', third, 'The key Mara gave Eli opens a storage cabinet inside the laboratory', 'key', 'opens', 'lab-cabinet'),
      assertion('a-not-door-key', third, 'not the laboratory door.', 'key', 'opens', 'laboratory-door', 'negative'),
    ],
    interpretations: [
      {
        id: 'h-door-key', proposition: keyOpensDoor,
        supports: ['a-key-gift'], challenges: ['a-card-required'], refutes: ['a-not-door-key'],
        assumptions: [], openQuestions: [],
      },
      {
        id: 'h-cabinet-key', proposition: 'The key opens a storage cabinet inside the laboratory.',
        supports: ['a-cabinet-key'], challenges: [], refutes: [],
        assumptions: [], openQuestions: [],
      },
    ],
  },
];
