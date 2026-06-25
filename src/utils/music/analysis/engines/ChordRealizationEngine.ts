import { Note, Chord } from "tonal";
import type { HarmonicSlot } from "../models/HarmonicSlot";
import type { PhraseContext } from "./PhraseAnalysisEngine";
import { MelodicInterpretationEngine } from "./MelodicInterpretationEngine";
import type { HarmonicPathway, PathwayMetrics } from "../models/HarmonicPathway";
import type { HarmonicSeed } from "../models/HarmonicSeed";
import type { NarrativePressure, FieldEvaluation } from "../models/NarrativeState";
import { NarrativeEngine } from "./NarrativeEngine";

export class ChordRealizationEngine {
  
  public static realize(
    slots: HarmonicSlot[], 
    phraseContext: PhraseContext,
    seed: HarmonicSeed,
    initialState: NarrativePressure
  ): HarmonicPathway[] {
    
    if (slots.length === 0) return [];

    let currentPaths = [{
      bassLine: [] as string[],
      melodyLine: [] as string[],
      harmonyEvents: [] as any[],
      detectedMotives: [] as any[],
      metrics: this.initMetrics(),
      state: initialState
    }];

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const candidates = this.getValidChordsForSlot(slot, phraseContext, seed);

      if (candidates.length === 0) return []; // Dead end

      let newPaths = [];

      for (const path of currentPaths) {
        for (const candidate of candidates) {
          
          // 1. Modulate the Field Score using the Narrative Engine (Dual-Force Equation)
          const modScore = NarrativeEngine.computeScore(candidate, path.state);

          const newMetrics = { ...path.metrics };
          newMetrics.totalScore += modScore;

          // 2. Create the Historical Event
          const event = {
            chord: candidate.chord,
            fieldId: seed.fieldId,
            bass: slot.bassNote,
            slotIndex: i,
            tensionAtTime: path.state.tension
          };

          // 3. Mutate Narrative State based on the chosen event
          const newState = NarrativeEngine.updateNarrative(path.state, event, slots.length);

          newMetrics.tensionProfile = [...newMetrics.tensionProfile, newState.tension];

          newPaths.push({
            bassLine: [...path.bassLine, slot.bassNote],
            melodyLine: [...path.melodyLine, slot.melodyNotes.length > 0 ? slot.melodyNotes[0].pitch : ""],
            harmonyEvents: [...path.harmonyEvents, {
              chord: candidate.chord,
              bass: slot.bassNote,
              melody: slot.melodyNotes.length > 0 ? slot.melodyNotes[0].pitch : "",
              interpretation: candidate.interpretation
            }],
            detectedMotives: [],
            metrics: newMetrics,
            state: newState
          });
        }
      }

      // Beam Search Pruning
      newPaths.sort((a, b) => b.metrics.totalScore - a.metrics.totalScore);
      currentPaths = newPaths.slice(0, 16);
    }

    return currentPaths;
  }

  private static initMetrics(): PathwayMetrics {
    return {
      totalScore: 0,
      smoothness: 0,
      commonToneRetention: 0,
      chromaticMotion: 0,
      bassCoherence: 0,
      archetypeStrength: 0,
      tensionProfile: [],
      harmonicRhythm: []
    };
  }

  private static getValidChordsForSlot(slot: HarmonicSlot, phraseContext: PhraseContext, seed: HarmonicSeed): FieldEvaluation[] {
    const melody = slot.melodyNotes.length > 0 ? slot.melodyNotes[0].pitch : phraseContext.selectedCenter.tonic;
    const bass = slot.bassNote;
    const rawInterpretations = MelodicInterpretationEngine.getInterpretations(melody, phraseContext.selectedCenter);
    
    const validOptions: FieldEvaluation[] = [];

    for (const interp of rawInterpretations) {
      let baseChord = interp.selectedMeaning.impliedChord;
      
      const chordNotes = Chord.get(baseChord).notes.map((n: string) => Note.pitchClass(n));
      const bassPC = Note.pitchClass(bass);
      
      let finalChord = baseChord;
      let voiceLeadingScore = 0;

      if (chordNotes[0] === bassPC) {
        voiceLeadingScore = 1.0;
      } else if (chordNotes.includes(bassPC)) {
        finalChord = `${baseChord}/${bassPC}`;
        voiceLeadingScore = 0.6;
      } else {
        finalChord = `${baseChord}/${bassPC}`;
        voiceLeadingScore = -0.5; // Penalize non-chord bass notes slightly, but allow them (pedal point)
      }

      // Functional mapping
      let tonalStability = 0;
      let novelty = 0;
      let narrativeAlignment = 0;

      const chordData = Chord.get(baseChord);
      const isTonic = chordData.tonic === phraseContext.selectedCenter.tonic;

      // Simplistic behavior check based on chord quality
      let behavior = "DIATONIC";
      if (chordData.quality === "Diminished" || chordData.quality === "Augmented") behavior = "CHROMATIC";
      else if (chordData.aliases.includes("7") || chordData.aliases.includes("9")) behavior = "DOMINANT";

      if (behavior === "DIATONIC") {
        tonalStability = isTonic ? 1.0 : 0.8;
        novelty = 0.1;
        narrativeAlignment = 0.2; // Baseline
      } else if (behavior === "DOMINANT") {
        tonalStability = 0.4;
        novelty = 0.5;
        narrativeAlignment = 1.0; // High tension driver
      } else {
        // Chromatic / Borrowed
        tonalStability = 0.1;
        novelty = 1.0;
        narrativeAlignment = 0.8;
      }

      validOptions.push({
        chord: finalChord,
        score: {
          fieldFit: 1.0,
          voiceLeading: voiceLeadingScore,
          tonalStability: tonalStability,
          novelty: novelty,
          narrativeAlignment: narrativeAlignment
        },
        biasVector: seed.biasVector,
        interpretation: interp
      });
    }

    return validOptions;
  }
}
