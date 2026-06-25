import { Note, Chord } from "tonal";
import type { HarmonicSlot } from "../models/HarmonicSlot";
import type { PhraseContext } from "./PhraseAnalysisEngine";
import { MelodicInterpretationEngine } from "./MelodicInterpretationEngine";
import type { HarmonicPathway, PathwayMetrics } from "../models/HarmonicPathway";

export class ChordRealizationEngine {
  
  public static realize(
    slots: HarmonicSlot[], 
    phraseContext: PhraseContext,
    requireTonalStability?: boolean
  ): HarmonicPathway[] {
    
    if (slots.length === 0) return [];

    let currentPaths: HarmonicPathway[] = [];

    // Initialize with the first slot
    const firstOptions = this.getValidChordsForSlot(slots[0], phraseContext, requireTonalStability);
    if (firstOptions.length === 0) return [];

    currentPaths = firstOptions.map(opt => ({
      bassLine: [slots[0].bassNote],
      melodyLine: [slots[0].melodyNotes.length > 0 ? slots[0].melodyNotes[0].pitch : ""],
      harmonyEvents: [{
        chord: opt.chord,
        bass: slots[0].bassNote,
        melody: slots[0].melodyNotes.length > 0 ? slots[0].melodyNotes[0].pitch : "",
        interpretation: opt.interpretation
      }],
      detectedMotives: [],
      metrics: this.initMetrics()
    }));

    // Iterate through the rest
    for (let i = 1; i < slots.length; i++) {
      const nextSlot = slots[i];
      const nextOptions = this.getValidChordsForSlot(nextSlot, phraseContext, requireTonalStability);

      if (nextOptions.length === 0) return []; // Dead end

      let newPaths: HarmonicPathway[] = [];

      for (const path of currentPaths) {
        for (const opt of nextOptions) {
          const newMetrics = { ...path.metrics };
          newMetrics.totalScore += opt.score;

          newPaths.push({
            bassLine: [...path.bassLine, nextSlot.bassNote],
            melodyLine: [...path.melodyLine, nextSlot.melodyNotes.length > 0 ? nextSlot.melodyNotes[0].pitch : ""],
            harmonyEvents: [...path.harmonyEvents, {
              chord: opt.chord,
              bass: nextSlot.bassNote,
              melody: nextSlot.melodyNotes.length > 0 ? nextSlot.melodyNotes[0].pitch : "",
              interpretation: opt.interpretation
            }],
            detectedMotives: [],
            metrics: newMetrics
          });
        }
      }

      newPaths.sort((a, b) => b.metrics.totalScore - a.metrics.totalScore);
      currentPaths = newPaths.slice(0, 16);
    }

    return currentPaths;
  }

  private static getValidChordsForSlot(slot: HarmonicSlot, phraseContext: PhraseContext, requireTonalStability?: boolean) {
    const melody = slot.melodyNotes.length > 0 ? slot.melodyNotes[0].pitch : phraseContext.selectedCenter.tonic;
    const bass = slot.bassNote;
    const rawInterpretations = MelodicInterpretationEngine.getInterpretations(melody, phraseContext.selectedCenter);
    
    const validOptions = [];

    for (const interp of rawInterpretations) {
      let baseChord = interp.selectedMeaning.impliedChord;
      let score = 0;

      if (requireTonalStability) {
        // Simple stability check: if chord is outside the key
        const chordData = Chord.get(baseChord);
        if (chordData.quality === "Diminished" || chordData.quality === "Augmented") {
          score -= 10;
        } else if (chordData.aliases.includes("7") || chordData.aliases.includes("9")) {
          score -= 2;
        }
      }
      
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
