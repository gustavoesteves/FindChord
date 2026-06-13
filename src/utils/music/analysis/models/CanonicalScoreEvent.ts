import type { CanonicalProgressionEvent } from './CanonicalProgressionEvent';
import type { MetaTheory } from './MetaTheory';

export interface SectionNarrative {
  sectionId: string;
  name: string;                           // Name of the section (e.g. "Verse", "Chorus", "Exposition", "A")
  range: { startMeasure: number; endMeasure: number };
  progressionId: string;                  // Reference to a CanonicalProgressionEvent ID
  localNarrative: string;                 // Descriptive text for this section
}

export interface CanonicalScoreEvent {
  id: string;
  title: string;
  progressionEvents: CanonicalProgressionEvent[];
  globalNarrative: string;                 // Textual narrative explaining the global harmonic form and journey
  sections: SectionNarrative[];           // Segmented formal sections of the piece
  metaTheory: MetaTheory;                 // The active meta-theory that explains the entire score
  dominantResearchPrograms: string[];     // Research programs (e.g. Functional, Transformational) dominant across the work
  universalLawsActivated: string[];       // All unique universal/fundamental laws activated in the piece
}
