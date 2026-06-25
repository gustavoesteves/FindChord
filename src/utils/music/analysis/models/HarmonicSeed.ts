import type { FieldBias } from "./NarrativeState";

export type NarrativeGoal =
  | "TONAL_RESOLUTION"
  | "DEFERRED_RESOLUTION"
  | "AVOID_RESOLUTION"
  | "CIRCULAR_RESOLUTION"
  | "PERMANENT_TENSION";

export type HarmonicFunction = "T" | "PD" | "D" | "EXT" | "CHROM";

export interface HarmonicSkeleton {
  functions: HarmonicFunction[]; // e.g. [T, PD, D, T]
  density: number; // slots per function
  cadenceTarget: "authentic" | "half" | "deceptive" | "open";
}

export interface SeedConstraints {
  allowSecondaryDominants: boolean;
  allowChromaticPassing: "between-functions-only" | "freely" | "none";
  enforceCadence: boolean;
}

export interface BassContour {
  direction: "ASCENDING" | "DESCENDING" | "STATIC" | "OBLIQUE" | "ARCH" | "PEDAL";
  tendency: "STEPWISE" | "LEAP" | "CHROMATIC" | "CYCLE_OF_5THS";
  target: string; // The destination pitch
}

export interface HarmonicSeed {
  id: string;
  type: string; // e.g. "CHROMATIC_ASCENT_TO_TARGET"
  fieldId: string; // "TONAL", "CHROMATIC", etc.
  bassContour: BassContour; // Used for micro-voice leading
  skeleton: HarmonicSkeleton; // The structural macro-function requirement
  narrativeGoal: NarrativeGoal;
  constraints: SeedConstraints;
  explanation: string[]; // e.g. ["Linha cromática ascendente rumo à tônica relativa", "Intercâmbio modal previsto"]
  requireTonalStability?: boolean; // Legacy: replaced largely by Skeleton
  biasVector: FieldBias; // The micro-identity biases for this field
}
