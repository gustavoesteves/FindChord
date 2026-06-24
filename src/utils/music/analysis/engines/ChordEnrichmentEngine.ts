import { Chord, Interval } from "tonal";
import type { SuggestedChord, MelodyExtractionResult } from "../models/SuggestedRoute";

export class ChordEnrichmentEngine {
  
  /**
   * Enriches suggested chords to accommodate the melody before passing them to the validator.
   * Modifies the SuggestedChord array in-place.
   */
  public static enrichTrajectory(
    trajectory: SuggestedChord[],
    melody: MelodyExtractionResult,
    tickStart: number
  ): void {
    if (melody.notes.length === 0) return;

    let currentTick = tickStart;

    for (const chord of trajectory) {
      if (chord.suggested === chord.original) {
        // We generally don't enrich the original chords that are maintained,
        // because they presumably already fit, or we just want to keep them as is.
        // Assuming equal time distribution for now if duration isn't specified on chord
        // (In a real scenario, we'd need the actual duration of the suggested chord)
        currentTick += 1920; 
        continue;
      }

      const parsed = Chord.get(chord.suggested);
      if (parsed.empty || !parsed.root) {
        currentTick += 1920;
        continue;
      }

      // Find melody notes that overlap with this chord
      // (Assuming each chord is 1 measure = 1920 ticks for MVP)
      const chordEndTick = currentTick + 1920;
      const overlappingNotes = melody.notes.filter(n => n.tickStart < chordEndTick && n.tickEnd > currentTick);
      
      let newSymbol = chord.suggested;

      for (const note of overlappingNotes) {
        let dist = Interval.distance(parsed.root, note.pitchClass);
        if (!dist) continue;
        const simpleInterval = Interval.simplify(dist);

        // Check for conflicts that could be resolved via enrichment
        const isDominant = parsed.aliases.includes('7');
        const isMajor = parsed.aliases.includes('M') || parsed.aliases.includes('maj7') || parsed.aliases.length === 0; // simplistic
        
        if (isDominant) {
          if (simpleInterval === '2m') { // b9
            if (!newSymbol.includes('b9')) {
              newSymbol = newSymbol.replace('7', '7(b9)');
              chord.reason += ' [Enriched: b9 for melody]';
            }
          } else if (simpleInterval === '5A' || simpleInterval === '6m') { // #5 / b13
            if (!newSymbol.includes('b13') && !newSymbol.includes('#5')) {
              newSymbol = newSymbol.replace('7', '7(b13)');
              chord.reason += ' [Enriched: b13 for melody]';
            }
          } else if (simpleInterval === '4A' || simpleInterval === '5d') { // #11
            if (!newSymbol.includes('#11') && !newSymbol.includes('b5')) {
              newSymbol = newSymbol.replace('7', '7(#11)');
              chord.reason += ' [Enriched: #11 for melody]';
            }
          } else if (simpleInterval === '2M') { // 9
             if (!newSymbol.includes('9') && !newSymbol.includes('b9') && !newSymbol.includes('#9')) {
               newSymbol = newSymbol.replace('7', '9');
               chord.reason += ' [Enriched: 9 for melody]';
             }
          }
        }
        
        if (isMajor) {
          if (simpleInterval === '2M' && !newSymbol.includes('9')) { // 9
            newSymbol = newSymbol.replace('maj7', 'maj9').replace('M7', 'M9');
            if (newSymbol === parsed.root) newSymbol += 'add9'; // basic triad
            chord.reason += ' [Enriched: 9 for melody]';
          }
        }
      }

      chord.suggested = newSymbol;
      currentTick = chordEndTick;
    }
  }
}
