import type { FunctionalFingerprint } from './FunctionalFingerprint';

export interface ExpectationVector {
  anticipatedClosure: boolean;
  anticipatedGravity: 'TONAL' | 'MODAL';
  anticipatedDirection: 'expansion' | 'compression' | 'suspension' | 'resolution';
  tensionAccumulation: number; // Grows if there are unresolved dominants in history
}

export interface PhraseContext {
  previousFingerprints: FunctionalFingerprint[];
  expectationVector: ExpectationVector;
}

export interface PerceptualOverlay {
  perceivedClosureStrength: number;
  perceivedTension: number;
  perceivedGravity: number;
}

export interface ContextualInterpretation {
  fingerprint: FunctionalFingerprint; 
  context: PhraseContext;
  overlay: PerceptualOverlay;
}
