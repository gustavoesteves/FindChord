import type { TheoryStage } from './TheoryCandidate';

export interface EvolutionHistoryEntry {
  generation: number;
  metrics: {
    tcs: number;
    tri: number;
    gs: number;
    egsw: number;
    ns: number;
    tms: number;
    tas?: number;
    iss?: number;
  };
  stage: TheoryStage;
}

export interface TheoryFitness {
  lss: number;             // Longitudinal Survival Score
  tcg: number;             // Theory Compression Gain
  tri2: number;            // Theory Replacement Index
  eps: number;             // Explanatory Persistence Score
  generationsAlive: number;
  isExtinct: boolean;
}
