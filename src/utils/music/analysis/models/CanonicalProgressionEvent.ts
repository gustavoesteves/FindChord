import type { CanonicalChordEvent } from './CanonicalChordEvent';

export interface CanonicalProgressionEvent {
  id: string;
  chordEvents: CanonicalChordEvent[];
  tonalCenters: string[];                 // List of estimated tonal centers/keys across the progression
  narrativeSegments?: string[];           // Text descriptions of segment/transition narrative arcs
  globalTensionCurve?: number[];          // Tension progression values aligned with chordEvents
  activeParadigms?: string[];             // Active paradigm/research program IDs used by the consensus resolver
  metaTheoryId?: string;                  // Synthesized Meta-Theory ID (F11-X) that explains this progression
}
