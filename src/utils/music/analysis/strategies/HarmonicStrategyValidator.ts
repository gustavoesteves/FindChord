import { Chord, Note } from "tonal";
import type { MelodicAnchor } from "../models/ProjectionSet";
import type { ReharmonizationMeasure } from "../models/ReharmonizationProposal";
import { analyzeApparentFunction } from "./ApparentFunctionAnalysis";

export type HarmonicStrategyId =
  | "I_IV_V"
  | "EXPANSAO_FUNCIONAL_DIATONICA"
  | "DOMINANTES_SECUNDARIAS"
  | "DIMINUTO_PASSAGEM";
export type StrategyFunctionId = "T" | "PD" | "D" | "OTHER";
export type HarmonicExpansionIntent =
  | "PROLONG_VIA_SECONDARY"
  | "SUSTAIN"
  | "PREPARE_NEXT_REGION"
  | "CADENTIAL_RESOLUTION"
  | "SECONDARY_DOMINANT_RESOLUTION"
  | "DIMINISHED_PASSING_RESOLUTION";

export interface HarmonicStrategyExpectation {
  strategy: HarmonicStrategyId;
  backbone: StrategyFunctionId[];
  requiredExpansions: HarmonicExpansionIntent[];
  melodyCoverage: number;
  functionalEscapes: number;
  unresolvedSecondaryDominants?: number;
  unresolvedDiminishedPassings?: number;
  invalidChromaticEscapes?: number;
  minChordCount: number;
  maxChordCount: number;
}

export interface HarmonizationCandidate {
  strategy: HarmonicStrategyId;
  center: string;
  measures: ReharmonizationMeasure[];
  melody: MelodicAnchor[];
}

export interface HarmonicStrategyReport {
  strategy: HarmonicStrategyId;
  backbone: StrategyFunctionId[];
  expansions: HarmonicExpansionIntent[];
  melodyCoverage: number;
  functionalEscapes: number;
  secondaryDominantExcursions: number;
  unresolvedSecondaryDominants: number;
  diminishedPassingExcursions: number;
  unresolvedDiminishedPassings: number;
  invalidChromaticEscapes: number;
  chordCount: number;
  bassMotionProfile: "DESCENDING" | "ASCENDING" | "MIXED" | "STATIC";
}

export interface HarmonicStrategyValidation {
  accepted: boolean;
  report: HarmonicStrategyReport;
  failures: string[];
}

const functionMap: Record<StrategyFunctionId, string[]> = {
  T: ["I", "iii", "vi"],
  PD: ["ii", "IV"],
  D: ["V", "vii"],
  OTHER: []
};

const romanByDegree: Record<number, string> = {
  0: "I",
  2: "ii",
  4: "iii",
  5: "IV",
  7: "V",
  9: "vi",
  11: "vii"
};

export const STRATEGY_EXPECTATIONS: Record<HarmonicStrategyId, HarmonicStrategyExpectation> = {
  I_IV_V: {
    strategy: "I_IV_V",
    backbone: ["T", "PD", "D", "T"],
    requiredExpansions: ["CADENTIAL_RESOLUTION"],
    melodyCoverage: 0.85,
    functionalEscapes: 0,
    minChordCount: 4,
    maxChordCount: 4
  },
  EXPANSAO_FUNCIONAL_DIATONICA: {
    strategy: "EXPANSAO_FUNCIONAL_DIATONICA",
    backbone: ["T", "PD", "D", "T"],
    requiredExpansions: ["PROLONG_VIA_SECONDARY", "SUSTAIN", "PREPARE_NEXT_REGION", "CADENTIAL_RESOLUTION"],
    melodyCoverage: 0.85,
    functionalEscapes: 0,
    minChordCount: 6,
    maxChordCount: 8
  },
  DOMINANTES_SECUNDARIAS: {
    strategy: "DOMINANTES_SECUNDARIAS",
    backbone: ["T", "PD", "D", "T"],
    requiredExpansions: ["SECONDARY_DOMINANT_RESOLUTION", "CADENTIAL_RESOLUTION"],
    melodyCoverage: 0.85,
    functionalEscapes: 0,
    unresolvedSecondaryDominants: 0,
    invalidChromaticEscapes: 0,
    minChordCount: 6,
    maxChordCount: 9
  },
  DIMINUTO_PASSAGEM: {
    strategy: "DIMINUTO_PASSAGEM",
    backbone: ["T", "PD", "D", "T"],
    requiredExpansions: ["DIMINISHED_PASSING_RESOLUTION", "CADENTIAL_RESOLUTION"],
    melodyCoverage: 0.85,
    functionalEscapes: 0,
    unresolvedDiminishedPassings: 0,
    invalidChromaticEscapes: 0,
    minChordCount: 6,
    maxChordCount: 10
  }
};

