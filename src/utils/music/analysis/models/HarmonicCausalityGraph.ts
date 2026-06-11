export type CausalityType = 
  | 'SUPPORTS'
  | 'TRIGGERS_MODULATION'
  | 'STABILIZES_CONSENSUS'
  | 'GENERATES_DISAGREEMENT';

export interface CausalityNode {
  id: string;
  type: 'cause' | 'effect' | 'pivot';
  label: string;
  chordIndex?: number;
  description?: string;
}

export interface CausalityEdge {
  from: string; // Node ID
  to: string;   // Node ID
  type: CausalityType;
  weight?: number; // e.g. CIS score or impact strength
}

export interface HarmonicCausalityGraph {
  nodes: CausalityNode[];
  edges: CausalityEdge[];
}
