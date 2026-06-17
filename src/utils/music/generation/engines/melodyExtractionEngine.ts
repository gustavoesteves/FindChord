import type { MelodicAnchor, MelodicPhrase } from '../models/GenerationContext';

export interface RawMelodyNote {
  noteName: string;
  midiNote: number;
  duration: number; // e.g. quarter note = 1.0
  isOnStrongBeat: boolean;
}

export class MelodyExtractionEngine {
  /**
   * Identifies structural and ornamental notes from a raw melody line.
   */
  public extractMelodicPhrase(id: string, rawNotes: RawMelodyNote[]): MelodicPhrase {
    const anchors: MelodicAnchor[] = rawNotes.map(note => {
      // A note is structural if it is on a strong beat or has a long duration (> 0.5)
      const isStructural = note.isOnStrongBeat || note.duration >= 0.5;
      const isOrnamental = !isStructural;

      return {
        noteName: note.noteName,
        midiNote: note.midiNote,
        isStructural,
        isOrnamental
      };
    });

    return {
      id,
      anchors
    };
  }
}
