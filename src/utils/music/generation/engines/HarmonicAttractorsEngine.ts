import { AttractorType } from '../models/HarmonicAttractors';
import type { HarmonicAttractor, AttractorField } from '../models/HarmonicAttractors';
import type { FunctionalFingerprint } from '../models/FunctionalFingerprint';
import type { HarmonicDNA } from '../models/HarmonicDNA';
import { DnaStrand } from '../models/HarmonicDNA';
import type { HarmonicInvariant } from '../models/HarmonicInvariants';
import type { PhraseContext } from '../models/HarmonicMemory';

export class HarmonicAttractorsEngine {
  
  public mapAttractorField(
    fingerprint: FunctionalFingerprint,
    dna: HarmonicDNA,
    invariants: HarmonicInvariant,
    context: PhraseContext
  ): AttractorField {
    
    // 1. Calculate individual pulls for each basin
    const attractors: HarmonicAttractor[] = [
      this.calculateTonalResolution(fingerprint, invariants),
      this.calculateModalExpansion(fingerprint, dna, invariants),
      this.calculateDominanceSuspension(fingerprint, invariants, context),
      this.calculateNarrativeDiversion(fingerprint),
      this.calculateCyclicEquilibrium(fingerprint, invariants)
    ];

    // 2. Rank attractors by pull (highest first)
    attractors.sort((a, b) => b.pull - a.pull);

    // 3. Calculate Attractor Commitment
    // High commitment means the primary attractor heavily dominates the secondary one.
    // If they are close, the progression is ambiguous and commitment is low.
    let commitment = 1.0;
    if (attractors.length >= 2) {
      const primaryPull = attractors[0].pull;
      const secondaryPull = attractors[1].pull;
      
      if (primaryPull > 0) {
        // The greater the gap, the higher the commitment
        commitment = (primaryPull - secondaryPull) / primaryPull;
      } else {
        commitment = 0.0;
      }
    }

    return {
      attractors,
      attractorCommitment: Math.max(0, Math.min(1.0, commitment))
    };
  }

  private calculateTonalResolution(
    fingerprint: FunctionalFingerprint,
    invariants: HarmonicInvariant
  ): HarmonicAttractor {
    const pull = Math.min(1.0, 
      (invariants.discovered.closureWeight * 0.5) +
      (invariants.discovered.dominanceWeight * 0.3) +
      (fingerprint.cadentialSignature.authentic * 0.2)
    );

    return {
      type: AttractorType.TonalResolution,
      pull,
      signature: {
        closurePull: invariants.discovered.closureWeight,
        modalIdentity: 0.1,
        tensionRest: fingerprint.energy.relaxationIndex
      }
    };
  }

  private calculateModalExpansion(
    fingerprint: FunctionalFingerprint,
    dna: HarmonicDNA,
    invariants: HarmonicInvariant
  ): HarmonicAttractor {
    const hasExpansionStrand = dna.macro.includes(DnaStrand.Expansion) ? 0.3 : 0.0;
    const closurePenalty = Math.max(0, 1.0 - invariants.discovered.closureWeight);
    
    const pull = Math.min(1.0, 
      (invariants.discovered.modalWeight * 0.4) +
      (hasExpansionStrand) +
      (closurePenalty * 0.3)
    );

    return {
      type: AttractorType.ModalExpansion,
      pull,
      signature: {
        closurePull: invariants.discovered.closureWeight,
        modalIdentity: invariants.discovered.modalWeight,
        tensionRest: fingerprint.energy.relaxationIndex
      }
    };
  }

  private calculateDominanceSuspension(
    fingerprint: FunctionalFingerprint,
    invariants: HarmonicInvariant,
    context: PhraseContext
  ): HarmonicAttractor {
    const closurePenalty = Math.max(0, 1.0 - invariants.discovered.closureWeight);
    
    const pull = Math.min(1.0, 
      (invariants.discovered.dominanceWeight * 0.5) +
      (context.expectationVector.tensionAccumulation * 0.3) +
      (closurePenalty * 0.2)
    );

    return {
      type: AttractorType.DominanceSuspension,
      pull,
      signature: {
        closurePull: invariants.discovered.closureWeight,
        modalIdentity: 0.1,
        tensionRest: fingerprint.energy.tensionIndex
      }
    };
  }

  private calculateNarrativeDiversion(
    fingerprint: FunctionalFingerprint
  ): HarmonicAttractor {
    // Narrative diversion happens when diversion intent is high, deceptive cadence is present
    const pull = Math.min(1.0, 
      (fingerprint.narrativeIntent.diversion * 0.6) +
      (fingerprint.cadentialSignature.deceptive * 0.4)
    );

    return {
      type: AttractorType.NarrativeDiversion,
      pull,
      signature: {
        closurePull: fingerprint.perception.closureStrength * 0.5,
        modalIdentity: 0.5,
        tensionRest: fingerprint.energy.tensionIndex * 0.5
      }
    };
  }

  private calculateCyclicEquilibrium(
    fingerprint: FunctionalFingerprint,
    invariants: HarmonicInvariant
  ): HarmonicAttractor {
    const closurePenalty = Math.max(0, 1.0 - invariants.discovered.closureWeight);
    
    // Cyclic Equilibrium requires high direction (movement), high narrative (story), but low closure
    const pull = Math.min(1.0, 
      (invariants.discovered.directionWeight * 0.4) +
      (invariants.discovered.narrativeWeight * 0.4) +
      (closurePenalty * 0.2)
    );

    return {
      type: AttractorType.CyclicEquilibrium,
      pull,
      signature: {
        closurePull: invariants.discovered.closureWeight,
        modalIdentity: 0.3,
        tensionRest: fingerprint.energy.tensionIndex * 0.8
      }
    };
  }
}
