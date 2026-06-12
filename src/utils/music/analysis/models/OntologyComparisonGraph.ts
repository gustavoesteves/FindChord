export type ComparisonEdgeType = 'OUTPERFORMS' | 'COMPLEMENTS' | 'SUBSUMES' | 'EQUIVALENT';

export interface ComparisonNode {
  id: string;
  label: string;
  ofs: number;
}

export interface ComparisonEdge {
  source: string;
  target: string;
  type: ComparisonEdgeType;
  margin: number; // Difference in OFS or comparison weight
}

export interface OntologyComparisonGraph {
  nodes: ComparisonNode[];
  edges: ComparisonEdge[];
}
