/**
 * Bayesian Weight Prior and MAP Optimization (Sprint F10-F.7)
 */

import { OptimizationInputs, OptimizedWeights } from './regularizedConfidenceOptimizer';

function pearsonCorrelation(x: number[], y: number[]): number {
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

function spearmanCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  function getRanks(arr: number[]): number[] {
    const indexed = arr.map((val, idx) => ({ val, idx }));
    indexed.sort((a, b) => a.val - b.val);
    
    const ranks = new Array(n);
    let i = 0;
    while (i < n) {
      let j = i + 1;
      while (j < n && indexed[j].val === indexed[i].val) {
        j++;
      }
      const rankVal = (i + 1 + j) / 2;
      for (let k = i; k < j; k++) {
        ranks[indexed[k].idx] = rankVal;
      }
      i = j;
    }
    return ranks;
  }

  const ranksX = getRanks(x);
  const ranksY = getRanks(y);

  return pearsonCorrelation(ranksX, ranksY);
}

// Prior parameters
export const BAYESIAN_PRIOR_4_FEATURE = {
  means: {
    scoreGapWeight: 0.40,
    goalAlignmentWeight: 0.15,
    geometryWeight: 0.25,
    ambiguityWeight: 0.20
  },
  stdDevs: {
    scoreGapWeight: 0.05,
    goalAlignmentWeight: 0.05,
    geometryWeight: 0.05,
    ambiguityWeight: 0.05
  }
};

export const BAYESIAN_PRIOR_3_FEATURE = {
  means: {
    scoreGapWeight: 0.0,
    goalAlignmentWeight: 0.20,
    geometryWeight: 0.45,
    ambiguityWeight: 0.35
  },
  stdDevs: {
    scoreGapWeight: 0.01, // Near zero constraint
    goalAlignmentWeight: 0.05,
    geometryWeight: 0.05,
    ambiguityWeight: 0.05
  }
};

/**
 * Computes the Bayesian log-prior density of the weights: -0.5 * sum((w_i - mu_i)^2 / sigma_i^2)
 */
export function computeBayesianLogPrior(
  weights: { scoreGapWeight: number; goalAlignmentWeight: number; geometryWeight: number; ambiguityWeight: number },
  useThreeFeatures: boolean,
  sigmaScale: number = 1.0
): number {
  const prior = useThreeFeatures ? BAYESIAN_PRIOR_3_FEATURE : BAYESIAN_PRIOR_4_FEATURE;
  
  let logPrior = 0;
  
  // Calculate term for each weight
  if (!useThreeFeatures) {
    const diffGap = weights.scoreGapWeight - prior.means.scoreGapWeight;
    const varGap = Math.pow(prior.stdDevs.scoreGapWeight * sigmaScale, 2);
    logPrior += -0.5 * (diffGap * diffGap) / varGap;
  }
  
  const diffGoal = weights.goalAlignmentWeight - prior.means.goalAlignmentWeight;
  const varGoal = Math.pow(prior.stdDevs.goalAlignmentWeight * sigmaScale, 2);
  logPrior += -0.5 * (diffGoal * diffGoal) / varGoal;
  
  const diffGeom = weights.geometryWeight - prior.means.geometryWeight;
  const varGeom = Math.pow(prior.stdDevs.geometryWeight * sigmaScale, 2);
  logPrior += -0.5 * (diffGeom * diffGeom) / varGeom;
  
  const diffAmb = weights.ambiguityWeight - prior.means.ambiguityWeight;
  const varAmb = Math.pow(prior.stdDevs.ambiguityWeight * sigmaScale, 2);
  logPrior += -0.5 * (diffAmb * diffAmb) / varAmb;
  
  return logPrior;
}

/**
 * Optimizes weights under Bayesian MAP optimization.
 */
