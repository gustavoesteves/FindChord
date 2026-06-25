import type { HarmonicFunction } from "./HSMKState";
import type { ExpansionIntent } from "./ExpansionIntent";

export const LATENT_DIM = 36;
export const BUFFER_SIZE = 10;
export const TEMPORAL_MEMORY_CAPACITY = 16;

export interface TemporalFieldCentroid {
  position: Float32Array;
  weight: number;
  lastVisitedTick: number;
}

export type TemporalFieldMemoryByFunction = Record<HarmonicFunction, TemporalFieldCentroid[]>;

export interface LatentState {
  position: Float32Array; // 36-dims
  velocity: Float32Array; // 36-dims
  memory: Float32Array;   // 36-dims
  entropy: number;        // Temperatura dinâmica interna
  buffer: Float32Array[]; // Trajectory Buffer (últimos N probes) para E_topo
  temporalMemory: TemporalFieldMemoryByFunction;
}

export interface EvaluationContext {
  tick: number;
  functionIntent: HarmonicFunction;
  expansionIntent: ExpansionIntent;
  melody: string[];
  center: string;
}

export interface EnergyField {
  id: "functional" | "melodic" | "trajectory" | "topological" | "temporal";
  evaluate(state: LatentState, probe: Float32Array, ctx: EvaluationContext): number;
}
