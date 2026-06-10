import type { ParetoFrontier } from '../models/Discovery';
import confidenceContextModel from './confidence_context_model.json' with { type: 'json' };

export const DEFAULT_SOFTMAX_TEMPERATURE = 6.0;

export interface FrontierEntropyResult {
  frontierEntropy: number;
  normalizedEntropy: number;
  effectiveFrontierSize: number;
  ambiguityFactor: number;
  informationGain: number;
  maxProbability: number;
  entropyCompressionRatio: number;
}

/**
 * Calcula a entropia da fronteira de Pareto com base nas contribuições Softmax dos caminhos ótimos.
 */
export function calculateFrontierEntropy(
  frontier: ParetoFrontier,
  customTemperature?: number
): FrontierEntropyResult {
  const paths = frontier.paths || [];
  const n = paths.length;

  if (n === 0) {
    return {
      frontierEntropy: 0.0,
      normalizedEntropy: 0.0,
      effectiveFrontierSize: 1.0,
      ambiguityFactor: 0.0,
      informationGain: 1.0,
      maxProbability: 1.0,
      entropyCompressionRatio: 1.0
    };
  }

  if (n === 1) {
    return {
      frontierEntropy: 0.0,
      normalizedEntropy: 0.0,
      effectiveFrontierSize: 1.0,
      ambiguityFactor: 0.0,
      informationGain: 1.0,
      maxProbability: 1.0,
      entropyCompressionRatio: 1.0
    };
  }

  // Obter temperatura do softmax da configuração persistida ou usar o padrão 6.0
  const meta = (confidenceContextModel as any).meta;
  const lambda = customTemperature !== undefined
    ? customTemperature
    : (meta && typeof meta.softmaxTemperature === 'number' ? meta.softmaxTemperature : DEFAULT_SOFTMAX_TEMPERATURE);

  // 1. Obter os scores normalizados [0.0 - 1.0] para cada caminho da fronteira
  const scores = paths.map(p => {
    if (p.score !== undefined && p.score > 0) {
      return p.score;
    }
    const obj = p.objectives;
    const sum = (
      obj.tension +
      obj.chromaticism +
      obj.bassSmoothness +
      obj.functionalStability +
      obj.voiceLeading +
      obj.playability +
      obj.pedagogicalImpact +
      obj.goalAchievement
    );
    return sum / 8;
  });

  // 2. Aplicar Softmax com a temperatura configurada para amplificar diferenças
  const expScores = scores.map(s => Math.exp(lambda * s));
  const sumExp = expScores.reduce((sum, val) => sum + val, 0);

  let p: number[];
  if (sumExp < 1e-9) {
    p = paths.map(() => 1 / n);
  } else {
    p = expScores.map(val => val / sumExp);
  }

  // 3. Shannon Entropy H
  let H = 0.0;
  for (const prob of p) {
    if (prob > 0.000001) {
      H -= prob * Math.log2(prob);
    }
  }

  // 4. Normalized Entropy H_norm
  const H_norm = H / Math.log2(Math.max(8.0, n));

  const normalizedH = Number(Math.max(0.0, Math.min(1.0, H_norm)).toFixed(4));
  const shannonEntropy = Number(H.toFixed(4));
  const effectiveSize = Number(Math.max(1.0, Math.min(n, Math.pow(2, H))).toFixed(4));
  const ambiguityFactor = normalizedH;
  const informationGain = Number((1.0 - normalizedH).toFixed(4));
  const maxProbability = Number(Math.max(...p).toFixed(4));
  const entropyCompressionRatio = Number((H_norm).toFixed(4)); // Como H_norm = H / H_max, esse é exatamente o entropyCompressionRatio!

  return {
    frontierEntropy: shannonEntropy,
    normalizedEntropy: normalizedH,
    effectiveFrontierSize: effectiveSize,
    ambiguityFactor,
    informationGain,
    maxProbability,
    entropyCompressionRatio
  };
}
