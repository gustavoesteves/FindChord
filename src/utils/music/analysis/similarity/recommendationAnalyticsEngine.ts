import type {
  TransformationExecutionResult,
  DiscoveryMatch,
  RecommendationAnalytics,
  DominantDecisionFactor,
  RecommendationMechanism
} from '../models/Discovery';

/**
 * Normalizes any transformation ID or mechanism name to the defined RecommendationMechanism enum.
 */
export function normalizeMechanism(mechanism: string): RecommendationMechanism {
  const m = mechanism.toUpperCase();
  if (m.includes('TRITONE_SUBSTITUTION') || m.includes('TRITONE')) {
    return 'TRITONE_SUBSTITUTION';
  }
  if (m.includes('MODAL_BORROWING') || m.includes('MODAL')) {
    return 'MODAL_BORROWING';
  }
  if (m.includes('SECONDARY_DOMINANT') || m.includes('SECONDARY')) {
    return 'SECONDARY_DOMINANT';
  }
  if (m.includes('FUNCTIONAL_EXPANSION') || m.includes('EXPANSION')) {
    return 'FUNCTIONAL_EXPANSION';
  }
  if (m.includes('CADENTIAL_REINTERPRETATION') || m.includes('CADENTIAL')) {
    return 'CADENTIAL_REINTERPRETATION';
  }
  if (m.includes('FUNCTIONAL_COMPRESSION') || m.includes('COMPRESSION')) {
    return 'FUNCTIONAL_COMPRESSION';
  }
  return 'OTHER';
}

/**
 * Normalizes any decision factor string to the defined DominantDecisionFactor enum.
 */
export function normalizeDominantFactor(factor: string): DominantDecisionFactor {
  const f = factor.toUpperCase();
  if (f.includes('GOAL_ALIGNMENT')) return 'GOAL_ALIGNMENT';
  if (f.includes('GOAL_ACHIEVEMENT')) return 'GOAL_ACHIEVEMENT';
  if (f.includes('CONSTRAINTS') || f.includes('CONSTRAINT_PENALTY')) return 'CONSTRAINTS';
  if (f.includes('PEDAGOGICAL_IMPACT') || f.includes('PEDAGOGICAL_SCORE') || f.includes('PEDAGOGICAL')) return 'PEDAGOGICAL_IMPACT';
  if (f.includes('PARETO_RANKING') || f.includes('PARETO')) return 'PARETO_RANKING';
  return 'GOAL_ALIGNMENT'; // fallback default
}

/**
 * Computes recommendation analytics over raw transformation execution results.
 */
