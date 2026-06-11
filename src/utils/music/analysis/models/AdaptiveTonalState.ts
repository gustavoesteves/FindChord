import type { TonalMode, HarmonicFunction } from './FunctionalAnalysis';
import type { MusicologicalInterpretationGraph } from './MusicologicalInterpretationGraph';
import type { HarmonicCausalityGraph } from './HarmonicCausalityGraph';

export interface TonalHypothesis {
  root: string;
  mode: TonalMode;
  probability: number;
  harmonicFunction: HarmonicFunction;
  contextualFunction?: string;
}

export interface AdaptiveTonalState {
  primary: TonalHypothesis;
  alternatives: TonalHypothesis[];
  certaintyLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  pcs?: number;
  pcsBeforePrior?: number;
  rawHypotheses?: TonalHypothesis[];
  mig?: MusicologicalInterpretationGraph;
  adi?: number;
  cfs?: number;
  causalityGraph?: HarmonicCausalityGraph;
  iss?: number;
  sis?: number;
  pis?: number;
  icr?: number;
  sdsMatrix?: number[][];
  tas?: number;
  tfi?: number;
}


