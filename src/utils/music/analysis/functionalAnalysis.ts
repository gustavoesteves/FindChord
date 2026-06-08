// ──────────────────────────────────────────────────────────────
// Sprint 12B — Functional Analysis Facade (Refactored)
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
// ──────────────────────────────────────────────────────────────

