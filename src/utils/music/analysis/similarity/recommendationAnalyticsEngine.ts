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
    // Collect mechanisms from applications
    if (exec.applications) {
      for (const app of exec.applications) {
        const mech = normalizeMechanism(app.transformationId);
        typeDist[mech]++;
      }
    }

    // Goal Achievement
    if (exec.goalAchievement) {
      sumGoalAchievement += exec.goalAchievement.score;
      countGoalAchievement++;
    }

    // Constraint evaluation & failures
    if (exec.constraintEvaluation) {
      sumConstraintPenalty += exec.constraintEvaluation.totalPenalty;
      countConstraintPenalty++;

      countConstraintEvaluations++;
      if (exec.constraintEvaluation.passed === false || exec.constraintEvaluation.hardViolations > 0) {
        countHardConstraintFailures++;
      }
    }

    // State Profile Metrics
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

  // Pareto Size
  let sumParetoSize = 0;
  const paretoSizes = options?.paretoSizes || [];
  for (const size of paretoSizes) {
    sumParetoSize += size;
  }
  const averageParetoSize = paretoSizes.length > 0 ? sumParetoSize / paretoSizes.length : 0;

  // Decision Confidence
  let sumConfidence = 0;
  const decisionConfidences = options?.decisionConfidences || [];
  for (const conf of decisionConfidences) {
    sumConfidence += conf;
  }
  const averageDecisionConfidence = decisionConfidences.length > 0 ? sumConfidence / decisionConfidences.length : 0;

  // Playability
  let sumPlayability = 0;
  const playabilities = options?.playabilities || [];
  for (const play of playabilities) {
    sumPlayability += play;
  }
  const averagePlayability = playabilities.length > 0 ? sumPlayability / playabilities.length : 0;

  // Dominant Factors distribution
  const dominantFactors = options?.dominantFactors || [];
  for (const factor of dominantFactors) {
    const normFactor = normalizeDominantFactor(factor);
    factorDist[normFactor]++;
  }

  // Calculate final averages
  const averageGoalAchievement = countGoalAchievement > 0 ? sumGoalAchievement / countGoalAchievement : 0;
  const averageConstraintPenalty = countConstraintPenalty > 0 ? sumConstraintPenalty / countConstraintPenalty : 0;
  const hardConstraintFailureRate = countConstraintEvaluations > 0 ? countHardConstraintFailures / countConstraintEvaluations : 0;

  const averageFunctionalStability = countFunctionalStability > 0 ? sumFunctionalStability / countFunctionalStability : 0;
  const averageTension = countTension > 0 ? sumTension / countTension : 0;
  const averageVoiceLeading = countVoiceLeading > 0 ? sumVoiceLeading / countVoiceLeading : 0;

  // Shannon Entropy and Effective Mechanism Count
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

  // Path length calculations
  let sumPathLength = 0;
  const pathLengthDist: Record<number, number> = {};
  for (const exec of executions) {
    const len = exec.applications ? exec.applications.length : 0;
    sumPathLength += len;
    pathLengthDist[len] = (pathLengthDist[len] || 0) + 1;
  }
  const averagePathLength = executions.length > 0 ? Number((sumPathLength / executions.length).toFixed(4)) : 0;

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
    mechanismDominanceRatio
  };
}

/**
 * Adapter that computes recommendation analytics over a list of DiscoveryMatches.
 */
export function computeDiscoveryAnalytics(matches: DiscoveryMatch[]): RecommendationAnalytics {
  const executions: TransformationExecutionResult[] = [];
  const paretoSizes: number[] = [];
  const dominantFactors: DominantDecisionFactor[] = [];
  const decisionConfidences: number[] = [];
  const playabilities: number[] = [];

  for (const match of matches) {
    if (match.recommendedPaths && match.recommendedPaths.length > 0) {
      const winner = match.recommendedPaths[0];
      if (winner.executionResult) {
        executions.push(winner.executionResult);
      }
      
      // Calculate playability as (1.0 - max physicalComplexity of steps)
      const maxComplexity = winner.steps.length > 0
        ? Math.max(...winner.steps.map(s => s.physicalComplexity))
        : 0;
      playabilities.push(1.0 - maxComplexity);
    }

    if (match.paretoFrontier) {
      paretoSizes.push(match.paretoFrontier.frontierSize);
    }

    if (match.recommendationDecision) {
      dominantFactors.push(normalizeDominantFactor(match.recommendationDecision.dominantFactor));
      decisionConfidences.push(match.recommendationDecision.confidence);
    }
  }

  return computeRecommendationAnalytics(executions, {
    paretoSizes,
    dominantFactors,
    decisionConfidences,
    playabilities
  });
}
