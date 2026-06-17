import type { FunctionalFingerprint } from '../models/FunctionalFingerprint';
import type { HarmonicDNA } from '../models/HarmonicDNA';
import type { StructuralSkeleton } from '../models/StructuralSkeleton';
import type { HarmonicInvariant, ForbiddenStructuralChange } from '../models/HarmonicInvariants';
import { DnaStrand } from '../models/HarmonicDNA';

export class HarmonicInvariantsEngine {

  public extractInvariants(
    targetFingerprint: FunctionalFingerprint,
    _targetDNA: HarmonicDNA,
    targetSkeleton: StructuralSkeleton
  ): HarmonicInvariant {
    
    // 1. Extract Closure Weight
    // Based on actual perceptual closure and the presence of authentic cadences
    const closureWeight = Math.max(
      targetFingerprint.perception.closureStrength,
      targetFingerprint.cadentialSignature.authentic
    );

    // 2. Extract Dominance Weight
    // Based on structural weight and the actual dominant pillar
    const dominancePillar = targetSkeleton.pillars.find(p => p.strand === DnaStrand.Dominance);
    const dominanceWeight = dominancePillar ? 
      Math.max(dominancePillar.weight, targetFingerprint.structure.dominantWeight) : 
      targetFingerprint.structure.dominantWeight;

    // 3. Extract Narrative Weight
    // If the narrative has strong direction (preparation -> expansion -> resolution)
    const narrativeWeight = Math.max(
      targetFingerprint.momentum.forwardPull,
      targetFingerprint.narrativeIntent.preparation
    );

    // 4. Extract Modal Weight
    // If the harmonic stability relies more on modal gravity than tonal
    const modalWeight = targetFingerprint.gravity.modalGravity > targetFingerprint.gravity.tonalGravity ?
      targetFingerprint.gravity.modalGravity :
      0.0;

    // 5. Extract Direction Weight
    // The psychological vector (compression vs expansion)
    const directionWeight = Math.max(
      targetFingerprint.direction.compression,
      targetFingerprint.direction.expansion,
      targetFingerprint.direction.resolution
    );

    // Compute Global Weight for this invariant
    const weight = (closureWeight + dominanceWeight + narrativeWeight + modalWeight + directionWeight) / 5.0;

    const discovered = {
      weight,
      closureWeight,
      dominanceWeight,
      narrativeWeight,
      modalWeight,
      directionWeight
    };

    // Calculate fragility index
    // A progression is fragile if it relies heavily on specific tensions, specific modal colors, 
    // or has a very complex hierarchical decoration.
    const fragilityIndex = Math.min(1.0, 
      (targetFingerprint.color.extensionDensity * 0.4) + 
      (targetFingerprint.perception.ambiguityIndex * 0.4) + 
      ((1 - targetFingerprint.stability.harmonicStability) * 0.2)
    );

    // 6. Populate required pillars
    // Any pillar with weight > 0.7 is required
    const requiredStructuralPillars = targetSkeleton.pillars
      .filter(p => p.weight >= 0.7)
      .map(p => p.strand);

    // 7. Populate forbidden changes
    const forbiddenStructuralChanges: ForbiddenStructuralChange[] = [];

    // If dominance is absolutely critical, forbid removing it
    if (dominanceWeight > 0.8) {
      forbiddenStructuralChanges.push({
        pillar: DnaStrand.Dominance,
        severity: 'critical'
      });
    } else if (dominanceWeight > 0.5) {
      forbiddenStructuralChanges.push({
        pillar: DnaStrand.Dominance,
        severity: 'high'
      });
    }

    // If closure is critical, the anchor must be preserved
    if (closureWeight > 0.8) {
      forbiddenStructuralChanges.push({
        pillar: DnaStrand.Anchor,
        severity: 'critical'
      });
    }

    return {
      discovered,
      locked: {}, // Initially empty, populated by Composer Mode UI
      fragilityIndex,
      requiredStructuralPillars,
      forbiddenStructuralChanges
    };
  }
}