export function computeRecommendationAnalytics(
  executions: TransformationExecutionResult[],
  options?: {
    paretoSizes?: number[];
    dominantFactors?: (DominantDecisionFactor | string)[];
    decisionConfidences?: number[];
    playabilities?: number[];
    targets?: number[];
    hypervolumes?: number[];
    spreads?: number[];
    spacings?: number[];
    compressionRatios?: number[];
    occupancyIndices?: number[];
    scoreGapsRaw?: number[];
    scoreGapsWeighted?: number[];
    constraintMarginsRaw?: number[];
    constraintMarginsWeighted?: number[];
    goalAlignmentsRaw?: number[];
    goalAlignmentsWeighted?: number[];
    geometriesRaw?: number[];
    geometriesWeighted?: number[];
    frontierEntropies?: number[];
    normalizedEntropies?: number[];
    effectiveFrontierSizes?: number[];
    ambiguityFactors?: number[];
    informationGains?: number[];
    ambiguitiesRaw?: number[];
    ambiguitiesWeighted?: number[];
  }
 ): RecommendationAnalytics {
  const typeDist: Record<RecommendationMechanism, number> = {
    MODAL_BORROWING: 0,
    TRITONE_SUBSTITUTION: 0,
    FUNCTIONAL_EXPANSION: 0,
    SECONDARY_DOMINANT: 0,
    CADENTIAL_REINTERPRETATION: 0,
    FUNCTIONAL_COMPRESSION: 0,
    OTHER: 0
  };

  const factorDist: Record<DominantDecisionFactor, number> = {
    GOAL_ALIGNMENT: 0,
    GOAL_ACHIEVEMENT: 0,
    CONSTRAINTS: 0,
    PEDAGOGICAL_IMPACT: 0,
    PARETO_RANKING: 0
  };

  let sumGoalAchievement = 0;
  let countGoalAchievement = 0;
  let sumConstraintPenalty = 0;
  let countConstraintPenalty = 0;
  let countHardConstraintFailures = 0;
  let countConstraintEvaluations = 0;

  let sumFunctionalStability = 0;
  let countFunctionalStability = 0;
  let sumTension = 0;
  let countTension = 0;
  let sumVoiceLeading = 0;
  let countVoiceLeading = 0;

  for (const exec of executions) {
    if (exec.applications) {
      for (const app of exec.applications) {
        const mech = normalizeMechanism(app.transformationId);
        typeDist[mech]++;
      }
    }

    if (exec.goalAchievement) {
      sumGoalAchievement += exec.goalAchievement.score;
      countGoalAchievement++;
    }

    if (exec.constraintEvaluation) {
      sumConstraintPenalty += exec.constraintEvaluation.totalPenalty;
      countConstraintPenalty++;

      countConstraintEvaluations++;
      if (exec.constraintEvaluation.passed === false || exec.constraintEvaluation.hardViolations > 0) {
        countHardConstraintFailures++;
      }
    }

    if (exec.stateTransition?.after) {
      const after = exec.stateTransition.after;
      if (typeof after.functionalStability === 'number') {
        sumFunctionalStability += after.functionalStability;
        countFunctionalStability++;
      }
      if (typeof after.tension === 'number') {
        sumTension += after.tension;
        countTension++;
      }
      if (typeof after.voiceLeadingQuality === 'number') {
        sumVoiceLeading += after.voiceLeadingQuality;
        countVoiceLeading++;
      }
    }
  }

  const paretoSizes = options?.paretoSizes || [];
  const sumParetoSize = paretoSizes.reduce((a, b) => a + b, 0);
  const averageParetoSize = paretoSizes.length > 0 ? sumParetoSize / paretoSizes.length : 0;

  const decisionConfidences = options?.decisionConfidences || [];
  const sumConfidence = decisionConfidences.reduce((a, b) => a + b, 0);
  const averageDecisionConfidence = decisionConfidences.length > 0 ? sumConfidence / decisionConfidences.length : 0;

  const playabilities = options?.playabilities || [];
  const sumPlayability = playabilities.reduce((a, b) => a + b, 0);
  const averagePlayability = playabilities.length > 0 ? sumPlayability / playabilities.length : 0;

  const dominantFactors = options?.dominantFactors || [];
  for (const factor of dominantFactors) {
    const normFactor = normalizeDominantFactor(factor);
    factorDist[normFactor]++;
  }

  const averageGoalAchievement = countGoalAchievement > 0 ? sumGoalAchievement / countGoalAchievement : 0;
  const averageConstraintPenalty = countConstraintPenalty > 0 ? sumConstraintPenalty / countConstraintPenalty : 0;
  const hardConstraintFailureRate = countConstraintEvaluations > 0 ? countHardConstraintFailures / countConstraintEvaluations : 0;

  const averageFunctionalStability = countFunctionalStability > 0 ? sumFunctionalStability / countFunctionalStability : 0;
  const averageTension = countTension > 0 ? sumTension / countTension : 0;
  const averageVoiceLeading = countVoiceLeading > 0 ? sumVoiceLeading / countVoiceLeading : 0;

  const totalApps = Object.values(typeDist).reduce((sum, count) => sum + count, 0);
  let entropy = 0;
  if (totalApps > 0) {
    for (const count of Object.values(typeDist)) {
      if (count > 0) {
        const p = count / totalApps;
        entropy -= p * Math.log2(p);
      }
    }
  }
  const mechanismEntropy = Number(entropy.toFixed(4));
  const effectiveMechanismCount = totalApps > 0 ? Number(Math.pow(2, entropy).toFixed(4)) : 0;

  const maxCount = Math.max(...Object.values(typeDist));
  const mechanismDominanceRatio = totalApps > 0 ? Number((maxCount / totalApps).toFixed(4)) : 0;

  let sumPathLength = 0;
  const pathLengthDist: Record<number, number> = {};
  for (const exec of executions) {
    const len = exec.applications ? exec.applications.length : 0;
    sumPathLength += len;
    pathLengthDist[len] = (pathLengthDist[len] || 0) + 1;
  }
  const averagePathLength = executions.length > 0 ? Number((sumPathLength / executions.length).toFixed(4)) : 0;

  const getPercentile = (sorted: number[], p: number): number => {
    if (sorted.length === 0) return 0;
    const idx = (p / 100) * (sorted.length - 1);
    const low = Math.floor(idx);
    const high = Math.ceil(idx);
    const weight = idx - low;
    return (1 - weight) * sorted[low] + weight * sorted[high];
  };

  const calculateStdDev = (vals: number[], avg: number): number => {
    if (vals.length === 0) return 0.0;
    const variance = vals.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / vals.length;
    return Number(Math.sqrt(variance).toFixed(4));
  };

  // Discrimination metrics
  let confidenceStdDev = 0;
  let confidenceDynamicRange = 0;
  let confidenceEntropy = 0;
  let confidenceP90MinusP10 = 0;
  let confidenceResolution = 0;
  let occupiedReliabilityBins = 0;

  if (decisionConfidences.length > 0) {
    const avg = decisionConfidences.reduce((sum, v) => sum + v, 0) / decisionConfidences.length;
    confidenceStdDev = calculateStdDev(decisionConfidences, avg);

    const max = Math.max(...decisionConfidences);
    const min = Math.min(...decisionConfidences);
    confidenceDynamicRange = Number((max - min).toFixed(4));

    const bins = Array(10).fill(0);
    for (const v of decisionConfidences) {
      let bIdx = Math.floor(v * 10);
      if (bIdx >= 10) bIdx = 9;
      if (bIdx < 0) bIdx = 0;
      bins[bIdx]++;
    }
    let entropy = 0;
    for (const count of bins) {
      if (count > 0) {
        const p = count / decisionConfidences.length;
        entropy -= p * Math.log2(p);
      }
    }
    confidenceEntropy = Number(entropy.toFixed(4));
    occupiedReliabilityBins = bins.filter(count => count > 0).length;

    const sorted = [...decisionConfidences].sort((a, b) => a - b);
    const p90 = getPercentile(sorted, 90);
    const p10 = getPercentile(sorted, 10);
    confidenceP90MinusP10 = Number((p90 - p10).toFixed(4));

    const resolutionBins: { target: number }[][] = Array.from({ length: 10 }, () => []);
    for (let i = 0; i < decisionConfidences.length; i++) {
      const conf = decisionConfidences[i];
      const target = options?.targets?.[i] ?? executions[i]?.goalAchievement?.score ?? 0;
      let bIdx = Math.floor(conf * 10);
      if (bIdx >= 10) bIdx = 9;
      if (bIdx < 0) bIdx = 0;
      resolutionBins[bIdx].push({ target });
    }
    const successRates: number[] = [];
    for (const bin of resolutionBins) {
      if (bin.length > 0) {
        const avgTarget = bin.reduce((sum, s) => sum + s.target, 0) / bin.length;
        successRates.push(avgTarget);
      }
    }
    if (successRates.length > 0) {
      const avgRate = successRates.reduce((sum, r) => sum + r, 0) / successRates.length;
      const vr = successRates.reduce((sum, r) => sum + Math.pow(r - avgRate, 2), 0) / successRates.length;
      confidenceResolution = Number(vr.toFixed(4));
    }
  }

  // Geometry Metrics Aggregations
  const hypervolumes = options?.hypervolumes || [];
  const averageHypervolume = hypervolumes.length > 0 ? Number((hypervolumes.reduce((a, b) => a + b, 0) / hypervolumes.length).toFixed(4)) : 0.0;
  const hypervolumeStdDev = calculateStdDev(hypervolumes, averageHypervolume);

  const spreads = options?.spreads || [];
  const averageSpread = spreads.length > 0 ? Number((spreads.reduce((a, b) => a + b, 0) / spreads.length).toFixed(4)) : 0.0;
  const spreadStdDev = calculateStdDev(spreads, averageSpread);

  const spacings = options?.spacings || [];
  const averageSpacing = spacings.length > 0 ? Number((spacings.reduce((a, b) => a + b, 0) / spacings.length).toFixed(4)) : 0.0;
  const spacingStdDev = calculateStdDev(spacings, averageSpacing);

  const compressionRatios = options?.compressionRatios || [];
  const averageFrontierCompressionRatio = compressionRatios.length > 0 ? Number((compressionRatios.reduce((a, b) => a + b, 0) / compressionRatios.length).toFixed(4)) : 0.0;

  const occupancyIndices = options?.occupancyIndices || [];
  const averageFrontierOccupancyIndex = occupancyIndices.length > 0 ? Number((occupancyIndices.reduce((a, b) => a + b, 0) / occupancyIndices.length).toFixed(4)) : 0.0;

  const scoreGapsRaw = options?.scoreGapsRaw || [];
  const averageScoreGapRaw = scoreGapsRaw.length > 0 ? Number((scoreGapsRaw.reduce((a, b) => a + b, 0) / scoreGapsRaw.length).toFixed(4)) : 0.0;

  const scoreGapsWeighted = options?.scoreGapsWeighted || [];
  const averageScoreGapWeighted = scoreGapsWeighted.length > 0 ? Number((scoreGapsWeighted.reduce((a, b) => a + b, 0) / scoreGapsWeighted.length).toFixed(4)) : 0.0;

  const constraintMarginsRaw = options?.constraintMarginsRaw || [];
  const averageConstraintMarginRaw = constraintMarginsRaw.length > 0 ? Number((constraintMarginsRaw.reduce((a, b) => a + b, 0) / constraintMarginsRaw.length).toFixed(4)) : 0.0;

  const constraintMarginsWeighted = options?.constraintMarginsWeighted || [];
  const averageConstraintMarginWeighted = constraintMarginsWeighted.length > 0 ? Number((constraintMarginsWeighted.reduce((a, b) => a + b, 0) / constraintMarginsWeighted.length).toFixed(4)) : 0.0;

  const goalAlignmentsRaw = options?.goalAlignmentsRaw || [];
  const averageGoalAlignmentRaw = goalAlignmentsRaw.length > 0 ? Number((goalAlignmentsRaw.reduce((a, b) => a + b, 0) / goalAlignmentsRaw.length).toFixed(4)) : 0.0;

  const goalAlignmentsWeighted = options?.goalAlignmentsWeighted || [];
  const averageGoalAlignmentWeighted = goalAlignmentsWeighted.length > 0 ? Number((goalAlignmentsWeighted.reduce((a, b) => a + b, 0) / goalAlignmentsWeighted.length).toFixed(4)) : 0.0;

  const geometriesRaw = options?.geometriesRaw || [];
  const averageGeometryRaw = geometriesRaw.length > 0 ? Number((geometriesRaw.reduce((a, b) => a + b, 0) / geometriesRaw.length).toFixed(4)) : 0.0;

  const geometriesWeighted = options?.geometriesWeighted || [];
  const averageGeometryWeighted = geometriesWeighted.length > 0 ? Number((geometriesWeighted.reduce((a, b) => a + b, 0) / geometriesWeighted.length).toFixed(4)) : 0.0;

  const frontierEntropies = options?.frontierEntropies || [];
  const averageFrontierEntropy = frontierEntropies.length > 0 ? Number((frontierEntropies.reduce((a, b) => a + b, 0) / frontierEntropies.length).toFixed(4)) : 0.0;

  const normalizedEntropies = options?.normalizedEntropies || [];
  const averageNormalizedEntropy = normalizedEntropies.length > 0 ? Number((normalizedEntropies.reduce((a, b) => a + b, 0) / normalizedEntropies.length).toFixed(4)) : 0.0;

  const effectiveFrontierSizes = options?.effectiveFrontierSizes || [];
  const averageEffectiveFrontierSize = effectiveFrontierSizes.length > 0 ? Number((effectiveFrontierSizes.reduce((a, b) => a + b, 0) / effectiveFrontierSizes.length).toFixed(4)) : 1.0;

  const ambiguityFactors = options?.ambiguityFactors || [];
  const averageAmbiguityFactor = ambiguityFactors.length > 0 ? Number((ambiguityFactors.reduce((a, b) => a + b, 0) / ambiguityFactors.length).toFixed(4)) : 0.0;

  const informationGains = options?.informationGains || [];
  const averageInformationGain = informationGains.length > 0 ? Number((informationGains.reduce((a, b) => a + b, 0) / informationGains.length).toFixed(4)) : 1.0;

  const ambiguitiesRaw = options?.ambiguitiesRaw || [];
  const averageAmbiguityRaw = ambiguitiesRaw.length > 0 ? Number((ambiguitiesRaw.reduce((a, b) => a + b, 0) / ambiguitiesRaw.length).toFixed(4)) : 0.0;

  const ambiguitiesWeighted = options?.ambiguitiesWeighted || [];
  const averageAmbiguityWeighted = ambiguitiesWeighted.length > 0 ? Number((ambiguitiesWeighted.reduce((a, b) => a + b, 0) / ambiguitiesWeighted.length).toFixed(4)) : 0.0;

  return {
    recommendationTypeDistribution: typeDist,
    dominantFactorDistribution: factorDist,
    averageGoalAchievement,
    averageConstraintPenalty,
    averageParetoSize,
    averageDecisionConfidence,
    averageFunctionalStability,
    averageTension,
    averageVoiceLeading,
    averagePlayability,
    hardConstraintFailureRate,
    mechanismEntropy,
    effectiveMechanismCount,
    averagePathLength,
    pathLengthDistribution: pathLengthDist,
    mechanismDominanceRatio,
    confidenceEntropy,
    confidenceStdDev,
    confidenceDynamicRange,
    confidenceP90MinusP10,
    confidenceResolution,
    occupiedReliabilityBins,
    averageHypervolume,
    hypervolumeStdDev,
    averageSpread,
    spreadStdDev,
    averageSpacing,
    spacingStdDev,
    averageFrontierCompressionRatio,
    averageFrontierOccupancyIndex,
    averageScoreGapRaw,
    averageScoreGapWeighted,
    averageConstraintMarginRaw,
    averageConstraintMarginWeighted,
    averageGoalAlignmentRaw,
    averageGoalAlignmentWeighted,
    averageGeometryRaw,
    averageGeometryWeighted,
    averageFrontierEntropy,
    averageNormalizedEntropy,
    averageEffectiveFrontierSize,
    averageAmbiguityFactor,
    averageInformationGain,
    averageAmbiguityRaw,
    averageAmbiguityWeighted
  };
}

