import type { SoftWorld } from "../models/NarrativeWorld";

export interface DivergentIdea {
  signature: string;
  worlds: SoftWorld[];
  primaryWorld: SoftWorld;
}

export class HarmonicDivergenceEngine {
  /**
   * Identifies truly distinct musical ideas by grouping worlds with identical functional signatures.
   */
  public static extractDivergentIdeas(worlds: SoftWorld[]): DivergentIdea[] {
    const families = new Map<string, SoftWorld[]>();

    for (const world of worlds) {
      // Functional signature: the sequence of narrative behaviors
      // e.g. "StableTonic -> SubdominantArrival -> AuthenticCadence"
      const signature = world.events.map(e => e.interpretation.narrativeType).join(" -> ");
      
      if (!families.has(signature)) {
        families.set(signature, []);
      }
      families.get(signature)!.push(world);
    }

    const divergentIdeas: DivergentIdea[] = [];

    for (const [signature, familyWorlds] of families.entries()) {
      // Sort within family to find the most coherent representative
      familyWorlds.sort((a, b) => b.coherenceScore - a.coherenceScore);
      
      divergentIdeas.push({
        signature,
        worlds: familyWorlds,
        primaryWorld: familyWorlds[0]
      });
    }

    // Sort ideas by the coherence of their primary world
    return divergentIdeas.sort((a, b) => b.primaryWorld.coherenceScore - a.primaryWorld.coherenceScore);
  }
}
