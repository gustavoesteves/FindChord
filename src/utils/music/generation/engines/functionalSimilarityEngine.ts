import type { FunctionalFingerprint } from '../models/FunctionalFingerprint';
import type { SimilarityScore, DriftProfile } from '../models/FunctionalSimilarity';

/**
 * Functional Similarity Engine (F14-A2)
 * Compares two FunctionalFingerprints and returns a SimilarityScore
 * using the weighted and critical-axes-penalized mathematics defined in RFC F14-A2.0.
 */
export class FunctionalSimilarityEngine {
  // Matriz de Pesos (Weight Matrix)
  private readonly WEIGHTS = {
    narrative: 0.30,
    cadential: 0.20,
    structural: 0.20,
    modal: 0.15,
    energy: 0.10,
    color: 0.05
  };

  // Limiar de colapso de identidade
  private readonly CRITICAL_THRESHOLD = 0.20;

  public calculateSimilarity(a: FunctionalFingerprint, b: FunctionalFingerprint): SimilarityScore {
    const narrativeSimilarity = this.calculateNarrativeSimilarity(a, b);
    const cadentialSimilarity = this.calculateCadentialSimilarity(a, b);
    const structuralSimilarity = this.calculateStructuralSimilarity(a, b);
    const modalSimilarity = this.calculateModalSimilarity(a, b);
    const energySimilarity = this.calculateEnergySimilarity(a, b);
    const colorSimilarity = this.calculateColorSimilarity(a, b);

    // Soma ponderada
    let overallSimilarity = 
      (narrativeSimilarity * this.WEIGHTS.narrative) +
      (cadentialSimilarity * this.WEIGHTS.cadential) +
      (structuralSimilarity * this.WEIGHTS.structural) +
      (modalSimilarity * this.WEIGHTS.modal) +
      (energySimilarity * this.WEIGHTS.energy) +
      (colorSimilarity * this.WEIGHTS.color);

    // Critical Axes Penalty (Identity Collapse)
    const criticalAxes = [narrativeSimilarity, cadentialSimilarity, structuralSimilarity];
    const hasCollapsed = criticalAxes.some(score => score < this.CRITICAL_THRESHOLD);

    if (hasCollapsed) {
      // Penalidade geométrica massiva
      overallSimilarity = overallSimilarity * 0.1;
    }

    return {
      narrativeSimilarity,
      cadentialSimilarity,
      structuralSimilarity,
      modalSimilarity,
      energySimilarity,
      colorSimilarity,
      overallSimilarity
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
    const maxDistance = Math.sqrt(vecA.length); // Assuming domain [0, 1] per dimension
    
    return Math.max(0, 1 - (distance / maxDistance));
  }

  private calculateNarrativeSimilarity(a: FunctionalFingerprint, b: FunctionalFingerprint): number {
    const vecA = [
      a.narrativeIntent.expansion, a.narrativeIntent.preparation, a.narrativeIntent.suspension,
      a.narrativeIntent.confirmation, a.narrativeIntent.diversion, a.narrativeIntent.resolution,
      a.momentum.forwardPull, a.momentum.backwardPull, a.momentum.staticHold
    ];
    const vecB = [
      b.narrativeIntent.expansion, b.narrativeIntent.preparation, b.narrativeIntent.suspension,
      b.narrativeIntent.confirmation, b.narrativeIntent.diversion, b.narrativeIntent.resolution,
      b.momentum.forwardPull, b.momentum.backwardPull, b.momentum.staticHold
    ];
    return this.calculateEuclideanSimilarity(vecA, vecB);
  }

  private calculateCadentialSimilarity(a: FunctionalFingerprint, b: FunctionalFingerprint): number {
    const vecA = [
      a.cadentialSignature.authentic, a.cadentialSignature.plagal, 
      a.cadentialSignature.deceptive, a.cadentialSignature.modal,
      a.perception.closureStrength
    ];
    const vecB = [
      b.cadentialSignature.authentic, b.cadentialSignature.plagal, 
      b.cadentialSignature.deceptive, b.cadentialSignature.modal,
      b.perception.closureStrength
    ];
    return this.calculateEuclideanSimilarity(vecA, vecB);
  }

  private calculateStructuralSimilarity(a: FunctionalFingerprint, b: FunctionalFingerprint): number {
    const vecA = [
      a.structure.establishmentWeight, a.structure.prolongationWeight, 
      a.structure.dominantWeight, a.structure.cadentialWeight,
      a.hierarchy.structuralWeight, a.hierarchy.decorativeWeight
    ];
    const vecB = [
      b.structure.establishmentWeight, b.structure.prolongationWeight, 
      b.structure.dominantWeight, b.structure.cadentialWeight,
      b.hierarchy.structuralWeight, b.hierarchy.decorativeWeight
    ];
    return this.calculateEuclideanSimilarity(vecA, vecB);
  }

  private calculateModalSimilarity(a: FunctionalFingerprint, b: FunctionalFingerprint): number {
    const vecA = [
      a.modalProfile.dorianWeight, a.modalProfile.phrygianWeight, 
      a.modalProfile.lydianWeight, a.modalProfile.mixolydianWeight, 
      a.modalProfile.aeolianWeight, a.gravity.tonalGravity, 
      a.gravity.modalGravity, a.gravity.symmetricGravity
    ];
    const vecB = [
      b.modalProfile.dorianWeight, b.modalProfile.phrygianWeight, 
      b.modalProfile.lydianWeight, b.modalProfile.mixolydianWeight, 
      b.modalProfile.aeolianWeight, b.gravity.tonalGravity, 
      b.gravity.modalGravity, b.gravity.symmetricGravity
    ];
    return this.calculateEuclideanSimilarity(vecA, vecB);
  }

  private calculateEnergySimilarity(a: FunctionalFingerprint, b: FunctionalFingerprint): number {
    const vecA = [
      a.energy.tensionIndex, a.energy.relaxationIndex, 
      a.stability.harmonicStability, a.perception.ambiguityIndex
    ];
    const vecB = [
      b.energy.tensionIndex, b.energy.relaxationIndex, 
      b.stability.harmonicStability, b.perception.ambiguityIndex
    ];
    return this.calculateEuclideanSimilarity(vecA, vecB);
  }

  private calculateColorSimilarity(a: FunctionalFingerprint, b: FunctionalFingerprint): number {
    const vecA = [
      a.color.modalColor, a.color.chromaticColor, a.color.extensionDensity
    ];
    const vecB = [
      b.color.modalColor, b.color.chromaticColor, b.color.extensionDensity
    ];
    return this.calculateEuclideanSimilarity(vecA, vecB);
  }
}
