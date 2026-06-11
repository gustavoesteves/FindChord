/**
 * Engine de auditoria de robustez da entropia e detecção Out-of-Distribution (OOD) (Sprint F10-F)
 */

// Helper para cálculo da correlação de Pearson
export function pearsonCorrelation(x: number[], y: number[]): number {
  const len = x.length;
  if (len === 0) return 0;
  const meanX = x.reduce((a, b) => a + b, 0) / len;
  const meanY = y.reduce((a, b) => a + b, 0) / len;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < len; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }
  if (denX === 0 || denY === 0) return 0;
  return num / Math.sqrt(denX * denY);
}

// Helper para calcular percentil
export function getPercentile(values: number[], pct: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = (pct / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export interface EntropyRobustnessResult {
  corrIG: number;
  corrHNorm: number;
  corrNeff: number;
  passed: boolean;
}

export interface OODResult {
  avgOOD: number;
  individualOODs: number[];
}

/**
 * Audits the direction and magnitude of correlation for entropy metrics with success score.
 */
export function auditEntropyRobustness(
  informationGains: number[],
  normalizedEntropies: number[],
  effectiveSizes: number[],
  successScores: number[]
): EntropyRobustnessResult {
  const corrIG = pearsonCorrelation(informationGains, successScores);
  const corrHNorm = pearsonCorrelation(normalizedEntropies, successScores);
  const corrNeff = pearsonCorrelation(effectiveSizes, successScores);

  // Assert minimum correlation magnitudes:
  // IG > +0.10, Hnorm < -0.10, Neff < -0.10
  const passed = corrIG > 0.10 && corrHNorm < -0.10 && corrNeff < -0.10;

  return {
    corrIG,
    corrHNorm,
    corrNeff,
    passed
  };
}

/**
 * Computes Out-of-Distribution (OOD) score for a set of samples.
 * OOD = 0.5 * H_norm + 0.5 * min(1.0, Neff / P95(Neff)_training)
 */
export function computeOODScore(
  normalizedEntropies: number[],
  effectiveSizes: number[],
  trainingP95Neff: number,
  complexityFactors?: number[]
): OODResult {
  const n = normalizedEntropies.length;
  if (n === 0) {
    return { avgOOD: 0, individualOODs: [] };
  }

  const individualOODs: number[] = [];
  let sum = 0;

  const denom = trainingP95Neff > 0 ? trainingP95Neff : 1.0;

  for (let i = 0; i < n; i++) {
    const h = normalizedEntropies[i];
    const neff = effectiveSizes[i];
    const normNeff = Math.min(1.0, neff / denom);
    const cf = complexityFactors?.[i] ?? 0.0;
    // OOD score integrates both frontier uncertainty (entropy + size) and input-level complexity factor
    const ood = 0.4 * h + 0.4 * normNeff + 0.2 * cf;
    individualOODs.push(ood);
    sum += ood;
  }

  return {
    avgOOD: sum / n,
    individualOODs
  };
}
