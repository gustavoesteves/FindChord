// @ts-nocheck
import type { HarmonicPerspective, ValidationObservation } from "../models/SuggestedRoute";

export class OntologyValidator {
  
  public static validate(perspective: HarmonicPerspective): { score: number; obs: ValidationObservation[] } {
    let score = 100;
    const obs: ValidationObservation[] = [];

    const strategy = perspective.strategy;
    const region = perspective.sourceRegionType;

    if (region === 'CADENTIAL') {
      if (strategy === 'TRITONE_SUBSTITUTION' || strategy === 'SECONDARY_DOMINANT' || strategy === 'BACKDOOR_CADENCE') {
        obs.push({
          type: 'ONTOLOGICAL',
          severity: 'LOW',
          description: `✔ Reforça a sensação de chegada.`
        });
      }
    } else if (region === 'ATTRACTOR') {
      if (strategy === 'SECONDARY_DOMINANT' || strategy === 'TRITONE_SUBSTITUTION' || strategy === 'BACKDOOR_CADENCE') {
        obs.push({
          type: 'ONTOLOGICAL',
          severity: 'LOW',
          description: `✔ Aumenta a atração para o centro tonal.`
        });
      }
    } else if (region === 'STATIC') {
      if (perspective.riskLevel === 'HIGH' || ['TRITONE_SUBSTITUTION', 'PASSING_DIMINISHED', 'SECONDARY_DOMINANT'].includes(strategy)) {
        score -= 20;
        obs.push({
          type: 'ONTOLOGICAL',
          severity: 'MEDIUM',
          description: `⚠ Introduz movimento onde a narrativa sugere repouso.`
        });
      } else if (strategy === 'MODAL_BORROWING') {
        obs.push({
          type: 'ONTOLOGICAL',
          severity: 'LOW',
          description: `✔ Adiciona cor sem quebrar a estabilidade estática.`
        });
      }
    }

    // Default neutral alignment
    if (obs.length === 0) {
      obs.push({
        type: 'ONTOLOGICAL',
        severity: 'LOW',
        description: `✔ Alinhamento neutro com a narrativa atual.`
      });
    }

    return { score: Math.max(0, score), obs };
  }
}
