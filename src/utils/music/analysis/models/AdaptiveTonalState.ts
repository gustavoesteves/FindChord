import type { TonalMode, HarmonicFunction } from './FunctionalAnalysis';

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
}
