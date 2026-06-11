export type PatternNodeType =
  | 'CONSENSUS_REGION'
  | 'FRONTIER_REGION'
  | 'EMERGENT_REGION'
  | 'ANOMALY_REGION';

export interface PatternNode {
  id: string;
  type: PatternNodeType;
  label: string;
  size: number;
  description: string;
  metrics: {
    avgTAS: number;
    avgTFI: number;
    avgISS: number;
    avgADI: number;
    fcs: number; // Frontier Confidence Score
    cps: number; // Community Purity Score
    efi: number; // Emergent Frontier Index
  };
}

export interface PatternEdge {
  from: string;
  to: string;
  type: 'transition' | 'similarity' | 'exclusion';
  weight: number;
}

export interface AnalyticalPatternGraph {
  nodes: PatternNode[];
  edges: PatternEdge[];
}
