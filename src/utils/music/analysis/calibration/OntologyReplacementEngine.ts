import type { OntologicalTaxonomy } from '../models/TheoryOntology';
import type { ParadigmState } from '../models/ParadigmHistory';
import { ParadigmShiftEngine } from './ParadigmShiftEngine';
import { OntologyTournamentEngine } from './OntologyTournamentEngine';

export class OntologyReplacementEngine {
  /**
   * Evaluates if the active ontology should be replaced by one of the candidate alternative taxonomies.
   * Checks if in crisis, then runs a tournament. Replacement occurs if OFS_new > OFS_old + 0.05.
   */
  public static evaluateReplacement(
    active: OntologicalTaxonomy,
    candidates: OntologicalTaxonomy[],
    history: ParadigmState[],
    previousRecord?: Record<string, OntologicalTaxonomy>
  ): { replaced: boolean; newOntology?: OntologicalTaxonomy } {
    // 1. Check if the paradigm is currently in crisis
    if (!ParadigmShiftEngine.isParadigmInCrisis(history)) {
      return { replaced: false };
    }

    const activeId = (active.metadata as any).ontologyId || 'unknown';

    // 2. Evaluate active ontology fitness (OFS_old)
    const activeTournamentResults = OntologyTournamentEngine.runTournament([active], previousRecord);
    const activeResult = activeTournamentResults.find(r => r.ontologyId === activeId);
    const ofsOld = activeResult ? activeResult.ofs : 0.0;

    let bestAlternative: OntologicalTaxonomy | undefined = undefined;
    let bestOfs = ofsOld + 0.05; // Must surpass by at least 0.05

    // 3. Evaluate each candidate alternative
    candidates.forEach(cand => {
      const candId = (cand.metadata as any).ontologyId || 'candidate';
      // Run tournament on active + candidate to get accurate comparison
      const results = OntologyTournamentEngine.runTournament([active, cand], previousRecord);
      const candRes = results.find(r => r.ontologyId === candId);

      if (candRes && candRes.ofs > bestOfs) {
        bestOfs = candRes.ofs;
        bestAlternative = cand;
      }
    });

    if (bestAlternative) {
      return {
        replaced: true,
        newOntology: bestAlternative
      };
    }

    return { replaced: false };
  }
}
