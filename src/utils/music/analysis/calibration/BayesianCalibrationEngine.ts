import { computeComplexityScore, getMaximumProbability } from './ContextualConfidenceModel';

export interface CalibratedHypothesis {
  root: string;
  mode: 'MAJOR' | 'MINOR';
  probability: number;
  harmonicFunction: string;
  contextualFunction?: string;
}

export interface CalibrationResult {
  hypotheses: CalibratedHypothesis[];
  pcs: number;
}

export function calibrateHypotheses(
  hypotheses: CalibratedHypothesis[],
  chordSymbol: string
): CalibrationResult {
  if (hypotheses.length === 0) {
    return { hypotheses: [], pcs: 0 };
  }

  // 1. Compute entropy and HDS / HDC of raw hypotheses
  const rawProbs = hypotheses.map(h => h.probability);
  const rawEntropy = -rawProbs.reduce((sum, p) => p > 0 ? sum + p * Math.log(p) : sum, 0);
  const hds = Math.exp(rawEntropy);
  
  // Quick estimate of functional distance for HDC
  let hdc = 0;
  if (hypotheses.length > 1) {
    // If the top two keys have different roots, assign maximum functional distance
    const root1 = hypotheses[0].root;
    const root2 = hypotheses[1].root;
    if (root1 !== root2) hdc = 1.0;
  }

  // 2. Compute dynamic complexity and maximum allowed probability
  const complexity = computeComplexityScore(chordSymbol, hds, hdc);
  const pMax = getMaximumProbability(complexity);

  // 3. Apply Temperature Scaling
  // Temperature increases with complexity to soften overconfident distributions
  const temperature = 1.0 + 1.2 * complexity;
  
  // Convert probabilities to logits, apply temperature, and softmax
  const logits = rawProbs.map(p => Math.log(Math.max(p, 1e-9)));
  const expLogits = logits.map(l => Math.exp(l / temperature));
  const sumExp = expLogits.reduce((sum, val) => sum + val, 0);
  let calibratedProbs = expLogits.map(val => sumExp > 0 ? val / sumExp : 0);

  // 4. Bound the primary probability with Pmax and redistribute
  if (calibratedProbs[0] > pMax) {
    const diff = calibratedProbs[0] - pMax;
    calibratedProbs[0] = pMax;
    const alternativesSum = calibratedProbs.slice(1).reduce((s, e) => s + e, 0);
    if (alternativesSum > 0) {
      for (let i = 1; i < calibratedProbs.length; i++) {
        calibratedProbs[i] += (calibratedProbs[i] / alternativesSum) * diff;
      }
    } else if (calibratedProbs.length > 1) {
      // If sum of alternatives was 0, distribute equally
      const share = diff / (calibratedProbs.length - 1);
      for (let i = 1; i < calibratedProbs.length; i++) {
        calibratedProbs[i] += share;
      }
    }
  }

  // Map calibrated probabilities back to hypotheses list
  const calibratedHypotheses = hypotheses.map((h, idx) => ({
    ...h,
    probability: Number(calibratedProbs[idx].toFixed(4))
  }));

  // Re-normalize to sum to 1.0 exactly
  const finalSum = calibratedHypotheses.reduce((s, h) => s + h.probability, 0);
  if (finalSum > 0) {
    calibratedHypotheses.forEach(h => {
      h.probability = Number((h.probability / finalSum).toFixed(4));
    });
  }

  // 5. Compute PCS (Posterior Confidence Score) using entropy relative to max possible entropy
  const finalProbs = calibratedHypotheses.map(h => h.probability);
  const finalEntropy = -finalProbs.reduce((sum, p) => p > 0 ? sum + p * Math.log(p) : sum, 0);
  const K = finalProbs.length;
  const hMax = K > 1 ? Math.log(K) : 1.0;
  const pTop = finalProbs[0];
  const pcs = Number((pTop * (1.0 - (hMax > 0 ? finalEntropy / hMax : 0.0))).toFixed(4));

  return {
    hypotheses: calibratedHypotheses,
    pcs
  };
}
