import type { ScoreHarmonyEvent } from "../models/ScoreSnapshot";
import type { MelodicAnchor } from "../models/ProjectionSet";
import { analyzeReferenceHarmony } from "./ReferenceHarmonyAnalysis";
import {
  validateFunctionPreservingSubstitution,
  type FunctionPreservingSubstitutionValidation
} from "./FunctionPreservingSubstitution";
import { classifyFunction, normalizeChordRoot } from "./HarmonicStrategyValidator";

interface ControlledSubstitutionProposal {
  originalChord: string;
  substituteChord: string;
  measure: number;
  preservedFunction: "T" | "PD" | "D";
  melodyPitches: string[];
  validation: FunctionPreservingSubstitutionValidation;
  explanation: string[];
}

const SUBSTITUTION_CANDIDATES: Record<"T" | "PD" | "D", string[]> = {
  T: [],
  PD: ["#IVm7(b5)"],
  D: [],
};

function rootForSharpIvHalfDiminished(center: string): string {
  const sharpIvByCenter: Record<string, string> = {
    C: "F#",
    G: "C#",
    D: "G#",
    A: "D#",
    E: "A#",
    B: "E#",
    F: "B",
    Bb: "E",
    Eb: "A",
    Ab: "D",
    Db: "G",
    Gb: "C"
  };
  return sharpIvByCenter[center] || "F#";
}

function materializeCandidate(template: string, center: string): string {
  if (template === "#IVm7(b5)") return `${rootForSharpIvHalfDiminished(center)}m7(b5)`;
  return template;
}

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

export function generateControlledSubstitutionProposals(
  harmonies: ScoreHarmonyEvent[],
  anchors: MelodicAnchor[],
  center: string,
  maxSubstitutions = 1
): ControlledSubstitutionProposal[] {
  const reference = analyzeReferenceHarmony(harmonies);
  if (!reference.hasExistingHarmony) return [];

  const ordered = [...harmonies].sort((a, b) => a.tickStart - b.tickStart);
  const proposals: ControlledSubstitutionProposal[] = [];

  for (let i = 0; i < ordered.length; i++) {
    if (proposals.length >= maxSubstitutions) break;
    if (shouldSkipStructuralCadence(i, ordered)) continue;

    const harmony = ordered[i];
    const originalFunction = classifyFunction(harmony.harmony, center);
    if (originalFunction !== "T" && originalFunction !== "PD" && originalFunction !== "D") continue;

    const candidates = SUBSTITUTION_CANDIDATES[originalFunction]
      .map(template => materializeCandidate(template, center));
    for (const substituteChord of candidates) {
      if (normalizeChordRoot(substituteChord) === normalizeChordRoot(harmony.harmony)) continue;
      if (!preservesStructuralBass(harmony.harmony, substituteChord)) continue;

      const melodyPitches = uniquePitchesForMeasure(anchors, harmony.measure);
      const validation = validateFunctionPreservingSubstitution({
        center,
        originalChord: harmony.harmony,
        substituteChord,
        previousChord: ordered[i - 1]?.harmony,
        nextChord: ordered[i + 1]?.harmony,
        melodyPitches,
        expectedBackboneFunction: originalFunction
      });

      if (!validation.accepted) continue;

      proposals.push({
        originalChord: harmony.harmony,
        substituteChord,
        measure: harmony.measure,
        preservedFunction: originalFunction,
        melodyPitches,
        validation,
        explanation: [
          `Substitui ${harmony.harmony} por ${substituteChord}`,
          `Preserva função ${originalFunction}`,
          "Mantém compatibilidade com a melodia",
          ...validation.evidence
        ]
      });
      break;
    }
  }

  return proposals;
}
