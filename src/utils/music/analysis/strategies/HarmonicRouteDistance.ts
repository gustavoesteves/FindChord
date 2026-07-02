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

function functionalPenalty(fromFunction: StrategyFunctionId, toFunction: StrategyFunctionId): number {
  if (fromFunction === "OTHER" || toFunction === "OTHER") return 1.5;
  if (fromFunction === toFunction) return 0.35;
  if (fromFunction === "T" && toFunction === "D") return 0.9;
  if (fromFunction === "D" && toFunction === "PD") return 1.2;
  return 0;
}

function chromaticPenalty(fromChord: string, toChord: string): number {
  const distance = rootDistance(fromChord, toChord);
  if (distance <= 2 || distance === 5) return 0;
  if (distance === 6) return 0.7;
  return 0.3;
}

function stepEvidence(step: HarmonicRouteStep): string[] {
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
  if (chromaticPenalty(step.from, step.to) > 0) {
    evidence.push("rota usa salto cromático/raiz distante");
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
    const chrPenalty = chromaticPenalty(from, to);
    const unresolvedPenalty = voiceLeading.unresolvedTendencyCount * 1.4;
    const leapPenalty = voiceLeading.excessiveLeapCount * 0.45;
    const voiceLeadingCredit = Math.min(voiceLeading.score, 7) * 0.28;
    const cost = Math.max(0, 2 + fnPenalty + chrPenalty + unresolvedPenalty + leapPenalty - voiceLeadingCredit);
    const step: HarmonicRouteStep = {
      from,
      to,
      fromFunction,
      toFunction,
      voiceLeading,
      cost: Number(cost.toFixed(2)),
      evidence: []
    };
    step.evidence = stepEvidence(step);
    steps.push(step);
  }

  const totalCost = steps.reduce((sum, step) => sum + step.cost, 0);
  const transitionCount = steps.length;
  const averageVoiceLeadingScore = transitionCount === 0
    ? 0
    : steps.reduce((sum, step) => sum + step.voiceLeading.score, 0) / transitionCount;
  const totalFunctionalPenalty = steps.reduce((sum, step) => sum + functionalPenalty(step.fromFunction, step.toFunction), 0);
  const totalChromaticPenalty = steps.reduce((sum, step) => sum + chromaticPenalty(step.from, step.to), 0);
  const totalUnresolvedPenalty = steps.reduce((sum, step) => sum + step.voiceLeading.unresolvedTendencyCount, 0);
  const cost = Number(totalCost.toFixed(2));
  const functionalPenaltyTotal = Number(totalFunctionalPenalty.toFixed(2));
  const chromaticPenaltyTotal = Number(totalChromaticPenalty.toFixed(2));
  const hasChromaticResolution = steps.some(step => (
    [...step.evidence, ...step.voiceLeading.evidence].some(evidence => /SubV7|cromática|cromático/i.test(evidence))
  ));
  const profile = classifyRouteProfile({
    cost,
    transitionCount,
    functionalPenalty: functionalPenaltyTotal,
    chromaticPenalty: chromaticPenaltyTotal,
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
