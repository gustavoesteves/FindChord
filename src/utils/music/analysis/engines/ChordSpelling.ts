export class ChordSpelling {
  
  private static readonly PITCH_CLASSES: Record<string, number> = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4,
    'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9,
    'A#': 10, 'Bb': 10, 'B': 11
  };

  /**
   * Translates a chord symbol into a set of pitch classes (0-11).
   * Example: "Cmaj7" -> [0, 4, 7, 11]
   */
  public static getPitches(chordSymbol: string): number[] {
    const rootMatch = chordSymbol.match(/^[A-G][#b]?/);
    if (!rootMatch) return [];

    const rootStr = rootMatch[0];
    const rootPc = this.PITCH_CLASSES[rootStr];
    if (rootPc === undefined) return [];

    const suffix = chordSymbol.slice(rootStr.length);
    const intervals = this.parseSuffixIntervals(suffix);

    const pitches = new Set<number>([rootPc]);
    for (const interval of intervals) {
      pitches.add((rootPc + interval) % 12);
    }

    // Sort to keep it standardized
    return Array.from(pitches).sort((a, b) => a - b);
  }

  private static parseSuffixIntervals(suffix: string): number[] {
    const clean = suffix.split('/')[0]; // ignore bass slash for now in interval stack

    if (clean === '' || clean === 'M') return [4, 7];
    if (clean === 'm') return [3, 7];
    if (clean === 'dim') return [3, 6];
    if (clean === 'aug') return [4, 8];

    if (clean === '7') return [4, 7, 10];
    if (clean === 'm7') return [3, 7, 10];
    if (clean === 'maj7' || clean === 'M7') return [4, 7, 11];
    if (clean === 'm7b5' || clean === 'h7') return [3, 6, 10];
    if (clean === 'dim7') return [3, 6, 9];

    if (clean === '6') return [4, 7, 9];
    if (clean === 'm6') return [3, 7, 9];
    
    // Extensions
    if (clean === '9') return [4, 7, 10, 14 % 12];
    if (clean === 'm9') return [3, 7, 10, 14 % 12];
    if (clean === 'maj9') return [4, 7, 11, 14 % 12];
    
    if (clean === '13') return [4, 7, 10, 14 % 12, 21 % 12];
    
    // Alterations
    if (clean.includes('7(b9)') || clean === '7b9') return [4, 7, 10, 13 % 12];
    if (clean.includes('7(#9)') || clean === '7#9') return [4, 7, 10, 15 % 12];
    if (clean.includes('maj7(#11)')) return [4, 7, 11, 18 % 12];

    // Fallback if unrecognized, return major
    return [4, 7];
  }
}
