import type { FieldBias } from "./NarrativeState";

export interface BassContour {
  direction: "ASCENDING" | "DESCENDING" | "STATIC" | "OBLIQUE" | "ARCH" | "PEDAL";
  tendency: "STEPWISE" | "LEAP" | "CHROMATIC" | "CYCLE_OF_5THS";
  target: string; // The destination pitch
}

export interface HarmonicSeed {
  id: string;
  type: string; // e.g. "CHROMATIC_ASCENT_TO_TARGET"
  fieldId: string; // "TONAL", "CHROMATIC", etc.
  bassContour: BassContour;
  explanation: string[]; // e.g. ["Linha cromática ascendente rumo à tônica relativa", "Intercâmbio modal previsto"]
  requireTonalStability?: boolean; // Whether the realization should penalize deviations from stable functions
  biasVector: FieldBias; // The micro-identity biases for this field
}
