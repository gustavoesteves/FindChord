import type { KeyRelation, HarmonicGrammarProfile } from '../analysis/models/FunctionalAnalysis';
import { getChroma } from './pitchClass';

export function isCloselyRelated(
  k1: { root: string; mode: 'MAJOR' | 'MINOR' },
  k2: { root: string; mode: 'MAJOR' | 'MINOR' }
): boolean {
  const c1 = getChroma(k1.root);
  const c2 = getChroma(k2.root);
  const diff = (c2 - c1 + 12) % 12;

  if (k1.mode === 'MAJOR') {
    if (k2.mode === 'MINOR') {
      // relative minor (9), parallel minor (0), relative of dominant (4), relative of subdominant (2)
      return diff === 9 || diff === 0 || diff === 4 || diff === 2;
    } else {
      // dominant major (7), subdominant major (5)
      return diff === 7 || diff === 5;
    }
  } else {
    if (k2.mode === 'MAJOR') {
      // relative major (3), parallel major (0), relative of dominant (10), relative of subdominant (8)
      return diff === 3 || diff === 0 || diff === 10 || diff === 8;
    } else {
      // dominant minor (7), subdominant minor (5)
      return diff === 7 || diff === 5;
    }
  }
}

export const REGIONAL_TRANSITION_PROFILES: Record<
  HarmonicGrammarProfile,
  { close: number; distant: number }
> = {
  COMMON_PRACTICE: { close: 0.80, distant: 0.15 },
  EXTENDED_FUNCTIONAL: { close: 0.80, distant: 0.35 },
  CHROMATIC_FUNCTIONAL: { close: 0.85, distant: 0.60 },
  MODAL_FUNCTIONAL: { close: 0.75, distant: 0.40 },
  GENERAL: { close: 0.80, distant: 0.35 }
};

export function getKeyRelation(
  k1: { root: string; mode: 'MAJOR' | 'MINOR' },
  k2: { root: string; mode: 'MAJOR' | 'MINOR' }
): KeyRelation {
  const c1 = getChroma(k1.root);
  const c2 = getChroma(k2.root);
  const diff = (c2 - c1 + 12) % 12;

  // Mesma tonalidade (não deve ocorrer para transição regional real, mas mantido por segurança)
  if (k1.root === k2.root && k1.mode === k2.mode) {
    return 'RELATIVE';
  }

  // 1. Relação Homônima (Paralela)
  if (c1 === c2 && k1.mode !== k2.mode) {
    return 'PARALLEL';
  }

  // 2. Relação Relativa
  if (k1.mode === 'MAJOR' && k2.mode === 'MINOR' && diff === 9) {
    return 'RELATIVE';
  }
  if (k1.mode === 'MINOR' && k2.mode === 'MAJOR' && diff === 3) {
    return 'RELATIVE';
  }

  // 3. Relações de Dominante / Subdominante
  if (diff === 7 && k1.mode === k2.mode) {
    return 'DOMINANT';
  }
  if (diff === 5 && k1.mode === k2.mode) {
    return 'SUBDOMINANT';
  }

  // 4. Mediante Diatônica (Terça de distância na armadura que não seja a relativa direta)
  if (k1.mode === 'MAJOR' && k2.mode === 'MINOR' && diff === 4) {
    return 'MEDIANT'; // C Major -> E Minor (iii)
  }
  if (k1.mode === 'MINOR' && k2.mode === 'MAJOR' && diff === 8) {
    return 'MEDIANT'; // A Minor -> F Major (bVI)
  }

  // 5. Mediante Cromática (Terças com alteração de armadura ou mesma qualidade modal)
  if (diff === 3 || diff === 4 || diff === 8 || diff === 9) {
    return 'CHROMATIC_MEDIANT';
  }

  // 6. Relação de Trítono
  if (diff === 6) {
    return 'TRITONE';
  }

  return 'DISTANT';
}

export function getKeyTransitionMultiplier(
  k1: { root: string; mode: 'MAJOR' | 'MINOR' },
  k2: { root: string; mode: 'MAJOR' | 'MINOR' },
  profile: HarmonicGrammarProfile = 'GENERAL'
): number {
  if (k1.root === k2.root && k1.mode === k2.mode) {
    return 1.0;
  }
  const isClose = isCloselyRelated(k1, k2);
  const weights = REGIONAL_TRANSITION_PROFILES[profile] || REGIONAL_TRANSITION_PROFILES.GENERAL;
  return isClose ? weights.close : weights.distant;
}
