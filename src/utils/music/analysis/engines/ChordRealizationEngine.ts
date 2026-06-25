import { Note, Chord } from "tonal";
import type { MelodicAnchor } from "../models/ProjectionSet";
import type { PhraseContext } from "./PhraseAnalysisEngine";
import { MelodicInterpretationEngine } from "./MelodicInterpretationEngine";
import type { HarmonicPathway, PathwayMetrics } from "../models/HarmonicPathway";

export class ChordRealizationEngine {
  
  public static realize(
    bassLine: string[], 
    anchors: MelodicAnchor[], 
    phraseContext: PhraseContext
  ): HarmonicPathway[] {
    
    if (bassLine.length !== anchors.length) return [];

    let currentPaths: HarmonicPathway[] = [];

    // Initialize with the first anchor
    const firstOptions = this.getValidChordsForBassAndMelody(bassLine[0], anchors[0].pitch, phraseContext);
    if (firstOptions.length === 0) return [];

    currentPaths = firstOptions.map(opt => ({
      bassLine: [bassLine[0]],
      melodyLine: [anchors[0].pitch],
      harmonyEvents: [{
        chord: opt.chord,
        bass: bassLine[0],
        melody: anchors[0].pitch,
        interpretation: opt.interpretation
      }],
      detectedMotives: [],
      metrics: this.initMetrics()
    }));

    // Iterate through the rest
    for (let i = 1; i < anchors.length; i++) {
      const nextBass = bassLine[i];
      const nextMelody = anchors[i].pitch;
      const nextOptions = this.getValidChordsForBassAndMelody(nextBass, nextMelody, phraseContext);

      if (nextOptions.length === 0) return []; // Dead end

      let newPaths: HarmonicPathway[] = [];

      for (const path of currentPaths) {
        for (const opt of nextOptions) {
          // Simplistic scoring just to keep the best ones
          // A real implementation would score voice leading between chords here
          const newMetrics = { ...path.metrics };
          newMetrics.totalScore += opt.score;

          newPaths.push({
            bassLine: [...path.bassLine, nextBass],
            melodyLine: [...path.melodyLine, nextMelody],
            harmonyEvents: [...path.harmonyEvents, {
              chord: opt.chord,
              bass: nextBass,
              melody: nextMelody,
              interpretation: opt.interpretation
            }],
            detectedMotives: [],
            metrics: newMetrics
          });
        }
      }

      // Prune
      newPaths.sort((a, b) => b.metrics.totalScore - a.metrics.totalScore);
      currentPaths = newPaths.slice(0, 16); // Strict beam width because the structure is already guaranteed
    }

    return currentPaths;
  }

  private static getValidChordsForBassAndMelody(bass: string, melody: string, phraseContext: PhraseContext) {
    const rawInterpretations = MelodicInterpretationEngine.getInterpretations(melody, phraseContext.selectedCenter);
    
    const validOptions = [];

    for (const interp of rawInterpretations) {
      let baseChord = interp.selectedMeaning.impliedChord;
      let score = 0;
      
      const chordNotes = Chord.get(baseChord).notes.map((n: string) => Note.pitchClass(n));
      const bassPC = Note.pitchClass(bass);
      
      let finalChord = baseChord;

      if (chordNotes[0] === bassPC) {
        // Root position
        score += 10;
      } else if (chordNotes.includes(bassPC)) {
        // Inversion
        finalChord = `${baseChord}/${bassPC}`;
        score += 5;
      } else {
        // Slash chord / pedal point
        // If it creates a minor 9th with any chord tone, it's very harsh. For now, allow but penalize.
        finalChord = `${baseChord}/${bassPC}`;
        score -= 5;
      }

      validOptions.push({
        chord: finalChord,
        interpretation: interp,
        score: score
      });
    }

    return validOptions.sort((a, b) => b.score - a.score).slice(0, 5); // Keep top 5 fits per node
  }

  private static initMetrics(): PathwayMetrics {
    return {
      smoothness: 0,
      commonToneRetention: 0,
      chromaticMotion: 0,
      bassCoherence: 0,
      archetypeStrength: 0,
      totalScore: 0
    };
  }
}