export function normalizeChordRoot(chord: string): string {
  const [symbol] = chord.split("/");
  return Chord.tokenize(symbol)[0] || symbol.replace(/[^A-G#b]/g, "");
}

export function rootToRoman(root: string, center: string): string {
  const chroma = Note.chroma(root);
  const centerChroma = Note.chroma(center);
  if (chroma === undefined || centerChroma === undefined) return "?";

  const degree = (chroma - centerChroma + 12) % 12;
  return romanByDegree[degree] || "?";
}

export function classifyFunction(chord: string, center: string): StrategyFunctionId {
  const roman = rootToRoman(normalizeChordRoot(chord), center);
  if (functionMap.T.includes(roman)) return "T";
  if (functionMap.PD.includes(roman)) return "PD";
  if (functionMap.D.includes(roman)) return "D";
  return "OTHER";
}

export function secondaryDominantTarget(chord: string, center: string): string | null {
  const symbol = chord.split("/")[0];
  const chordData = Chord.get(symbol);
  const root = chordData.tonic ? Note.pitchClass(chordData.tonic) : normalizeChordRoot(chord);
  const rootChroma = Note.chroma(root);
  const centerChroma = Note.chroma(center);
  if (rootChroma === undefined || centerChroma === undefined) return null;
  if (!/7|dom/i.test(chordData.type) && !symbol.includes("7")) return null;

  const targetChroma = (rootChroma + 5) % 12;
  const targetDegree = (targetChroma - centerChroma + 12) % 12;
  const targetRoman = romanByDegree[targetDegree] || "?";
  const allowedTargets = ["ii", "IV", "V", "vi"];
  if (!allowedTargets.includes(targetRoman)) return null;

  return targetRoman;
}

export function isPassingDiminishedChord(chord: string): boolean {
  const symbol = chord.split("/")[0];
  const chordData = Chord.get(symbol);
  return chordData.type === "diminished";
}

export function diminishedPassingTarget(chord: string, nextChord: string | undefined, center: string): string | null {
  if (!nextChord || !isPassingDiminishedChord(chord)) return null;

  const root = normalizeChordRoot(chord);
  const targetRoot = normalizeChordRoot(nextChord);
  const rootChroma = Note.chroma(root);
  const targetChroma = Note.chroma(targetRoot);
  if (rootChroma === undefined || targetChroma === undefined) return null;

  const resolvesUpBySemitone = (targetChroma - rootChroma + 12) % 12 === 1;
  if (!resolvesUpBySemitone) return null;

  const targetRoman = rootToRoman(targetRoot, center);
  if (targetRoman === "?") return null;

  return targetRoman;
}

function chordMatchesRoman(chord: string, center: string, roman: string): boolean {
  return rootToRoman(normalizeChordRoot(chord), center) === roman;
}

export function compressBackbone(functions: StrategyFunctionId[]): StrategyFunctionId[] {
  const structuralFunctions = functions.filter(fn => fn !== "OTHER");
  return structuralFunctions.filter((fn, index) => fn !== structuralFunctions[index - 1]);
}

function sameBackbone(a: StrategyFunctionId[], b: StrategyFunctionId[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function repeatedBackbone(expected: StrategyFunctionId[], repetitions: number): StrategyFunctionId[] {
  const repeated: StrategyFunctionId[] = [];
  for (let i = 0; i < repetitions; i++) {
    repeated.push(...expected);
  }
  return compressBackbone(repeated);
}

function backboneMatchesExpectation(actual: StrategyFunctionId[], expected: StrategyFunctionId[], measureCount: number): boolean {
  if (sameBackbone(actual, expected)) return true;
  if (measureCount <= 4) return false;

  const startsAndEndsAtTonic = actual[0] === "T" && actual[actual.length - 1] === "T";
  const hasFunctionalArc = actual.includes("PD") && actual.includes("D");
  const finalDominant = actual.lastIndexOf("D");
  if (startsAndEndsAtTonic && hasFunctionalArc && finalDominant >= 0 && finalDominant < actual.length - 1) return true;

  const phraseCount = Math.max(1, Math.ceil(measureCount / 4));
  return sameBackbone(actual, repeatedBackbone(expected, phraseCount));
}

export function noteCoveredByChord(note: string, chord: string): boolean {
  const pc = Note.pitchClass(note);
  const [symbol, explicitBass] = chord.split("/");
  const chordNotes = Chord.get(symbol).notes.map((n: string) => Note.pitchClass(n));
  if (explicitBass) chordNotes.push(Note.pitchClass(explicitBass));
  return pc !== "" && chordNotes.includes(pc);
}

export function calculateMelodyCoverage(candidate: HarmonizationCandidate): number {
  if (candidate.melody.length === 0) return 0;

  if (candidate.measures.length > 4) {
    const coveredMeasures = candidate.measures.filter(measure => {
      const measureMelody = candidate.melody.filter(anchor => anchor.measureIndex === measure.measureIndex);
      return measureMelody.some(anchor => measure.chords.some(chord => noteCoveredByChord(anchor.pitch, chord)));
    }).length;

    return coveredMeasures / candidate.measures.length;
  }

  let covered = 0;
  for (const anchor of candidate.melody) {
    const measure = candidate.measures.find(item => item.measureIndex === anchor.measureIndex);
    if (measure?.chords.some(chord => noteCoveredByChord(anchor.pitch, chord))) covered++;
  }
  return covered / candidate.melody.length;
}

export function detectExpansions(candidate: HarmonizationCandidate): HarmonicExpansionIntent[] {
  const flat = candidate.measures.flatMap(measure => measure.chords);
  const functions = flat.map(chord => secondaryDominantTarget(chord, candidate.center) || isPassingDiminishedChord(chord)
    ? "OTHER"
    : classifyFunction(chord, candidate.center));
  const expansions = new Set<HarmonicExpansionIntent>();

  for (let i = 1; i < flat.length; i++) {
    if (functions[i - 1] === "T" && functions[i] === "T" && normalizeChordRoot(flat[i - 1]) !== normalizeChordRoot(flat[i])) {
      expansions.add("PROLONG_VIA_SECONDARY");
    }
    if (functions[i - 1] === "PD" && functions[i] === "PD") {
      expansions.add("SUSTAIN");
    }
    if (functions[i - 1] === "D" && functions[i] === "D") {
      expansions.add("PREPARE_NEXT_REGION");
    }
    if (functions[i - 1] === "D" && functions[i] === "T") {
      expansions.add("CADENTIAL_RESOLUTION");
    }
    const target = secondaryDominantTarget(flat[i - 1], candidate.center);
    if (target && chordMatchesRoman(flat[i], candidate.center, target)) {
      expansions.add("SECONDARY_DOMINANT_RESOLUTION");
    }
    if (diminishedPassingTarget(flat[i - 1], flat[i], candidate.center)) {
      expansions.add("DIMINISHED_PASSING_RESOLUTION");
    }
  }

  return Array.from(expansions);
}

export function countSecondaryDominantExcursions(candidate: HarmonizationCandidate): number {
  return candidate.measures
    .flatMap(measure => measure.chords)
    .filter(chord => secondaryDominantTarget(chord, candidate.center) !== null).length;
}

export function countUnresolvedSecondaryDominants(candidate: HarmonizationCandidate): number {
  const flat = candidate.measures.flatMap(measure => measure.chords);
  let unresolved = 0;

  for (let i = 0; i < flat.length; i++) {
    const target = secondaryDominantTarget(flat[i], candidate.center);
    if (!target) continue;
    const next = flat[i + 1];
    if (!next || !chordMatchesRoman(next, candidate.center, target)) unresolved++;
  }

  return unresolved;
}

export function countDiminishedPassingExcursions(candidate: HarmonizationCandidate): number {
  return candidate.measures
    .flatMap(measure => measure.chords)
    .filter(isPassingDiminishedChord).length;
}

export function countUnresolvedDiminishedPassings(candidate: HarmonizationCandidate): number {
  const flat = candidate.measures.flatMap(measure => measure.chords);
  let unresolved = 0;

  for (let i = 0; i < flat.length; i++) {
    if (!isPassingDiminishedChord(flat[i])) continue;

    const previous = flat[i - 1];
    const previousIsStable = previous
      ? (!isPassingDiminishedChord(previous) && classifyFunction(previous, candidate.center) !== "OTHER") || secondaryDominantTarget(previous, candidate.center) !== null
      : false;
    const target = diminishedPassingTarget(flat[i], flat[i + 1], candidate.center);

    if (!previousIsStable || !target) unresolved++;
  }

  return unresolved;
}

export function countInvalidChromaticEscapes(candidate: HarmonizationCandidate): number {
  const flat = candidate.measures.flatMap(measure => measure.chords);
  return flat.reduce((count, chord, index) => {
    const isChromaticEvent = classifyFunction(chord, candidate.center) === "OTHER" || isPassingDiminishedChord(chord);
    if (!isChromaticEvent) return count;
    if (secondaryDominantTarget(chord, candidate.center) !== null) return count;
    if (diminishedPassingTarget(chord, flat[index + 1], candidate.center) !== null) return count;
    const apparentFunction = analyzeApparentFunction(chord, {
      center: candidate.center,
      previousChord: flat[index - 1],
      nextChord: flat[index + 1]
    });
    if (apparentFunction && !apparentFunction.shouldCountAsFunctionalEscape) return count;
    return count + 1;
  }, 0);
}

export function bassMotionProfile(candidate: HarmonizationCandidate): HarmicBassMotion {
  const basses = candidate.measures.flatMap(measure => measure.chords).map(chord => {
    const explicitBass = chord.split("/")[1];
    return Note.chroma(explicitBass || normalizeChordRoot(chord));
  }).filter((chroma): chroma is number => chroma !== undefined);

  let up = 0;
  let down = 0;
  for (let i = 1; i < basses.length; i++) {
    const delta = (basses[i] - basses[i - 1] + 12) % 12;
    if (delta === 0) continue;
    if (delta <= 6) up++;
    else down++;
  }

  if (up > 0 && down > 0) return "MIXED";
  if (up > 0) return "ASCENDING";
  if (down > 0) return "DESCENDING";
  return "STATIC";
}

type HarmicBassMotion = HarmonicStrategyReport["bassMotionProfile"];

export function analyzeHarmonicStrategy(candidate: HarmonizationCandidate): HarmonicStrategyReport {
  const flat = candidate.measures.flatMap(measure => measure.chords);
  const functions = flat.map(chord => secondaryDominantTarget(chord, candidate.center) || isPassingDiminishedChord(chord) ? "OTHER" : classifyFunction(chord, candidate.center));
  const secondaryDominantExcursions = countSecondaryDominantExcursions(candidate);
  const unresolvedSecondaryDominants = countUnresolvedSecondaryDominants(candidate);
  const diminishedPassingExcursions = countDiminishedPassingExcursions(candidate);
  const unresolvedDiminishedPassings = countUnresolvedDiminishedPassings(candidate);
  const invalidChromaticEscapes = countInvalidChromaticEscapes(candidate);

  return {
    strategy: candidate.strategy,
    backbone: compressBackbone(functions),
    expansions: detectExpansions(candidate),
    melodyCoverage: calculateMelodyCoverage(candidate),
    functionalEscapes: invalidChromaticEscapes,
    secondaryDominantExcursions,
    unresolvedSecondaryDominants,
    diminishedPassingExcursions,
    unresolvedDiminishedPassings,
    invalidChromaticEscapes,
    chordCount: flat.length,
    bassMotionProfile: bassMotionProfile(candidate)
  };
}

export function validateHarmonicStrategy(
  candidate: HarmonizationCandidate,
  expected = STRATEGY_EXPECTATIONS[candidate.strategy]
): HarmonicStrategyValidation {
  const report = analyzeHarmonicStrategy(candidate);
  const failures: string[] = [];
  const defaultExpectation = expected === STRATEGY_EXPECTATIONS[candidate.strategy];
  const isLongMelody = candidate.measures.length > 4;
  const phraseCount = defaultExpectation && !isLongMelody ? Math.max(1, Math.ceil(candidate.measures.length / 4)) : 1;
  const minChordCount = isLongMelody ? candidate.measures.length : expected.minChordCount * phraseCount;
  const maxChordCount = isLongMelody ? expected.maxChordCount * Math.max(1, Math.ceil(candidate.measures.length / 4)) : expected.maxChordCount * phraseCount;

  if (report.strategy !== expected.strategy) failures.push("strategy-mismatch");
  if (!backboneMatchesExpectation(report.backbone, expected.backbone, candidate.measures.length)) failures.push("backbone-integrity");
  if (report.melodyCoverage < expected.melodyCoverage) failures.push("melody-coverage");
  if (report.functionalEscapes !== expected.functionalEscapes) failures.push("functional-escape");
  if (expected.unresolvedSecondaryDominants !== undefined && report.unresolvedSecondaryDominants !== expected.unresolvedSecondaryDominants) failures.push("unresolved-secondary-dominant");
  if (expected.unresolvedDiminishedPassings !== undefined && report.unresolvedDiminishedPassings !== expected.unresolvedDiminishedPassings) failures.push("unresolved-diminished-passing");
  if (expected.invalidChromaticEscapes !== undefined && report.invalidChromaticEscapes !== expected.invalidChromaticEscapes) failures.push("invalid-chromatic-escape");
  if (report.chordCount < minChordCount || report.chordCount > maxChordCount) failures.push("density-range");

  const requiredExpansions = isLongMelody
    ? expected.requiredExpansions.filter(expansion => expansion === "CADENTIAL_RESOLUTION")
    : expected.requiredExpansions;

  for (const expansion of requiredExpansions) {
    if (!report.expansions.includes(expansion)) failures.push(`missing-expansion:${expansion}`);
  }

  return {
    accepted: failures.length === 0,
    report,
    failures
  };
}
