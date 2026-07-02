import { Note } from "tonal";
import type { ScoreHarmonyEvent } from "../models/ScoreSnapshot";
import { chordPitchClasses, chordRoot } from "../../theory/ChordSymbolResolver";
import { detectIiVFunctionalCells } from "./IiVFunctionalGrammar";

interface SlashChordRelation {
  chord: string;
  measure: number;
  upperRoot: string;
  bass: string;
  relation: "TRIVIAL_INVERSION" | "INDEPENDENT_BASS";
}

type BassMotionKind =
  | "REPEATED"
  | "STEP_ASC"
  | "STEP_DESC"
  | "CHROMATIC_ASC"
  | "CHROMATIC_DESC"
  | "STRUCTURAL_LEAP";

interface BassMotionEvent {
  from: string;
  to: string;
  semitones: number;
  direction: "UP" | "DOWN" | "STATIC";
  kind: BassMotionKind;
}

interface HarmonicPlaneSegment {
  startMeasure: number;
  endMeasure: number;
  chords: string[];
  bassLine: string[];
  independentBassCount: number;
}

interface StructuralBassGrammarReport {
  chordCount: number;
  slashChordCount: number;
  slashChordDensity: number;
  independentBassCount: number;
  bassLine: string[];
  bassMotions: BassMotionEvent[];
  bassMotionProfile: BassMotionKind[];
  bassContinuityScore: number;
  harmonicPlaneSegments: HarmonicPlaneSegment[];
  lowDirectCadentialDependence: boolean;
  relations: SlashChordRelation[];
  properties: string[];
}

function normalizePitch(note: string): string {
  return Note.pitchClass(note) || note;
}

function chordSymbol(chord: string): string {
  return chord.split("/")[0];
}

function normalizeChordRoot(chord: string): string {
  return normalizePitch(chordRoot(chordSymbol(chord)) || "");
}

function explicitBass(chord: string): string | null {
  const bass = chord.split("/")[1];
  return bass ? normalizePitch(bass) : null;
}

function bassForChord(chord: string): string {
  return explicitBass(chord) || normalizeChordRoot(chord);
}

function upperChordPitchClasses(chord: string): string[] {
  return chordPitchClasses(chordSymbol(chord), false).map(note => normalizePitch(note)).filter(Boolean);
}

function bassSemitoneStep(a: string, b: string): number | null {
  const aChroma = Note.chroma(a);
  const bChroma = Note.chroma(b);
  if (aChroma === undefined || bChroma === undefined) return null;
  const up = (bChroma - aChroma + 12) % 12;
  const down = (aChroma - bChroma + 12) % 12;
  return Math.min(up, down);
}

function bassMotionEvent(from: string, to: string): BassMotionEvent | null {
  const fromChroma = Note.chroma(from);
  const toChroma = Note.chroma(to);
  if (fromChroma === undefined || toChroma === undefined) return null;

  const up = (toChroma - fromChroma + 12) % 12;
  const down = (fromChroma - toChroma + 12) % 12;
  const direction = up === 0 ? "STATIC" : up <= down ? "UP" : "DOWN";
  const semitones = direction === "DOWN" ? down : up;
  let kind: BassMotionKind = "STRUCTURAL_LEAP";

  if (semitones === 0) kind = "REPEATED";
  else if (semitones === 1 && direction === "UP") kind = "CHROMATIC_ASC";
  else if (semitones === 1 && direction === "DOWN") kind = "CHROMATIC_DESC";
  else if (semitones === 2 && direction === "UP") kind = "STEP_ASC";
  else if (semitones === 2 && direction === "DOWN") kind = "STEP_DESC";

  return { from, to, semitones, direction, kind };
}

function bassMotions(bassLine: string[]): BassMotionEvent[] {
  return bassLine
    .slice(1)
    .map((bass, index) => bassMotionEvent(bassLine[index], bass))
    .filter((event): event is BassMotionEvent => event !== null);
}

function bassContinuityScore(bassLine: string[]): number {
  if (bassLine.length < 2) return 1;

  const steps = bassLine
    .slice(1)
    .map((bass, index) => bassSemitoneStep(bassLine[index], bass))
    .filter((step): step is number => step !== null);

  if (steps.length === 0) return 0;
  const smoothSteps = steps.filter(step => step <= 2).length;
  const moderateSteps = steps.filter(step => step <= 5).length;
  return Number(((smoothSteps + moderateSteps * 0.5) / steps.length).toFixed(3));
}

