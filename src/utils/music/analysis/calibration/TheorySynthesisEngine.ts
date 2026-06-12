import type { TheoryCandidate } from '../models/TheoryCandidate';
import type { FunctionalAnalysis } from '../models/FunctionalAnalysis';
import { EvolutionHistoryStore } from './EvolutionHistoryStore';
import { evaluateTheoryFitness } from './TheorySelectionEngine';

// Verification function for synthesis compatibility:
// Complementarity > 0.60 and Similarity < 0.80
export function canMerge(
  complementarity: number,
  similarity: number
): boolean {
  return complementarity > 0.60 && similarity < 0.80;
}

// Merges two complementary candidates if they satisfy the TCG complexity constraint:
// TCG_merged >= 0.90 * max(TCG_A, TCG_B)
export function mergeTheories(
  A: TheoryCandidate,
  B: TheoryCandidate,
  tcgA: number,
  tcgB: number,
  analyses: FunctionalAnalysis[],
  historyStore: EvolutionHistoryStore,
  clusterAvgTAS: number
): TheoryCandidate | null {
  // 1. Combine prototype chords and properties
  const prototypeChords = Array.from(new Set([...A.prototypeChords, ...B.prototypeChords]));
  const properties = Array.from(new Set([...A.properties, ...B.properties]));

  const mergedId = `candidate_hybrid_${A.id}_${B.id}`;
  const mergedCandidate: TheoryCandidate = {
    id: mergedId,
    name: 'Teoria Híbrida Sintética',
    stage: 'THEORY_CANDIDATE',
    prototypeChords,
    properties,
    description: `Teoria híbrida gerada através da fusão evolutiva de seus ancestrais: "${A.name}" e "${B.name}".`,
    metrics: {
      tcs: 0.88,
      tri: 0.92,
      gs: 0.9802,
      egsw: 0.0, // will compute below
      ns: 0.88,
      tms: 0.0  // will compute below
    },
    parents: [A.id, B.id],
    family: 'HYBRID'
  };

  // 2. Evaluate fitness of the merged candidate
  const clusterSize = prototypeChords.length * 2 + 10; // estimate cluster size based on prototypes
  const fitness = evaluateTheoryFitness(mergedCandidate, analyses, historyStore, clusterAvgTAS, clusterSize);

  // Constraint check: TCG_merged >= 0.90 * max(tcgA, tcgB)
  const maxParentTCG = Math.max(tcgA, tcgB);
  if (fitness.tcg < 0.90 * maxParentTCG) {
    // Fails the complexity control constraint! Return null
    return null;
  }

  // Calculate EGS_w and TMS for the merged candidate
  const totalChords = analyses.reduce((sum, a) => sum + a.chords.length, 0);
  const coverage = totalChords > 0 ? clusterSize / totalChords : 0.0;
  const egsw = (0.95 - clusterAvgTAS) * coverage + 0.10;

  const tms = 0.25 * mergedCandidate.metrics.tcs + 
              0.25 * mergedCandidate.metrics.tri + 
              0.20 * mergedCandidate.metrics.gs + 
              0.15 * egsw + 
              0.15 * mergedCandidate.metrics.ns;

  return {
    ...mergedCandidate,
    metrics: {
      tcs: mergedCandidate.metrics.tcs,
      tri: mergedCandidate.metrics.tri,
      gs: mergedCandidate.metrics.gs,
      egsw: Number(egsw.toFixed(4)),
      ns: mergedCandidate.metrics.ns,
      tms: Number(tms.toFixed(4))
    }
  };
}