export function computeDiscoveryAnalytics(
  matches: DiscoveryMatch[],
  options?: { targets?: number[] }
): RecommendationAnalytics {
  const executions: TransformationExecutionResult[] = [];
  const paretoSizes: number[] = [];
  const dominantFactors: DominantDecisionFactor[] = [];
  const decisionConfidences: number[] = [];
  const playabilities: number[] = [];
  const hypervolumes: number[] = [];
  const spreads: number[] = [];
  const spacings: number[] = [];
  const compressionRatios: number[] = [];
  const occupancyIndices: number[] = [];

  const scoreGapsRaw: number[] = [];
  const scoreGapsWeighted: number[] = [];
  const constraintMarginsRaw: number[] = [];
  const constraintMarginsWeighted: number[] = [];
  const goalAlignmentsRaw: number[] = [];
  const goalAlignmentsWeighted: number[] = [];
  const geometriesRaw: number[] = [];
  const geometriesWeighted: number[] = [];

  const frontierEntropies: number[] = [];
  const normalizedEntropies: number[] = [];
  const effectiveFrontierSizes: number[] = [];
  const ambiguityFactors: number[] = [];
  const informationGains: number[] = [];
  const ambiguitiesRaw: number[] = [];
  const ambiguitiesWeighted: number[] = [];

  for (const match of matches) {
    if (match.recommendedPaths && match.recommendedPaths.length > 0) {
      const winner = match.recommendedPaths[0];
      if (winner.executionResult) {
        executions.push(winner.executionResult);
      }
      
      const maxComplexity = winner.steps.length > 0
        ? Math.max(...winner.steps.map(s => s.physicalComplexity))
        : 0;
      playabilities.push(1.0 - maxComplexity);
    }

    if (match.paretoFrontier) {
      paretoSizes.push(match.paretoFrontier.frontierSize);
      if (typeof match.paretoFrontier.hypervolume === 'number') hypervolumes.push(match.paretoFrontier.hypervolume);
      if (typeof match.paretoFrontier.spread === 'number') spreads.push(match.paretoFrontier.spread);
      if (typeof match.paretoFrontier.spacing === 'number') spacings.push(match.paretoFrontier.spacing);
      if (typeof match.paretoFrontier.frontierCompressionRatio === 'number') compressionRatios.push(match.paretoFrontier.frontierCompressionRatio);
      if (typeof match.paretoFrontier.frontierOccupancyIndex === 'number') occupancyIndices.push(match.paretoFrontier.frontierOccupancyIndex);
      if (typeof match.paretoFrontier.frontierEntropy === 'number') frontierEntropies.push(match.paretoFrontier.frontierEntropy);
      if (typeof match.paretoFrontier.normalizedEntropy === 'number') normalizedEntropies.push(match.paretoFrontier.normalizedEntropy);
      if (typeof match.paretoFrontier.effectiveFrontierSize === 'number') effectiveFrontierSizes.push(match.paretoFrontier.effectiveFrontierSize);
      if (typeof match.paretoFrontier.ambiguityFactor === 'number') ambiguityFactors.push(match.paretoFrontier.ambiguityFactor);
      if (typeof match.paretoFrontier.informationGain === 'number') informationGains.push(match.paretoFrontier.informationGain);
    }

    if (match.recommendationDecision) {
      dominantFactors.push(normalizeDominantFactor(match.recommendationDecision.dominantFactor));
      decisionConfidences.push(match.recommendationDecision.confidence);
      
      const cb = match.recommendationDecision.confidenceBreakdown;
      if (cb) {
        scoreGapsRaw.push(cb.scoreGapRaw);
        scoreGapsWeighted.push(cb.scoreGapWeighted);
        constraintMarginsRaw.push(cb.constraintMarginRaw);
        constraintMarginsWeighted.push(cb.constraintMarginWeighted);
        goalAlignmentsRaw.push(cb.goalAlignmentRaw);
        goalAlignmentsWeighted.push(cb.goalAlignmentWeighted);
        geometriesRaw.push(cb.geometryRaw);
        geometriesWeighted.push(cb.geometryWeighted);
        if (typeof cb.ambiguityRaw === 'number') ambiguitiesRaw.push(cb.ambiguityRaw);
        if (typeof cb.ambiguityWeighted === 'number') ambiguitiesWeighted.push(cb.ambiguityWeighted);
      }
    }
  }

  return computeRecommendationAnalytics(executions, {
    paretoSizes,
    dominantFactors,
    decisionConfidences,
    playabilities,
    targets: options?.targets,
    hypervolumes,
    spreads,
    spacings,
    compressionRatios,
    occupancyIndices,
    scoreGapsRaw,
    scoreGapsWeighted,
    constraintMarginsRaw,
    constraintMarginsWeighted,
    goalAlignmentsRaw,
    goalAlignmentsWeighted,
    geometriesRaw,
    geometriesWeighted,
    frontierEntropies,
    normalizedEntropies,
    effectiveFrontierSizes,
    ambiguityFactors,
    informationGains,
    ambiguitiesRaw,
    ambiguitiesWeighted
  });
}