function harmonicPlaneSegments(
  ordered: ScoreHarmonyEvent[],
  relations: SlashChordRelation[],
  motions: BassMotionEvent[]
): HarmonicPlaneSegment[] {
  const relationByIndex = new Map<number, SlashChordRelation>();
  for (const relation of relations) {
    const index = ordered.findIndex(harmony => harmony.measure === relation.measure && harmony.harmony === relation.chord);
    if (index >= 0) relationByIndex.set(index, relation);
  }

  const segments: HarmonicPlaneSegment[] = [];
  let start = -1;

  const isPlaneIndex = (index: number) => {
    const relation = relationByIndex.get(index);
    const previousMotion = motions[index - 1];
    const nextMotion = motions[index];
    return relation?.relation === "INDEPENDENT_BASS"
      || previousMotion?.kind !== "STRUCTURAL_LEAP"
      || nextMotion?.kind !== "STRUCTURAL_LEAP";
  };

  for (let i = 0; i < ordered.length; i++) {
    if (isPlaneIndex(i)) {
      if (start === -1) start = Math.max(0, i - 1);
    } else if (start !== -1) {
      const end = i - 1;
      if (end - start >= 2) {
        const segment = buildHarmonicPlaneSegment(ordered, relations, start, end);
        if (segment.independentBassCount > 0) segments.push(segment);
      }
      start = -1;
    }
  }

  if (start !== -1 && ordered.length - 1 - start >= 2) {
    const segment = buildHarmonicPlaneSegment(ordered, relations, start, ordered.length - 1);
    if (segment.independentBassCount > 0) segments.push(segment);
  }

  return segments;
}

function buildHarmonicPlaneSegment(
  ordered: ScoreHarmonyEvent[],
  relations: SlashChordRelation[],
  start: number,
  end: number
): HarmonicPlaneSegment {
  const segment = ordered.slice(start, end + 1);
  const relationKeys = new Set(relations
    .filter(relation => relation.relation === "INDEPENDENT_BASS")
    .map(relation => `${relation.measure}:${relation.chord}`));

  return {
    startMeasure: segment[0].measure,
    endMeasure: segment[segment.length - 1].measure,
    chords: segment.map(harmony => harmony.harmony),
    bassLine: segment.map(harmony => bassForChord(harmony.harmony)),
    independentBassCount: segment.filter(harmony => relationKeys.has(`${harmony.measure}:${harmony.harmony}`)).length
  };
}

function analyzeSlashRelation(harmony: ScoreHarmonyEvent): SlashChordRelation | null {
  const bass = explicitBass(harmony.harmony);
  if (!bass) return null;

  const upperRoot = normalizeChordRoot(harmony.harmony);
  const upperNotes = upperChordPitchClasses(harmony.harmony);
  const relation = upperNotes.includes(bass) ? "TRIVIAL_INVERSION" : "INDEPENDENT_BASS";

  return {
    chord: harmony.harmony,
    measure: harmony.measure,
    upperRoot,
    bass,
    relation
  };
}

export function analyzeStructuralBassGrammar(harmonies: ScoreHarmonyEvent[]): StructuralBassGrammarReport {
  const ordered = [...harmonies].sort((a, b) => a.tickStart - b.tickStart);
  const relations = ordered
    .map(analyzeSlashRelation)
    .filter((relation): relation is SlashChordRelation => relation !== null);
  const bassLine = ordered.map(harmony => bassForChord(harmony.harmony));
  const independentBassCount = relations.filter(relation => relation.relation === "INDEPENDENT_BASS").length;
  const slashChordDensity = ordered.length > 0 ? relations.length / ordered.length : 0;
  const iiVCells = detectIiVFunctionalCells(ordered);
  const lowDirectCadentialDependence = ordered.length === 0 || iiVCells.length / ordered.length < 0.2;
  const motions = bassMotions(bassLine);
  const motionProfile = Array.from(new Set(motions.map(motion => motion.kind)));
  const continuity = bassContinuityScore(bassLine);
  const planeSegments = harmonicPlaneSegments(ordered, relations, motions);

  const properties: string[] = [];
  if (relations.length > 0) properties.push("SLASH_CHORD_RELATION");
  if (slashChordDensity >= 0.3) properties.push("SIGNIFICANT_SLASH_CHORD_DENSITY");
  if (independentBassCount > 0) properties.push("UPPER_STRUCTURE_OVER_BASS");
  if (independentBassCount >= 2) properties.push("STRUCTURAL_BASS_GRAMMAR");
  if (continuity >= 0.5) properties.push("BASS_MOTION_CONTINUITY");
  if (motionProfile.includes("CHROMATIC_ASC") || motionProfile.includes("CHROMATIC_DESC")) properties.push("CHROMATIC_BASS_MOTION");
  if (motionProfile.includes("STRUCTURAL_LEAP")) properties.push("STRUCTURAL_BASS_LEAP");
  if (planeSegments.length > 0) properties.push("PLANAR_CHORD_MOTION");
  if (lowDirectCadentialDependence) properties.push("LOW_DIRECT_CADENTIAL_DEPENDENCE");

  return {
    chordCount: ordered.length,
    slashChordCount: relations.length,
    slashChordDensity: Number(slashChordDensity.toFixed(3)),
    independentBassCount,
    bassLine,
    bassMotions: motions,
    bassMotionProfile: motionProfile,
    bassContinuityScore: continuity,
    harmonicPlaneSegments: planeSegments,
    lowDirectCadentialDependence,
    relations,
    properties
  };
}
