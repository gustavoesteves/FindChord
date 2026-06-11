export const MIN_BIN_POPULATION = 2;

export interface DimensionCoverageResult {
  dimension: string;
  coverage: number;
  binCounts: number[];
  binPercentages: number[];
  occupiedBins: number;
  totalBins: number;
  binLabels: string[];
  warnings: string[];
}

export interface CombinedCoverageResult {
  combinedCoverageScore: number;
  coverageGap: number;
  averageDiversity: number;
  averageBalance: number;
  benchmarkQualityScore: number;
  dimensionResults: Record<string, DimensionCoverageResult>;
  allWarnings: string[];
  topMissingRegions: string[];
}

// Bins definition
export const BIN_DEFINITIONS: Record<string, {
  labels: string[];
  getBin: (val: number) => number;
}> = {
  goalAlignment: {
    labels: ['[0.0, 0.50)', '[0.50, 0.75)', '[0.75, 1.0]'],
    getBin: (val: number) => {
      if (val < 0.50) return 0;
      if (val < 0.75) return 1;
      return 2;
    }
  },
  scoreGap: {
    labels: ['[0.0, 0.05)', '[0.05, 0.15)', '[0.15, 1.0]'],
    getBin: (val: number) => {
      if (val < 0.05) return 0;
      if (val < 0.15) return 1;
      return 2;
    }
  },
  geometry: {
    labels: ['[0.0, 0.50)', '[0.50, 0.85)', '[0.85, 1.0]'],
    getBin: (val: number) => {
      if (val < 0.50) return 0;
      if (val < 0.85) return 1;
      return 2;
    }
  },
  hypervolume: {
    labels: ['[0.0, 0.001]', '(0.001, 0.020]', '(0.020, 1.0]'],
    getBin: (val: number) => {
      if (val <= 0.001) return 0;
      if (val <= 0.020) return 1;
      return 2;
    }
  },
  frontierSize: {
    labels: ['[1, 3]', '[4, 4]', '[5, 20]'],
    getBin: (val: number) => {
      if (val <= 3) return 0;
      if (val === 4) return 1;
      return 2;
    }
  },
  informationGain: {
    labels: ['[0.0, 0.51]', '(0.51, 0.75]', '(0.75, 1.0]'],
    getBin: (val: number) => {
      if (val <= 0.51) return 0;
      if (val <= 0.75) return 1;
      return 2;
    }
  }
};

/**
 * Computes coverage, diversity, balance, and warnings for a single dimension of values.
 */
export function computeCoverageForDimension(
  values: number[],
  dimensionName: string
): DimensionCoverageResult {
  const def = BIN_DEFINITIONS[dimensionName];
  if (!def) {
    throw new Error(`Dimension ${dimensionName} is not defined in BIN_DEFINITIONS.`);
  }

  const totalBins = def.labels.length;
  const binCounts = Array(totalBins).fill(0);

  for (const val of values) {
    const binIdx = def.getBin(val);
    if (binIdx >= 0 && binIdx < totalBins) {
      binCounts[binIdx]++;
    }
  }

  const occupiedBins = binCounts.filter(c => c > 0).length;
  const coverage = occupiedBins / totalBins;

  const totalCount = values.length;
  const binPercentages = binCounts.map(c => totalCount > 0 ? (c / totalCount) : 0.0);

  const warnings: string[] = [];
  binCounts.forEach((count, idx) => {
    const label = def.labels[idx];
    if (count === 0) {
      warnings.push(`⚠ ${dimensionName} ${label} não possui amostras (Não Coberto).`);
    } else if (count < MIN_BIN_POPULATION) {
      warnings.push(`⚠ ${dimensionName} ${label} possui apenas ${count} cenário(s) (Sub-amostrado).`);
    }
  });

  return {
    dimension: dimensionName,
    coverage,
    binCounts,
    binPercentages,
    occupiedBins,
    totalBins,
    binLabels: def.labels,
    warnings
  };
}

/**
 * Calculates normalized Shannon entropy diversity for a dimension's bin distribution.
 */
export function calculateDiversityForDimension(binCounts: number[]): number {
  const total = binCounts.reduce((sum, c) => sum + c, 0);
  if (total === 0) return 0.0;

  const M = binCounts.length;
  let H = 0.0;
  for (const count of binCounts) {
    if (count > 0) {
      const p = count / total;
      H -= p * Math.log2(p);
    }
  }

  const H_max = Math.log2(M);
  return H_max > 0 ? H / H_max : 0.0;
}

/**
 * Calculates Uniformity Index (Balance) for a dimension's bin distribution.
 */
export function calculateBalanceForDimension(binCounts: number[]): number {
  const total = binCounts.reduce((sum, c) => sum + c, 0);
  const M = binCounts.length;
  if (total === 0 || M <= 1) return 0.0;

  let sumDiff = 0.0;
  const idealP = 1.0 / M;
  for (const count of binCounts) {
    const p = count / total;
    sumDiff += Math.abs(p - idealP);
  }

  // Normalized balance index between 0.0 (all in one bin) and 1.0 (perfectly uniform)
  const maxDiff = 2.0 * (1.0 - idealP);
  return 1.0 - (sumDiff / maxDiff);
}

/**
 * Computes global combined coverage, diversity, balance, quality, and recommendations.
 */
export function computeCombinedCoverage(
  data: Record<string, number[]>
): CombinedCoverageResult {
  const dimensions = Object.keys(BIN_DEFINITIONS);
  const dimensionResults: Record<string, DimensionCoverageResult> = {};
  const allWarnings: string[] = [];
  const topMissingRegions: string[] = [];

  let sumCoverage = 0.0;
  let sumDiversity = 0.0;
  let sumBalance = 0.0;

  for (const dim of dimensions) {
    const vals = data[dim] || [];
    const res = computeCoverageForDimension(vals, dim);
    dimensionResults[dim] = res;
    allWarnings.push(...res.warnings);

    // List empty bins as missing regions
    res.binCounts.forEach((count, idx) => {
      if (count === 0) {
        topMissingRegions.push(`${dim}: ${res.binLabels[idx]}`);
      }
    });

    sumCoverage += res.coverage;
    sumDiversity += calculateDiversityForDimension(res.binCounts);
    sumBalance += calculateBalanceForDimension(res.binCounts);
  }

  const combinedCoverageScore = Number((sumCoverage / dimensions.length).toFixed(4));
  const coverageGap = Number((1.0 - combinedCoverageScore).toFixed(4));
  const averageDiversity = Number((sumDiversity / dimensions.length).toFixed(4));
  const averageBalance = Number((sumBalance / dimensions.length).toFixed(4));

  // Benchmark Quality KPI formula
  const benchmarkQualityScore = Number((
    0.40 * combinedCoverageScore +
    0.30 * averageDiversity +
    0.30 * averageBalance
  ).toFixed(4));

  return {
    combinedCoverageScore,
    coverageGap,
    averageDiversity,
    averageBalance,
    benchmarkQualityScore,
    dimensionResults,
    allWarnings,
    topMissingRegions
  };
}
