import type { ResearchProgram } from '../models/ResearchProgram';
import type { CounterfactualUniverse } from '../models/CounterfactualUniverse';
import type { UniversalLaw } from '../models/UniversalLaw';

export class UniversalLawExtractionEngine {
  /**
   * Extracts universal laws from the active research programs based on multi-dimensional filters.
   */
  public static extractUniversalLaws(
    programs: ResearchProgram[],
    universes: CounterfactualUniverse[],
    evaluationsByUniverse: Record<string, { ofs: number; pvi: number; tci: number; lawAccuracies: Record<string, number> }>[],
    _srsMap: Record<string, number>,
    repsMap: Record<string, number>,
    fiMap: Record<string, number>,
    generation: number
  ): UniversalLaw[] {
    const universalLaws: UniversalLaw[] = [];

    // Pre-calculate adaptive threshold for each universe: max(0.65, avg_PVI_in_universe)
    const thresholdsByUniverse = universes.map((_, uniIdx) => {
      const uniEval = evaluationsByUniverse[uniIdx];
      const programEvals = Object.values(uniEval);
      const avgPvi = programEvals.length > 0
        ? programEvals.reduce((sum, val) => sum + val.pvi, 0) / programEvals.length
        : 0.65;
      return Math.max(0.65, avgPvi);
    });

    // 1. Gather all unique laws/axioms across all research programs
    const uniqueLawsMap = new Map<string, { id: string; statement: string; domain: UniversalLaw['domain'] }>();
    programs.forEach(program => {
      program.hardCorePrinciples.forEach(axiom => {
        if (!uniqueLawsMap.has(axiom.id)) {
          uniqueLawsMap.set(axiom.id, {
            id: axiom.id,
            statement: axiom.statement,
            domain: axiom.domain as UniversalLaw['domain']
          });
        }
      });
    });

    const totalProgramsCount = programs.length;

    // 2. Process each unique law
    uniqueLawsMap.forEach((lawInfo, lawId) => {
      // Find all programs that support this law
      const supportPrograms = programs
        .filter(p => p.hardCorePrinciples.some(axiom => axiom.id === lawId))
        .map(p => p.id);

      if (supportPrograms.length === 0) return;

      // Calculate PCS = supportPrograms / totalPrograms
      const pcs = totalProgramsCount > 0 ? supportPrograms.length / totalProgramsCount : 0.0;

      // Calculate Combined EAW = min(1.0, sum(EAW_p))
      const sumEaw = supportPrograms.reduce((sum, pId) => {
        const prog = programs.find(p => p.id === pId);
        return sum + (prog?.state?.eaw ?? 0.0);
      }, 0.0);
      const eawCombined = Math.min(1.0, sumEaw);

      // Find support universes (where accuracy >= adaptive threshold)
      const supportUniverses: string[] = [];
      universes.forEach((universe, uniIdx) => {
        const uniEval = evaluationsByUniverse[uniIdx];
        const threshold = thresholdsByUniverse[uniIdx];

        // Find maximum accuracy for this law across all supporting programs in this universe
        let maxAcc = 0.0;
        supportPrograms.forEach(pId => {
          const progEval = uniEval[pId];
          if (progEval && progEval.lawAccuracies[lawId] !== undefined) {
            maxAcc = Math.max(maxAcc, progEval.lawAccuracies[lawId]);
          }
        });

        if (maxAcc >= threshold) {
          supportUniverses.push(universe.id);
        }
      });

      // Calculate OIS
      const ois = universes.length > 0 ? supportUniverses.length / universes.length : 0.0;

      // Retrieve FI and RepS (with fallback defaults)
      const fi = fiMap[lawId] ?? 1.0;
      const reps = repsMap[lawId] ?? 0.80;

      // Calculate Law Robustness Score (LRS)
      // LRS = FI * RepS * OIS * sqrt(EAW_combined)
      const lrs = fi * reps * ois * Math.sqrt(eawCombined);

      // Determine Universality Class:
      // UNIVERSAL: OIS >= 0.80, PCS >= 0.66, LRS >= 0.40
      // QUASI_UNIVERSAL: OIS >= 0.60, LRS >= 0.20
      // LOCAL: rest
      let universalityClass: UniversalLaw['universalityClass'] = 'LOCAL';
      if (ois >= 0.80 && pcs >= 0.66 && lrs >= 0.40) {
        universalityClass = 'UNIVERSAL';
      } else if (ois >= 0.60 && lrs >= 0.20) {
        universalityClass = 'QUASI_UNIVERSAL';
      }

      universalLaws.push({
        id: lawId,
        statement: lawInfo.statement,
        domain: lawInfo.domain,
        universalityClass,
        supportPrograms,
        supportUniverses,
        metrics: {
          ois: Number(ois.toFixed(4)),
          reps: Number(reps.toFixed(4)),
          eawCombined: Number(eawCombined.toFixed(4)),
          lrs: Number(lrs.toFixed(4)),
          pcs: Number(pcs.toFixed(4))
        },
        extractionGeneration: generation
      });
    });

    return universalLaws;
  }
}
