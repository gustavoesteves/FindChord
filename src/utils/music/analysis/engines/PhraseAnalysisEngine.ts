import { Scale, Note } from "tonal";
import type { MelodicAnchor } from "../models/ProjectionSet";
import type { ScoreMeasureTickRange } from "../models/ScoreSnapshot";
import { keyContextFromSignature } from "../scoreTimelineContext";

export type CadenceType = 
  | "AUTHENTIC"
  | "HALF"
  | "DECEPTIVE"
  | "PLAGAL"
  | "PHRYGIAN"
  | "EVASIVE"
  | "OPEN"
  | "UNKNOWN";

export interface TonalCenterCandidate {
  tonic: string;
  mode: "major" | "minor";
  confidence: number;
}

export interface CadentialTarget {
  targetPitch: string;
  cadenceType: CadenceType;
  confidence: number;
}

export interface PhraseContext {
  tonalCenterCandidates: TonalCenterCandidate[];
  selectedCenter: TonalCenterCandidate;
  selectedCenterSource?: "melody" | "reference";
  selectedCenterEvidence?: string[];
  cadentialTarget: CadentialTarget;
}

interface PhraseAnalysisOptions {
  measureTicks?: ScoreMeasureTickRange[];
}

const TONAL_CENTER_ROOTS = [
  "C",
  "G",
  "D",
  "A",
  "E",
  "B",
  "F#",
  "C#",
  "F",
  "Bb",
  "Eb",
  "Ab",
  "Db",
  "Gb",
  "Cb"
];

export class PhraseAnalysisEngine {
  
  public static analyzePhrase(
    anchors: MelodicAnchor[],
    keySignature?: string,
    options: PhraseAnalysisOptions = {}
  ): PhraseContext {
    if (anchors.length === 0) {
      const defaultCenter: TonalCenterCandidate = { tonic: "C", mode: "major", confidence: 0.1 };
      return {
        selectedCenter: defaultCenter,
        selectedCenterSource: "melody",
        tonalCenterCandidates: [defaultCenter],
        cadentialTarget: { targetPitch: "C", cadenceType: "UNKNOWN", confidence: 0.1 }
      };
    }

    const cadentialTarget = this.inferCadentialTarget(anchors, options);
    const candidates = this.evaluateTonalCenters(anchors, cadentialTarget, keySignature);
    
    // Fallback if no candidate
    if (candidates.length === 0) {
      candidates.push({ tonic: "C", mode: "major", confidence: 0.1 });
    }

    return {
      tonalCenterCandidates: candidates,
      selectedCenter: candidates[0],
      selectedCenterSource: "melody",
      cadentialTarget
    };
  }

  private static inferCadentialTarget(
    anchors: MelodicAnchor[],
    options: PhraseAnalysisOptions
  ): CadentialTarget {
    const lastAnchor = anchors[anchors.length - 1];
    const targetPitch = Note.pitchClass(lastAnchor.pitch) || "C";
    
    // Confidence based on the final note duration in ticks. A whole-note-ish
    // arrival is strong; a short pickup should not saturate the cadence.
    const durationTicks = lastAnchor.duration || (
      lastAnchor.startTick !== undefined && lastAnchor.endTick !== undefined
        ? lastAnchor.endTick - lastAnchor.startTick
        : 480
    );
    const expectedMeasureDuration = this.measureDurationForAnchor(lastAnchor, options.measureTicks) ?? 1920;
    const durationRatio = Math.max(0, Math.min(1, durationTicks / expectedMeasureDuration));
    const confidence = Math.min(0.9, 0.4 + (durationRatio * 0.5));

    return {
      targetPitch,
      cadenceType: "OPEN", // We will refine this after we know the Tonal Center
      confidence
    };
  }

  private static measureDurationForAnchor(
    anchor: MelodicAnchor,
    measureTicks: ScoreMeasureTickRange[] | undefined
  ): number | undefined {
    if (!measureTicks || measureTicks.length === 0) return undefined;

    const matchingMeasure = measureTicks.find(measure => (
      measure.measure === anchor.measureIndex
      || (
        anchor.startTick !== undefined
        && anchor.startTick >= measure.startTick
        && anchor.startTick < measure.endTick
      )
    ));
    if (!matchingMeasure) return undefined;

    const duration = matchingMeasure.endTick - matchingMeasure.startTick;
    return duration > 0 ? duration : undefined;
  }

