import { Note, Interval } from "tonal";
import type { MelodicAnchor } from "../models/ProjectionSet";
import { ChordSpelling } from "./ChordSpelling";
import type { TrajectoryInterpretation } from "../models/MelodicInterpretation";
import type { PhraseContext } from "./PhraseAnalysisEngine";
import type { GravityField } from "./fields/GravityField";

export const MotiveTag = {
  CHROMATIC_ASCENT: "Aproximação Cromática Ascendente",
  CHROMATIC_DESCENT: "Linha Cromática Descendente",
  CYCLE_OF_FIFTHS: "Ciclo de Quintas",
  PEDAL_POINT: "Pedal Harmônico",
  INNER_VOICE_LINE: "Movimento de Voz Interna",
  SEQUENTIAL_PATTERN: "Padrão Sequencial"
} as const;

export type MotiveTag = typeof MotiveTag[keyof typeof MotiveTag];

export interface StructuralMotive {
  id: string;
  tag: MotiveTag;
  match(bassNotes: string[]): boolean;
}

export const MotiveLibrary: StructuralMotive[] = [
  {
    id: "CHROMATIC_DESC",
    tag: MotiveTag.CHROMATIC_DESCENT,
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
    tag: MotiveTag.CHROMATIC_ASCENT,
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
    tag: MotiveTag.CYCLE_OF_FIFTHS,
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
    tag: MotiveTag.PEDAL_POINT,
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

export interface PathwayMetrics {
  smoothness: number;
  commonToneRetention: number;
  chromaticMotion: number;
  bassCoherence: number;
  archetypeStrength: number;
  totalScore: number;
}

export interface ChordEvent {
  chord: string;
  bass: string;
  melody: string;
  interpretation: TrajectoryInterpretation;
}

export interface HarmonicPathway {
  bassLine: string[];
  melodyLine: string[];
  harmonyEvents: ChordEvent[];
  metrics: PathwayMetrics;
  detectedMotives: MotiveTag[];
}

export class HorizontalHarmonyEngine {

  public static generatePathways(
    anchors: MelodicAnchor[], 
    phraseContext: PhraseContext,
    field: GravityField
  ): HarmonicPathway[] {
    if (anchors.length === 0) return [];

    const optionsPerAnchor = anchors.map(anchor => 
      field.generateCandidates(anchor.pitch, phraseContext)
    );

    // If a field generated 0 candidates for an anchor, it fails to produce a pathway
    if (optionsPerAnchor.some(opts => opts.length === 0)) return [];

    let currentPaths: HarmonicPathway[] = optionsPerAnchor[0].map((interp: TrajectoryInterpretation) => {
      const chord = interp.selectedMeaning.impliedChord;
      const bass = ChordSpelling.getBass(chord) || "C";
      return {
        bassLine: [bass],
        melodyLine: [interp.anchorPitch],
        harmonyEvents: [{
          chord: chord,
          bass: bass,
          melody: interp.anchorPitch,
          interpretation: interp
        }],
        detectedMotives: [],
        metrics: {
          smoothness: 0,
          commonToneRetention: 0,
          chromaticMotion: 0,
          bassCoherence: 0,
          archetypeStrength: 0,
          totalScore: 0
        }
      };
    });

    const BEAM_WIDTH = 64; // We can lower this since the field prunes aggressively

    for (let i = 1; i < optionsPerAnchor.length; i++) {
      const nextOptions = optionsPerAnchor[i];
      let newPaths: HarmonicPathway[] = [];

      for (const path of currentPaths) {
        const lastState = path.harmonyEvents[path.harmonyEvents.length - 1];

        for (const nextInterp of nextOptions) {
          const nextChord = nextInterp.selectedMeaning.impliedChord;
          const nextBass = ChordSpelling.getBass(nextChord) || "C";

          const transitionMetrics = field.scoreTransition(
            lastState.chord,
            nextChord,
            lastState.bass,
            nextBass,
            phraseContext,
            lastState.melody,
            nextInterp.anchorPitch
          );
          
          const rawMetrics = this.evaluateVoiceLeadingMetrics(lastState.chord, nextChord);

          const newMetrics: PathwayMetrics = {
            smoothness: path.metrics.smoothness + rawMetrics.smoothness + transitionMetrics.smoothness,
            commonToneRetention: path.metrics.commonToneRetention + rawMetrics.commonTones + transitionMetrics.commonToneRetention,
            chromaticMotion: path.metrics.chromaticMotion + rawMetrics.chromaticApproaches + transitionMetrics.chromaticMotion,
            bassCoherence: path.metrics.bassCoherence + transitionMetrics.bassCoherence,
            archetypeStrength: path.metrics.archetypeStrength + transitionMetrics.archetypeStrength,
            totalScore: 0 // Will be calculated at the end
          };

          newPaths.push({
            bassLine: [...path.bassLine, nextBass],
            melodyLine: [...path.melodyLine, nextInterp.anchorPitch],
            harmonyEvents: [...path.harmonyEvents, {
              chord: nextChord,
              bass: nextBass,
              melody: nextInterp.anchorPitch,
              interpretation: nextInterp
            }],
            detectedMotives: [],
            metrics: newMetrics
          });
        }
      }

      // Quick prune based on partial totalScore approximation
      newPaths.forEach(p => p.metrics.totalScore = this.calculateTotalScore(p.metrics));
      newPaths.sort((a, b) => b.metrics.totalScore - a.metrics.totalScore);
      currentPaths = newPaths.slice(0, BEAM_WIDTH);
    }

    for (const path of currentPaths) {
      const matchedMotives: MotiveTag[] = [];

      for (const motive of MotiveLibrary) {
        if (motive.match(path.bassLine)) {
          matchedMotives.push(motive.tag);
          path.metrics.archetypeStrength += 1.0;
        }
      }

      if (path.bassLine.length >= 2) {
        const lastDist = Interval.semitones(Interval.distance(path.bassLine[path.bassLine.length-2] + "4", path.bassLine[path.bassLine.length-1] + "4"))! % 12;
        if (lastDist === -1 || lastDist === 11 || lastDist === 1 || lastDist === -11) {
          matchedMotives.push(MotiveTag.CHROMATIC_DESCENT); // close enough for UI feedback
          path.metrics.archetypeStrength += 0.5;
        }
      }

      // Simple bass coherence: penalize crazy jumps
      let bassJumps = 0;
      for (let j = 1; j < path.bassLine.length; j++) {
        const dist = Math.abs(Interval.semitones(Interval.distance(path.bassLine[j-1] + "4", path.bassLine[j] + "4"))!) % 12;
        if (dist > 4 && dist !== 5 && dist !== 7) bassJumps++;
      }
      path.metrics.bassCoherence += (1.0 - (bassJumps * 0.2));

      path.detectedMotives = Array.from(new Set(matchedMotives));
      path.metrics.totalScore = this.calculateTotalScore(path.metrics);
    }

    currentPaths.sort((a, b) => b.metrics.totalScore - a.metrics.totalScore);

    return currentPaths;
  }

  private static calculateTotalScore(m: PathwayMetrics): number {
    return (m.smoothness * 0.35) +
           (m.commonToneRetention * 0.20) +
           (m.chromaticMotion * 0.15) +
           (m.bassCoherence * 0.20) +
           (m.archetypeStrength * 0.10);
  }

  private static evaluateVoiceLeadingMetrics(chordA: string, chordB: string) {
    const pitchesA = ChordSpelling.getPitches(chordA);
    const pitchesB = ChordSpelling.getPitches(chordB);

    if (pitchesA.length === 0 || pitchesB.length === 0) {
      return { smoothness: 0, commonTones: 0, chromaticApproaches: 0 };
    }

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
        if (minDelta === 1) chromaticApproaches++;
      }
    }

    // Normalized smoothness: 0 movement is 1.0, 10 movement is 0.0
    const smoothness = Math.max(0, 1.0 - (totalMovement / 10));

    return {
      smoothness,
      commonTones,
      chromaticApproaches
    };
  }
}
