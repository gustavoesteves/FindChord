// ──────────────────────────────────────────────────────────────
// Sprint 12B — Functional Analysis Facade (Refactored for Sprint F12)
// ──────────────────────────────────────────────────────────────

export { analyzeProgressionUnderKey } from './facade/analyzeProgressionUnderKey';
export { analyzeProgression } from './orchestrators/progressionAnalysis';
export { segmentHarmonicRegions, segmentHarmonicRegions as segmentTonalRegions } from './regions/regionSegmentation';
export { segmentPhrases } from './narrative/phraseSegmentation';
export { getRegionRank, buildHarmonicRegionTree, buildTonalRegionTree } from './regions/regionTree';
export { calculateTonalSummary } from './narrative/tonalSummary';
export { generateTonalNarrative } from './narrative/tonalNarrative';
export { analyzeFormalStructure } from './narrative/formalStructureSolver';
export type { HarmonicNodeType, HarmonicNode, HarmonicEdge, HarmonicEdgeRelation, HarmonicKnowledgeGraph } from './models/HarmonicGraph';
export { buildHarmonicKnowledgeGraph } from './narrative/knowledgeGraphBuilder';
export { HarmonicGraphEngine } from './narrative/knowledgeGraphEngine';
export * from './models/HarmonicNarrative';
export * from './models/HarmonicFingerprint';
export * from './models/FunctionalEquivalence';
export * from './models/VoiceLeadingLayer';
export * from './models/ApparentFunctionLayer';
export * from './models/Similarity';
export * from './models/Discovery';
export { generateFingerprint } from './narrative/narrativeFingerprint';
export { resolveFunctionalEquivalences } from './narrative/functionalEquivalenceEngine';
export { resolveVoiceLeadingNarrative } from './narrative/voiceLeadingNarrativeEngine';
export { resolveApparentFunctions } from './narrative/apparentFunctionsEngine';
export { generateSimilarityInsights, generateInterpretiveInsights, detectPedagogicalTransformations, generateExplainabilityReport } from './similarity/explainabilityEngine';
export { buildEvidenceGraph, findEvidenceTraces } from './similarity/evidenceGraphBuilder';
export { renderExplanation } from './similarity/narrativeRenderer';
export { compareFingerprints } from './similarity/similarityEngine';
export { DEFAULT_CORPUS } from './similarity/defaultCorpus';
export { prepareCorpus, findSimilarProgressions } from './similarity/discoveryEngine';
export { rankEvidence, attributePrimaryReason, buildCausalExplanation } from './similarity/evidenceRankingEngine';
export { ablateNode, analyzeSensitivity } from './similarity/counterfactualEngine';
export { TRANSFORMATION_TEMPLATES, detectOpportunities } from './similarity/transformationSpaceEngine';
// ──────────────────────────────────────────────────────────────



