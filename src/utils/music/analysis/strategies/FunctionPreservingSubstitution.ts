import {
  analyzeApparentFunction,
  type ApparentFunctionAnalysis
} from "./ApparentFunctionAnalysis";
import { Note } from "tonal";
import {
  classifyFunctionInMode,
  noteCoveredByChord,
  type FunctionalClassificationMode,
  type StrategyFunctionId
} from "./HarmonicStrategyValidator";

interface FunctionPreservingSubstitutionInput {
  center: string;
  originalChord: string;
  substituteChord: string;
  previousChord?: string;
  nextChord?: string;
  melodyPitches?: string[];
  expectedBackboneFunction?: StrategyFunctionId;
  classificationMode?: FunctionalClassificationMode;
}

export interface FunctionPreservingSubstitutionValidation {
  accepted: boolean;
  originalFunction: StrategyFunctionId;
  substituteFunction: StrategyFunctionId | "APPARENT";
  impliedFunction?: StrategyFunctionId;
  apparentFunction?: ApparentFunctionAnalysis;
  melodyCoverage: number;
  failures: string[];
  evidence: string[];
}

function effectiveFunction(
  chord: string,
  center: string,
  mode: FunctionalClassificationMode,
  apparent?: ApparentFunctionAnalysis | null
): StrategyFunctionId | "APPARENT" {
  if (apparent && !apparent.shouldCountAsFunctionalEscape && apparent.impliedFunction) return "APPARENT";
  return classifyFunctionInMode(chord, center, mode);
}

function melodyCoverage(chord: string, melodyPitches: string[] = []): number {
  if (melodyPitches.length === 0) return 1;
  const compactChord = chord.replace(/\(([^)]+)\)/g, "$1");
  const covered = melodyPitches.filter(pitch => (
    noteCoveredByChord(pitch, chord) || noteCoveredByChord(pitch, compactChord)
  )).length;
  return covered / melodyPitches.length;
}

function isResolvedSubV7(substituteChord: string, nextChord: string | undefined, center: string): boolean {
  if (!nextChord) return false;

  const substituteRoot = substituteChord.match(/^[A-G](?:#|b)?/)?.[0];
  const nextRoot = nextChord.match(/^[A-G](?:#|b)?/)?.[0];
  if (!substituteRoot || !nextRoot) return false;

  const substituteChroma = Note.chroma(substituteRoot);
  const nextChroma = Note.chroma(nextRoot);
  const centerChroma = Note.chroma(center);
  if (substituteChroma === undefined || nextChroma === undefined || centerChroma === undefined) return false;

  return nextChroma === centerChroma && (substituteChroma - nextChroma + 12) % 12 === 1 && /7/.test(substituteChord);
}

export function validateFunctionPreservingSubstitution(
  input: FunctionPreservingSubstitutionInput
): FunctionPreservingSubstitutionValidation {
  const apparentFunction = analyzeApparentFunction(input.substituteChord, {
    center: input.center,
    previousChord: input.previousChord,
    nextChord: input.nextChord
  });
  const classificationMode = input.classificationMode || "major-functional";
  const originalFunction = input.expectedBackboneFunction || classifyFunctionInMode(input.originalChord, input.center, classificationMode);
  const substituteFunction = isResolvedSubV7(input.substituteChord, input.nextChord, input.center)
    ? "APPARENT"
    : effectiveFunction(input.substituteChord, input.center, classificationMode, apparentFunction);
  const impliedFunction = substituteFunction === "APPARENT"
    ? apparentFunction?.impliedFunction || (isResolvedSubV7(input.substituteChord, input.nextChord, input.center) ? "D" : undefined)
    : substituteFunction;
  const coverage = melodyCoverage(input.substituteChord, input.melodyPitches);
  const failures: string[] = [];
  const evidence: string[] = [];

  if (originalFunction === "OTHER") failures.push("original-function-unknown");
  if (!impliedFunction || impliedFunction === "OTHER") failures.push("substitute-function-unknown");
  if (impliedFunction && originalFunction !== "OTHER" && impliedFunction !== originalFunction) failures.push("function-changed");
  if (apparentFunction?.shouldCountAsFunctionalEscape) failures.push("apparent-function-unresolved");
  if (coverage < 1) failures.push("melody-compatibility");

  if (apparentFunction && !apparentFunction.shouldCountAsFunctionalEscape) {
    evidence.push(...apparentFunction.evidence);
  }
  if (isResolvedSubV7(input.substituteChord, input.nextChord, input.center)) {
    evidence.push("SubV7 resolve cromaticamente no centro tonal");
  }
  if (coverage === 1) evidence.push("substituto cobre as notas melódicas exigidas");
  if (impliedFunction === originalFunction && originalFunction !== "OTHER") {
    evidence.push(`preserva função ${originalFunction}`);
  }

  return {
    accepted: failures.length === 0,
    originalFunction,
    substituteFunction,
    impliedFunction,
    apparentFunction: apparentFunction || undefined,
    melodyCoverage: Number(coverage.toFixed(3)),
    failures,
    evidence
  };
}
