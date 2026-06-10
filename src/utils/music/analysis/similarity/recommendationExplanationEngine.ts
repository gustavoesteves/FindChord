import type {
  RecommendationPath,
  HarmonicGoal,
  HarmonicConstraint,
  RecommendationDecision,
  DiscardedAlternative,
  RecommendationTradeoff,
  DominantDecisionFactor,
  HarmonicConstraintMetric,
  ParetoFrontier
} from '../models/Discovery';
import calibrationModel from './calibration_model.json' with { type: 'json' };
import confidenceWeightModel from './confidence_weight_model.json' with { type: 'json' };

function formatGoalName(goal: string): string {
  switch (goal) {
    case 'INCREASE_TENSION': return 'aumentar tensão harmônica';
    case 'REDUCE_TENSION': return 'reduzir tensão harmônica';
    case 'INCREASE_CHROMATICISM': return 'aumentar cromatismo';
    case 'SMOOTHER_BASS': return 'suavizar linha do baixo';
    case 'PRESERVE_FUNCTION': return 'preservar função harmônica';
    case 'JAZZIFY': return 'jazzificar a progressão';
    case 'SIMPLIFY': return 'simplificar a progressão';
    case 'INCREASE_DRAMA': return 'aumentar o contraste dramático';
    default: return goal;
  }
}

function formatMetricLabel(metric: string): string {
  switch (metric) {
    case 'TENSION': return 'tensão harmônica';
    case 'CHROMATICISM': return 'cromatismo';
    case 'BASS_SMOOTHNESS': return 'suavidade do baixo';
    case 'FUNCTIONAL_STABILITY': return 'estabilidade funcional';
    case 'VOICE_LEADING': return 'condução de vozes (voice leading)';
    case 'PHYSICAL_COMPLEXITY': return 'simplicidade física';
    default: return metric;
  }
}

/**
 * Resgata o valor numérico de destino para uma dada métrica de restrição.
 */
function getMetricValue(p: RecommendationPath, metric: HarmonicConstraintMetric): number {
  switch (metric) {
    case 'TENSION':
      return p.executionResult?.stateTransition?.after.tension ?? 0;
    case 'CHROMATICISM':
      return p.executionResult?.stateTransition?.after.chromaticism ?? 0;
    case 'BASS_SMOOTHNESS':
      return p.executionResult?.stateTransition?.after.bassSmoothness ?? 0;
    case 'FUNCTIONAL_STABILITY':
      return p.executionResult?.stateTransition?.after.functionalStability ?? 0;
    case 'VOICE_LEADING':
      return p.executionResult?.stateTransition?.after.voiceLeadingQuality ?? 0;
    case 'PHYSICAL_COMPLEXITY':
      return Math.max(...p.steps.map(s => s.physicalComplexity), 0);
    default:
      return 0;
  }
}

/**
 * Explica as decisões e os trade-offs do recomendador.
 */
