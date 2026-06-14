import type { CanonicalProgressionEvent } from './CanonicalProgressionEvent';
import type { MetaTheory } from './MetaTheory';

export interface SectionNarrative {
  sectionId: string;
  name: string;                           // Name of the section (e.g. "Verse", "Chorus", "Exposition", "A")
  range: { startMeasure: number; endMeasure: number };
  progressionId: string;                  // Reference to a CanonicalProgressionEvent ID
  localNarrative: string;                 // Descriptive text for this section
}

/**
 * CanonicalScoreEvent - FROZEN v1
 */
export interface CanonicalScoreEvent {
  id: string;
  title: string;
  progressionEvents: CanonicalProgressionEvent[];
  /** @deprecated Orphan field in v1. Preserved for future narrative plugin compatibility. */
  globalNarrative: string;                 // Textual narrative explaining the global harmonic form and journey
  /** @deprecated Orphan field in v1. Preserved for future narrative plugin compatibility. */
  sections: SectionNarrative[];           // Segmented formal sections of the piece
  /** @deprecated Orphan field in v1. Preserved for future narrative plugin compatibility. */
  metaTheory: MetaTheory;                 // The active meta-theory that explains the entire score
  /** @deprecated Orphan field in v1. Preserved for future narrative plugin compatibility. */
  dominantResearchPrograms: string[];     // Research programs (e.g. Functional, Transformational) dominant across the work
  /** @deprecated Orphan field in v1. Preserved for future narrative plugin compatibility. */
  universalLawsActivated: string[];       // All unique universal/fundamental laws activated in the piece
}
