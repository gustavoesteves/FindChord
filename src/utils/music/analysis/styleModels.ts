import type { ContextualFunction, HarmonicGrammarProfile } from './models/FunctionalAnalysis';
 
export interface GrammarParameters {
  theoryWeight: number; // α
  corpusWeight: number; // β
}

export const GRAMMAR_PARAMETERS: Record<HarmonicGrammarProfile, GrammarParameters> = {
  COMMON_PRACTICE: { theoryWeight: 0.80, corpusWeight: 0.20 },
  EXTENDED_FUNCTIONAL: { theoryWeight: 0.45, corpusWeight: 0.55 },
  MODAL_FUNCTIONAL: { theoryWeight: 0.60, corpusWeight: 0.40 },
  CHROMATIC_FUNCTIONAL: { theoryWeight: 0.50, corpusWeight: 0.50 },
  GENERAL: { theoryWeight: 0.60, corpusWeight: 0.40 },
};

// Profile-specific pre-compiled corpus transition weights.
// If a transition is missing, the CorpusTransitionModel will use a fallback (e.g. 0.10).
export const GRAMMAR_CORPUS_TRANSITIONS: Record<
  HarmonicGrammarProfile,
  Partial<Record<ContextualFunction, Partial<Record<ContextualFunction, number>>>>
> = {
  COMMON_PRACTICE: {
    'PRIMARY': {
      'PRIMARY': 0.75,
      'SECONDARY_LEADING_TONE': 0.15,
      'SECONDARY_DOMINANT': 0.10,
    },
    'SECONDARY_DOMINANT': {
      'PRIMARY': 0.90,
      'SECONDARY_DOMINANT': 0.10,
    },
    'SECONDARY_LEADING_TONE': {
      'PRIMARY': 0.95,
    },
    'PASSING_DIMINISHED': {
      'PRIMARY': 0.85,
    },
    'COMMON_TONE_DIMINISHED': {
      'PRIMARY': 0.90,
    },
  },
  EXTENDED_FUNCTIONAL: {
    'PRIMARY': {
      'PRIMARY': 0.45,
      'SECONDARY_DOMINANT': 0.35,
      'TRITONE_SUBSTITUTION': 0.20,
    },
    'SECONDARY_DOMINANT': {
      'SECONDARY_DOMINANT': 0.60, // Strong chained secondary dominants
      'PRIMARY': 0.30,
      'TRITONE_SUBSTITUTION': 0.10,
    },
    'TRITONE_SUBSTITUTION': {
      'PRIMARY': 0.85,
      'SECONDARY_DOMINANT': 0.15,
    },
    'SECONDARY_LEADING_TONE': {
      'PRIMARY': 0.80,
    },
    'MODAL_BORROWING': {
      'PRIMARY': 0.70,
    },
  },
  MODAL_FUNCTIONAL: {
    'PRIMARY': {
      'PRIMARY': 0.85,
      'MODAL_BORROWING': 0.10,
      'SECONDARY_DOMINANT': 0.05,
    },
    'MODAL_BORROWING': {
      'PRIMARY': 0.90,
    },
    'SECONDARY_DOMINANT': {
      'PRIMARY': 0.95,
    },
  },
  CHROMATIC_FUNCTIONAL: {
    'PRIMARY': {
      'PRIMARY': 0.50,
      'MODAL_BORROWING': 0.30, // Frequent modal borrowings
      'TRITONE_SUBSTITUTION': 0.20,
    },
    'TRITONE_SUBSTITUTION': {
      'PRIMARY': 0.80,
      'MODAL_BORROWING': 0.20,
    },
    'MODAL_BORROWING': {
      'PRIMARY': 0.75,
      'TRITONE_SUBSTITUTION': 0.15,
      'SECONDARY_DOMINANT': 0.10,
    },
  },
  GENERAL: {
    'PRIMARY': {
      'PRIMARY': 0.60,
      'SECONDARY_DOMINANT': 0.15,
      'SECONDARY_LEADING_TONE': 0.10,
      'TRITONE_SUBSTITUTION': 0.05,
      'MODAL_BORROWING': 0.10,
    },
    'SECONDARY_DOMINANT': {
      'PRIMARY': 0.80,
      'SECONDARY_DOMINANT': 0.20,
    },
    'TRITONE_SUBSTITUTION': {
      'PRIMARY': 0.85,
      'SECONDARY_DOMINANT': 0.15,
    },
    'SECONDARY_LEADING_TONE': {
      'PRIMARY': 0.90,
    },
    'MODAL_BORROWING': {
      'PRIMARY': 0.80,
      'MODAL_BORROWING': 0.10,
      'SECONDARY_DOMINANT': 0.10,
    },
    'CHROMATIC_APPROACH': {
      'PRIMARY': 0.90,
    },
  },
};
