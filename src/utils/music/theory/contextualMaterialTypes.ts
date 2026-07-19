import type { MelodicAnchor } from "../analysis/models/ProjectionSet";
import type { MaterialSourceMap } from "./musicTheory";

export type ContextualMaterialRole = "primary" | "color" | "resolution";
export type ContextualHarmonicFunction = "tonic" | "predominant" | "dominant" | "modal" | "color";
export type ContextualMaterialIntent = "inside" | "functional" | "tension" | "outside";
export type ContextualMelodicFit = "aligned" | "neutral" | "caution";
export type MelodySupportRole = "guide-tone" | "resolution-target" | "passing-tone" | "linear-fragment";

export interface MaterialContext {
  chord: string;
  previousChord?: string;
  nextChord?: string;
  tonalCenter?: { tonic: string; mode: "major" | "minor" };
  melody?: MelodicAnchor[] | string[];
  resolutionTarget?: string;
}

export interface WeightedMelodyNote {
  pitch: string;
  weight: number;
}

export interface MaterialRankingEvidence {
  compatibilityPrior: number;
  melodySupport: number;
  chordToneCoverage: number;
  resolutionSupport: number;
  avoidNotePenalty: number;
  melodicFitAdjustment: number;
}

export interface ContextualMelodicMaterial {
  label: string;
  source: "scale" | "guide-tones" | "arpeggio" | "chromatic-approach" | "pentatonic";
  sourceScale?: string;
  cells: string[];
  tensionProfile: string[];
  resolutionTargets: string[];
  practiceHint: string;
}

export interface ContextualMaterialCandidate extends MaterialSourceMap {
  chord: string;
  role: ContextualMaterialRole;
  intent: ContextualMaterialIntent;
  harmonicFunction: ContextualHarmonicFunction;
  chordTones: string[];
  supportedTensions: string[];
  passingNotes: string[];
  avoidNotes: string[];
  melodyNotes: string[];
  melodyMatches: string[];
  melodySupportRoles: Record<string, MelodySupportRole[]>;
  melodyCoverage: number;
  resolutionTarget?: string;
  rankingEvidence: MaterialRankingEvidence;
  confidence: number;
  explanation: string;
  practiceHint: string;
  guideTones: string[];
  guideToneTargets: string[];
  guideToneResolutions: string[];
  linearFragments: string[];
  melodicMaterials: ContextualMelodicMaterial[];
  melodicFit: ContextualMelodicFit;
}
