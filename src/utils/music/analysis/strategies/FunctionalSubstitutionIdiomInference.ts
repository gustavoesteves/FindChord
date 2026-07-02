import type { FunctionalSubstitutionIdiom } from "./FunctionalSubstitutionCatalog";
import { classifyHarmonicIdiom } from "./HarmonicIdiomClassifier";

export interface FunctionalSubstitutionIdiomInference {
  idiom: FunctionalSubstitutionIdiom;
  confidence: "strong" | "medium" | "weak";
  evidence: string[];
}

export function inferFunctionalSubstitutionIdiom(
  chords: string[],
  center: string
): FunctionalSubstitutionIdiomInference {
  const classification = classifyHarmonicIdiom(chords, center);
  return {
    idiom: classification.idiom as FunctionalSubstitutionIdiom,
    confidence: classification.confidence,
    evidence: classification.evidence
  };
}