export function explainRecommendationDecision(
  selectedPath: RecommendationPath,
  candidatePaths: RecommendationPath[],
  goal?: HarmonicGoal,
  _constraints?: HarmonicConstraint[],
  paretoFrontier?: ParetoFrontier
): RecommendationDecision {
  const selectedPathId = selectedPath.steps.map(s => s.id).join('+') || 'no-transform';
  const selectionReasons: string[] = [];

  // 1. Identificar alternativas viáveis
  const viableAlternatives = candidatePaths.filter(p => {
    const pId = p.steps.map(s => s.id).join('+') || 'no-transform';
    const isSelf = pId === selectedPathId;
    const passed = p.executionResult?.constraintEvaluation?.passed !== false;
    return !isSelf && passed;
  });

  const bestAlternative = viableAlternatives[0]; // Ordenado por finalScore, a primeira alternativa viável é a melhor
  const breakdown = selectedPath.scoreBreakdown || {
    goalAlignment: 0,
    pedagogicalScore: 0,
    goalAchievement: 0,
    constraintPenalty: 0,
    finalScore: 0
  };

  // 2. Determinar dominantFactor e selectionReasons
  let dominantFactor: DominantDecisionFactor = 'PEDAGOGICAL_IMPACT';
  
  if (bestAlternative && bestAlternative.scoreBreakdown) {
    const deltaGoal = goal ? (breakdown.goalAlignment - bestAlternative.scoreBreakdown.goalAlignment) : -1;
    const deltaPenalty = (bestAlternative.scoreBreakdown.constraintPenalty - breakdown.constraintPenalty);
    const deltaAchievement = (breakdown.goalAchievement - bestAlternative.scoreBreakdown.goalAchievement);
    const deltaPedagogical = (breakdown.pedagogicalScore - bestAlternative.scoreBreakdown.pedagogicalScore);

    const maxDelta = Math.max(deltaGoal, deltaPenalty, deltaAchievement, deltaPedagogical);

    if (maxDelta > 0.0001) {
      if (maxDelta === deltaGoal) {
        dominantFactor = 'GOAL_ALIGNMENT';
      } else if (maxDelta === deltaPenalty) {
        dominantFactor = 'CONSTRAINTS';
      } else if (maxDelta === deltaAchievement) {
        dominantFactor = 'GOAL_ACHIEVEMENT';
      } else {
        dominantFactor = 'PEDAGOGICAL_IMPACT';
      }
    } else {
      // Se empatar ou for menor/igual, decide por importância absoluta
      if (goal && breakdown.goalAlignment > 0.4) {
        dominantFactor = 'GOAL_ALIGNMENT';
      } else if (breakdown.goalAchievement > 0.5) {
        dominantFactor = 'GOAL_ACHIEVEMENT';
      } else {
        dominantFactor = 'PEDAGOGICAL_IMPACT';
      }
    }
  } else {
    // Sem alternativas viáveis
    if (goal && breakdown.goalAlignment > 0.4) {
      dominantFactor = 'GOAL_ALIGNMENT';
    } else if (breakdown.goalAchievement > 0.5) {
      dominantFactor = 'GOAL_ACHIEVEMENT';
    } else {
      dominantFactor = 'PEDAGOGICAL_IMPACT';
    }
  }

  // Popula selectionReasons com base no dominantFactor
  if (dominantFactor === 'GOAL_ALIGNMENT' && goal) {
    selectionReasons.push(`Melhor alinhamento estético com a meta de ${formatGoalName(goal)}.`);
  } else if (dominantFactor === 'CONSTRAINTS') {
    selectionReasons.push('Menor penalidade acumulada de restrições.');
  } else if (dominantFactor === 'GOAL_ACHIEVEMENT') {
    selectionReasons.push('Maior taxa de meta observada após a execução real.');
  } else if ((dominantFactor as DominantDecisionFactor) === 'PARETO_RANKING') {
    selectionReasons.push('Melhor posicionamento na ordenação de Pareto.');
  } else {
    selectionReasons.push('Maior pontuação pedagógica e riqueza harmônica acumulada.');
  }

  selectionReasons.push("Selecionado como solução da fronteira de Pareto.");
  selectionReasons.push("Outras alternativas permanecem ótimas sob critérios diferentes.");

  // 3. Identificar descartados e motivos
  const discardedAlternatives: DiscardedAlternative[] = [];

  for (const path of candidatePaths) {
    const pId = path.steps.map(s => s.id).join('+') || 'no-transform';
    if (pId === selectedPathId) continue;

    const diff = breakdown.finalScore - (path.finalScore ?? 0);
    
    // Rastrear falha de hard constraint
    if (path.executionResult?.constraintEvaluation?.passed === false) {
      const ce = path.executionResult.constraintEvaluation;
      const failedEval = ce.evaluations.find(ev => !ev.satisfied && ev.constraint.strict);
      let failedLabel = '';
      if (failedEval) {
        const metricName = formatMetricLabel(failedEval.constraint.metric);
        let targetText = '';
        switch (failedEval.constraint.operator) {
          case 'GREATER_THAN': targetText = `≥ ${Math.round(failedEval.constraint.value * 100)}%`; break;
          case 'LESS_THAN': targetText = `≤ ${Math.round(failedEval.constraint.value * 100)}%`; break;
          case 'PRESERVE': targetText = 'preservada'; break;
        }
        failedLabel = `${metricName} ${targetText}`;
      }

      discardedAlternatives.push({
        pathId: pId,
        reason: 'HARD_CONSTRAINT_FAILURE',
        scoreDifference: diff,
        description: `Caminho descartado por violar restrição estrita de ${failedLabel || 'contorno harmônico'}.`,
        violatedConstraintDescription: failedLabel || undefined
      });
    } else {
      // Comparar scores individuais para deduzir o motivo de descarte
      const pB = path.scoreBreakdown;
      const sB = breakdown;
      
      if (pB && sB) {
        if (pB.goalAlignment < sB.goalAlignment) {
          discardedAlternatives.push({
            pathId: pId,
            reason: 'LOWER_GOAL_ALIGNMENT',
            scoreDifference: diff,
            description: 'Menor alinhamento com a intenção/meta harmônica original.'
          });
        } else if (pB.constraintPenalty > sB.constraintPenalty) {
          discardedAlternatives.push({
            pathId: pId,
            reason: 'HIGHER_CONSTRAINT_PENALTY',
            scoreDifference: diff,
            description: 'Maior acúmulo de penalidade por violação de restrições soft.'
          });
        } else if (pB.goalAchievement < sB.goalAchievement) {
          discardedAlternatives.push({
            pathId: pId,
            reason: 'LOWER_GOAL_ACHIEVEMENT',
            scoreDifference: diff,
            description: 'Menor aproveitamento e alcance de meta observado no circuito fechado.'
          });
        } else {
          discardedAlternatives.push({
            pathId: pId,
            reason: 'LOWER_PEDAGOGICAL_SCORE',
            scoreDifference: diff,
            description: 'Menor riqueza e variedade de transformações pedagógicas.'
          });
        }
      } else {
        discardedAlternatives.push({
          pathId: pId,
          reason: 'LOWER_PEDAGOGICAL_SCORE',
          scoreDifference: diff,
          description: 'Menor ranqueamento geral.'
        });
      }
    }
  }

  // 4. Análise de Trade-offs
  const tradeoffs: RecommendationTradeoff[] = [];
  if (bestAlternative) {
    const metrics: HarmonicConstraintMetric[] = [
      'TENSION',
      'CHROMATICISM',
      'BASS_SMOOTHNESS',
      'FUNCTIONAL_STABILITY',
      'VOICE_LEADING',
      'PHYSICAL_COMPLEXITY'
    ];

    const gains: { metric: HarmonicConstraintMetric; value: number }[] = [];
    const losses: { metric: HarmonicConstraintMetric; value: number }[] = [];

    for (const m of metrics) {
      const selectedVal = getMetricValue(selectedPath, m);
      const altVal = getMetricValue(bestAlternative, m);

      let diff = 0;
      if (m === 'PHYSICAL_COMPLEXITY') {
        diff = altVal - selectedVal; // Menor complexidade é ganho
      } else {
        diff = selectedVal - altVal; // Maior valor é ganho
      }

      if (diff > 0.001) {
        gains.push({ metric: m, value: diff });
      } else if (diff < -0.001) {
        losses.push({ metric: m, value: -diff });
      }
    }

    gains.sort((a, b) => b.value - a.value);
    losses.sort((a, b) => b.value - a.value);

    if (gains.length > 0 && losses.length > 0) {
      const bestAlternativeId = bestAlternative.steps.map(s => s.id).join('+') || 'alternative';
      for (let i = 0; i < Math.min(gains.length, losses.length); i++) {
        const g = gains[i];
        const l = losses[i];
        
        let lostLabel = formatMetricLabel(l.metric);
        let gainedLabel = formatMetricLabel(g.metric);

        tradeoffs.push({
          comparisonPathId: bestAlternativeId,
          metric: g.metric,
          lostMetric: l.metric,
          gained: Number(g.value.toFixed(4)),
          lost: Number(l.value.toFixed(4)),
          explanation: `O caminho escolhido sacrificou parte de ${lostLabel} para obter maior ${gainedLabel}.`
        });
      }
    }
  }

  // 5. Cálculo da Confiança Ponderada
  const selectedScore = breakdown.finalScore;
  const secondBestScore = bestAlternative ? (bestAlternative.finalScore ?? 0) : 0;
  
  // scoreGap = (selectedScore - secondBestScore) limitado a [0.0 - 1.0]. Se não houver 2o colocado, vale 1.0.
  const scoreGap = bestAlternative 
    ? Math.max(0.0, Math.min(1.0, selectedScore - secondBestScore)) 
    : 1.0;
  
  // constraintMargin = 1.0 - totalPenalty limitado a [0.0 - 1.0]
  const penalty = breakdown.constraintPenalty;
  const constraintMargin = Math.max(0.0, Math.min(1.0, 1.0 - penalty));

  // goalAlignment = alinhamento do vencedor. Se sem meta, vale 1.0.
  const goalAlignmentValue = goal ? breakdown.goalAlignment : 1.0;

  // Geometry evaluation based on Pareto frontier metrics
  let geometryFactor = 1.0;
  let paretoAmbiguity = 0.0;
  if (paretoFrontier) {
    const frontierSize = paretoFrontier.frontierSize ?? paretoFrontier.paths?.length ?? 1;
    const hypervolume = paretoFrontier.hypervolume ?? 0;
    const spacing = paretoFrontier.spacing ?? 0;

    // 1. Pareto Size Score (decreases as size increases)
    const sizePenalty = Math.min(1.0, (frontierSize - 1) * 0.05);
    const sizeScore = 1.0 - sizePenalty;

    // 2. Hypervolume Score (decreases as hypervolume increases, avoiding quick saturation)
    const hvPenalty = Math.min(0.5, Math.sqrt(hypervolume));
    const hvScore = 1.0 - hvPenalty;

    // 3. Spacing Score (decreases as spacing increases)
    const spacingPenalty = Math.min(0.5, spacing * 1.0);
    const spacingScore = 1.0 - spacingPenalty;

    // Combine geometry metrics
    geometryFactor = (sizeScore * 0.4) + (hvScore * 0.3) + (spacingScore * 0.3);
    paretoAmbiguity = ((1.0 - sizeScore) * 0.4) + ((1.0 - hvScore) * 0.3) + ((1.0 - spacingScore) * 0.3);
  }

  const wGap = confidenceWeightModel.scoreGapWeight;
  const wGoal = confidenceWeightModel.goalAlignmentWeight;
  const wGeom = confidenceWeightModel.geometryWeight;

  const rawConfidence = (scoreGap * wGap) + (goalAlignmentValue * wGoal) + (geometryFactor * wGeom);
  
  const confidenceBreakdown = {
    scoreGapRaw: Number(scoreGap.toFixed(4)),
    scoreGapWeighted: Number((scoreGap * wGap).toFixed(4)),
    constraintMarginRaw: Number(constraintMargin.toFixed(4)),
    constraintMarginWeighted: 0.0,
    goalAlignmentRaw: Number(goalAlignmentValue.toFixed(4)),
    goalAlignmentWeighted: Number((goalAlignmentValue * wGoal).toFixed(4)),
    geometryRaw: Number(geometryFactor.toFixed(4)),
    geometryWeighted: Number((geometryFactor * wGeom).toFixed(4))
  };

  // Platt Scaling Calibration
  const CALIBRATION_COEFFICIENTS = {
    A: calibrationModel.A,
    B: calibrationModel.B
  };
  const calibratedConfidence = 1.0 / (1.0 + Math.exp(-(CALIBRATION_COEFFICIENTS.A * rawConfidence + CALIBRATION_COEFFICIENTS.B)));
  const confidence = Number(Math.max(0.0, Math.min(1.0, calibratedConfidence)).toFixed(4));

  return {
    selectedPathId,
    selectionReasons,
    discardedAlternatives,
    tradeoffs,
    dominantFactor,
    scoreBreakdown: breakdown,
    confidence,
    rawConfidence,
    paretoAmbiguity: Number(paretoAmbiguity.toFixed(4)),
    confidenceBreakdown
  };
}
