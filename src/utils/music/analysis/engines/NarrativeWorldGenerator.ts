import type { NarrativeWorld, NarrativeEvent, StructuralProfile } from "../models/NarrativeWorld";
import { MelodicInterpretationEngine } from "./MelodicInterpretationEngine";
import { VoiceLeadingPrimitiveEngine } from "./VoiceLeadingPrimitiveEngine";
import type { MelodicAnchor } from "../models/ProjectionSet";
import type { TonalCenter } from "./LocalTonalCenterEngine";

export class NarrativeWorldGenerator {
  
  /**
   * Generates competing narrative worlds based on a sequence of melodic anchors.
   * Uses Probabilistic Pruning (Beam Search) to prevent combinatorial explosion.
   */
  public static generateWorlds(anchors: MelodicAnchor[], tonalCenter?: TonalCenter): NarrativeWorld[] {
    if (anchors.length === 0) return [];

    const optionsPerAnchor = anchors.map(anchor => 
      MelodicInterpretationEngine.getInterpretations(anchor.pitch, tonalCenter)
    );

    const BEAM_WIDTH = 64; // Max viable timelines carried forward
    let currentPaths: NarrativeEvent[][] = [[]];

    for (let i = 0; i < optionsPerAnchor.length; i++) {
      const options = optionsPerAnchor[i];
      const anchor = anchors[i];
      const newPaths: NarrativeEvent[][] = [];

      // Expand all current paths with all options for this anchor
      for (const path of currentPaths) {
        for (const option of options) {
          const event: NarrativeEvent = {
            measureIndex: anchor.measureIndex,
            anchorPitch: option.anchorPitch,
            interpretation: option,
            resolvedChord: option.selectedMeaning.impliedChord
          };
          newPaths.push([...path, event]);
        }
      }

      // If we exceed our beam width, prune paths based on partial coherence
      if (newPaths.length > BEAM_WIDTH) {
        const scoredPaths = newPaths.map(path => {
          // Evaluate the partial path (or complete if it's the last iteration)
          const tempWorld = this.evaluateWorld(path, "temp");
          return { path, score: tempWorld.coherenceScore };
        });

        // Sort descending by score
        scoredPaths.sort((a, b) => b.score - a.score);

        // Keep top N paths to prevent combinatorial explosion
        currentPaths = scoredPaths.slice(0, BEAM_WIDTH).map(sp => sp.path);
      } else {
        currentPaths = newPaths;
      }
    }

    // Final evaluation for the surviving timelines
    const worlds: NarrativeWorld[] = [];
    currentPaths.forEach((path, index) => {
      const world = this.evaluateWorld(path, `World_${index + 1}`);
      worlds.push(world);
    });

    // Sort by final coherence
    return worlds.sort((a, b) => b.coherenceScore - a.coherenceScore);
  }

  private static evaluateWorld(events: NarrativeEvent[], fallbackId: string): NarrativeWorld {
    let matches = 0;
    let ruptures = 0;
    let ruptureDesc = "";
    
    // F22: Voice Leading Smoothness Base
    let totalSmoothness = 0;

    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i];
      const next = events[i + 1];

      // F22: Voice Leading Primitive Engine Evaluation
      const vlResult = VoiceLeadingPrimitiveEngine.evaluateTransition(current.resolvedChord, next.resolvedChord);
      totalSmoothness += vlResult.smoothnessScore;

      // Check gravitational overlap (Functional Analysis)
      const currentExpectsNext = current.interpretation.consequentOptions.includes(next.resolvedChord);
      const nextExpectsCurrent = next.interpretation.antecedentOptions.includes(current.resolvedChord);

      if (currentExpectsNext || nextExpectsCurrent) {
        matches++;
      } else {
        // Evaluate structural rupture
        const currentBehavior = current.interpretation.selectedMeaning.behavior;
        const nextBehavior = next.interpretation.selectedMeaning.behavior;

        if (currentBehavior === "DIATONIC" && (nextBehavior === "MODAL" || nextBehavior === "CHROMATIC")) {
          ruptures++;
          ruptureDesc = `Ruptura Estilística no Compasso ${next.measureIndex}: Transição de Diatônico para ${nextBehavior}.`;
        } else if (currentBehavior !== "DIATONIC" && (nextBehavior === "MODAL" || nextBehavior === "CHROMATIC")) {
          ruptures++;
        }
      }
    }

    const totalTransitions = events.length - 1;
    
    // F22 Hybrid Scoring System
    let functionalCoherence = totalTransitions === 0 ? 1.0 : (matches / totalTransitions);
    let avgSmoothness = totalTransitions === 0 ? 1.0 : (totalSmoothness / totalTransitions);

    // If there are functional ruptures, punish the functional score heavily
    if (ruptures > 0) {
      functionalCoherence = Math.max(0.1, functionalCoherence - (ruptures * 0.3));
    }

    // New Formula: 40% Functional Coherence + 60% Voice Leading Smoothness
    // This allows smooth chromatic transitions (Almada style) to survive even if functional coherence is low.
    let coherenceScore = (functionalCoherence * 0.4) + (avgSmoothness * 0.6);

    const structuralProfile = this.calculateStructuralProfile(events);
    const structuralCategory = this.determineStructuralCategory(structuralProfile, ruptures > 0);

    return {
      id: fallbackId,
      structuralCategory,
      structuralProfile,
      events,
      coherenceScore,
      isViable: true, // F20: All worlds survive as part of the perceptual space
      isStructuralRupture: ruptures > 0,
      ruptureDescription: ruptures > 0 ? ruptureDesc : undefined
    };
  }

  private static calculateStructuralProfile(events: NarrativeEvent[]): StructuralProfile {
    const total = events.length;
    if (total === 0) return { diatonicStability: 0, dominantDensity: 0, modalAmbiguity: 0, chromaticDisruption: 0 };

    let diatonic = 0;
    let dominant = 0;
    let modal = 0;
    let chromatic = 0;

    events.forEach(e => {
      const b = e.interpretation.selectedMeaning.behavior;
      if (b === "DIATONIC") diatonic++;
      else if (b === "DOMINANT") dominant++;
      else if (b === "MODAL") modal++;
      else if (b === "CHROMATIC") chromatic++;
    });

    return {
      diatonicStability: diatonic / total,
      dominantDensity: dominant / total,
      modalAmbiguity: modal / total,
      chromaticDisruption: chromatic / total
    };
  }

  private static determineStructuralCategory(profile: StructuralProfile, hasRupture: boolean): string {
    if (hasRupture) {
      if (profile.modalAmbiguity > 0) return "Mundo de Ruptura Modal";
      if (profile.chromaticDisruption > 0) return "Mundo de Ruptura Cromática Estruturada";
      return "Mundo Híbrido com Ruptura Funcional";
    }

    if (profile.diatonicStability === 1.0) return "Mundo de Coerência Funcional Diatônica";
    if (profile.dominantDensity >= 0.5) return "Mundo de Tensão Dominante Estendida";
    if (profile.modalAmbiguity >= 0.5) return "Mundo de Ambiguidade Modal Controlada";
    if (profile.chromaticDisruption >= 0.5) return "Mundo de Predominância Substitucional";

    // Mixed without ruptures
    if (profile.diatonicStability >= 0.5 && profile.dominantDensity > 0) {
      return "Mundo Funcional Expandido";
    }

    return "Mundo de Coerência Híbrida";
  }

}
