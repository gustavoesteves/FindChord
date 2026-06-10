import confidenceContextModel from './confidence_context_model.json' with { type: 'json' };

export type ConfidenceContextType = 'global';

export interface ConfidenceWeights {
  scoreGapWeight: number;
  goalAlignmentWeight: number;
  geometryWeight: number;
  ambiguityWeight: number;
  brierScore?: number;
  population?: number;
  lastOptimized?: string;
}

/**
 * Classifica a ambiguidade do cenário. Com a introdução da modelagem contínua na F12.8,
 * a classificação discreta de clusters é simplificada para retornar o contexto unificado 'global'.
 */
export function inferConfidenceContext(
  _frontierSize: number,
  _p33?: number,
  _p66?: number
): ConfidenceContextType {
  return 'global';
}

/**
 * Seleciona os pesos correspondentes ao contexto unificado 'global'.
 */
export function selectConfidenceWeights(context: ConfidenceContextType): ConfidenceWeights {
  const model = confidenceContextModel as unknown as Record<string, ConfidenceWeights>;
  if (model[context]) {
    return model[context];
  }
  // Fallback seguro de pesos globais caso a chave não esteja presente no modelo
  if (model.global) {
    return model.global;
  }
  return {
    scoreGapWeight: 0.50,
    goalAlignmentWeight: 0.15,
    geometryWeight: 0.20,
    ambiguityWeight: 0.15
  };
}
