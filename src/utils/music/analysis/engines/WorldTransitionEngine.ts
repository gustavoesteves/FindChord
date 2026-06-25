import type { NarrativeWorld, StructuralProfile, NarrativeEvent } from "../models/NarrativeWorld";

export interface TransitionMutation {
  measureIndex: number;
  anchorPitch: string;
  fromInterpretation: string;
  toInterpretation: string;
  fromChord: string;
  toChord: string;
}

export interface WorldTransitionResult {
  targetWorld: NarrativeWorld;
  perceptualCost: number; // The distance / energy required for the transition
  mutations: TransitionMutation[];
}

export class WorldTransitionEngine {
  
  // Perceptual Weights (Cognitive energy required to shift into this regime)
  private static readonly WEIGHTS = {
    DIATONIC: 1.0,
    DOMINANT: 1.1,
    MODAL: 1.3,
    CHROMATIC: 2.0
  };

  /**
   * Calculates the weighted euclidean distance (perceptual energy cost) between two structural profiles.
   */
  public static calculatePerceptualDistance(profileA: StructuralProfile, profileB: StructuralProfile): number {
    const dDiatonic = (profileB.diatonicStability - profileA.diatonicStability) * this.WEIGHTS.DIATONIC;
    const dDominant = (profileB.dominantDensity - profileA.dominantDensity) * this.WEIGHTS.DOMINANT;
    const dModal = (profileB.modalAmbiguity - profileA.modalAmbiguity) * this.WEIGHTS.MODAL;
    const dChromatic = (profileB.chromaticDisruption - profileA.chromaticDisruption) * this.WEIGHTS.CHROMATIC;

    return Math.sqrt(
      Math.pow(dDiatonic, 2) +
      Math.pow(dDominant, 2) +
      Math.pow(dModal, 2) +
      Math.pow(dChromatic, 2)
    );
  }

  /**
   * Finds the minimal re-interpretation path (mutations) to move from a current world towards a target vector.
   */
  public static findMinimalMutation(
    currentWorld: NarrativeWorld, 
    targetVector: StructuralProfile, 
    availableWorlds: NarrativeWorld[]
  ): WorldTransitionResult | null {
    
    // Filter out the current world and incoherent worlds
    const validCandidates = availableWorlds.filter(w => w.id !== currentWorld.id && w.isViable);
    
    if (validCandidates.length === 0) return null;

    let bestCandidate: NarrativeWorld | null = null;
    let minDistance = Infinity;

    // Find the world closest to the target vector
    validCandidates.forEach(candidate => {
      const distance = this.calculatePerceptualDistance(candidate.structuralProfile, targetVector);
      if (distance < minDistance) {
        minDistance = distance;
        bestCandidate = candidate;
      }
    });

    if (!bestCandidate) return null;

    // Calculate the exact mutations required
    const mutations = this.calculateMutations(currentWorld, bestCandidate!);

    return {
      targetWorld: bestCandidate!,
      perceptualCost: minDistance,
      mutations
    };
  }

  private static calculateMutations(worldA: NarrativeWorld, worldB: NarrativeWorld): TransitionMutation[] {
    const mutations: TransitionMutation[] = [];

    // Assuming both worlds have the same length and sequence of anchors (which is true for the same melody)
    for (let i = 0; i < worldA.events.length; i++) {
      const eventA = worldA.events[i];
      const eventB = worldB.events[i];

      // If the functional reading changed, log it as a mutation
      if (eventA.interpretation.selectedMeaning.meaningId !== eventB.interpretation.selectedMeaning.meaningId) {
        mutations.push({
          measureIndex: eventA.measureIndex,
          anchorPitch: eventA.anchorPitch,
          fromInterpretation: eventA.interpretation.selectedMeaning.meaningLabel,
          toInterpretation: eventB.interpretation.selectedMeaning.meaningLabel,
          fromChord: eventA.resolvedChord,
          toChord: eventB.resolvedChord
        });
      }
    }

    return mutations;
  }
}
