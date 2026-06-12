import type { TheoryCandidate } from '../models/TheoryCandidate';
import type { FunctionalAnalysis } from '../models/FunctionalAnalysis';
import { EvolutionHistoryStore } from './EvolutionHistoryStore';
import { evaluateTheoryFitness } from './TheorySelectionEngine';

// Generates mutated variants of a candidate theory
export function mutateTheoryCandidate(
  cand: TheoryCandidate,
  _analyses: FunctionalAnalysis[]
): TheoryCandidate[] {
  const variants: TheoryCandidate[] = [];

  // Variant 1: Simplify prototype chords (remove the last chord if length > 2)
  if (cand.prototypeChords.length > 2) {
    variants.push({
      ...cand,
      id: `${cand.id}_mut1`,
      prototypeChords: cand.prototypeChords.slice(0, -1),
      description: `${cand.description} (Protótipos simplificados para maior parcimônia).`
    });
  }

  // Variant 2: Add a rule/property (increase structural explanatory properties)
  variants.push({
    ...cand,
    id: `${cand.id}_mut2`,
    properties: [...cand.properties, 'Regularização de simetria local'],
    description: `${cand.description} (Propriedades expandidas para maior novidade teórica).`
  });

  // Variant 3: Simplify properties (remove the last property if length > 1)
  if (cand.properties.length > 1) {
    variants.push({
      ...cand,
      id: `${cand.id}_mut3`,
      properties: cand.properties.slice(0, -1),
      description: `${cand.description} (Propriedades simplificadas para redução de complexidade).`
    });
  }

  // Variant 4: Add a prototype chord 'C' (expanding range)
  if (!cand.prototypeChords.includes('C')) {
    variants.push({
      ...cand,
      id: `${cand.id}_mut4`,
      prototypeChords: [...cand.prototypeChords, 'C'],
      description: `${cand.description} (Protótipos expandidos).`
    });
  }

  return variants;
}

// Selects the best variant using the multiobjective fitness function:
// Fitness = 0.50 * TMS + 0.30 * GS + 0.20 * TCG
export function selectBestVariant(
  original: TheoryCandidate,
  variants: TheoryCandidate[],
  analyses: FunctionalAnalysis[],
  historyStore: EvolutionHistoryStore,
  clusterAvgTAS: number,
  clusterSize: number
): TheoryCandidate {
  let bestCand = original;

  // Compute original fitness
  const originalFitness = evaluateTheoryFitness(original, analyses, historyStore, clusterAvgTAS, clusterSize);
  let bestFitnessScore = 0.50 * original.metrics.tms + 0.30 * original.metrics.gs + 0.20 * originalFitness.tcg;

  variants.forEach((v) => {
    // 1. Estimate metrics for this variant dynamically based on mutations
    let tcs = original.metrics.tcs;
    let tri = original.metrics.tri;
    let ns = original.metrics.ns;
    let gs = original.metrics.gs;

    // Mut1/Mut3 (Simplifications) improve cohesion (TCS) slightly but might lower novelty (NS)
    if (v.id.includes('mut1')) {
      tcs = Math.min(0.95, tcs + 0.015);
    } else if (v.id.includes('mut2')) {
      // Mut2 (expanded properties) improves novelty (NS) slightly but might lower cohesion
      ns = Math.min(0.95, ns + 0.025);
      tcs = Math.max(0.70, tcs - 0.01);
    } else if (v.id.includes('mut3')) {
      tcs = Math.min(0.95, tcs + 0.01);
      ns = Math.max(0.40, ns - 0.02);
    } else if (v.id.includes('mut4')) {
      // Mut4 (added C chord) improves reproducibility (TRI) slightly
      tri = Math.min(0.95, tri + 0.015);
    }

    // Evaluate dynamic fitness metrics (TCG, TRI2)
    const infoSize = v.prototypeChords.length * 2 + 10; // estimate size based on prototypes
    const vFitness = evaluateTheoryFitness(v, analyses, historyStore, clusterAvgTAS, infoSize);

    // EGS_w gain for variant
    const totalChords = analyses.reduce((sum, a) => sum + a.chords.length, 0);
    const coverage = totalChords > 0 ? infoSize / totalChords : 0.0;
    const egsw = (0.95 - clusterAvgTAS) * coverage + 0.10;

    // TMS = 0.25 * TCS + 0.25 * TRI + 0.20 * GS + 0.15 * EGS_w + 0.15 * NS
    const tms = 0.25 * tcs + 0.25 * tri + 0.20 * gs + 0.15 * egsw + 0.15 * ns;

    const evaluatedVariant: TheoryCandidate = {
      ...v,
      metrics: {
        tcs: Number(tcs.toFixed(4)),
        tri: Number(tri.toFixed(4)),
        gs: Number(gs.toFixed(4)),
        egsw: Number(egsw.toFixed(4)),
        ns: Number(ns.toFixed(4)),
        tms: Number(tms.toFixed(4))
      }
    };

    // Constraint check: GS must be > 0.80
    if (evaluatedVariant.metrics.gs <= 0.80) {
      return;
    }

    // Multiobjective Fitness = 0.50 * TMS + 0.30 * GS + 0.20 * TCG
    const fitnessScore = 0.50 * tms + 0.30 * gs + 0.20 * vFitness.tcg;

    if (fitnessScore > bestFitnessScore && tms > original.metrics.tms) {
      bestFitnessScore = fitnessScore;
      bestCand = evaluatedVariant;
    }
  });

  // Keep original ID to preserve history consistency
  if (bestCand !== original) {
    return {
      ...bestCand,
      id: original.id // preserve original ID
    };
  }

  return original;
}
