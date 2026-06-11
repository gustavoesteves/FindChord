/**
 * Regularized Weight Optimizer for Confidence Estimation (Sprint F10-F.7)
 */

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

export interface OptimizationInputs {
  scoreGaps?: number[]; // Optional for 3-feature models
  goalAlignments: number[];
  geometries: number[];
  informationGains: number[];
  successScores: number[];
  frontierSizes: number[];
  hypervolumes: number[];
}

export interface OptimizedWeights {
  scoreGapWeight: number;
  goalAlignmentWeight: number;
  geometryWeight: number;
  ambiguityWeight: number; // mapping to information gain weight
  optimizationScore: number;
  pearson: number;
  spearman: number;
}

/**
 * Optimizes weights under Ridge (L2) regularization.
 * Supports both 4-feature and 3-feature modes.
 */
export function optimizeConfidenceWeightsL2(
  inputs: OptimizationInputs,
  lambda: number,
  useThreeFeatures: boolean
): OptimizedWeights {
  const { scoreGaps, goalAlignments, geometries, informationGains, successScores, frontierSizes, hypervolumes } = inputs;
  const n = successScores.length;
  if (n === 0) {
    return {
      scoreGapWeight: useThreeFeatures ? 0 : 0.40,
      goalAlignmentWeight: useThreeFeatures ? 0.20 : 0.15,
      geometryWeight: useThreeFeatures ? 0.45 : 0.25,
      ambiguityWeight: useThreeFeatures ? 0.35 : 0.20,
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
    
    // Core objective score
    let baseScore = 0.7 * pearson + 0.3 * spearman;
    
    // Ridge penalty: lambda * sum of squared weights
    const ridgePenalty = lambda * (wGap * wGap + wGoal * wGoal + wGeom * wGeom + wAmb * wAmb);
    let score = baseScore - ridgePenalty;
    
    // Enforce positive/negative correlation of the raw confidence with each component factor
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

  // Define limits depending on whether it is 4-feature or 3-feature configuration
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
    // 4-feature model limits
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
