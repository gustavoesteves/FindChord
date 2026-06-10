import type {
  RecommendationPath,
  ObjectiveVector,
  ParetoPath,
  ParetoFrontier,
  OptimizationProfile
} from '../models/Discovery';
import metricDistributions from './metric_distributions.json' with { type: 'json' };

const PEDAGOGY_SATURATION = 0.6;

interface PercentilePoint {
  val: number;
  pct: number;
}

const percentileCache: Record<string, PercentilePoint[]> = {};

// Inicializa o cache de percentis a partir do arquivo JSON importado
if (metricDistributions && metricDistributions.percentiles) {
  for (const [metricName, dist] of Object.entries(metricDistributions.percentiles)) {
    const d = dist as any;
    const points: PercentilePoint[] = [
      { val: d.min, pct: 0 },
      { val: d.p10, pct: 10 },
      { val: d.p25, pct: 25 },
      { val: d.p50, pct: 50 },
      { val: d.p75, pct: 75 },
      { val: d.p90, pct: 90 },
      { val: d.p95, pct: 95 },
      { val: d.p99, pct: 99 },
      { val: d.max, pct: 100 }
    ];
    points.sort((a, b) => a.val - b.val);
    percentileCache[metricName] = points;
  }
}

/**
 * Converte um valor numérico bruto em sua classificação percentílica empírica [0.0 - 1.0].
 * Suporta proteção contra NaN, pontos explícitos P0/P100 e percentis degenerados.
 */
export function getPercentileForMetric(metricName: string, value: number): number {
  if (!Number.isFinite(value)) {
    return 0.0;
  }

  const points = percentileCache[metricName];
  if (!points || points.length === 0) {
    return value;
  }

  if (value <= points[0].val) return 0.0;
  if (value >= points[points.length - 1].val) return 1.0;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    if (value >= p1.val && value <= p2.val) {
      if (Math.abs(p2.val - p1.val) < 1e-9) {
        return Number((p2.pct / 100).toFixed(4));
      }
      const pct = p1.pct + ((value - p1.val) / (p2.val - p1.val)) * (p2.pct - p1.pct);
      return Number((pct / 100).toFixed(4));
    }
  }

  return value;
}

/**
 * Extrai o vetor de objetivos a partir de um caminho de recomendação.
 * Por padrão, mapeia os valores brutos para seus percentis populacionais.
 */
export function extractObjectiveVector(path: RecommendationPath, usePercentiles: boolean = true): ObjectiveVector {
  const transition = path.executionResult?.stateTransition;
  const goalAchievement = path.executionResult?.goalAchievement;
  const accumulatedImpact = path.accumulatedImpact ?? 0;

  const physicalComplexity = path.steps.length > 0 
    ? Math.max(...path.steps.map(s => s.physicalComplexity)) 
    : 0;

  const avgComplexity = path.steps.length > 0
    ? (path.steps.reduce((sum, s) => sum + s.physicalComplexity, 0) / path.steps.length)
    : 0;

  const rawPlayability = Math.max(0.0, 1.0 - avgComplexity - 0.05 * path.steps.length);
  const rawPedagogicalImpact = Number((1.0 - Math.exp(-PEDAGOGY_SATURATION * accumulatedImpact)).toFixed(4));

  const rawTension = transition?.after.tension ?? 0;
  const rawChromaticism = transition?.after.chromaticism ?? 0;
  const rawBassSmoothness = transition?.after.bassSmoothness ?? 0;
  const rawFunctionalStability = transition?.after.functionalStability ?? 0;
  const rawVoiceLeading = transition?.after.voiceLeadingQuality ?? 0;
  const rawGoalAchievement = goalAchievement?.score ?? 0;

  if (usePercentiles) {
    return {
      tension: getPercentileForMetric('tension', rawTension),
      chromaticism: getPercentileForMetric('chromaticism', rawChromaticism),
      bassSmoothness: getPercentileForMetric('bassSmoothness', rawBassSmoothness),
      functionalStability: getPercentileForMetric('functionalStability', rawFunctionalStability),
      voiceLeading: getPercentileForMetric('voiceLeading', rawVoiceLeading),
      physicalComplexity,
      playability: getPercentileForMetric('playability', Number(rawPlayability.toFixed(4))),
      pedagogicalImpact: getPercentileForMetric('pedagogicalImpact', rawPedagogicalImpact),
      goalAchievement: getPercentileForMetric('goalAchievement', rawGoalAchievement)
    };
  }

  return {
    tension: rawTension,
    chromaticism: rawChromaticism,
    bassSmoothness: rawBassSmoothness,
    functionalStability: rawFunctionalStability,
    voiceLeading: rawVoiceLeading,
    physicalComplexity,
    playability: Number(rawPlayability.toFixed(4)),
    pedagogicalImpact: rawPedagogicalImpact,
    goalAchievement: rawGoalAchievement
  };
}

