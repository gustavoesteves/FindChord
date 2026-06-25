import type { TonalCenterCandidate } from "../engines/PhraseAnalysisEngine";
import type { NarrativeGoal } from "./HarmonicSeed";

export type NarrativePhase = "EXPOSITION" | "DEVELOPMENT" | "CLIMAX" | "RESOLUTION";

export interface HarmonicEvent {
  chord: string;
  fieldId: string;
  bass: string;
  slotIndex: number;
  tensionAtTime: number;
}

export interface NarrativePressure {
  tonalAnchor: TonalCenterCandidate;
  phase: NarrativePhase;
  goal: NarrativeGoal;
  tension: number; // 0.0 to 1.0
  memory: HarmonicEvent[];
}

export interface ScoreVector {
  fieldFit: number;
  voiceLeading: number;
  tonalStability: number;
  novelty: number;
  narrativeAlignment: number;
}

export interface FieldBias {
  preferTension: number;
  preferResolution: number;
  preferChromaticism: number;
  preferStability: number;
}

export interface FieldEvaluation {
  chord: string;
  score: ScoreVector;
  biasVector: FieldBias;
  interpretation: any; // MelodicInterpretation reference
}

export interface NarrativeModulation {
  stabilityPressure: number;
  tensionPressure: number;
  resolutionPressure: number;
  entropyAllowance: number;
}
