export interface HarmonicInterpretation {
    chord: string;
    role: string;
    category: "STRUCTURAL" | "DIATONIC_EXTENSION" | "DOMINANT_TENSION" | "MODAL" | "CHROMATIC";
}

export class HarmonicCatalog {

  /**
   * Returns possible harmonic interpretations for a given pitch class.
   * Currently hardcoded for 'E' as proof of concept for the F17.6 observability sprint.
   */
  public static getInterpretations(pitchClass: string): HarmonicInterpretation[] {
    const normalized = pitchClass.replace(/♯/g, '#').replace(/♭/g, 'b');

    if (normalized === 'C') {
      return [
        { chord: 'Cmaj7', role: '1P', category: 'STRUCTURAL' },
        { chord: 'Am7', role: 'b3', category: 'STRUCTURAL' },
        { chord: 'Fmaj7', role: '5P', category: 'STRUCTURAL' },
        { chord: 'Dm11', role: '7m', category: 'DIATONIC_EXTENSION' }
      ];
    }

    if (normalized === 'E') {
      return [
        { chord: 'Cmaj7', role: '3M', category: 'STRUCTURAL' },
        { chord: 'Am7', role: '5P', category: 'STRUCTURAL' },
        { chord: 'Em7', role: '1P', category: 'STRUCTURAL' },
        
        { chord: 'Dm9', role: '9M', category: 'DIATONIC_EXTENSION' },
        { chord: 'Fmaj7', role: '7M', category: 'DIATONIC_EXTENSION' },

        { chord: 'G13', role: '13M', category: 'DOMINANT_TENSION' },
        { chord: 'A7', role: '5P', category: 'DOMINANT_TENSION' },
        
        { chord: 'Bbmaj7(#11)', role: '#11', category: 'MODAL' },

        { chord: 'C#7(#9)', role: '#9', category: 'CHROMATIC' },
        { chord: 'Abmaj7(#5)', role: '#5', category: 'CHROMATIC' },
      ];
    }

    if (normalized === 'A') {
      return [
        { chord: 'Am7', role: '1P', category: 'STRUCTURAL' },
        { chord: 'Fmaj7', role: '3M', category: 'STRUCTURAL' },
        { chord: 'Dm7', role: '5P', category: 'STRUCTURAL' },
        { chord: 'D7', role: '5P', category: 'DOMINANT_TENSION' }
      ];
    }

    if (normalized === 'B') {
      return [
        { chord: 'G7', role: '3M', category: 'STRUCTURAL' },
        { chord: 'Em7', role: '5P', category: 'STRUCTURAL' },
        { chord: 'Bm7b5', role: '1P', category: 'STRUCTURAL' },
        { chord: 'Cmaj7', role: '7M', category: 'STRUCTURAL' },
        { chord: 'G13', role: '3M', category: 'DOMINANT_TENSION' }
      ];
    }
    
    if (normalized === 'G') {
       return [
         { chord: 'G7', role: '1P', category: 'STRUCTURAL' },
         { chord: 'Cmaj7', role: '5P', category: 'STRUCTURAL' },
         { chord: 'Em7', role: '3m', category: 'STRUCTURAL' },
         { chord: 'Am7', role: '7m', category: 'DIATONIC_EXTENSION' },
         { chord: 'A7', role: '7m', category: 'DOMINANT_TENSION' }
       ];
    }

    // Default fallback
    return [];
  }
}
