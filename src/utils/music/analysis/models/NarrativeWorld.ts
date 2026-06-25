import type { TrajectoryInterpretation } from "./MelodicInterpretation";
import type { PathwayMetrics, MotiveTag } from "../engines/HorizontalHarmonyEngine";

export interface NarrativeEvent {
  measureIndex: number;
  anchorPitch: string;
  interpretation: TrajectoryInterpretation;
  resolvedChord: string;
}

export interface StructuralProfile {
  diatonicStability: number;
  dominantDensity: number;
  modalAmbiguity: number;
  chromaticDisruption: number;
}

export interface NarrativeWorld {
  id: string;
  structuralCategory?: string; 
  structuralProfile: StructuralProfile; 
  
  events: NarrativeEvent[];
  
  coherenceScore: number; 
  isViable?: boolean; 
  
  isStructuralRupture?: boolean;
  ruptureDescription?: string;
  
  bassLine: string[]; // F22.1
  metrics: PathwayMetrics; // F22.1
  detectedMotives: MotiveTag[]; // F22.1
}

export type SoftWorld = NarrativeWorld;