/**
 * Determina se o vetor de objetivos A domina o vetor B.
 * A domina B se for pelo menos igual em todas as dimensões e estritamente melhor em pelo menos uma.
 * Para physicalComplexity, menor valor é melhor. Para os outros, maior é melhor.
 */
export function dominates(a: ObjectiveVector, b: ObjectiveVector): boolean {
  const betterOrEqual =
    a.tension >= b.tension &&
    a.chromaticism >= b.chromaticism &&
    a.bassSmoothness >= b.bassSmoothness &&
    a.functionalStability >= b.functionalStability &&
    a.voiceLeading >= b.voiceLeading &&
    a.physicalComplexity <= b.physicalComplexity &&
    a.playability >= b.playability &&
    a.pedagogicalImpact >= b.pedagogicalImpact &&
    a.goalAchievement >= b.goalAchievement;

  const strictlyBetter =
    a.tension > b.tension ||
    a.chromaticism > b.chromaticism ||
    a.bassSmoothness > b.bassSmoothness ||
    a.functionalStability > b.functionalStability ||
    a.voiceLeading > b.voiceLeading ||
    a.physicalComplexity < b.physicalComplexity ||
    a.playability > b.playability ||
    a.pedagogicalImpact > b.pedagogicalImpact ||
    a.goalAchievement > b.goalAchievement;

  return betterOrEqual && strictlyBetter;
}

/**
 * Calcula a distância de aglomeração (Crowding Distance) para garantir diversidade musical.
 * Atribui infinito para soluções extremas em cada objetivo.
 */
export function computeCrowdingDistance(paths: ParetoPath[]): void {
  const n = paths.length;
  if (n === 0) return;
  if (n <= 2) {
    paths.forEach(p => p.crowdingDistance = Infinity);
    return;
  }

  // Reset
  paths.forEach(p => p.crowdingDistance = 0);

  const keys: (keyof ObjectiveVector)[] = [
    'tension',
    'chromaticism',
    'bassSmoothness',
    'functionalStability',
    'voiceLeading',
    'physicalComplexity',
    'playability',
    'pedagogicalImpact',
    'goalAchievement'
  ];

  for (const key of keys) {
    // Ordenação ascendente pela métrica
    paths.sort((a, b) => a.objectives[key] - b.objectives[key]);

    // Extremidades recebem distância infinita
    paths[0].crowdingDistance = Infinity;
    paths[n - 1].crowdingDistance = Infinity;

    const minVal = paths[0].objectives[key];
    const maxVal = paths[n - 1].objectives[key];
    const range = maxVal - minVal;

    if (range > 0.0001) {
      for (let i = 1; i < n - 1; i++) {
        if (paths[i].crowdingDistance !== Infinity) {
          paths[i].crowdingDistance += (paths[i + 1].objectives[key] - paths[i - 1].objectives[key]) / range;
        }
      }
    }
  }
}

const GEOMETRY_OBJECTIVE_KEYS: (keyof ObjectiveVector)[] = [
  'tension',
  'chromaticism',
  'bassSmoothness',
  'functionalStability',
  'voiceLeading',
  'playability',
  'pedagogicalImpact',
  'goalAchievement'
];

/**
 * Computa o Hypervolume (HV) da fronteira de Pareto usando estimativa de Monte Carlo.
 * Utiliza 20.000 amostras na região [0.0, 1.0]^8 dos percentis empíricos.
 */
