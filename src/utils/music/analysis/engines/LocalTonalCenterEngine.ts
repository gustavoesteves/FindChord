import type { ScoreSection, ScoreNoteEvent } from "../models/ScoreSnapshot";


export interface TonalCenter {
  tonic: string;
  mode: "major" | "minor" | "unknown";
  confidence: number;
}

export class LocalTonalCenterEngine {
  
  /**
   * Detects the local tonal center for a specific section of the score.
   */
  public static detectTonalCenter(
    section: ScoreSection | null,
    notes: ScoreNoteEvent[],
    keySignature?: string
  ): TonalCenter {
    
    // 1. If explicit key signature is provided and valid, use it with high confidence
    if (keySignature && keySignature !== "C") { // Often "C" is the default empty state in XML
      const isMinor = keySignature.toLowerCase().endsWith("m");
      return {
        tonic: keySignature.replace(/m/i, "").trim(),
        mode: isMinor ? "minor" : "major",
        confidence: 0.95
      };
    }

    // 2. Filter notes for this specific section
    let sectionNotes = notes;
    if (section) {
      const startTick = section.startTick ?? (section.startMeasure - 1) * 1920;
      const endTick = section.endTick ?? section.endMeasure * 1920;
      sectionNotes = notes.filter(n => n.tickStart >= startTick && n.tickStart < endTick);
    }

    if (sectionNotes.length === 0) {
      return { tonic: "C", mode: "major", confidence: 0.1 }; // ultimate fallback
    }

    // 3. Probabilistic Inference based on Salience
    return this.inferCenterFromSalience(sectionNotes);
  }

  private static inferCenterFromSalience(notes: ScoreNoteEvent[]): TonalCenter {
    const pitchScores = new Map<string, number>();
    
    // Convert to simple pitch classes (C, C#, D...)
    const getPC = (n: ScoreNoteEvent) => {
      let pc = n.step;
      if (n.alter === 1) pc += "#";
      else if (n.alter === -1) pc += "b";
      return pc.replace('Cb', 'B').replace('Fb', 'E').replace('E#', 'F').replace('B#', 'C');
    };

    const firstNote = notes[0];
    const lastNote = notes[notes.length - 1];

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const pc = getPC(note);
      
      let weight = note.durationTicks / 1920; // Base weight based on duration

      // Metric salience (downbeats are stronger)
      // Assuming 4/4 and 480 TPQ -> 1920 ticks per measure
      const tickInMeasure = note.tickStart % 1920;
      if (tickInMeasure === 0) weight *= 2.0; // Downbeat
      else if (tickInMeasure === 960) weight *= 1.5; // Beat 3

      // Structural position
      if (note === firstNote) weight *= 1.5;
      if (note === lastNote) weight *= 2.5; // Final note usually resolves to tonic

      pitchScores.set(pc, (pitchScores.get(pc) || 0) + weight);
    }

    // Find the highest scoring pitch
    let bestPitch = "C";
    let maxScore = 0;
    let totalScore = 0;

    for (const [pc, score] of pitchScores.entries()) {
      totalScore += score;
      if (score > maxScore) {
        maxScore = score;
        bestPitch = pc;
      }
    }

    const confidence = totalScore > 0 ? (maxScore / totalScore) : 0.1;

    const minorThirdMap: Record<string, string> = {
      "C": "Eb", "C#": "E", "Db": "E", "D": "F", "D#": "F#", "Eb": "Gb",
      "E": "G", "F": "Ab", "F#": "A", "Gb": "A", "G": "Bb", "G#": "B", 
      "Ab": "Cb", "A": "C", "A#": "C#", "Bb": "Db", "B": "D"
    };
    
    const minorThirdPC = minorThirdMap[bestPitch];
    const majorThirdMap: Record<string, string> = {
      "C": "E", "C#": "F", "Db": "F", "D": "F#", "D#": "G", "Eb": "G",
      "E": "G#", "F": "A", "F#": "A#", "Gb": "Bb", "G": "B", "G#": "C", 
      "Ab": "C", "A": "C#", "A#": "D", "Bb": "D", "B": "D#"
    };
    const majorThirdPC = majorThirdMap[bestPitch];

    const minorScore = pitchScores.get(minorThirdPC) || 0;
    const majorScore = pitchScores.get(majorThirdPC) || 0;

    const mode = minorScore > majorScore ? "minor" : "major";

    return {
      tonic: bestPitch,
      mode,
      confidence: Math.min(0.8, 0.4 + confidence) 
    };
  }
}
