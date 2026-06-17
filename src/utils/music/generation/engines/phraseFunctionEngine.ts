import { CanonicalChordEvent } from '../../analysis/models/CanonicalChordEvent';

export type PhraseFunction = 'Establishment' | 'Predominant' | 'Dominant' | 'Cadential' | 'Prolongation';

export class PhraseFunctionEngine {
  /**
   * Analyzes a sequence of chords to determine the primary structural function of the phrase.
   * This is a placeholder logic for the architectural scaffolding.
   */
  public determineFunction(chords: CanonicalChordEvent[]): PhraseFunction {
    if (chords.length === 0) return 'Establishment';
    
    // Naive heuristic for architecture:
    const lastChord = chords[chords.length - 1];
    
    // If it ends on a dominant chord, it's likely a Dominant/Preparation phrase
    if (lastChord.symbol.includes('7') && !lastChord.symbol.includes('maj7') && !lastChord.symbol.includes('m7')) {
      return 'Dominant';
    }

    return 'Establishment'; // Default fallback
  }
}
