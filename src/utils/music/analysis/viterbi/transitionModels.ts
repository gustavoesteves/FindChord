import type { ContextualFunction, HarmonicFunction, HarmonicGrammarProfile } from '../models/FunctionalAnalysis';

export const BASE_TRANSITIONS: Partial<Record<ContextualFunction, Partial<Record<ContextualFunction, number>>>> = {
  'PRIMARY': {
    'PRIMARY': 1.00,
    'SECONDARY_DOMINANT': 1.10,
    'TRITONE_SUBSTITUTION': 0.90,
    'SECONDARY_LEADING_TONE': 1.10,
    'MODAL_BORROWING': 1.00,
    'PASSING_DIMINISHED': 0.90,
    'COMMON_TONE_DIMINISHED': 0.90,
    'NEIGHBOR_DIMINISHED': 0.90,
    'CHROMATIC_APPROACH': 0.80,
  },
  'SECONDARY_DOMINANT': {
    'PRIMARY': 1.25,
  },
  'TRITONE_SUBSTITUTION': {
    'PRIMARY': 1.25,
  },
  'SECONDARY_LEADING_TONE': {
    'PRIMARY': 1.25,
  },
  'MODAL_BORROWING': {
    'PRIMARY': 1.15,
  },
  'PASSING_DIMINISHED': {
    'PRIMARY': 1.10,
  },
  'COMMON_TONE_DIMINISHED': {
    'PRIMARY': 1.15,
  },
  'NEIGHBOR_DIMINISHED': {
    'PRIMARY': 1.10,
  },
  'CHROMATIC_APPROACH': {
    'PRIMARY': 0.80,
  },
};

export function getBaseTransition(from: ContextualFunction, to: ContextualFunction): number {
  const fromMap = BASE_TRANSITIONS[from];
  if (fromMap && fromMap[to] !== undefined) {
    return fromMap[to]!;
  }
  return 0.90; // Default transition weight
}

export function getFunctionalMultiplier(fromFn: HarmonicFunction, toFn: HarmonicFunction, profile?: HarmonicGrammarProfile): number {
  if (profile === 'MODAL_FUNCTIONAL') {
    // In modal harmony, traditional cadential tension is flat or ignored
    return 1.00;
  }
  if (fromFn === 'SUBDOMINANT' && toFn === 'DOMINANT') return 1.20;
  if (fromFn === 'DOMINANT' && toFn === 'TONIC') return 1.30;
  if (fromFn === 'TONIC' && toFn === 'SUBDOMINANT') return 1.10;
  if (fromFn === 'DOMINANT' && toFn === 'SUBDOMINANT') return 0.70;
  if (fromFn === 'TONIC' && toFn === 'DOMINANT') return 0.85;
  return 1.00; // Default functional multiplier
}

export interface TransitionModel {
  getProbability(from: ContextualFunction, to: ContextualFunction): number;
}

export class StaticTransitionModel implements TransitionModel {
  getProbability(from: ContextualFunction, to: ContextualFunction): number {
    return getBaseTransition(from, to);
  }
}

export class CorpusTransitionModel implements TransitionModel {
  private transitions: Partial<Record<ContextualFunction, Partial<Record<ContextualFunction, number>>>>;

  constructor(
    transitions: Partial<Record<ContextualFunction, Partial<Record<ContextualFunction, number>>>>
  ) {
    this.transitions = transitions;
  }

  getProbability(from: ContextualFunction, to: ContextualFunction): number {
    const fromMap = this.transitions[from];
    if (fromMap && fromMap[to] !== undefined) {
      return fromMap[to]!;
    }
    return 0.10; // Suavização/fallback para transições não observadas
  }
}

export class HybridTransitionModel implements TransitionModel {
  private theoryModel: TransitionModel;
  private corpusModel: TransitionModel;
  private alpha: number;
  private beta: number;

  constructor(
    theoryModel: TransitionModel,
    corpusModel: TransitionModel,
    alpha: number, // theory weight
    beta: number   // corpus weight
  ) {
    this.theoryModel = theoryModel;
    this.corpusModel = corpusModel;
    this.alpha = alpha;
    this.beta = beta;
  }

  getProbability(from: ContextualFunction, to: ContextualFunction): number {
    const theoryProb = this.theoryModel.getProbability(from, to);
    const corpusProb = this.corpusModel.getProbability(from, to);
    
    // Média geométrica ponderada: P = theoryProb^alpha * corpusProb^beta
    return Math.pow(theoryProb, this.alpha) * Math.pow(corpusProb, this.beta);
  }

  getExplanations(from: ContextualFunction, to: ContextualFunction): {
    baseProb: number;
    corpusProb: number;
    finalProb: number;
    alpha: number;
    beta: number;
  } {
    const theoryProb = this.theoryModel.getProbability(from, to);
    const corpusProb = this.corpusModel.getProbability(from, to);
    const finalProb = this.getProbability(from, to);
    return {
      baseProb: theoryProb,
      corpusProb,
      finalProb,
      alpha: this.alpha,
      beta: this.beta
    };
  }
}
