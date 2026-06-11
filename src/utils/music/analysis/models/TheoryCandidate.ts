export type TheoryStage =
  | 'CLUSTER'
  | 'PATTERN_CANDIDATE'
  | 'THEORY_CANDIDATE'
  | 'VALIDATED_THEORY_CANDIDATE';

export interface TheoryCandidate {
  id: string;
  name: string;
  stage: TheoryStage;
  prototypeChords: string[];
  properties: string[];
  description: string;
  metrics: {
    tcs: number;  // Theory Cohesion Score (> 0.80)
    tri: number;  // Theory Reproducibility Index (> 0.75)
    gs: number;   // Generalization Score (> 0.80)
    egsw: number; // Weighted Explanatory Gain Score (> 0.10)
    ns: number;   // Novelty Score (> 0.40)
    tms: number;  // Theory Maturity Score (> 0.80)
  };
}
