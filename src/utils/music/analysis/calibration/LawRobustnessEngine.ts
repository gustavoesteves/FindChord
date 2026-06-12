import type { CounterfactualUniverse } from '../models/CounterfactualUniverse';
import type { ResearchProgram } from '../models/ResearchProgram';

export class LawRobustnessEngine {
  /**
   * Evaluates a research program under a counterfactual universe's rules.
   */
  public static evaluateUniverse(
    universe: CounterfactualUniverse,
    program: ResearchProgram
  ): { ofs: number; pvi: number; tci: number; lawAccuracies: Record<string, number> } {
    let pvi = 0.50;
    const lawAccuracies: Record<string, number> = {};

    const rules = universe.generationRules;

    if (program.id === 'rp_functional') {
      // Functional program laws
      const gravityAcc = rules.tonalGravity * 0.90 + rules.modalPersistence * 0.20 + 0.10;
      lawAccuracies['functional_gravity'] = Number(Math.max(0.20, Math.min(0.95, gravityAcc)).toFixed(4));
      
      // Dependent on tonal gravity
      pvi = rules.tonalGravity * 0.80 + rules.modalPersistence * 0.10 + 0.05;
    } else if (program.id === 'rp_symmetric') {
      // Symmetric program laws
      const axisAcc = rules.symmetryWeight * 0.90 + rules.chromaticFreedom * 0.20 + 0.50;
      lawAccuracies['symmetric_axis'] = Number(Math.max(0.40, Math.min(0.95, axisAcc)).toFixed(4));
      
      // Symmetric properties generalize fairly well
      pvi = rules.symmetryWeight * 0.40 + 0.55;
    } else if (program.id === 'rp_transformational') {
      // Transformational program laws
      const voiceLeadingAcc = rules.chromaticFreedom * 0.80 + rules.tonalGravity * 0.40 + 0.50;
      lawAccuracies['parsimonious_voice_leading'] = Number(Math.max(0.40, Math.min(0.95, voiceLeadingAcc)).toFixed(4));
      
      // Transformational generalizes very well
      pvi = rules.chromaticFreedom * 0.35 + 0.60;
    } else {
      pvi = 0.70;
    }

    pvi = Number(Math.max(0.10, Math.min(0.98, pvi)).toFixed(4));
    
    // Theoretical consilience index (TCI) is inversely proportional to complexity
    const tci = Number(Math.max(0.50, Math.min(0.95, 1.0 - universe.metadata.complexity * 0.15)).toFixed(4));

    // Ontological Fitness Score (OFS) for counterfactual universes
    const ofs = Number((0.60 * pvi + 0.40 * tci).toFixed(4));

    return {
      ofs,
      pvi,
      tci,
      lawAccuracies
    };
  }
}
