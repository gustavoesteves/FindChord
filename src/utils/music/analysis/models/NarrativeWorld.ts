import type { TrajectoryInterpretation } from "./MelodicInterpretation";

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
  
  structuralMotives?: string[]; // F22: The horizontal motives
}

export type SoftWorld = NarrativeWorld;