export function computeHypervolume(paths: ParetoPath[], sampleCount: number = 20000): { hv: number; stdError: number } {
  if (paths.length === 0) {
    return { hv: 0.0, stdError: 0.0 };
  }

  let dominatedSamples = 0;
  for (let s = 0; s < sampleCount; s++) {
    const sample: number[] = [];
    for (let d = 0; d < GEOMETRY_OBJECTIVE_KEYS.length; d++) {
      sample.push(Math.random());
    }

    let isDominated = false;
    for (let i = 0; i < paths.length; i++) {
      let dominatesSample = true;
      const objectives = paths[i].objectives;
      for (let d = 0; d < GEOMETRY_OBJECTIVE_KEYS.length; d++) {
        if (objectives[GEOMETRY_OBJECTIVE_KEYS[d]] < sample[d]) {
          dominatesSample = false;
          break;
        }
      }
      if (dominatesSample) {
        isDominated = true;
        break;
      }
    }
    if (isDominated) {
      dominatedSamples++;
    }
  }

  const hv = Number((dominatedSamples / sampleCount).toFixed(4));
  const stdError = Number(Math.sqrt((hv * (1 - hv)) / sampleCount).toFixed(4));
  return { hv, stdError };
}

/**
 * Computa o Spacing (S) usando distância Euclidiana (L2) para vizinhos mais próximos.
 */
export function computeSpacing(paths: ParetoPath[]): number {
  const n = paths.length;
  if (n <= 1) {
    return 0.0;
  }

  const distances: number[] = [];
  for (let i = 0; i < n; i++) {
    let minDist = Infinity;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      let sumSq = 0;
      for (const key of GEOMETRY_OBJECTIVE_KEYS) {
        sumSq += Math.pow(paths[i].objectives[key] - paths[j].objectives[key], 2);
      }
      const dist = Math.sqrt(sumSq);
      if (dist < minDist) {
        minDist = dist;
      }
    }
    distances.push(minDist);
  }

  const meanDist = distances.reduce((a, b) => a + b, 0) / n;
  const sumSqDiff = distances.reduce((sum, d) => sum + Math.pow(d - meanDist, 2), 0);
  const variance = sumSqDiff / (n - 1);
  return Number(Math.sqrt(variance).toFixed(4));
}

/**
 * Computa o Spread (Delta) usando os extremos observados da própria fronteira como âncoras.
 */
export function computeSpread(paths: ParetoPath[]): number {
  const n = paths.length;
  if (n === 0) return 0.0;
  if (n === 1) return 1.0; // Penalidade máxima para fronteira de ponto único

  // 1. Encontra os extremos observados da fronteira (E_max e E_min)
  const eMax: Record<string, number> = {};
  const eMin: Record<string, number> = {};
  for (const key of GEOMETRY_OBJECTIVE_KEYS) {
    const vals = paths.map(p => p.objectives[key]);
    eMax[key] = Math.max(...vals);
    eMin[key] = Math.min(...vals);
  }

  // 2. Calcula d_f (distância ao extremo máximo) e d_l (distância ao extremo mínimo)
  let df = Infinity;
  let dl = Infinity;
  for (let i = 0; i < n; i++) {
    let sumSqMax = 0;
    let sumSqMin = 0;
    for (const key of GEOMETRY_OBJECTIVE_KEYS) {
      sumSqMax += Math.pow(eMax[key] - paths[i].objectives[key], 2);
      sumSqMin += Math.pow(paths[i].objectives[key] - eMin[key], 2);
    }
    const distMax = Math.sqrt(sumSqMax);
    const distMin = Math.sqrt(sumSqMin);
    if (distMax < df) df = distMax;
    if (distMin < dl) dl = distMin;
  }

  // 3. Calcula d_i para cada solução (distância Euclidiana ao vizinho mais próximo)
  const distances: number[] = [];
  for (let i = 0; i < n; i++) {
    let minDist = Infinity;
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      let sumSq = 0;
      for (const key of GEOMETRY_OBJECTIVE_KEYS) {
        sumSq += Math.pow(paths[i].objectives[key] - paths[j].objectives[key], 2);
      }
      const dist = Math.sqrt(sumSq);
      if (dist < minDist) {
        minDist = dist;
      }
    }
    distances.push(minDist);
  }

  const meanDist = distances.reduce((a, b) => a + b, 0) / n;
  const sumDiff = distances.reduce((sum, d) => sum + Math.abs(d - meanDist), 0);

  const numerator = df + dl + sumDiff;
  const denominator = df + dl + (n * meanDist);

  if (denominator < 1e-9) return 0.0;
  return Number((numerator / denominator).toFixed(4));
}

