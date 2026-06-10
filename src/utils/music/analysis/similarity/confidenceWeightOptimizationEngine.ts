/**
 * Engine de otimização de pesos de confiança (Sprint F12.6)
 */

// Helper para cálculo da correlação de Pearson
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

// Helper para cálculo da correlação de Spearman com tratamento de empates
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

export interface OptimizedWeights {
  scoreGapWeight: number;
  goalAlignmentWeight: number;
  geometryWeight: number;
  optimizationScore: number;
  pearson: number;
  spearman: number;
}

export function optimizeConfidenceWeights(inputs: {
  scoreGaps: number[];
  goalAlignments: number[];
  geometries: number[];
  successScores: number[];
}): OptimizedWeights {
  const { scoreGaps, goalAlignments, geometries, successScores } = inputs;
  const n = successScores.length;
  if (n === 0) {
    return {
      scoreGapWeight: 0.4,
      goalAlignmentWeight: 0.3,
      geometryWeight: 0.3,
      optimizationScore: 0,
      pearson: 0,
      spearman: 0
    };
  }

  function evaluateWeights(wGap: number, wGoal: number, wGeom: number) {
    const rawConfidences: number[] = [];
    for (let i = 0; i < n; i++) {
      const raw = (scoreGaps[i] * wGap) + (goalAlignments[i] * wGoal) + (geometries[i] * wGeom);
      rawConfidences.push(raw);
    }
    const pearson = pearsonCorrelation(rawConfidences, successScores);
    const spearman = spearmanCorrelation(rawConfidences, successScores);
    const score = 0.7 * pearson + 0.3 * spearman;
    return { score, pearson, spearman };
  }

  // Limites mínimos para garantir a presença de todos os fatores regularizadores e evitar colapsos de calibração
  const MIN_GAP = 0.15;
  const MIN_GOAL = 0.10;
  const MIN_GEOM = 0.15;

  // Passo 1: Busca em grade grossa (passo 0.05) com limites mínimos
  let bestScoreCoarse = -99999;
  let bestWeightsCoarse = { scoreGapWeight: 0.40, goalAlignmentWeight: 0.3333, geometryWeight: 0.2667 };
  let bestMetricsCoarse = { pearson: 0, spearman: 0 };

  for (let wGap = MIN_GAP; wGap <= 1.001; wGap += 0.05) {
    for (let wGoal = MIN_GOAL; wGoal <= 1.001 - wGap; wGoal += 0.05) {
      const wGeom = 1.0 - wGap - wGoal;
      const weightGeom = Number(wGeom.toFixed(4));
      const weightGap = Number(wGap.toFixed(4));
      const weightGoal = Number(wGoal.toFixed(4));

      if (weightGeom < MIN_GEOM || Math.abs(weightGap + weightGoal + weightGeom - 1.0) > 0.001) continue;

      const { score, pearson, spearman } = evaluateWeights(weightGap, weightGoal, weightGeom);

      if (score > bestScoreCoarse) {
        bestScoreCoarse = score;
        bestWeightsCoarse = {
          scoreGapWeight: weightGap,
          goalAlignmentWeight: weightGoal,
          geometryWeight: weightGeom
        };
        bestMetricsCoarse = { pearson, spearman };
      }
    }
  }

  // Passo 2: Refinamento local (passo 0.01) ao redor de bestWeightsCoarse com limites mínimos
  let bestScoreFine = bestScoreCoarse;
  let bestWeightsFine = { ...bestWeightsCoarse };
  let bestMetricsFine = { ...bestMetricsCoarse };

  const rGapMin = Math.max(MIN_GAP, bestWeightsCoarse.scoreGapWeight - 0.05);
  const rGapMax = Math.min(1.0, bestWeightsCoarse.scoreGapWeight + 0.05);
  const rGoalMin = Math.max(MIN_GOAL, bestWeightsCoarse.goalAlignmentWeight - 0.05);
  const rGoalMax = Math.min(1.0, bestWeightsCoarse.goalAlignmentWeight + 0.05);

  for (let wGap = rGapMin; wGap <= rGapMax + 0.001; wGap += 0.01) {
    for (let wGoal = rGoalMin; wGoal <= rGoalMax + 0.001; wGoal += 0.01) {
      const wGeom = 1.0 - wGap - wGoal;
      const weightGeom = Number(wGeom.toFixed(4));
      const weightGap = Number(wGap.toFixed(4));
      const weightGoal = Number(wGoal.toFixed(4));

      if (weightGeom < MIN_GEOM || Math.abs(weightGap + weightGoal + weightGeom - 1.0) > 0.001) continue;

      const { score, pearson, spearman } = evaluateWeights(weightGap, weightGoal, weightGeom);

      if (score > bestScoreFine) {
        bestScoreFine = score;
        bestWeightsFine = {
          scoreGapWeight: weightGap,
          goalAlignmentWeight: weightGoal,
          geometryWeight: weightGeom
        };
        bestMetricsFine = { pearson, spearman };
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
