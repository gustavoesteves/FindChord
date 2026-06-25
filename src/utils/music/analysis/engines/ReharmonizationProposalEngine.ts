import type { DivergentIdea } from "./HarmonicDivergenceEngine";

export interface ReharmonizationProposal {
  id: string;
  progression: string[];
  explanation: string;
}

export interface ReharmonizationFamily {
  id: string;
  name: string;
  proposals: ReharmonizationProposal[];
}

export class ReharmonizationProposalEngine {
  
  public static categorizeProposals(ideas: DivergentIdea[]): ReharmonizationFamily[] {
    const families: Record<string, ReharmonizationFamily> = {
      conservative: { id: "conservative", name: "Conservadoras", proposals: [] },
      functional: { id: "functional", name: "Funcionais", proposals: [] },
      modal: { id: "modal", name: "Modais", proposals: [] },
      chromatic: { id: "chromatic", name: "Cromáticas", proposals: [] }
    };

    let pIdx = 1;

    for (const idea of ideas) {
      const world = idea.primaryWorld;
      const profile = world.structuralProfile;

      // Simplistic categorization based on structural weights
      let categoryId = "conservative";
      
      // Determine dominant trait
      const traits = [
        { id: "conservative", weight: profile.diatonicStability },
        { id: "functional", weight: profile.dominantDensity },
        { id: "modal", weight: profile.modalAmbiguity },
        { id: "chromatic", weight: profile.chromaticDisruption }
      ];

      // Sort traits by highest weight
      traits.sort((a, b) => b.weight - a.weight);

      // We need some thresholds, if chromatic is high enough, it's chromatic.
      if (profile.chromaticDisruption >= 0.4) {
        categoryId = "chromatic";
      } else if (profile.modalAmbiguity >= 0.4) {
        categoryId = "modal";
      } else if (profile.dominantDensity >= 0.4) {
        categoryId = "functional";
      } else {
        categoryId = "conservative";
      }

      families[categoryId].proposals.push({
        id: `prop_${pIdx++}`,
        progression: world.events.map(e => e.resolvedChord),
        explanation: idea.signature
      });
    }

    // Return as array, filtering out empty families
    return [
      families.conservative,
      families.functional,
      families.modal,
      families.chromatic
    ].filter(f => f.proposals.length > 0);
  }
}
