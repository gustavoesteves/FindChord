import type {
  HarmonicConstraint,
  ConstraintEvaluation,
  ConstraintEvaluationResult,
  TransformationExecutionResult,
  RecommendationPath
} from '../models/Discovery';

/**
 * Avalia uma única restrição contra o resultado de execução de um caminho.
 */
export function evaluateConstraint(
  constraint: HarmonicConstraint,
  executionResult: TransformationExecutionResult,
  path: RecommendationPath
): ConstraintEvaluation {
  const metric = constraint.metric;
  let beforeValue = 0;
  let afterValue = 0;
  let label = '';

  switch (metric) {
    case 'TENSION':
      afterValue = executionResult.stateTransition?.after.tension ?? 0;
      beforeValue = executionResult.stateTransition?.before.tension ?? 0;
      label = 'Tensão';
      break;
    case 'CHROMATICISM':
      afterValue = executionResult.stateTransition?.after.chromaticism ?? 0;
      beforeValue = executionResult.stateTransition?.before.chromaticism ?? 0;
      label = 'Cromatismo';
      break;
    case 'BASS_SMOOTHNESS':
      afterValue = executionResult.stateTransition?.after.bassSmoothness ?? 0;
      beforeValue = executionResult.stateTransition?.before.bassSmoothness ?? 0;
      label = 'Suavidade do Baixo';
      break;
    case 'FUNCTIONAL_STABILITY':
      afterValue = executionResult.stateTransition?.after.functionalStability ?? 0;
      beforeValue = executionResult.stateTransition?.before.functionalStability ?? 0;
      label = 'Estabilidade Funcional';
      break;
    case 'VOICE_LEADING':
      afterValue = executionResult.stateTransition?.after.voiceLeadingQuality ?? 0;
      beforeValue = executionResult.stateTransition?.before.voiceLeadingQuality ?? 0;
      label = 'Condução de Vozes';
      break;
    case 'PHYSICAL_COMPLEXITY':
      // Dificuldade física máxima no caminho
      afterValue = Math.max(...path.steps.map(s => s.physicalComplexity), 0);
      beforeValue = 0;
      label = 'Complexidade Física';
      break;
  }

  let violation = 0;
  let reason = '';

  switch (constraint.operator) {
    case 'GREATER_THAN':
      violation = Math.max(0, constraint.value - afterValue);
      if (violation > 0) {
        reason = `${label} caiu abaixo do limite mínimo de ${Math.round(constraint.value * 100)}% (obtido: ${Math.round(afterValue * 100)}%)`;
      }
      break;
    case 'LESS_THAN':
      violation = Math.max(0, afterValue - constraint.value);
      if (violation > 0) {
        reason = `${label} excedeu o limite máximo de ${Math.round(constraint.value * 100)}% (obtido: ${Math.round(afterValue * 100)}%)`;
      }
      break;
    case 'PRESERVE':
      // Usamos uma tolerância embutida de 0.02 para acomodar pequenas variações naturais
      violation = Math.max(0, beforeValue - afterValue - 0.02);
      if (violation > 0) {
        reason = `${label} piorou de ${Math.round(beforeValue * 100)}% para ${Math.round(afterValue * 100)}%`;
      }
      break;
  }

  // Normalização da violação: variação de 0.0 a 1.0 (max possível de violação é 1.0)
  const maxPossibleViolation = 1.0;
  const normalizedViolation = violation / maxPossibleViolation;
  const satisfied = violation <= 0.0001;

  return {
    constraint,
    satisfied,
    violation: Number(normalizedViolation.toFixed(4)),
    metricValue: Number(afterValue.toFixed(4)),
    reason: satisfied ? undefined : reason
  };
}

/**
 * Avalia uma lista de restrições contra o resultado de execução de um caminho,
 * calculando violações estritas (hard) e penalidades acumuladas (soft).
 */
export function evaluatePathConstraints(
  path: RecommendationPath,
  executionResult: TransformationExecutionResult,
  constraints: HarmonicConstraint[]
): ConstraintEvaluationResult {
  const evaluations: ConstraintEvaluation[] = [];
  let hardViolations = 0;
  let softViolations = 0;
  let totalPenalty = 0;

  for (const constraint of constraints) {
    const evaluation = evaluateConstraint(constraint, executionResult, path);
    evaluations.push(evaluation);

    if (!evaluation.satisfied) {
      if (constraint.strict) {
        hardViolations++;
      } else {
        softViolations++;
        const weight = constraint.weight !== undefined ? constraint.weight : 1.0;
        totalPenalty += evaluation.violation * weight;
      }
    }
  }

  const passed = hardViolations === 0;

  return {
    passed,
    hardViolations,
    softViolations,
    totalPenalty: Number(totalPenalty.toFixed(4)),
    evaluations
  };
}
