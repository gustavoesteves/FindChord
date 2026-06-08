export type HarmonicNodeType =
  | 'REGION'
  | 'PHRASE'
  | 'PHRASE_GROUP'
  | 'CHORD'
  | 'CADENCE';

export interface HarmonicNode {
  id: string; // ex: "chord:0", "phrase:1", "cadence:0"
  type: HarmonicNodeType;
  label: string; // Ex: "Cmaj7 (Imaj7)", "Frase 1"
  properties: Record<string, unknown>;
}

export type HarmonicEdgeRelation =
  | 'CONTAINS'
  | 'PART_OF'
  | 'ENDS_WITH'
  | 'RESOLVES_TO'
  | 'PREPARES'
  | 'RESOLVES'
  | 'ANSWERS'
  | 'MODULATES_TO'
  | 'FOLLOWS';

export interface HarmonicEdge {
  id: string; // "sourceId->relation->targetId"
  sourceId: string;
  targetId: string;
  relation: HarmonicEdgeRelation;
  properties?: Record<string, unknown>;
}

export interface HarmonicKnowledgeGraph {
  nodes: HarmonicNode[];
  edges: HarmonicEdge[];
}
