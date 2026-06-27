import type { HarmonicFunction } from "./HarmonicSeed";

export interface TonalGravityMap {
  gravityStrength: Record<string, number>; // e.g. { "I": 1.0, "IV": 0.7, "V": 0.8 }
  inertia: number; // Resistance to functional change
}

export interface HarmonicPotentialField {
  function: HarmonicFunction;
  energy: number;        // Accumulated tension
  decay: number;         // Adaptive resistance before collapsing
  anchorForce: number;   // Gravitational pull to the tonic
}

export interface HarmonicRegion {
  startTick: number;
  endTick: number;
  measureIndex: number; // Optional, mapping to measure
  function: HarmonicFunction;
  stability: number; // 0-1
}

export interface HarmonicForm {
  regions: HarmonicRegion[];
}
