export type FitnessNodeType =
  | 'classical_school'
  | 'emergent_theory'
  | 'replaced_theory'
  | 'extinct_theory';

export type FitnessEdgeType =
  | 'DOMINATES'
  | 'COMPLEMENTS'
  | 'REPLACES';

export interface FitnessNode {
  id: string; // e.g. "school_functionalism" or "candidate_1"
  type: FitnessNodeType;
  label: string;
  description: string;
  metrics?: {
    tas: number;
    iss: number;
    tms: number;
    lss?: number;
    tri2?: number;
  };
}

export interface FitnessEdge {
  from: string;
  to: string;
  type: FitnessEdgeType;
  weight: number;
}

export interface TheoryFitnessGraph {
  nodes: FitnessNode[];
  edges: FitnessEdge[];
}
