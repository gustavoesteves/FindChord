import { Note } from "tonal";
import {
  evaluateVoiceLeadingTransition,
  type VoiceLeadingTransitionReport
} from "./VoiceLeadingTransitionEvaluator";
import {
  classifyFunctionInMode,
  normalizeChordRoot,
  type FunctionalClassificationMode,
  type StrategyFunctionId
} from "./HarmonicStrategyValidator";

export interface HarmonicRouteDistanceInput {
  chords: string[];
  center: string;
  classificationMode?: FunctionalClassificationMode;
}

export type HarmonicRouteProfile = "conservative" | "moderate" | "chromatic" | "radical";

export interface HarmonicRouteStep {
  from: string;
  to: string;
  fromFunction: StrategyFunctionId;
  toFunction: StrategyFunctionId;
  voiceLeading: VoiceLeadingTransitionReport;
  cost: number;
  evidence: string[];
}

export interface HarmonicRouteDistanceReport {
  cost: number;
  profile: HarmonicRouteProfile;
  transitionCount: number;
  averageVoiceLeadingScore: number;
  functionalPenalty: number;
  chromaticPenalty: number;
  unresolvedPenalty: number;
  steps: HarmonicRouteStep[];
  evidence: string[];
}

function rootDistance(fromChord: string, toChord: string): number {
  const fromChroma = Note.chroma(normalizeChordRoot(fromChord));
  const toChroma = Note.chroma(normalizeChordRoot(toChord));
  if (fromChroma === undefined || toChroma === undefined) return 6;
  const up = (toChroma - fromChroma + 12) % 12;
  const down = (fromChroma - toChroma + 12) % 12;
  return Math.min(up, down);
}

function rootDegree(chord: string, center: string): number | null {
  const rootChroma = Note.chroma(normalizeChordRoot(chord));
  const centerChroma = Note.chroma(center);
  if (rootChroma === undefined || centerChroma === undefined) return null;
  return (rootChroma - centerChroma + 12) % 12;
}

function isDiatonicFunctionalRoot(
  chord: string,
  center: string,
  mode: FunctionalClassificationMode,
  functionId: StrategyFunctionId
): boolean {
  if (functionId !== "OTHER") return true;
  const degree = rootDegree(chord, center);
  if (degree === null) return false;
  if (mode === "minor-functional") {
    return [0, 2, 3, 5, 7, 8, 9, 10, 11].includes(degree);
  }
  return [0, 2, 4, 5, 7, 9, 11].includes(degree);
}

function functionalPenalty(fromFunction: StrategyFunctionId, toFunction: StrategyFunctionId): number {
  if (fromFunction === "OTHER" || toFunction === "OTHER") return 1.5;
  if (fromFunction === toFunction) return 0.35;
  if (fromFunction === "T" && toFunction === "D") return 0.9;
  if (fromFunction === "D" && toFunction === "PD") return 1.2;
  return 0;
}

function rootMotionPenalty(fromChord: string, toChord: string): number {
  const distance = rootDistance(fromChord, toChord);
  if (distance <= 2 || distance === 5) return 0;
  if (distance === 6) return 0.7;
  return 0.3;
}

function chromaticPenalty(
  fromChord: string,
  toChord: string,
  center: string,
  mode: FunctionalClassificationMode,
  fromFunction: StrategyFunctionId,
  toFunction: StrategyFunctionId
): number {
  const fromInField = isDiatonicFunctionalRoot(fromChord, center, mode, fromFunction);
  const toInField = isDiatonicFunctionalRoot(toChord, center, mode, toFunction);
  if (fromInField && toInField) return 0;

  return rootMotionPenalty(fromChord, toChord);
}

function hasAlteredDominantColor(chord: string): boolean {
  const symbol = chord.split("/")[0];
  if (!/(?:^|[^a-z])7|9|11|13|alt/i.test(symbol)) return false;
  return /alt|b9|#9|#11|b13|#5|b5/i.test(symbol);
}

function stepEvidence(step: HarmonicRouteStep, center: string, mode: FunctionalClassificationMode): string[] {
  const evidence: string[] = [];
  if (step.fromFunction === "OTHER" || step.toFunction === "OTHER") {
    evidence.push("rota atravessa evento sem função tonal direta");
  }
  if (step.voiceLeading.guideToneResolutionCount > 0) {
    evidence.push("rota ganha clareza por resolução de guide tones");
  }
  if (step.voiceLeading.unresolvedTendencyCount > 0) {
    evidence.push("rota encarece por tendência não resolvida");
  }
  if (step.voiceLeading.commonToneCount > 0) {
    evidence.push("rota preserva notas comuns");
  }
  if (chromaticPenalty(step.from, step.to, center, mode, step.fromFunction, step.toFunction) > 0) {
    evidence.push("rota usa salto cromático/raiz distante");
  }
  if (hasAlteredDominantColor(step.from) || hasAlteredDominantColor(step.to)) {
    evidence.push("rota usa cor dominante alterada");
  }
  return evidence;
}

