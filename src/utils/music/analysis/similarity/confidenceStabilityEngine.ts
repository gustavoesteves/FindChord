import { optimizeConfidenceWeights } from './confidenceWeightOptimizationEngine';
import { pearsonCorrelation, getPercentile } from './entropyRobustnessEngine';

export interface BootstrapInputs {
  scoreGaps: number[];
  goalAlignments: number[];
  geometries: number[];
  informationGains: number[];
  successScores: number[];
  frontierSizes: number[];
  hypervolumes: number[];
}

export interface ParameterStats {
  mean: number;
  stdDev: number;
  cv: number; // Coefficient of Variation in %
}

export interface BootstrapResults {
  weightsStats: {
    scoreGap: ParameterStats;
    goalAlignment: ParameterStats;
    geometry: ParameterStats;
    ambiguity: ParameterStats;
  };
  plattStats: {
    a: ParameterStats;
    b: ParameterStats;
  };
}

// Helper para desvio padrão
function stdDev(values: number[]): number {
  const n = values.length;
  if (n <= 1) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
  return Math.sqrt(variance);
}

// Helper para entropia de 10 bins
function entropy10Bins(values: number[]): number {
  const bins = new Array(10).fill(0);
  for (const v of values) {
    let idx = Math.floor(v * 10);
    if (idx >= 10) idx = 9;
    if (idx < 0) idx = 0;
    bins[idx]++;
  }
  const n = values.length;
  let ent = 0;
  for (const count of bins) {
    if (count > 0) {
      const p = count / n;
      ent -= p * Math.log2(p);
    }
  }
  return ent;
}

/**
 * Optimizes Platt parameters A and B using a fast coarse/fine grid search.
 */
function optimizePlattScalingCoarseFine(
  rawConfidences: number[],
  normalizedScores: number[],
  frontierSizes: number[],
  hypervolumes: number[],
  scoreGaps: number[],
  goalAlignments: number[],
  geometries: number[],
  informationGains: number[]
): { a: number; b: number } {
  const n = rawConfidences.length;
  const stdDevScoreGapVal = stdDev(scoreGaps);
  const stdDevGoalAlignmentVal = stdDev(goalAlignments);
  const stdDevGeometryVal = stdDev(geometries);
  const stdDevInformationGainVal = stdDev(informationGains);

  function evaluatePlatt(a: number, b: number): number {
    const calibrated = rawConfidences.map(raw => 1.0 / (1.0 + Math.exp(-(a * raw + b))));
    
    // Mean Calibration Error (MAE)
    let sumErr = 0;
    for (let k = 0; k < n; k++) {
      sumErr += Math.abs(calibrated[k] - normalizedScores[k]);
    }
    const mce = sumErr / n;
    
    // Discrimination Metrics
    const std = stdDev(calibrated);
    const range = Math.max(...calibrated) - Math.min(...calibrated);
    const ent = entropy10Bins(calibrated);
    
    const sorted = [...calibrated].sort((x, y) => x - y);
    const p90 = getPercentile(sorted, 90);
    const p10 = getPercentile(sorted, 10);
    const p90p10Diff = p90 - p10;
    
    const localBins: { predicted: number; target: number }[][] = Array.from({ length: 10 }, () => []);
    for (let k = 0; k < n; k++) {
      const predicted = calibrated[k];
      const target = normalizedScores[k];
      let binIdx = Math.floor(predicted * 10);
      if (binIdx >= 10) binIdx = 9;
      if (binIdx < 0) binIdx = 0;
      localBins[binIdx].push({ predicted, target });
    }
    
    const occupiedBins = localBins.filter(b => b.length > 0).length;

    let eceSum = 0;
    const hasStableBin = localBins.some(b => b.length >= 3);
    let mce_bin = 0;
    for (const binSamples of localBins) {
      const count = binSamples.length;
      if (count > 0) {
        const avgConfidence = binSamples.reduce((sum, s) => sum + s.predicted, 0) / count;
        const avgTarget = binSamples.reduce((sum, s) => sum + s.target, 0) / count;
        const binErr = Math.abs(avgConfidence - avgTarget);
        eceSum += (count / n) * binErr;
        const isConsideredForMCE = hasStableBin ? (count >= 3) : true;
        if (isConsideredForMCE && binErr > mce_bin) {
          mce_bin = binErr;
        }
      }
    }
    const ece = eceSum;
    const brier = calibrated.reduce((sum, val, idx) => sum + Math.pow(val - normalizedScores[idx], 2), 0) / n;

    const corrFrontier = pearsonCorrelation(calibrated, frontierSizes);
    const corrHv = pearsonCorrelation(calibrated, hypervolumes);
    const corrScoreGap = pearsonCorrelation(calibrated, scoreGaps);
    const corrGoalAlign = pearsonCorrelation(calibrated, goalAlignments);
    const corrGeom = pearsonCorrelation(calibrated, geometries);
    const corrInfoGain = pearsonCorrelation(calibrated, informationGains);

    let score = -(ece * 5.0) - (mce * 2.0) - (brier * 10.0) + (ent * 0.5) + (std * 1.0) + (range * 1.0);
    if (std < 0.105) score -= 1000;
    if (range < 0.315) score -= 1000;
    if (ent < 1.00) score -= 1000;
    if (p90p10Diff < 0.16) score -= 1000;
    if (occupiedBins < 4) score -= 1000;
    if (mce >= 0.15) score -= 1000;
    if (ece > 0.1194) score -= 1000;
    if (mce_bin > 0.1763) score -= 1000;
    if (brier >= 0.0338) score -= 1000;
    if (corrFrontier >= -0.10) score -= 1000;
    if (corrHv >= -0.10) score -= 1000;
    if (stdDevScoreGapVal > 0.001 && corrScoreGap <= 0.05) score -= 1000;
    if (stdDevGoalAlignmentVal > 0.001 && corrGoalAlign <= 0.05) score -= 1000;
    if (stdDevGeometryVal > 0.001 && corrGeom <= 0.05) score -= 1000;
    if (stdDevInformationGainVal > 0.001 && corrInfoGain <= 0.05) score -= 1000;

    return score;
  }

  // Phase 1: Coarse search
  let bestScoreCoarse = -Infinity;
  let bestACoarse = 24.0;
  let bestBCoarse = -13.0;

  for (let a = 1.0; a <= 60.0; a += 3.0) {
    for (let b = -40.0; b <= 5.0; b += 3.0) {
      const score = evaluatePlatt(a, b);
      if (score > bestScoreCoarse) {
        bestScoreCoarse = score;
        bestACoarse = a;
        bestBCoarse = b;
      }
    }
  }

  // Phase 2: Fine refinement
  let bestScoreFine = bestScoreCoarse;
  let bestAFine = bestACoarse;
  let bestBFine = bestBCoarse;

  const aMin = Math.max(0.5, bestACoarse - 4.0);
  const aMax = Math.min(120.0, bestACoarse + 4.0);
  const bMin = Math.max(-90.0, bestBCoarse - 4.0);
  const bMax = Math.min(10.0, bestBCoarse + 4.0);

  for (let a = aMin; a <= aMax + 0.001; a += 0.5) {
    for (let b = bMin; b <= bMax + 0.001; b += 0.5) {
      const score = evaluatePlatt(a, b);
      if (score > bestScoreFine) {
        bestScoreFine = score;
        bestAFine = a;
        bestBFine = b;
      }
    }
  }

  return { a: bestAFine, b: bestBFine };
}

