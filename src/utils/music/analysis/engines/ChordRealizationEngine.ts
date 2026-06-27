import { Note, Chord } from "tonal";
import type { HarmonicSlot } from "../models/HarmonicSlot";
import type { PhraseContext } from "./PhraseAnalysisEngine";
import { MelodicInterpretationEngine } from "./MelodicInterpretationEngine";
import type { HarmonicPathway, PathwayMetrics } from "../models/HarmonicPathway";
import type { HarmonicSeed } from "../models/HarmonicSeed";
import type { NarrativePressure, FieldEvaluation } from "../models/NarrativeState";
import { NarrativeEngine } from "./NarrativeEngine";

type RealizationPath = HarmonicPathway & {
  state: NarrativePressure;
};

export class ChordRealizationEngine {
  
  public static realize(
    slots: HarmonicSlot[], 
    phraseContext: PhraseContext,
    seed: HarmonicSeed,
    initialState: NarrativePressure
  ): HarmonicPathway[] {
    
    if (slots.length === 0) return [];

    let currentPaths: RealizationPath[] = [{
      bassLine: [],
      melodyLine: [],
      harmonyEvents: [],
      metrics: this.initMetrics(),
      state: initialState
    }];

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const candidates = this.getValidChordsForSlot(slot, phraseContext, seed);

      if (candidates.length === 0) return []; // Dead end

      const newPaths: RealizationPath[] = [];

      for (const path of currentPaths) {
        for (const candidate of candidates) {
          
          // 1. Modulate the Field Score using the Narrative Engine (Dual-Force Equation)
          const modScore = NarrativeEngine.computeScore(candidate, path.state);

          const newMetrics = { ...path.metrics };
          newMetrics.totalScore += modScore;

          // 2. Create the Historical Event
          const event = {
            chord: candidate.chord,
            fieldId: seed.fieldId
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
      tensionProfile: []
    };
  }

  private static getValidChordsForSlot(slot: HarmonicSlot, phraseContext: PhraseContext, seed: HarmonicSeed): FieldEvaluation[] {
    const melody = slot.melodyNotes.length > 0 ? slot.melodyNotes[0].pitch : phraseContext.selectedCenter.tonic;
    const bass = slot.bassNote;
    const rawInterpretations = MelodicInterpretationEngine.getInterpretations(melody, phraseContext.selectedCenter);
    
    const validOptions: FieldEvaluation[] = [];

    for (const interp of rawInterpretations) {
      const baseChord = interp.selectedMeaning.impliedChord;
      
      const chordNotes = Chord.get(baseChord).notes.map((n: string) => Note.pitchClass(n));
      const bassPC = Note.pitchClass(bass);
      
      let finalChord = baseChord;
      const voiceLeadingScore = chordNotes[0] === bassPC ? 1.0 : chordNotes.includes(bassPC) ? 0.6 : -0.5;
      if (chordNotes[0] !== bassPC && chordNotes.includes(bassPC)) {
        finalChord = `${baseChord}/${bassPC}`;
      } else if (chordNotes[0] !== bassPC) {
        finalChord = `${baseChord}/${bassPC}`;
      }

      // Functional mapping
      const chordData = Chord.get(baseChord);
      const isTonic = chordData.tonic === phraseContext.selectedCenter.tonic;

      // Simplistic behavior check based on chord quality
      let behavior = "DIATONIC";
      if (chordData.quality === "Diminished" || chordData.quality === "Augmented") behavior = "CHROMATIC";
      else if (chordData.aliases.includes("7") || chordData.aliases.includes("9")) behavior = "DOMINANT";

      // Structural Function heuristic (T, PD, D, EXT, CHROM)
      const anchorChroma = Note.get(phraseContext.selectedCenter.tonic).chroma || 0;
      const chordChroma = Note.get(chordData.tonic || baseChord).chroma || 0;
      const relativeDist = (chordChroma - anchorChroma + 12) % 12;

      // Simplistic mapping for Major key
      const actualFunction =
        relativeDist === 0 || relativeDist === 4 || relativeDist === 9
          ? behavior === "DOMINANT" ? "EXT" : "T"
          : relativeDist === 5 || relativeDist === 2
            ? behavior === "DOMINANT" ? "EXT" : "PD"
            : relativeDist === 7 || relativeDist === 11
              ? "D"
              : behavior === "DOMINANT" ? "EXT" : "CHROM";

      // Functional Compliance Check
      let fieldFit = 1.0;
      if (slot.requiredFunction !== actualFunction) {
        if (slot.requiredFunction === "T" && actualFunction !== "T") fieldFit -= 0.8;
        if (slot.requiredFunction === "D" && actualFunction !== "D") fieldFit -= 0.8;
        if (slot.requiredFunction === "PD" && actualFunction !== "PD") fieldFit -= 0.5;
        
        // Strict enforcement of constraints
        if (actualFunction === "EXT" && !seed.constraints.allowSecondaryDominants) {
          fieldFit -= 2.0; // Hard penalty for using secondary dominants when forbidden
        }
        if (actualFunction === "CHROM" && seed.constraints.allowChromaticPassing === "none") {
          fieldFit -= 2.0; // Hard penalty for chromatic passing when forbidden
        }
      }

      const tonalStability = behavior === "DIATONIC" ? (isTonic ? 1.0 : 0.8) : behavior === "DOMINANT" ? 0.4 : 0.1;
      const novelty = behavior === "DIATONIC" ? 0.1 : behavior === "DOMINANT" ? 0.5 : 1.0;
      const narrativeAlignment = behavior === "DIATONIC" ? 0.2 : behavior === "DOMINANT" ? 1.0 : 0.8;

      validOptions.push({
        chord: finalChord,
        score: {
          fieldFit: fieldFit,
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
