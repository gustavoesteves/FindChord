import type { SoftWorld } from "../models/NarrativeWorld";
import { HarmonicArchetypeLibrary } from "./HarmonicArchetypeLibrary";
import type { MotiveTag } from "./HorizontalHarmonyEngine";
import type { PhraseContext } from "./PhraseAnalysisEngine";

export interface DivergentIdea {
  signature: string;
  archetype: string;
  worlds: SoftWorld[];
  primaryWorld: SoftWorld;
  bassLine: string[];
  detectedMotives: MotiveTag[];
  phraseContext: PhraseContext;
}

export class HarmonicDivergenceEngine {
  /**
   * Identifies truly distinct musical ideas by grouping worlds with identical archetype signatures.
   */
  public static extractDivergentIdeas(worlds: SoftWorld[]): DivergentIdea[] {
    const families = new Map<string, SoftWorld[]>();

    for (const world of worlds) {
      // Functional signature is now the sequence of Archetypes, not raw narrative types
      const signature = world.events
        .map(e => HarmonicArchetypeLibrary.classifyNarrativeType(e.interpretation.narrativeType))
        .join(" -> ");
      
      if (!families.has(signature)) {
        families.set(signature, []);
      }
      families.get(signature)!.push(world);
    }

    const divergentIdeas: DivergentIdea[] = [];

    for (const [signature, familyWorlds] of families.entries()) {
      // Sort within family to find the most coherent representative (best voice leading/score)
      familyWorlds.sort((a, b) => b.coherenceScore - a.coherenceScore);
      
      // Determine the dominant archetype name for this specific family
      const rawNarratives = familyWorlds[0].events.map(e => e.interpretation.narrativeType);
      const mainArchetype = HarmonicArchetypeLibrary.getProgressionArchetype(rawNarratives);

      divergentIdeas.push({
        signature,
        archetype: mainArchetype,
        worlds: familyWorlds,
        primaryWorld: familyWorlds[0],
        bassLine: familyWorlds[0].bassLine || [],
        detectedMotives: familyWorlds[0].detectedMotives || [],
        phraseContext: familyWorlds[0].phraseContext
      });
    }

    // Sort ideas by the coherence of their primary world
    return divergentIdeas.sort((a, b) => b.primaryWorld.coherenceScore - a.primaryWorld.coherenceScore);
  }
}
