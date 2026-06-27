import type { FieldBias } from "./NarrativeState";

export type NarrativeGoal =
  | "TONAL_RESOLUTION"
  | "DEFERRED_RESOLUTION"
  | "CIRCULAR_RESOLUTION"
  | "PERMANENT_TENSION";

export type HarmonicFunction = "T" | "PD" | "D" | "EXT" | "CHROM";

export interface HarmonicSkeleton {
  functions: HarmonicFunction[]; // e.g. [T, PD, D, T]
  density: number; // slots per function
}

export interface SeedConstraints {
  allowSecondaryDominants: boolean;
  allowChromaticPassing: "between-functions-only" | "freely" | "none";
}

export interface BassContour {
  tendency: "STEPWISE" | "LEAP" | "CHROMATIC" | "CYCLE_OF_5THS";
}

export interface HarmonicSeed {
  fieldId: string; // "TONAL", "CHROMATIC", etc.
  bassContour: BassContour; // Used for micro-voice leading
  skeleton: HarmonicSkeleton; // The structural macro-function requirement
  narrativeGoal: NarrativeGoal;
  constraints: SeedConstraints;
  explanation: string[]; // e.g. ["Linha cromática ascendente rumo à tônica relativa", "Intercâmbio modal previsto"]
  biasVector: FieldBias; // The micro-identity biases for this field
}
