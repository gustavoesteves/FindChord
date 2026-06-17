import type { FunctionalFingerprint } from '../models/FunctionalFingerprint';
import type { 
  SimilarityBands, 
  AsymmetricComparison, 
  DriftProfile, 
  WeightProfile
} from '../models/FunctionalSimilarity';
import { TONAL_WEIGHT_PROFILE } from '../models/FunctionalSimilarity';

/**
 * Functional Similarity Engine (F14-A2)
 * Compares two FunctionalFingerprints and returns SimilarityBands or AsymmetricComparisons
 * using hierarchical weighting and Identity Collapse prevention.
 */
export class FunctionalSimilarityEngine {
  // Limiar de colapso de identidade
  private readonly CRITICAL_THRESHOLD = 0.20;

  public calculateSimilarity(
    a: FunctionalFingerprint, 
    b: FunctionalFingerprint, 
    profile: WeightProfile = TONAL_WEIGHT_PROFILE
  ): SimilarityBands {
    const narrativeSimilarity = this.calculateNarrativeSimilarity(a, b);
    const cadentialSimilarity = this.calculateCadentialSimilarity(a, b);
    const structuralSimilarity = this.calculateStructuralSimilarity(a, b);
    const modalSimilarity = this.calculateModalSimilarity(a, b);
    const energySimilarity = this.calculateEnergySimilarity(a, b);
    const colorSimilarity = this.calculateColorSimilarity(a, b);

    // Texture similarity is derived from color's density components
    const textureSimilarity = this.calculateEuclideanSimilarity(
      [a.color.extensionDensity, a.color.chromaticColor],
      [b.color.extensionDensity, b.color.chromaticColor]
    );

    let identitySimilarity = 
      (structuralSimilarity * profile.axes.structural) + (cadentialSimilarity * profile.axes.cadential);

    let behaviorSimilarity = 
      (narrativeSimilarity * profile.axes.narrative) + (modalSimilarity * profile.axes.modal);

    let surfaceSimilarity = 
      (energySimilarity * profile.axes.energy) + (colorSimilarity * profile.axes.color);

    // Critical Axes Penalty (Identity Collapse)
    const criticalAxes = [narrativeSimilarity, cadentialSimilarity, structuralSimilarity];
    if (criticalAxes.some(score => score < this.CRITICAL_THRESHOLD)) {
      identitySimilarity *= 0.1;
      behaviorSimilarity *= 0.1;
    }

    return {
      identitySimilarity,
      behaviorSimilarity,
      surfaceSimilarity,
      textureSimilarity
    };
  }

  public calculateAsymmetricSimilarity(
    a: FunctionalFingerprint, 
    b: FunctionalFingerprint, 
    profile: WeightProfile = TONAL_WEIGHT_PROFILE
  ): AsymmetricComparison {
    const similarity = this.calculateSimilarity(a, b, profile);

    // Mock calculations for preservation based on "richness" (extensions, density, structural weight)
    const richnessA = a.color.extensionDensity + a.hierarchy.decorativeWeight;
    const richnessB = b.color.extensionDensity + b.hierarchy.decorativeWeight;

    let preservationA_to_B = similarity.identitySimilarity;
    let preservationB_to_A = similarity.identitySimilarity;

    let expansionScore = 0.0;
    let compressionScore = 0.0;

    if (richnessB > richnessA) {
      // B expands A
      preservationA_to_B = Math.min(1.0, similarity.identitySimilarity + 0.1);
      preservationB_to_A = Math.max(0.0, similarity.identitySimilarity - 0.2);
      expansionScore = Math.min(1.0, (richnessB - richnessA) * 2);
    } else if (richnessA > richnessB) {
      // B compresses A
      preservationA_to_B = Math.max(0.0, similarity.identitySimilarity - 0.2);
      preservationB_to_A = Math.min(1.0, similarity.identitySimilarity + 0.1);
      compressionScore = Math.min(1.0, (richnessA - richnessB) * 2);
    }

    return {
      similarity,
      preservationScoreA_to_B: preservationA_to_B,
      preservationScoreB_to_A: preservationB_to_A,
      expansionScore,
      compressionScore
    };
  }

