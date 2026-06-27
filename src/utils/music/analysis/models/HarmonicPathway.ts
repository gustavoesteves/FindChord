import type { TrajectoryInterpretation } from "./MelodicInterpretation";

export interface PathwayMetrics {
  totalScore: number;
  tensionProfile: number[];
}

export interface HarmonicPathway {
  bassLine: string[];
  melodyLine: string[];
  harmonyEvents: {
    chord: string;
    bass: string;
    melody: string;
    interpretation: TrajectoryInterpretation;
  }[];
  metrics: PathwayMetrics;
}
