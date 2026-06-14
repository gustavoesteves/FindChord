import type { CanonicalChordEvent } from './CanonicalChordEvent';

/**
 * CanonicalProgressionEvent - FROZEN v1
 */
export interface CanonicalProgressionEvent {
  id: string;
  chordEvents: CanonicalChordEvent[];
  tonalCenters: string[];                 // List of estimated tonal centers/keys across the progression
  /** @deprecated Orphan field in v1. Preserved for future narrative plugin compatibility. */
  narrativeSegments?: string[];           // Text descriptions of segment/transition narrative arcs
  globalTensionCurve?: number[];          // Tension progression values aligned with chordEvents
  /** @deprecated Orphan field in v1. Preserved for future narrative plugin compatibility. */
  activeParadigms?: string[];             // Active paradigm/research program IDs used by the consensus resolver
  /** @deprecated Orphan field in v1. Preserved for future narrative plugin compatibility. */
  metaTheoryId?: string;                  // Synthesized Meta-Theory ID (F11-X) that explains this progression
}
