import type { SoftWorld, StructuralProfile } from "../models/NarrativeWorld";
import type { HarmonicProbabilityField, InteractionVector, InteractiveSoftWorld } from "../models/HarmonicField";

export class FieldDeformationEngine {

  /**
   * Deforms the harmonic space by applying selection pressure from the interaction vector.
   * Calculates affinity (resonance) rather than distance.
   */
  public static deformField(
    sectionId: string,
    rawWorlds: SoftWorld[],
    interaction: InteractionVector
  ): HarmonicProbabilityField {
    
    if (rawWorlds.length === 0) {
      return {
        sectionId,
        particles: [],
        interactionState: interaction,
        topWorldDensity: []
      };
    }

    // Normalize interaction vector for dot product
    const normInt = this.normalizeVector([
      interaction.diatonicPressure,
      interaction.dominantPressure,
      interaction.modalPressure,
      interaction.chromaticPressure
    ]);
    
    // Fallback if vector is zero
    const normInteraction: InteractionVector = {
      diatonicPressure: normInt[0] || 0.25,
      dominantPressure: normInt[1] || 0.25,
      modalPressure: normInt[2] || 0.25,
      chromaticPressure: normInt[3] || 0.25
    };

    let totalExpWeight = 0;

    // Calculate unnormalized weights using Affinity (dot product)
    const rawParticles: (InteractiveSoftWorld & { expWeight: number })[] = rawWorlds.map(w => {
      const p = w.structuralProfile;
      const normW = this.normalizeVector([
        p.diatonicStability,
        p.dominantDensity,
        p.modalAmbiguity,
        p.chromaticDisruption
      ]);

      const profNormalized: StructuralProfile = {
        diatonicStability: normW[0] || 0,
        dominantDensity: normW[1] || 0,
        modalAmbiguity: normW[2] || 0,
        chromaticDisruption: normW[3] || 0
      };

      // F21 Affinity = dot product (Resonance)
      const affinity = this.dotProduct(profNormalized, normInteraction);

      // F21 Softmax base: affinity amplified, multiplied by native coherence
      // The temperature multiplier (e.g. 5.0) controls how sharply the density peaks
      const TEMPERATURE = 5.0;
      const expWeight = Math.exp(affinity * TEMPERATURE) * w.coherenceScore;
      
      totalExpWeight += expWeight;

      return {
        ...w,
        activeWeight: 0, // will be set below
        expWeight
      };
    });

    // Normalize into a probability distribution (softmax)
    const particles: InteractiveSoftWorld[] = rawParticles.map(p => {
      const activeWeight = totalExpWeight > 0 ? (p.expWeight / totalExpWeight) : 0;
      // Drop the temporary expWeight
      const { expWeight, ...cleanParticle } = p;
      return {
        ...cleanParticle,
        activeWeight
      };
    });

    // Sort by active weight to extract the density peaks
    const sortedParticles = [...particles].sort((a, b) => b.activeWeight - a.activeWeight);
    
    return {
      sectionId,
      particles: sortedParticles, // Usually keep sorted for UI performance
      interactionState: interaction,
      topWorldDensity: sortedParticles.slice(0, 10) // The top N peaks
    };
  }

  private static dotProduct(p: StructuralProfile, i: InteractionVector): number {
    return (p.diatonicStability * i.diatonicPressure) +
           (p.dominantDensity * i.dominantPressure) +
           (p.modalAmbiguity * i.modalPressure) +
           (p.chromaticDisruption * i.chromaticPressure);
  }

  private static normalizeVector(v: number[]): number[] {
    const mag = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0));
    if (mag === 0) return v;
    return v.map(val => val / mag);
  }
}