function routeProfileLabel(profile: HarmonicRouteProfile): string {
  if (profile === "conservative") return "rota conservadora";
  if (profile === "moderate") return "rota moderada";
  if (profile === "chromatic") return "rota cromática";
  return "rota radical";
}

function classifyRouteProfile(input: {
  cost: number;
  transitionCount: number;
  functionalPenalty: number;
  chromaticPenalty: number;
  unresolvedPenalty: number;
  hasChromaticResolution: boolean;
}): HarmonicRouteProfile {
  if (input.transitionCount === 0) return "conservative";

  const averageCost = input.cost / input.transitionCount;
  if (
    averageCost <= 1.8
    && input.chromaticPenalty === 0
    && input.unresolvedPenalty === 0
    && input.functionalPenalty <= 0.7
  ) {
    return "conservative";
  }

  if (input.hasChromaticResolution && averageCost <= 3.2) {
    return "chromatic";
  }

  if (
    averageCost <= 2.8
    && input.chromaticPenalty <= 0.7
    && (input.unresolvedPenalty === 0 || input.functionalPenalty === 0)
  ) {
    return "moderate";
  }

  if (
    input.chromaticPenalty > 0
    && input.unresolvedPenalty <= 1
    && averageCost <= 4.2
  ) {
    return "chromatic";
  }

  return "radical";
}

export function evaluateHarmonicRouteDistance(
  input: HarmonicRouteDistanceInput
): HarmonicRouteDistanceReport {
  const mode = input.classificationMode || "major-functional";
  const steps: HarmonicRouteStep[] = [];

  for (let i = 0; i < input.chords.length - 1; i++) {
    const from = input.chords[i];
    const to = input.chords[i + 1];
    const fromFunction = classifyFunctionInMode(from, input.center, mode);
    const toFunction = classifyFunctionInMode(to, input.center, mode);
    const voiceLeading = evaluateVoiceLeadingTransition({
      previousChord: from,
      nextChord: to,
      center: input.center
    });
    const fnPenalty = functionalPenalty(fromFunction, toFunction);
    const motionPenalty = rootMotionPenalty(from, to);
    const unresolvedPenalty = voiceLeading.unresolvedTendencyCount * 1.4;
    const leapPenalty = voiceLeading.excessiveLeapCount * 0.45;
    const voiceLeadingCredit = Math.min(voiceLeading.score, 7) * 0.28;
    const cost = Math.max(0, 2 + fnPenalty + motionPenalty + unresolvedPenalty + leapPenalty - voiceLeadingCredit);
    const step: HarmonicRouteStep = {
      from,
      to,
      fromFunction,
      toFunction,
      voiceLeading,
      cost: Number(cost.toFixed(2)),
      evidence: []
    };
    step.evidence = stepEvidence(step, input.center, mode);
    steps.push(step);
  }

  const totalCost = steps.reduce((sum, step) => sum + step.cost, 0);
  const transitionCount = steps.length;
  const averageVoiceLeadingScore = transitionCount === 0
    ? 0
    : steps.reduce((sum, step) => sum + step.voiceLeading.score, 0) / transitionCount;
  const totalFunctionalPenalty = steps.reduce((sum, step) => sum + functionalPenalty(step.fromFunction, step.toFunction), 0);
  const totalChromaticPenalty = steps.reduce(
    (sum, step) => sum + chromaticPenalty(step.from, step.to, input.center, mode, step.fromFunction, step.toFunction),
    0
  );
  const totalProfileMotionPenalty = steps.reduce((sum, step) => sum + rootMotionPenalty(step.from, step.to), 0);
  const totalUnresolvedPenalty = steps.reduce((sum, step) => sum + step.voiceLeading.unresolvedTendencyCount, 0);
  const cost = Number(totalCost.toFixed(2));
  const functionalPenaltyTotal = Number(totalFunctionalPenalty.toFixed(2));
  const chromaticPenaltyTotal = Number(totalChromaticPenalty.toFixed(2));
  const profileMotionPenaltyTotal = Number(totalProfileMotionPenalty.toFixed(2));
  const hasChromaticResolution = steps.some(step => (
    [...step.evidence, ...step.voiceLeading.evidence].some(evidence => /SubV7|cromática|cromático/i.test(evidence))
  ));
  const profile = classifyRouteProfile({
    cost,
    transitionCount,
    functionalPenalty: functionalPenaltyTotal,
    chromaticPenalty: profileMotionPenaltyTotal,
    unresolvedPenalty: totalUnresolvedPenalty,
    hasChromaticResolution
  });
  const evidence = [
    routeProfileLabel(profile),
    ...Array.from(new Set(steps.flatMap(step => step.evidence)))
  ].slice(0, 4);

  return {
    cost,
    profile,
    transitionCount,
    averageVoiceLeadingScore: Number(averageVoiceLeadingScore.toFixed(2)),
    functionalPenalty: functionalPenaltyTotal,
    chromaticPenalty: chromaticPenaltyTotal,
    unresolvedPenalty: totalUnresolvedPenalty,
    steps,
    evidence
  };
}
