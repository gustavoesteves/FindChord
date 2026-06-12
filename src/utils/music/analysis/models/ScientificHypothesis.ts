export interface ScientificHypothesis {
  id: string;
  statement: string;
  sourceOntology: string;
  concepts: string[];
  claims: string[];
  testableClaims: string[];
  hns: number;
  fi: number;
  dis: number;
  sts?: number; // Scientific Test Severity
  status: 'generated' | 'testing' | 'supported' | 'falsified';
}
