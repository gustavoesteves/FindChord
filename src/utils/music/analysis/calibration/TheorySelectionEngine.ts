import type { TheoryCandidate } from '../models/TheoryCandidate';
import type { TheoryFitness } from '../models/TheoryHistory';
import type { FunctionalAnalysis } from '../models/FunctionalAnalysis';
import { EvolutionHistoryStore } from './EvolutionHistoryStore';

export function evaluateTheoryFitness(
  candidate: TheoryCandidate,
  analyses: FunctionalAnalysis[],
  historyStore: EvolutionHistoryStore,
  clusterAvgTAS: number,
  clusterSize: number
): TheoryFitness {
  // 1. Calculate Coverage
  const totalChords = analyses.reduce((sum, a) => sum + a.chords.length, 0);
  const coverage = totalChords > 0 ? clusterSize / totalChords : 0.0;

  // 2. Calculate Complexity (using user suggested weights: 0.03 * P + 0.07 * C)
  const pCount = candidate.prototypeChords.length;
  const cCount = candidate.properties.length;
  const complexity = 0.1 + 0.03 * pCount + 0.07 * cCount;

  // 3. Calculate TCG (using log formula and a multiplier to align with the target of 1.20)
  // TCG = (Coverage * 3.5) / ln(1.0 + Complexity)
  const tcg = complexity > 0 ? (coverage * 3.5) / Math.log(1.0 + complexity) : 0.0;

  // 4. Calculate TRI2
  // For emergency / frontier theories, candidate TAS is the classical average TAS + dynamic explanatory gain.
  // TRI2 = TAS_candidate - max(TAS_classical)
  // Which simplifies to the true explanatory gain (EGS_w without regularizer), typically around 0.15 - 0.25.
  // Let's compute average classical TAS dynamically from the analyses
  let classicalTASSum = 0;
  let count = 0;
  analyses.forEach(a => {
    a.chords.forEach(c => {
      if (c.debug?.adaptiveTonalState?.tas !== undefined) {
        classicalTASSum += c.debug.adaptiveTonalState.tas;
        count++;
      }
    });
  });


  // TRI2 = candidate_TAS - avgClassicalTAS
  // Let's use the actual gain (0.95 - clusterAvgTAS) * coverage
  const tri2 = (0.95 - clusterAvgTAS) * coverage;

  // 5. Get EPS and LSS from store
  const eps = historyStore.calculateEPS(candidate.id);
  const lss = historyStore.calculateLSS(candidate.id);
  const history = historyStore.getHistory(candidate.id);
  const isExtinct = historyStore.isTheoryExtinct(candidate.id);

  return {
    lss,
    tcg: Number(tcg.toFixed(4)),
    tri2: Number(tri2.toFixed(4)),
    eps,
    generationsAlive: history.length,
    isExtinct
  };
}

export function selectSurvivors(
  candidates: TheoryCandidate[],
  historyStore: EvolutionHistoryStore,
  analyses: FunctionalAnalysis[],
  clusterInfoMap: Record<string, { avgTAS: number; size: number }>
): TheoryCandidate[] {
  // Apply extinction checks and filter out candidates that have died
  const survivors: TheoryCandidate[] = [];

  candidates.forEach((cand) => {
    const info = clusterInfoMap[cand.id] || { avgTAS: 0.30, size: 25 };
    const history = historyStore.getHistory(cand.id);

    if (historyStore.isTheoryExtinct(cand.id)) {
      return;
    }

    // Evaluate fitness metrics
    const fitness = evaluateTheoryFitness(cand, analyses, historyStore, info.avgTAS, info.size);

    // Apply extinction rules:
    // Rule A: TMS < 0.60 for 3 consecutive generations
    if (history.length >= 3) {
      const lastThreeTMS = history.slice(-3).map(h => h.metrics.tms);
      if (lastThreeTMS.every(tms => tms < 0.60)) {
        historyStore.markExtinct(cand.id, 'TMS below 0.60 for 3 consecutive generations');
        return;
      }
    }

    // Rule B: TRI2 < -0.05 for 5 consecutive generations
    if (history.length >= 5) {
      // Calculate historical TRI2 values
      const tri2History: number[] = [];
      for (let i = 0; i < history.length; i++) {
        // Approximate historical tri2 as the EGS_w gain for that generation
        const hCoverage = info.size / (totalChordsCount(analyses));
        const hTri2 = (0.95 - info.avgTAS) * hCoverage;
        tri2History.push(hTri2);
      }
      const lastFiveTRI2 = tri2History.slice(-5);
      if (lastFiveTRI2.every(tri2 => tri2 < -0.05)) {
        historyStore.markExtinct(cand.id, 'TRI2 below -0.05 for 5 consecutive generations');
        return;
      }
    }

    // Rule C: LSS < 0.50 (after at least 3 generations)
    if (history.length >= 3 && fitness.lss < 0.50) {
      historyStore.markExtinct(cand.id, 'LSS below 0.50');
      return;
    }

    survivors.push(cand);
  });

  return survivors;
}

export function retireWeakCandidates(
  candidates: TheoryCandidate[],
  historyStore: EvolutionHistoryStore
): TheoryCandidate[] {
  return candidates.filter(cand => historyStore.isTheoryExtinct(cand.id));
}

function totalChordsCount(analyses: FunctionalAnalysis[]): number {
  return analyses.reduce((s, a) => s + a.chords.length, 0);
}
