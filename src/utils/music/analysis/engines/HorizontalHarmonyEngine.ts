import { Note, Interval, Chord } from "tonal";
import type { MelodicAnchor } from "../models/ProjectionSet";
import { ChordSpelling } from "./ChordSpelling";
import { MelodicInterpretationEngine } from "./MelodicInterpretationEngine";
import type { TrajectoryInterpretation } from "../models/MelodicInterpretation";

export interface StructuralMotive {
  id: string;
  name: string;
  description: string;
  match(bassNotes: string[]): boolean;
}

export const MotiveLibrary: StructuralMotive[] = [
  {
    id: "CHROMATIC_DESC",
    name: "Linha Cromática Descendente",
    description: "Baixo desce em semitons",
    match: (bassNotes) => {
      if (bassNotes.length < 3) return false;
      let count = 0;
      for (let i = 1; i < bassNotes.length; i++) {
        const dist = Interval.semitones(Interval.distance(bassNotes[i-1] + "4", bassNotes[i] + "4"))! % 12;
        if (dist === -1 || dist === 11) count++;
      }
      return count >= 2;
    }
  },
  {
    id: "CHROMATIC_ASC",
    name: "Linha Cromática Ascendente",
    description: "Baixo sobe em semitons",
    match: (bassNotes) => {
      if (bassNotes.length < 3) return false;
      let count = 0;
      for (let i = 1; i < bassNotes.length; i++) {
        const dist = Interval.semitones(Interval.distance(bassNotes[i-1] + "4", bassNotes[i] + "4"))! % 12;
        if (dist === 1 || dist === -11) count++;
      }
      return count >= 2;
    }
  },
  {
    id: "CIRCLE_OF_FIFTHS",
    name: "Ciclo de Quintas",
    description: "Baixo salta em quartas justas (resolução forte)",
    match: (bassNotes) => {
      if (bassNotes.length < 2) return false;
      let count = 0;
      for (let i = 1; i < bassNotes.length; i++) {
        const dist = Math.abs(Interval.semitones(Interval.distance(bassNotes[i-1] + "4", bassNotes[i] + "5"))!) % 12;
        if (dist === 5 || dist === 7) count++;
      }
      return count >= 1;
    }
  },
  {
    id: "PEDAL_POINT",
    name: "Pedal Harmônico",
    description: "Nota de baixo se mantém constante enquanto as vozes movem",
    match: (bassNotes) => {
      if (bassNotes.length < 2) return false;
      let count = 0;
      for (let i = 1; i < bassNotes.length; i++) {
        if (Note.chroma(bassNotes[i-1]) === Note.chroma(bassNotes[i])) count++;
      }
      return count >= 2;
    }
  }
];

export interface HarmonizedState {
  chord: string;
  bass: string;
  melody: string;
  interpretation: TrajectoryInterpretation;
}

export interface HorizontalPathway {
  states: HarmonizedState[];
  motives: string[];
  voiceLeadingScore: number;
}

export class HorizontalHarmonyEngine {

  public static generatePathways(anchors: MelodicAnchor[], tonalCenter?: any): HorizontalPathway[] {
    if (anchors.length === 0) return [];

    const optionsPerAnchor = anchors.map(anchor => 
      MelodicInterpretationEngine.getInterpretations(anchor.pitch, tonalCenter)
    );

    let currentPaths: HorizontalPathway[] = optionsPerAnchor[0].map(interp => ({
      states: [{
        chord: interp.selectedMeaning.impliedChord,
        bass: Chord.get(interp.selectedMeaning.impliedChord).tonic || "C",
        melody: interp.anchorPitch,
        interpretation: interp
      }],
      motives: [],
      voiceLeadingScore: 0
    }));

    const BEAM_WIDTH = 128;

    for (let i = 1; i < optionsPerAnchor.length; i++) {
      const nextOptions = optionsPerAnchor[i];
      let newPaths: HorizontalPathway[] = [];

      for (const path of currentPaths) {
        const lastState = path.states[path.states.length - 1];

        for (const nextInterp of nextOptions) {
          const nextChord = nextInterp.selectedMeaning.impliedChord;
          const nextBass = Chord.get(nextChord).tonic || "C";
          
          const vlScore = this.evaluateVoiceLeading(lastState.chord, nextChord);

          newPaths.push({
            states: [...path.states, {
              chord: nextChord,
              bass: nextBass,
              melody: nextInterp.anchorPitch,
              interpretation: nextInterp
            }],
            motives: [],
            voiceLeadingScore: path.voiceLeadingScore + vlScore
          });
        }
      }

      newPaths.sort((a, b) => b.voiceLeadingScore - a.voiceLeadingScore);
      currentPaths = newPaths.slice(0, BEAM_WIDTH);
    }

    for (const path of currentPaths) {
      const bassLine = path.states.map(s => s.bass);
      const matchedMotives: string[] = [];

      for (const motive of MotiveLibrary) {
        if (motive.match(bassLine)) {
          matchedMotives.push(motive.name);
          path.voiceLeadingScore += 3.0; 
        }
      }

      if (bassLine.length >= 2) {
        const lastDist = Interval.semitones(Interval.distance(bassLine[bassLine.length-2] + "4", bassLine[bassLine.length-1] + "4"))! % 12;
        if (lastDist === -1 || lastDist === 11 || lastDist === 1 || lastDist === -11) {
          matchedMotives.push("Aproximação Cromática na Resolução");
          path.voiceLeadingScore += 2.0;
        }
      }

      path.motives = matchedMotives;
    }

    currentPaths.sort((a, b) => b.voiceLeadingScore - a.voiceLeadingScore);

    return currentPaths;
  }

  public static evaluateVoiceLeading(chordA: string, chordB: string): number {
    const pitchesA = ChordSpelling.getPitches(chordA);
    const pitchesB = ChordSpelling.getPitches(chordB);

    if (pitchesA.length === 0 || pitchesB.length === 0) return 0;

    let commonTones = 0;
    let chromaticApproaches = 0;
    let totalMovement = 0;

    const setB = new Set(pitchesB);

    for (const pA of pitchesA) {
      if (setB.has(pA)) {
        commonTones++;
      } else {
        let minDelta = Infinity;
        for (const pB of pitchesB) {
          let dist = Math.abs(pA - pB);
          if (dist > 6) dist = 12 - dist;
          if (dist < minDelta) minDelta = dist;
        }

        totalMovement += minDelta;

        if (minDelta === 1) {
          chromaticApproaches++;
        }
      }
    }

    return (commonTones * 3.0) + (chromaticApproaches * 2.0) - (totalMovement * 0.5);
  }
}
