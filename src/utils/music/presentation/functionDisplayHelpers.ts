import type { HarmonicFunction, KeyRelation } from '../analysis/models/FunctionalAnalysis';

/**
 * Returns a short abbreviation for a harmonic function.
 * Use this in the UI layer to keep analysis strings out of components.
 *
 *   TONIC        → "T"
 *   SUBDOMINANT  → "SD"
 *   DOMINANT     → "D"
 */
export function getFunctionLabel(fn: HarmonicFunction): string {
  switch (fn) {
    case 'TONIC':       return 'T';
    case 'SUBDOMINANT': return 'SD';
    case 'DOMINANT':    return 'D';
  }
}

/**
 * Returns a CSS-friendly color class name for a harmonic function.
 * Useful for rendering colored badges in the timeline.
 *
 *   TONIC        → "tonic"      (blue tones)
 *   SUBDOMINANT  → "subdominant" (yellow/amber tones)
 *   DOMINANT     → "dominant"    (red/rose tones)
 */
export function getFunctionColorClass(fn: HarmonicFunction): string {
  switch (fn) {
    case 'TONIC':       return 'tonic';
    case 'SUBDOMINANT': return 'subdominant';
    case 'DOMINANT':    return 'dominant';
  }
}

/**
 * Auxiliar para formatar o nome da relação em português.
 */
export function getRelationLabel(rel: KeyRelation): string {
  switch (rel) {
    case 'RELATIVE': return 'relativa';
    case 'PARALLEL': return 'homônima paralela';
    case 'DOMINANT': return 'dominante';
    case 'SUBDOMINANT': return 'subdominante';
    case 'MEDIANT': return 'mediante diatônica';
    case 'CHROMATIC_MEDIANT': return 'mediante cromática';
    case 'TRITONE': return 'trítono';
    case 'DISTANT': return 'distante';
  }
}
