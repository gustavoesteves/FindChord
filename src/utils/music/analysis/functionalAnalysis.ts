// ──────────────────────────────────────────────────────────────
// Sprint 12B — Functional Analysis Facade (Refactored)
// ──────────────────────────────────────────────────────────────

export { analyzeProgressionUnderKey } from './facade/analyzeProgressionUnderKey';
export { analyzeProgression } from './orchestrators/progressionAnalysis';
export { segmentTonalRegions } from './regions/regionSegmentation';
export { segmentPhrases } from './narrative/phraseSegmentation';
export { getRegionRank, buildTonalRegionTree } from './regions/regionTree';
export { calculateTonalSummary } from './narrative/tonalSummary';
export { generateTonalNarrative } from './narrative/tonalNarrative';
