/**
 * CanonicalChordEvent - FROZEN v1
 */
export interface CanonicalChordEvent {
  id: string;
  symbol: string;                        // Harmonic chord symbol (e.g. "Cm11", "Gmaj7/B")
  voicing: {
    notes: number[];                    // Absolute MIDI note numbers from low to high
    frets?: (number | null)[];          // Fret positions on instrument strings (null for unplayed)
  };
  tuning: {
    instrument: string;                 // Instrument name (e.g. "Guitarra", "Ukulele")
    strings: string[];                  // Pitch names per string from low to high (e.g. ["E2", "A2", "D3", "G3", "B3", "E4"])
  };
  inversion: 'Root' | 'First' | 'Second' | 'Third' | string;
  voicingType?: string;                 // Voicing structure classification (e.g. "Drop-2", "Drop-3", "Closed", "Quartal")
  tensionLevel?: number;                // Tension score computed by the engine
  voiceLeadingScore?: number;           // Voice leading transition quality score [0.0, 1.0]
}
