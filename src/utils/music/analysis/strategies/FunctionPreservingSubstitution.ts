import {
  analyzeApparentFunction,
  type ApparentFunctionAnalysis
} from "./ApparentFunctionAnalysis";
import { classifyFunction, noteCoveredByChord, type StrategyFunctionId } from "./HarmonicStrategyValidator";

interface FunctionPreservingSubstitutionInput {
  center: string;
  originalChord: string;
  substituteChord: string;
  previousChord?: string;
  nextChord?: string;
  melodyPitches?: string[];
  expectedBackboneFunction?: StrategyFunctionId;
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

function effectiveFunction(chord: string, center: string, apparent?: ApparentFunctionAnalysis | null): StrategyFunctionId | "APPARENT" {
  if (apparent && !apparent.shouldCountAsFunctionalEscape && apparent.impliedFunction) return "APPARENT";
  return classifyFunction(chord, center);
}

function melodyCoverage(chord: string, melodyPitches: string[] = []): number {
  if (melodyPitches.length === 0) return 1;
  const compactChord = chord.replace(/\(([^)]+)\)/g, "$1");
  const covered = melodyPitches.filter(pitch => (
    noteCoveredByChord(pitch, chord) || noteCoveredByChord(pitch, compactChord)
  )).length;
  return covered / melodyPitches.length;
}

export function validateFunctionPreservingSubstitution(
  input: FunctionPreservingSubstitutionInput
): FunctionPreservingSubstitutionValidation {
  const apparentFunction = analyzeApparentFunction(input.substituteChord, {
    center: input.center,
    previousChord: input.previousChord,
    nextChord: input.nextChord
  });
  const originalFunction = input.expectedBackboneFunction || classifyFunction(input.originalChord, input.center);
  const substituteFunction = effectiveFunction(input.substituteChord, input.center, apparentFunction);
  const impliedFunction = substituteFunction === "APPARENT"
    ? apparentFunction?.impliedFunction
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