/**
 * Computa a fronteira de Pareto (soluções não dominadas) a partir dos caminhos candidatos.
 */
export function computeParetoFrontier(candidatePaths: RecommendationPath[], usePercentiles: boolean = true): ParetoFrontier {
  const allParetoPaths: ParetoPath[] = candidatePaths.map(path => {
    const pathId = path.steps.map(s => s.id).join('+') || 'no-transform';
    const objectives = extractObjectiveVector(path, usePercentiles);
    return {
      pathId,
      objectives,
      dominanceRank: 0,
      crowdingDistance: 0
    };
  });

  const rank1Paths: ParetoPath[] = [];
  let dominatedCount = 0;

  for (let i = 0; i < allParetoPaths.length; i++) {
    let isDominated = false;
    for (let j = 0; j < allParetoPaths.length; j++) {
      if (i === j) continue;
      if (dominates(allParetoPaths[j].objectives, allParetoPaths[i].objectives)) {
        isDominated = true;
        break;
      }
    }
    if (!isDominated) {
      allParetoPaths[i].dominanceRank = 1;
      rank1Paths.push(allParetoPaths[i]);
    } else {
      allParetoPaths[i].dominanceRank = 2;
      dominatedCount++;
    }
  }

  // Computa as distâncias de aglomeração na fronteira
  computeCrowdingDistance(rank1Paths);

  // Resume os melhores extremos de objetivos
  let bestTension = 0;
  let bestVoiceLeading = 0;
  let bestStability = 0;
  let lowestComplexity = 1.0;
  let bestGoalAchievement = 0;
  let bestChromaticism = 0;
  let bestBassSmoothness = 0;
  let bestPedagogicalImpact = 0;

  if (rank1Paths.length > 0) {
    bestTension = Math.max(...rank1Paths.map(p => p.objectives.tension));
    bestVoiceLeading = Math.max(...rank1Paths.map(p => p.objectives.voiceLeading));
    bestStability = Math.max(...rank1Paths.map(p => p.objectives.functionalStability));
    lowestComplexity = Math.min(...rank1Paths.map(p => p.objectives.physicalComplexity));
    bestGoalAchievement = Math.max(...rank1Paths.map(p => p.objectives.goalAchievement));
    bestChromaticism = Math.max(...rank1Paths.map(p => p.objectives.chromaticism));
    bestBassSmoothness = Math.max(...rank1Paths.map(p => p.objectives.bassSmoothness));
    bestPedagogicalImpact = Math.max(...rank1Paths.map(p => p.objectives.pedagogicalImpact));
  }

  const { hv, stdError } = computeHypervolume(rank1Paths);
  const spread = computeSpread(rank1Paths);
  const spacing = computeSpacing(rank1Paths);
  const candidateCount = candidatePaths.length;
  const frontierCount = rank1Paths.length;
  const frontierCompressionRatio = candidateCount > 0 ? Number((frontierCount / candidateCount).toFixed(4)) : 0.0;
  const frontierOccupancyIndex = Number((hv * spread).toFixed(4));

  return {
    paths: rank1Paths,
    frontierSize: rank1Paths.length,
    dominatedCount,
    objectiveSummary: {
      bestTension: Number(bestTension.toFixed(4)),
      bestVoiceLeading: Number(bestVoiceLeading.toFixed(4)),
      bestStability: Number(bestStability.toFixed(4)),
      lowestComplexity: Number(lowestComplexity.toFixed(4)),
      bestGoalAchievement: Number(bestGoalAchievement.toFixed(4)),
      bestChromaticism: Number(bestChromaticism.toFixed(4)),
      bestBassSmoothness: Number(bestBassSmoothness.toFixed(4)),
      bestPedagogicalImpact: Number(bestPedagogicalImpact.toFixed(4))
    },
    hypervolume: hv,
    hypervolumeStdError: stdError,
    spread,
    spacing,
    candidateCount,
    frontierCount,
    frontierCompressionRatio,
    frontierOccupancyIndex
  };
}