export function optimizeWeightsBayesian(
  inputs: OptimizationInputs,
  useThreeFeatures: boolean,
  sigmaScale: number = 1.0
): OptimizedWeights {
  const { scoreGaps, goalAlignments, geometries, informationGains, successScores, frontierSizes, hypervolumes } = inputs;
  const n = successScores.length;
  if (n === 0) {
    const prior = useThreeFeatures ? BAYESIAN_PRIOR_3_FEATURE : BAYESIAN_PRIOR_4_FEATURE;
    return {
      scoreGapWeight: prior.means.scoreGapWeight,
      goalAlignmentWeight: prior.means.goalAlignmentWeight,
      geometryWeight: prior.means.geometryWeight,
      ambiguityWeight: prior.means.ambiguityWeight,
      optimizationScore: 0,
      pearson: 0,
      spearman: 0
    };
  }

  function evaluateWeights(wGap: number, wGoal: number, wGeom: number, wAmb: number) {
    const rawConfidences: number[] = [];
    for (let i = 0; i < n; i++) {
      const gapVal = scoreGaps ? scoreGaps[i] : 0;
      const raw = (gapVal * wGap) + (goalAlignments[i] * wGoal) + (geometries[i] * wGeom) + (informationGains[i] * wAmb);
      rawConfidences.push(raw);
    }
    const pearson = pearsonCorrelation(rawConfidences, successScores);
    const spearman = spearmanCorrelation(rawConfidences, successScores);
    
    const baseScore = 0.7 * pearson + 0.3 * spearman;
    
    // Add log-prior penalty
    const logPrior = computeBayesianLogPrior(
      { scoreGapWeight: wGap, goalAlignmentWeight: wGoal, geometryWeight: wGeom, ambiguityWeight: wAmb },
      useThreeFeatures,
      sigmaScale
    );
    
    let score = baseScore + logPrior;
    
    // Pearson correlation checks for correctness of signals
    const corrInfo = pearsonCorrelation(rawConfidences, informationGains);
    const corrGeom = pearsonCorrelation(rawConfidences, geometries);
    const corrGoal = pearsonCorrelation(rawConfidences, goalAlignments);
    const corrSize = pearsonCorrelation(rawConfidences, frontierSizes);
    const corrHv = pearsonCorrelation(rawConfidences, hypervolumes);

    if (corrInfo <= 0.10) score -= 1000;
    if (corrGeom <= 0.10) score -= 1000;
    if (corrGoal <= 0.10) score -= 1000;
    if (corrSize >= -0.18) score -= 1000;
    if (corrHv >= -0.18) score -= 1000;

    if (!useThreeFeatures && scoreGaps) {
      const corrGap = pearsonCorrelation(rawConfidences, scoreGaps);
      if (corrGap <= 0.10) score -= 1000;
    }

    return { score, pearson, spearman };
  }

  const MIN_GOAL = 0.10;
  const MIN_GEOM = 0.15;
  const MIN_AMB = 0.10;

  if (useThreeFeatures) {
    const MAX_AMB = 0.60;

    let bestScoreCoarse = -99999;
    let bestWeightsCoarse = { goalAlignmentWeight: 0.20, geometryWeight: 0.45, ambiguityWeight: 0.35 };
    let bestMetricsCoarse = { pearson: 0, spearman: 0 };

    for (let wGoal = MIN_GOAL; wGoal <= 1.001; wGoal += 0.05) {
      for (let wGeom = MIN_GEOM; wGeom <= 1.001 - wGoal; wGeom += 0.05) {
        const wAmb = 1.0 - wGoal - wGeom;
        const weightAmb = Number(wAmb.toFixed(4));
        const weightGoal = Number(wGoal.toFixed(4));
        const weightGeom = Number(wGeom.toFixed(4));

        if (
          weightAmb < MIN_AMB ||
          weightAmb > MAX_AMB ||
          Math.abs(weightGoal + weightGeom + weightAmb - 1.0) > 0.001
        ) continue;

        const { score, pearson, spearman } = evaluateWeights(0, weightGoal, weightGeom, weightAmb);

        if (score > bestScoreCoarse) {
          bestScoreCoarse = score;
          bestWeightsCoarse = { goalAlignmentWeight: weightGoal, geometryWeight: weightGeom, ambiguityWeight: weightAmb };
          bestMetricsCoarse = { pearson, spearman };
        }
      }
    }

    let bestScoreFine = bestScoreCoarse;
    let bestWeightsFine = { ...bestWeightsCoarse };
    let bestMetricsFine = { ...bestMetricsCoarse };

    const rGoalMin = Math.max(MIN_GOAL, bestWeightsCoarse.goalAlignmentWeight - 0.05);
    const rGoalMax = Math.min(1.0, bestWeightsCoarse.goalAlignmentWeight + 0.05);
    const rGeomMin = Math.max(MIN_GEOM, bestWeightsCoarse.geometryWeight - 0.05);
    const rGeomMax = Math.min(1.0, bestWeightsCoarse.geometryWeight + 0.05);

    for (let wGoal = rGoalMin; wGoal <= rGoalMax + 0.001; wGoal += 0.01) {
      for (let wGeom = rGeomMin; wGeom <= rGeomMax + 0.001; wGeom += 0.01) {
        const wAmb = 1.0 - wGoal - wGeom;
        const weightAmb = Number(wAmb.toFixed(4));
        const weightGoal = Number(wGoal.toFixed(4));
        const weightGeom = Number(wGeom.toFixed(4));

        if (
          weightAmb < MIN_AMB ||
          weightAmb > MAX_AMB ||
          Math.abs(weightGoal + weightGeom + weightAmb - 1.0) > 0.001
        ) continue;

        const { score, pearson, spearman } = evaluateWeights(0, weightGoal, weightGeom, weightAmb);

        if (score > bestScoreFine) {
          bestScoreFine = score;
          bestWeightsFine = { goalAlignmentWeight: weightGoal, geometryWeight: weightGeom, ambiguityWeight: weightAmb };
          bestMetricsFine = { pearson, spearman };
        }
      }
    }

    return {
      scoreGapWeight: 0,
      goalAlignmentWeight: bestWeightsFine.goalAlignmentWeight,
      geometryWeight: bestWeightsFine.geometryWeight,
      ambiguityWeight: bestWeightsFine.ambiguityWeight,
      optimizationScore: Number(bestScoreFine.toFixed(6)),
      pearson: Number(bestMetricsFine.pearson.toFixed(6)),
      spearman: Number(bestMetricsFine.spearman.toFixed(6))
    };
  } else {
    const MIN_GAP = 0.15;
    const MAX_AMB = 0.35;

    let bestScoreCoarse = -99999;
    let bestWeightsCoarse = { scoreGapWeight: 0.40, goalAlignmentWeight: 0.15, geometryWeight: 0.25, ambiguityWeight: 0.20 };
    let bestMetricsCoarse = { pearson: 0, spearman: 0 };

    for (let wGap = MIN_GAP; wGap <= 1.001; wGap += 0.05) {
      for (let wGoal = MIN_GOAL; wGoal <= 1.001 - wGap; wGoal += 0.05) {
        for (let wGeom = MIN_GEOM; wGeom <= 1.001 - wGap - wGoal; wGeom += 0.05) {
          const wAmb = 1.0 - wGap - wGoal - wGeom;
          const weightAmb = Number(wAmb.toFixed(4));
          const weightGap = Number(wGap.toFixed(4));
          const weightGoal = Number(wGoal.toFixed(4));
          const weightGeom = Number(wGeom.toFixed(4));

          if (
            weightAmb < MIN_AMB ||
            weightAmb > MAX_AMB ||
            Math.abs(weightGap + weightGoal + weightGeom + weightAmb - 1.0) > 0.001
          ) continue;

          const { score, pearson, spearman } = evaluateWeights(weightGap, weightGoal, weightGeom, weightAmb);

          if (score > bestScoreCoarse) {
            bestScoreCoarse = score;
            bestWeightsCoarse = {
              scoreGapWeight: weightGap,
              goalAlignmentWeight: weightGoal,
              geometryWeight: weightGeom,
              ambiguityWeight: weightAmb
            };
            bestMetricsCoarse = { pearson, spearman };
          }
        }
      }
    }

    let bestScoreFine = bestScoreCoarse;
    let bestWeightsFine = { ...bestWeightsCoarse };
    let bestMetricsFine = { ...bestMetricsCoarse };

    const rGapMin = Math.max(MIN_GAP, bestWeightsCoarse.scoreGapWeight - 0.05);
    const rGapMax = Math.min(1.0, bestWeightsCoarse.scoreGapWeight + 0.05);
    const rGoalMin = Math.max(MIN_GOAL, bestWeightsCoarse.goalAlignmentWeight - 0.05);
    const rGoalMax = Math.min(1.0, bestWeightsCoarse.goalAlignmentWeight + 0.05);
    const rGeomMin = Math.max(MIN_GEOM, bestWeightsCoarse.geometryWeight - 0.05);
    const rGeomMax = Math.min(1.0, bestWeightsCoarse.geometryWeight + 0.05);

    for (let wGap = rGapMin; wGap <= rGapMax + 0.001; wGap += 0.01) {
      for (let wGoal = rGoalMin; wGoal <= rGoalMax + 0.001; wGoal += 0.01) {
        for (let wGeom = rGeomMin; wGeom <= rGeomMax + 0.001; wGeom += 0.01) {
          const wAmb = 1.0 - wGap - wGoal - wGeom;
          const weightAmb = Number(wAmb.toFixed(4));
          const weightGap = Number(wGap.toFixed(4));
          const weightGoal = Number(wGoal.toFixed(4));
          const weightGeom = Number(wGeom.toFixed(4));

          if (
            weightAmb < MIN_AMB ||
            weightAmb > MAX_AMB ||
            Math.abs(weightGap + weightGoal + weightGeom + weightAmb - 1.0) > 0.001
          ) continue;

          const { score, pearson, spearman } = evaluateWeights(weightGap, weightGoal, weightGeom, weightAmb);

          if (score > bestScoreFine) {
            bestScoreFine = score;
            bestWeightsFine = {
              scoreGapWeight: weightGap,
              goalAlignmentWeight: weightGoal,
              geometryWeight: weightGeom,
              ambiguityWeight: weightAmb
            };
            bestMetricsFine = { pearson, spearman };
          }
        }
      }
    }

    return {
      ...bestWeightsFine,
      optimizationScore: Number(bestScoreFine.toFixed(6)),
      pearson: Number(bestMetricsFine.pearson.toFixed(6)),
      spearman: Number(bestMetricsFine.spearman.toFixed(6))
    };
  }
}
