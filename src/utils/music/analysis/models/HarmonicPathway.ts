import type { TrajectoryInterpretation } from "./MelodicInterpretation";

export interface PathwayMetrics {
  smoothness: number;
  commonToneRetention: number;
  chromaticMotion: number;
  bassCoherence: number;
  archetypeStrength: number;
  totalScore: number;
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
  detectedMotives: string[];
  metrics: PathwayMetrics;
}
