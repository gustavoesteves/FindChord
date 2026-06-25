import type { MelodicAnchor } from "./ProjectionSet";

export interface HarmonicSlot {
  measureIndex: number;
  startTick: number;
  endTick: number;
  melodyNotes: MelodicAnchor[];
  bassNote: string;
  weight: number; // Harmonic Anchor Weighting (bassStability + melodicTension + fieldPriority)
}
