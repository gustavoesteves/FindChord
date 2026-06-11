import type { TheoryCandidate } from './TheoryCandidate';

export type TheoryGraphEdgeType =
  | 'DERIVES_FROM'
  | 'CONFLICTS_WITH'
  | 'COMPLEMENTS';

export interface TheoryGraphNode {
  id: string; // e.g. "school_functionalism" or "candidate_sym_aug"
  type: 'classical_school' | 'emergent_candidate';
  label: string;
  description: string;
  candidateData?: TheoryCandidate;
}

export interface TheoryGraphEdge {
  from: string;
  to: string;
  type: TheoryGraphEdgeType;
  weight: number;
}

export interface TheoryKnowledgeGraph {
  nodes: TheoryGraphNode[];
  edges: TheoryGraphEdge[];
}