  private static evaluateTonalCenters(
    anchors: MelodicAnchor[], 
    cadentialTarget: CadentialTarget, 
    keySignature?: string
  ): TonalCenterCandidate[] {
    
    const uniqueNotes = Array.from(new Set(anchors.map(a => Note.pitchClass(a.pitch))));
    const firstNote = Note.pitchClass(anchors[0].pitch);
    const lastNote = cadentialTarget.targetPitch;

    const allKeys = [
      ...TONAL_CENTER_ROOTS.map(n => ({ tonic: n, mode: "major" as const, scale: Scale.get(`${n} major`).notes })),
      ...TONAL_CENTER_ROOTS.map(n => ({ tonic: n, mode: "minor" as const, scale: Scale.get(`${n} minor`).notes }))
    ];

    const candidates: (TonalCenterCandidate & { score: number })[] = [];

    for (const key of allKeys) {
      // 1. Pitch Coverage
      let covered = 0;
      for (const note of uniqueNotes) {
        if (key.scale.includes(note)) covered++;
        // Equivalent enharmonics check could be added here
      }
      const pitchCoverage = covered / uniqueNotes.length;

      // 2. Salience Support (Does the scale contain the most repeated/long notes?)
      // Simplification: Does it contain the first and last notes?
      let salienceSupport = 0;
      if (key.scale.includes(firstNote)) salienceSupport += 0.5;
      if (key.scale.includes(lastNote)) salienceSupport += 0.5;

      // 3. Phrase Boundary Support (Is the phrase starting/ending on stable degrees?)
      // Tonic = 1.0, Dominant = 0.8, Mediant = 0.6
      let phraseBoundarySupport = 0;
      if (firstNote === key.tonic) phraseBoundarySupport += 0.5;
      else if (firstNote === key.scale[4]) phraseBoundarySupport += 0.3; // Dominant
      
      if (lastNote === key.tonic) phraseBoundarySupport += 0.5;
      else if (lastNote === key.scale[4]) phraseBoundarySupport += 0.3; // Dominant

      // 4. Implied Cadence Support
      let impliedCadenceSupport = 0;
      if (lastNote === key.tonic) {
        impliedCadenceSupport = 1.0; // Authentic expectation
      } else if (lastNote === key.scale[4]) {
        impliedCadenceSupport = 0.8; // Half cadence expectation
      }

      const score = 
        (pitchCoverage * 0.4) + 
        (salienceSupport * 0.2) + 
        (phraseBoundarySupport * 0.2) + 
        (impliedCadenceSupport * 0.2);

      if (score > 0.4) {
        candidates.push({
          tonic: key.tonic,
          mode: key.mode,
          confidence: score,
          score
        });
      }
    }

    // Apply confidence penalty for short snippets
    const measureCount = anchors[anchors.length-1].measureIndex - anchors[0].measureIndex + 1;
    let confidencePenalty = 1.0;
    if (uniqueNotes.length < 6) confidencePenalty *= 0.65;
    if (measureCount < 8) confidencePenalty *= 0.75;

    const keyContext = keyContextFromSignature(keySignature);
    const keySignatureTonic = keyContext?.tonic;
    const keySignatureMode = keyContext?.mode;
    const relativeMinorTonic = keySignatureTonic && keySignatureMode === "major"
      ? Scale.get(`${keySignatureTonic} major`).notes[5]
      : undefined;

    // Apply score adjustments before choosing the top candidates. A declared
    // key can be musically decisive even when a short phrase ranks it fourth.
    const finalCandidates = candidates.map(c => {
      let conf = c.confidence * confidencePenalty;
      if (keySignatureTonic && c.tonic === keySignatureTonic && c.mode === keySignatureMode) {
        conf = Math.min(0.95, conf + 0.3);
      } else if (relativeMinorTonic && c.tonic === relativeMinorTonic && c.mode === "minor") {
        conf = Math.min(0.95, conf + 0.18);
      }
      return {
        tonic: c.tonic,
        mode: c.mode,
        confidence: Math.round(conf * 100) / 100
      };
    })
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    cadentialTarget.cadenceType = "OPEN";

    return finalCandidates;
  }
}
