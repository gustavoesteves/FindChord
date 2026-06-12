export interface LawDependencyEdge {
  source: string; // parentLawId
  target: string; // childLawId
  type: 'DERIVATION' | 'REDUNDANCY';
  score: number;  // Implication score (DIS_{source -> target})
}

export interface LawDependency {
  parentLawId: string;
  childLawId: string;
  explanatoryPower: number; // DIS score
}

export interface FundamentalLaw {
  lawId: string;
  descendants: string[];
  compressionGain: number;   // Number of descendant laws it explains
}

export interface LawDependencyGraph {
  nodes: string[];
  edges: LawDependencyEdge[];
  dependencies: LawDependency[];
  fundamentalLaws: FundamentalLaw[];
  metrics: {
    lcr: number;             // Law Compression Ratio
    hierarchyIndex: number;  // Hierarchy Index
  };
}
