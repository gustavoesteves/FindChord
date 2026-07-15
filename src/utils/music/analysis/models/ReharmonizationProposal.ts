import type { HarmonicDiagnostic } from "./HarmonicDiagnostic";

export interface ReharmonizationMeasure {
  measureIndex: number;
  chords: string[];
}

export type ReharmonizationProposalKind =
  | "reference"
  | "validated-harmonization"
  | "controlled-reharmonization"
  | "experimental-exploration";

export type ReharmonizationRouteProfile = "conservative" | "moderate" | "chromatic" | "radical";
export type ReharmonizationPresentationRole = "primary" | "alternative" | "comparative" | "adventurous";
export type ReharmonizationPresentationLayer = "basic" | "reference-aware" | "reharmonization";
export type ReharmonizationBoldnessMode = "simple" | "balanced" | "exploratory";
export type ReharmonizationInputContext =
  | "melody-only"
  | "melody-with-reference-harmony"
  | "harmony-only-analysis";
export type ReharmonizationReferenceRelation =
  | "reference-original"
  | "reference-rhythm-preserved"
  | "reference-close"
  | "reference-functional-variation"
  | "melody-derived-alternative"
  | "harmony-only-reading";
export type ReharmonizationBassLineProfile =
  | "stepwise"
  | "chromatic"
  | "pedal"
  | "functional"
  | "leaping"
  | "mixed";
export type ReharmonizationHarmonicIdiom =
  | "major-functional"
  | "minor-functional"
  | "modal"
  | "blues";
export type ReharmonizationHarmonicBoundary =
  | "minor-functional-cadential"
  | "modal-center";

export interface ReharmonizationProposal {
  id: string;
  kind: ReharmonizationProposalKind;
  name: string;
  measures: ReharmonizationMeasure[];
  explanation: string[];
  bassLine: string[];
  voiceLeadingScore?: number;
  voiceLeadingEvidence?: string[];
  apparentFunctionReferenceBonus?: number;
  referenceFunctionAgreement?: number;
  referenceRootAgreement?: number;
  bassLineProfile?: ReharmonizationBassLineProfile;
  bassLineEvidence?: string[];
  bassLineRankBonus?: number;
  routeDistanceCost?: number;
  routeProfile?: ReharmonizationRouteProfile;
  routeDistanceEvidence?: string[];
  temporalCoverageRatio?: number;
  temporalCoveragePenalty?: number;
  unsupportedChromaticPenalty?: number;
  chromaticLegibilityPenalty?: number;
  directedChromaticRankBonus?: number;
  dominantTensionRankBonus?: number;
  unsupportedDominantTensionPenalty?: number;
  presentationRole?: ReharmonizationPresentationRole;
  presentationLayer?: ReharmonizationPresentationLayer;
  inputContext?: ReharmonizationInputContext;
  referenceRelation?: ReharmonizationReferenceRelation;
  harmonicIdiom?: ReharmonizationHarmonicIdiom;
  harmonicBoundary?: ReharmonizationHarmonicBoundary;
  cadentialTarget?: string;
  diagnostics?: HarmonicDiagnostic[];
  colorVariants?: ReharmonizationProposal[];
}
