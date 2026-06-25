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
  structuralCategory: string; // The technically honest name
  structuralProfile: StructuralProfile; // The behavioral vector
  
  // The sequence of events that make up this world
  events: NarrativeEvent[];
  
  // Internal consistency metrics
  coherenceScore: number; // 0.0 to 1.0 (1.0 = perfectly seamless gravity)
  isViable: boolean; // Retained for type compatibility but true for F20 unless totally broken
  
  // If true, this world represents a deliberate structural shift rather than continuous gravity
  isStructuralRupture: boolean;
  ruptureDescription?: string; // e.g., "Chromatic shift at measure 3"
}

// Alias for F20 conceptual shift (Soft Coherence over Hard Coherence)
export type SoftWorld = NarrativeWorld;
