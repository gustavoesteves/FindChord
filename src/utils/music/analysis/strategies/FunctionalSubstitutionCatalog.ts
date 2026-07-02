import { Note } from "tonal";
import type { StrategyFunctionId } from "./HarmonicStrategyValidator";

export type FunctionalSubstitutionId =
  | "TONIC_RELATIVE_MINOR"
  | "TONIC_MEDIANT"
  | "PREDOMINANT_SUPERTONIC"
  | "PREDOMINANT_SHARP_IV_HALF_DIMINISHED"
  | "DOMINANT_SUSPENDED"
  | "DOMINANT_TRITONE_SUBSTITUTE"
  | "MINOR_TONIC_RELATIVE_MAJOR"
  | "MINOR_PREDOMINANT_HALF_DIMINISHED"
  | "MINOR_DOMINANT_ALTERED";

export type FunctionalSubstitutionIdiom =
  | "major-functional"
  | "minor-functional"
  | "modal"
  | "blues";

export interface FunctionalSubstitutionCandidate {
  id: FunctionalSubstitutionId;
  functionId: Exclude<StrategyFunctionId, "OTHER">;
  template: string;
  chord: string;
  idiom: FunctionalSubstitutionIdiom;
  explanation: string;
}

interface FunctionalSubstitutionTemplate {
  id: FunctionalSubstitutionId;
  functionId: Exclude<StrategyFunctionId, "OTHER">;
  template: string;
  idiom: FunctionalSubstitutionIdiom;
  explanation: string;
  materialize: (center: string) => string;
}

function pitch(center: string, interval: string): string {
  return Note.pitchClass(Note.transpose(`${center}4`, interval)) || center;
}

function sharpIvHalfDiminished(center: string): string {
  const root = pitch(center, "4A");
  return `${root}m7(b5)`;
}

const SUBSTITUTION_TABLE: FunctionalSubstitutionTemplate[] = [
  {
    id: "TONIC_RELATIVE_MINOR",
    functionId: "T",
    template: "vi",
    idiom: "major-functional",
    explanation: "relativo menor prolonga a região de repouso",
    materialize: center => `${pitch(center, "6M")}m`
  },
  {
    id: "TONIC_MEDIANT",
    functionId: "T",
    template: "iii",
    idiom: "major-functional",
    explanation: "mediante preserva repouso com cor mais leve",
    materialize: center => `${pitch(center, "3M")}m`
  },
  {
    id: "PREDOMINANT_SUPERTONIC",
    functionId: "PD",
    template: "ii",
    idiom: "major-functional",
    explanation: "supertonico menor preserva preparação predominante",
    materialize: center => `${pitch(center, "2M")}m`
  },
  {
    id: "PREDOMINANT_SHARP_IV_HALF_DIMINISHED",
    functionId: "PD",
    template: "#IVm7(b5)",
    idiom: "major-functional",
    explanation: "#IVm7(b5) intensifica a região subdominante",
    materialize: sharpIvHalfDiminished
  },
  {
    id: "DOMINANT_SUSPENDED",
    functionId: "D",
    template: "V7sus4",
    idiom: "major-functional",
    explanation: "dominante suspenso preserva tensão cadencial",
    materialize: center => `${pitch(center, "5P")}7sus4`
  },
  {
    id: "DOMINANT_TRITONE_SUBSTITUTE",
    functionId: "D",
    template: "SubV7",
    idiom: "major-functional",
    explanation: "SubV7 preserva impulso dominante com baixo cromatico",
    materialize: center => `${pitch(center, "2m")}7`
  },
  {
    id: "MINOR_TONIC_RELATIVE_MAJOR",
    functionId: "T",
    template: "bIII",
    idiom: "minor-functional",
    explanation: "relativo maior prolonga repouso menor",
    materialize: center => pitch(center, "3m")
  },
  {
    id: "MINOR_PREDOMINANT_HALF_DIMINISHED",
    functionId: "PD",
    template: "iiø",
    idiom: "minor-functional",
    explanation: "ii meio-diminuto prepara dominante em menor",
    materialize: center => `${pitch(center, "2M")}m7(b5)`
  },
  {
    id: "MINOR_DOMINANT_ALTERED",
    functionId: "D",
    template: "V7b13",
    idiom: "minor-functional",
    explanation: "dominante alterada preserva tensão cadencial menor",
    materialize: center => `${pitch(center, "5P")}7b13`
  }
];

export function functionalSubstitutionsFor(
  functionId: Exclude<StrategyFunctionId, "OTHER">,
  center: string,
  idiom: FunctionalSubstitutionIdiom = "major-functional"
): FunctionalSubstitutionCandidate[] {
  return SUBSTITUTION_TABLE
    .filter(candidate => candidate.functionId === functionId && candidate.idiom === idiom)
    .map(candidate => ({
      id: candidate.id,
      functionId: candidate.functionId,
      template: candidate.template,
      chord: candidate.materialize(center),
      idiom: candidate.idiom,
      explanation: candidate.explanation
    }));
}

export function allFunctionalSubstitutions(
  center: string,
  idiom?: FunctionalSubstitutionIdiom
): FunctionalSubstitutionCandidate[] {
  return SUBSTITUTION_TABLE
    .filter(candidate => !idiom || candidate.idiom === idiom)
    .map(candidate => ({
    id: candidate.id,
    functionId: candidate.functionId,
    template: candidate.template,
    chord: candidate.materialize(center),
    idiom: candidate.idiom,
    explanation: candidate.explanation
  }));
}