/**
 * Registro de Perfis de Otimização (pesos lineares normalizados).
 */
export const OPTIMIZATION_PROFILES: Record<OptimizationProfile, Record<keyof ObjectiveVector, number>> = {
  BALANCED: {
    tension: 1/7,
    chromaticism: 1/7,
    bassSmoothness: 1/7,
    functionalStability: 1/7,
    voiceLeading: 1/7,
    playability: 1/7,
    pedagogicalImpact: 1/7,
    goalAchievement: 0.0,
    physicalComplexity: 0.0
  },
  MAX_TENSION: {
    tension: 0.35,
    goalAchievement: 0.25,
    chromaticism: 0.40/6,
    bassSmoothness: 0.40/6,
    functionalStability: 0.40/6,
    voiceLeading: 0.40/6,
    playability: 0.40/6,
    pedagogicalImpact: 0.40/6,
    physicalComplexity: 0.0
  },
  MAX_STABILITY: {
    functionalStability: 0.35,
    voiceLeading: 0.25,
    tension: 0.40/6,
    chromaticism: 0.40/6,
    bassSmoothness: 0.40/6,
    playability: 0.40/6,
    pedagogicalImpact: 0.40/6,
    goalAchievement: 0.40/6,
    physicalComplexity: 0.0
  },
  MAX_PLAYABILITY: {
    playability: 0.45,
    voiceLeading: 0.20,
    tension: 0.35/6,
    chromaticism: 0.35/6,
    bassSmoothness: 0.35/6,
    functionalStability: 0.35/6,
    pedagogicalImpact: 0.35/6,
    goalAchievement: 0.35/6,
    physicalComplexity: 0.0
  },
  MAX_VOICE_LEADING: {
    voiceLeading: 0.45,
    bassSmoothness: 0.20,
    tension: 0.35/6,
    chromaticism: 0.35/6,
    functionalStability: 0.35/6,
    playability: 0.35/6,
    pedagogicalImpact: 0.35/6,
    goalAchievement: 0.35/6,
    physicalComplexity: 0.0
  },
  MAX_PEDAGOGY: {
    pedagogicalImpact: 0.45,
    goalAchievement: 0.20,
    tension: 0.35/6,
    chromaticism: 0.35/6,
    bassSmoothness: 0.35/6,
    functionalStability: 0.35/6,
    voiceLeading: 0.35/6,
    playability: 0.35/6,
    physicalComplexity: 0.0
  }
};

/**
 * Reordena os caminhos da fronteira com base nos pesos do perfil selecionado.
 */
export function rankParetoFrontier(
  frontier: ParetoFrontier,
  profile: OptimizationProfile = 'BALANCED'
): void {
  const weights = OPTIMIZATION_PROFILES[profile] || OPTIMIZATION_PROFILES.BALANCED;

  for (const path of frontier.paths) {
    let score = 0;
    score += path.objectives.tension * weights.tension;
    score += path.objectives.chromaticism * weights.chromaticism;
    score += path.objectives.bassSmoothness * weights.bassSmoothness;
    score += path.objectives.functionalStability * weights.functionalStability;
    score += path.objectives.voiceLeading * weights.voiceLeading;
    score += path.objectives.playability * weights.playability;
    score += path.objectives.pedagogicalImpact * weights.pedagogicalImpact;
    score += path.objectives.goalAchievement * weights.goalAchievement;

    path.score = Number(score.toFixed(4));
  }

  // Ordena a fronteira por score descendente, com desempate por crowdingDistance descendente
  frontier.paths.sort((a, b) => {
    const diffScore = (b.score ?? 0) - (a.score ?? 0);
    if (Math.abs(diffScore) > 0.0001) return diffScore;

    return b.crowdingDistance - a.crowdingDistance;
  });
}