  public calculateDrift(a: FunctionalFingerprint, b: FunctionalFingerprint): DriftProfile {
    return {
      narrativeDrift: 1 - this.calculateNarrativeSimilarity(a, b),
      cadentialDrift: 1 - this.calculateCadentialSimilarity(a, b),
      modalDrift: 1 - this.calculateModalSimilarity(a, b),
      structuralDrift: 1 - this.calculateStructuralSimilarity(a, b)
    };
  }

  // --- Funções Auxiliares de Distância Vetorial ---

  private calculateEuclideanSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length || vecA.length === 0) return 0;
    
    let sumSq = 0;
    for (let i = 0; i < vecA.length; i++) {
      sumSq += Math.pow(vecA[i] - vecB[i], 2);
    }
    const distance = Math.sqrt(sumSq);
    const maxDistance = Math.sqrt(vecA.length);
    
    return Math.max(0, 1 - (distance / maxDistance));
  }

  private calculateNarrativeSimilarity(a: FunctionalFingerprint, b: FunctionalFingerprint): number {
    return this.calculateEuclideanSimilarity(
      [a.narrativeIntent.expansion, a.narrativeIntent.preparation, a.narrativeIntent.suspension, a.narrativeIntent.resolution],
      [b.narrativeIntent.expansion, b.narrativeIntent.preparation, b.narrativeIntent.suspension, b.narrativeIntent.resolution]
    );
  }

  private calculateCadentialSimilarity(a: FunctionalFingerprint, b: FunctionalFingerprint): number {
    return this.calculateEuclideanSimilarity(
      [a.cadentialSignature.authentic, a.cadentialSignature.plagal, a.cadentialSignature.deceptive, a.cadentialSignature.modal, a.perception.closureStrength],
      [b.cadentialSignature.authentic, b.cadentialSignature.plagal, b.cadentialSignature.deceptive, b.cadentialSignature.modal, b.perception.closureStrength]
    );
  }

  private calculateStructuralSimilarity(a: FunctionalFingerprint, b: FunctionalFingerprint): number {
    return this.calculateEuclideanSimilarity(
      [a.structure.establishmentWeight, a.structure.prolongationWeight, a.structure.dominantWeight, a.hierarchy.structuralWeight],
      [b.structure.establishmentWeight, b.structure.prolongationWeight, b.structure.dominantWeight, b.hierarchy.structuralWeight]
    );
  }

  private calculateModalSimilarity(a: FunctionalFingerprint, b: FunctionalFingerprint): number {
    return this.calculateEuclideanSimilarity(
      [a.modalProfile.dorianWeight, a.modalProfile.phrygianWeight, a.modalProfile.mixolydianWeight, a.gravity.tonalGravity, a.gravity.modalGravity],
      [b.modalProfile.dorianWeight, b.modalProfile.phrygianWeight, b.modalProfile.mixolydianWeight, b.gravity.tonalGravity, b.gravity.modalGravity]
    );
  }

  private calculateEnergySimilarity(a: FunctionalFingerprint, b: FunctionalFingerprint): number {
    return this.calculateEuclideanSimilarity(
      [a.energy.tensionIndex, a.energy.relaxationIndex, a.stability.harmonicStability],
      [b.energy.tensionIndex, b.energy.relaxationIndex, b.stability.harmonicStability]
    );
  }

  private calculateColorSimilarity(a: FunctionalFingerprint, b: FunctionalFingerprint): number {
    return this.calculateEuclideanSimilarity(
      [a.color.modalColor, a.color.chromaticColor, a.color.extensionDensity],
      [b.color.modalColor, b.color.chromaticColor, b.color.extensionDensity]
    );
  }
}
