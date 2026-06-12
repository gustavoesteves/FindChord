import type { CounterfactualUniverse } from '../models/CounterfactualUniverse';
import type { ResearchProgram } from '../models/ResearchProgram';

export class CounterfactualConsensusEngine {
  /**
   * Aggregates evaluations across simulated universes to compute program metrics and law invariance.
   * evaluationsByUniverse: Array index matches universe index, maps programId to evaluations.
   */
  public static calculateConsensusMetrics(
    programs: ResearchProgram[],
    universes: CounterfactualUniverse[],
    srsMap: Record<string, number>,
    evaluationsByUniverse: Record<string, { ofs: number; pvi: number; tci: number; lawAccuracies: Record<string, number> }>[]
  ): {
    programMetrics: Record<string, { crs: number; lsi: number; cgs: number; dominantCount: number }>;
    lawInvarianceScores: Record<string, number>;
  } {
    const programMetrics: Record<string, { crs: number; lsi: number; cgs: number; dominantCount: number }> = {};
    const lawInvarianceScores: Record<string, number> = {};

    const universesCount = universes.length;
    const lawUniverseCounts: Record<string, number> = {};

    // Pre-calculate adaptive threshold for each universe: max(0.65, avg_PVI_in_universe)
    const thresholdsByUniverse = universes.map((_, uniIdx) => {
      const uniEval = evaluationsByUniverse[uniIdx];
      const programEvals = Object.values(uniEval);
      const avgPvi = programEvals.length > 0
        ? programEvals.reduce((sum, val) => sum + val.pvi, 0) / programEvals.length
        : 0.65;
      return Math.max(0.65, avgPvi);
    });

    programs.forEach(program => {
      let universesSupported = 0;
      let dominantCount = 0;
      const ofsList: number[] = [];

      universes.forEach((_, uniIdx) => {
        const uniEval = evaluationsByUniverse[uniIdx];
        const programEval = uniEval[program.id];

        if (!programEval) return;

        ofsList.push(programEval.ofs);

        // Adaptive threshold for this universe
        const threshold = thresholdsByUniverse[uniIdx];

        // Check if supported
        if (programEval.pvi >= threshold) {
          universesSupported++;
        }

        // Check if dominant (PVI >= max(otherPrograms.PVI))
        let isDominant = true;
        Object.entries(uniEval).forEach(([otherProgramId, otherEval]) => {
          if (otherProgramId !== program.id && otherEval.pvi > programEval.pvi) {
            isDominant = false;
          }
        });
        if (isDominant) {
          dominantCount++;
        }

        // Aggregate law accuracies for OIS (remains predictive if accuracy >= adaptive threshold)
        Object.entries(programEval.lawAccuracies).forEach(([lawId, acc]) => {
          if (acc >= threshold) {
            lawUniverseCounts[lawId] = (lawUniverseCounts[lawId] || 0) + 1;
          }
        });
      });

      // CRS
      const crs = universesCount > 0 ? universesSupported / universesCount : 0.0;

      // LSI = 1.0 - stdDev(OFS)
      let lsi = 1.0;
      if (ofsList.length > 0) {
        const meanOfs = ofsList.reduce((sum, val) => sum + val, 0) / ofsList.length;
        const variance = ofsList.reduce((sum, val) => sum + Math.pow(val - meanOfs, 2), 0) / ofsList.length;
        const stdDev = Math.sqrt(variance);
        lsi = Math.max(0.0, Math.min(1.0, 1.0 - stdDev));
      }

      // CGS = CRS * LSI * SRS
      const srs = srsMap[program.id] ?? 0.80;
      const cgs = crs * lsi * srs;

      programMetrics[program.id] = {
        crs: Number(crs.toFixed(4)),
        lsi: Number(lsi.toFixed(4)),
        cgs: Number(cgs.toFixed(4)),
        dominantCount
      };
    });

    // OIS_l = lawUniverseCounts[lawId] / universesCount
    Object.keys(lawUniverseCounts).forEach(lawId => {
      const count = lawUniverseCounts[lawId] || 0;
      lawInvarianceScores[lawId] = Number((count / universesCount).toFixed(4));
    });

    // Initialize missing laws with 0.0
    programs.forEach(program => {
      program.hardCorePrinciples.forEach(axiom => {
        if (lawInvarianceScores[axiom.id] === undefined) {
          lawInvarianceScores[axiom.id] = 0.0;
        }
      });
    });

    return {
      programMetrics,
      lawInvarianceScores
    };
  }
}
