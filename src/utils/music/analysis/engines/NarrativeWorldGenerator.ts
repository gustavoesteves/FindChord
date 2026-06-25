import type { NarrativeWorld, NarrativeEvent, StructuralProfile } from "../models/NarrativeWorld";
import type { MelodicAnchor } from "../models/ProjectionSet";
import type { TonalCenter } from "./LocalTonalCenterEngine";
import { HorizontalHarmonyEngine } from "./HorizontalHarmonyEngine";

export class NarrativeWorldGenerator {
  
  public static generateWorlds(anchors: MelodicAnchor[], tonalCenter?: TonalCenter): NarrativeWorld[] {
    if (anchors.length === 0) return [];

    // F22.1: Horizontal Generation (Pathway = Bass + Melody + Chords)
    const pathways = HorizontalHarmonyEngine.generatePathways(anchors, tonalCenter);

    const worlds: NarrativeWorld[] = [];
    let worldIdx = 1;

    for (const pathway of pathways) {
      const events: NarrativeEvent[] = [];
      let profile: StructuralProfile = {
        diatonicStability: 0,
        chromaticDisruption: 0,
        dominantDensity: 0,
        modalAmbiguity: 0
      };

      for (let i = 0; i < pathway.harmonyEvents.length; i++) {
        const state = pathway.harmonyEvents[i];
        const anchor = anchors[i];

        events.push({
          measureIndex: anchor.measureIndex,
          anchorPitch: state.melody,
          resolvedChord: state.chord,
          interpretation: state.interpretation
        });

        // Basic profiling based on the meaning behavior
        const behavior = state.interpretation.selectedMeaning.behavior;
        if (behavior === "DIATONIC") profile.diatonicStability += 1.0;
        else if (behavior === "CHROMATIC") profile.chromaticDisruption += 1.0;
        else if (behavior === "DOMINANT") profile.dominantDensity += 1.0;
        else if (behavior === "MODAL") profile.modalAmbiguity += 1.0;
      }

      // Normalize profile
      const total = pathway.harmonyEvents.length;
      if (total > 0) {
        profile.diatonicStability /= total;
        profile.chromaticDisruption /= total;
        profile.dominantDensity /= total;
        profile.modalAmbiguity /= total;
      }

      worlds.push({
        id: `world_${worldIdx}`,
        coherenceScore: pathway.metrics.totalScore,
        events,
        structuralProfile: profile,
        bassLine: pathway.bassLine,
        metrics: pathway.metrics,
        detectedMotives: pathway.detectedMotives
      });

      worldIdx++;
    }

    return worlds;
  }
}
