import type { HarmonicFunction } from "./HarmonicSeed";

export interface TonalGravityMap {
  tonic: string;
  gravityStrength: Record<string, number>; // e.g. { "I": 1.0, "IV": 0.7, "V": 0.8 }
  inertia: number; // Resistance to functional change
}

export interface HarmonicPotentialField {
  function: HarmonicFunction;
  energy: number;        // Accumulated tension
  decay: number;         // Adaptive resistance before collapsing
  anchorForce: number;   // Gravitational pull to the tonic
}

export interface FieldHierarchy {
  baseStability: number;     // Global structural tonal force
  localPerturbation: number; // Influence from bass and melody
  narrativePressure: number; // F23 macro-force
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
