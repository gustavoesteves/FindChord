import type { ScoreHarmonyEvent } from "../models/ScoreSnapshot";
import type { MelodicAnchor } from "../models/ProjectionSet";
import { analyzeReferenceHarmony } from "./ReferenceHarmonyAnalysis";
import {
  validateFunctionPreservingSubstitution,
  type FunctionPreservingSubstitutionValidation
} from "./FunctionPreservingSubstitution";
import {
  functionalSubstitutionsFor,
  type FunctionalSubstitutionCandidate,
  type FunctionalSubstitutionIdiom
} from "./FunctionalSubstitutionCatalog";
import { inferFunctionalSubstitutionIdiom } from "./FunctionalSubstitutionIdiomInference";
import { classifyFunction, normalizeChordRoot } from "./HarmonicStrategyValidator";

interface ControlledSubstitutionProposal {
  originalChord: string;
  substituteChord: string;
  measure: number;
  preservedFunction: "T" | "PD" | "D";
  substitution: FunctionalSubstitutionCandidate;
  melodyPitches: string[];
  validation: FunctionPreservingSubstitutionValidation;
  idiom: FunctionalSubstitutionIdiom;
  explanation: string[];
}

export type FunctionalSubstitutionIdiomRequest = FunctionalSubstitutionIdiom | "auto";

function uniquePitchesForMeasure(anchors: MelodicAnchor[], measure: number): string[] {
  return Array.from(new Set(anchors
    .filter(anchor => anchor.measureIndex === measure)
    .map(anchor => anchor.pitch)));
}

function shouldSkipStructuralCadence(index: number, harmonies: ScoreHarmonyEvent[]): boolean {
  return index === 0 || index === harmonies.length - 1;
}

function preservesStructuralBass(originalChord: string, substituteChord: string): boolean {
  const originalBass = originalChord.split("/")[1];
  const substituteBass = substituteChord.split("/")[1];
  if (!originalBass) return true;
  return originalBass === substituteBass;
}

function describeFunction(fn: "T" | "PD" | "D"): string {
  if (fn === "T") return "repouso";
  if (fn === "PD") return "preparação";
  return "tensão dominante";
}

function musicalEvidence(evidence: string[], preservedFunction: "T" | "PD" | "D"): string[] {
  return evidence.filter(item => item !== `preserva função ${preservedFunction}`);
}

export function generateControlledSubstitutionProposals(
  harmonies: ScoreHarmonyEvent[],
  anchors: MelodicAnchor[],
  center: string,
  maxSubstitutions = 1,
  idiom: FunctionalSubstitutionIdiomRequest = "auto"
): ControlledSubstitutionProposal[] {
  const reference = analyzeReferenceHarmony(harmonies);
  if (!reference.hasExistingHarmony) return [];

  const ordered = [...harmonies].sort((a, b) => a.tickStart - b.tickStart);
  const inferred = inferFunctionalSubstitutionIdiom(ordered.map(harmony => harmony.harmony), center);
  const effectiveIdiom = idiom === "auto" ? inferred.idiom : idiom;
  const proposals: ControlledSubstitutionProposal[] = [];

  for (let i = 0; i < ordered.length; i++) {
    if (proposals.length >= maxSubstitutions) break;
    if (shouldSkipStructuralCadence(i, ordered)) continue;

    const harmony = ordered[i];
    const originalFunction = classifyFunction(harmony.harmony, center);
    if (originalFunction !== "T" && originalFunction !== "PD" && originalFunction !== "D") continue;

    const melodyPitches = uniquePitchesForMeasure(anchors, harmony.measure);
    if (melodyPitches.length === 0) continue;

    const candidates = functionalSubstitutionsFor(originalFunction, center, effectiveIdiom);
    for (const substitution of candidates) {
      const substituteChord = substitution.chord;
      if (normalizeChordRoot(substituteChord) === normalizeChordRoot(harmony.harmony)) continue;
      if (!preservesStructuralBass(harmony.harmony, substituteChord)) continue;

      const validation = validateFunctionPreservingSubstitution({
        center,
        originalChord: harmony.harmony,
        substituteChord,
        previousChord: ordered[i - 1]?.harmony,
        nextChord: ordered[i + 1]?.harmony,
        melodyPitches,
        expectedBackboneFunction: originalFunction,
        classificationMode: effectiveIdiom === "minor-functional" ? "minor-functional" : "major-functional"
      });

      if (!validation.accepted) continue;

      proposals.push({
        originalChord: harmony.harmony,
        substituteChord,
        measure: harmony.measure,
        preservedFunction: originalFunction,
        substitution,
        melodyPitches,
        validation,
        idiom: effectiveIdiom,
        explanation: [
          `Substitui ${harmony.harmony} por ${substituteChord}`,
          `Preserva a função de ${describeFunction(originalFunction)}`,
          "Mantém compatibilidade com a melodia",
          substitution.explanation,
          ...musicalEvidence(validation.evidence, originalFunction)
        ]
      });
      break;
    }
  }

  return proposals;
}
