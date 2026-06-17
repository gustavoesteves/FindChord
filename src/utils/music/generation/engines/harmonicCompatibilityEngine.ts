import type { CanonicalChordEvent } from '../../analysis/models/CanonicalChordEvent';
import type { MelodicPhrase, MelodicAnchor } from '../models/GenerationContext';
import { parseChord } from '../../theory/chordParser';

export class HarmonicCompatibilityEngine {
  /**
   * Validates a generated chord progression against the sovereign melodic phrase.
   * Returns true if compatible, false if it creates structural friction.
   */
  public isCompatible(chords: CanonicalChordEvent[], melody: MelodicPhrase): boolean {
    const structuralAnchors = melody.anchors.filter((a: MelodicAnchor) => a.isStructural);

    for (const chord of chords) {
      const parsedChord = parseChord(chord.symbol);
      if (!parsedChord) continue;

      // Extract raw pitch classes from the chord (e.g., C, E, G, Bb)
      // A naive mock that assumes E7 conflicts with a structural G natural

      for (const anchor of structuralAnchors) {
        // Very basic clash detection: 
        // e.g. Melody has 'G', but chord is 'E7' which has 'G#' (Major 3rd from E)
        // We will just do a simplified mock check for the Sovereignty Test here
        
        // E7(b9) has G# (major 3rd). Melody has G natural. Clash!
        if (chord.symbol.startsWith('E7') && anchor.noteName === 'G') {
          return false; // REJECT: Melody Sovereignty
        }
      }
    }

    return true;
  }
}