/**
 * Runs the double bootstrap algorithm on the training dataset.
 */
export function runDoubleBootstrap(
  inputs: BootstrapInputs,
  B: number
): BootstrapResults {
  const n = inputs.successScores.length;
  
  // Storage arrays for bootstrap parameter values
  const scoreGapWeights: number[] = [];
  const goalAlignmentWeights: number[] = [];
  const geometryWeights: number[] = [];
  const ambiguityWeights: number[] = [];
  const plattAs: number[] = [];
  const plattBs: number[] = [];

  for (let iter = 0; iter < B; iter++) {
    // 1. Resample indices with replacement
    const resampledIndices: number[] = [];
    for (let i = 0; i < n; i++) {
      const idx = Math.floor(Math.random() * n);
      resampledIndices.push(idx);
    }

    // 2. Build resampled dataset
    const resampled: BootstrapInputs = {
      scoreGaps: resampledIndices.map(idx => inputs.scoreGaps[idx]),
      goalAlignments: resampledIndices.map(idx => inputs.goalAlignments[idx]),
      geometries: resampledIndices.map(idx => inputs.geometries[idx]),
      informationGains: resampledIndices.map(idx => inputs.informationGains[idx]),
      successScores: resampledIndices.map(idx => inputs.successScores[idx]),
      frontierSizes: resampledIndices.map(idx => inputs.frontierSizes[idx]),
      hypervolumes: resampledIndices.map(idx => inputs.hypervolumes[idx])
    };

    // 3. Re-optimize weights
    const optW = optimizeConfidenceWeights({
      scoreGaps: resampled.scoreGaps,
      goalAlignments: resampled.goalAlignments,
      geometries: resampled.geometries,
      informationGains: resampled.informationGains,
      successScores: resampled.successScores,
      frontierSizes: resampled.frontierSizes,
      hypervolumes: resampled.hypervolumes
    });

    scoreGapWeights.push(optW.scoreGapWeight);
    goalAlignmentWeights.push(optW.goalAlignmentWeight);
    geometryWeights.push(optW.geometryWeight);
    ambiguityWeights.push(optW.ambiguityWeight);

    // 4. Re-calibrate Platt scaling coefficients (A, B)
    // First calculate the candidate raw confidences under resampled weights
    const rawConfidences: number[] = [];
    for (let i = 0; i < n; i++) {
      const raw = (resampled.scoreGaps[i] * optW.scoreGapWeight) + 
                  (resampled.goalAlignments[i] * optW.goalAlignmentWeight) + 
                  (resampled.geometries[i] * optW.geometryWeight) +
                  (resampled.informationGains[i] * optW.ambiguityWeight);
      rawConfidences.push(raw);
    }

    const optPlatt = optimizePlattScalingCoarseFine(
      rawConfidences,
      resampled.successScores,
      resampled.frontierSizes,
      resampled.hypervolumes,
      resampled.scoreGaps,
      resampled.goalAlignments,
      resampled.geometries,
      resampled.informationGains
    );

    plattAs.push(optPlatt.a);
    plattBs.push(optPlatt.b);
  }

  const computeStats = (vals: number[]): ParameterStats => {
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd = stdDev(vals);
    const cv = mean !== 0 ? (sd / Math.abs(mean)) * 100 : 0;
    return {
      mean: Number(mean.toFixed(4)),
      stdDev: Number(sd.toFixed(4)),
      cv: Number(cv.toFixed(2))
    };
  };

  return {
    weightsStats: {
      scoreGap: computeStats(scoreGapWeights),
      goalAlignment: computeStats(goalAlignmentWeights),
      geometry: computeStats(geometryWeights),
      ambiguity: computeStats(ambiguityWeights)
    },
    plattStats: {
      a: computeStats(plattAs),
      b: computeStats(plattBs)
    }
  };
}
