import type { FunctionalFingerprint } from '../models/FunctionalFingerprint';
import type { HarmonicDNA } from '../models/HarmonicDNA';
import type { StructuralSkeleton } from '../models/StructuralSkeleton';
import type { ContextualInterpretation } from '../models/HarmonicMemory';
import { DriftSeverity } from '../models/FunctionalDrift';
import type { DriftProfile } from '../models/FunctionalDrift';

export class FunctionalDriftEngine {

  public evaluateDrift(
    sourceFingerprint: FunctionalFingerprint,
    sourceDNA: HarmonicDNA,
    sourceSkeleton: StructuralSkeleton,
    sourceInterpretation: ContextualInterpretation,
    
    targetFingerprint: FunctionalFingerprint,
    targetDNA: HarmonicDNA,
    targetSkeleton: StructuralSkeleton,
    targetInterpretation: ContextualInterpretation
  ): DriftProfile {
    
    // 1. Semantic Drift (Identity & Behavior approximation)
    const semanticDrift = this.calculateSemanticDrift(sourceFingerprint, targetFingerprint);
    
    // 2. Narrative Drift (Story intent changes)
    const narrativeDrift = this.calculateNarrativeDrift(sourceFingerprint, targetFingerprint);

    // 3. DNA Drift (Array diffing)
    const dnaDrift = this.calculateDnaDrift(sourceDNA, targetDNA);

    // 4. Structural Drift (Pillar preservation)
    const structuralDrift = this.calculateStructuralDrift(sourceSkeleton, targetSkeleton);

    // 5. Perceptual Drift (Contextual experience changes)
    const perceptualDrift = this.calculatePerceptualDrift(sourceInterpretation, targetInterpretation);

    // Find the primary cause of the drift
    const drifts = [
      { cause: 'structure', value: structuralDrift },
      { cause: 'dna', value: dnaDrift },
      { cause: 'narrative', value: narrativeDrift },
      { cause: 'semantics', value: semanticDrift },
      { cause: 'perception', value: perceptualDrift }
    ] as const;

    const primaryCause = drifts.reduce((prev, current) => (prev.value > current.value) ? prev : current).cause;

    // Overall Drift (Weighted average)
    // Structure and DNA are extremely foundational.
    const overallDrift = Math.min(1.0, 
      (structuralDrift * 0.35) + 
      (dnaDrift * 0.20) + 
      (narrativeDrift * 0.20) + 
      (semanticDrift * 0.15) + 
      (perceptualDrift * 0.10)
    );

    // Severity classification
    const severity = this.determineSeverity(overallDrift, structuralDrift, dnaDrift);

    return {
      structuralDrift,
      dnaDrift,
      narrativeDrift,
      semanticDrift,
      perceptualDrift,
      overallDrift,
      primaryCause,
      severity
    };
  }

  private calculateSemanticDrift(source: FunctionalFingerprint, target: FunctionalFingerprint): number {
    // Basic euclidean distance on key semantic axes (Structure, Hierarchy, Cadential)
    const sDiff = 
      Math.abs(source.structure.dominantWeight - target.structure.dominantWeight) +
      Math.abs(source.hierarchy.structuralWeight - target.hierarchy.structuralWeight) +
      Math.abs(source.cadentialSignature.authentic - target.cadentialSignature.authentic);
    return Math.min(1.0, sDiff / 3.0);
  }

  private calculateNarrativeDrift(source: FunctionalFingerprint, target: FunctionalFingerprint): number {
    const s1 = source.narrativeIntent;
    const t1 = target.narrativeIntent;
    
    const diff = 
      Math.abs(s1.preparation - t1.preparation) +
      Math.abs(s1.expansion - t1.expansion) +
      Math.abs(s1.resolution - t1.resolution) +
      Math.abs(s1.diversion - t1.diversion);
      
    return Math.min(1.0, diff / 4.0);
  }

  private calculateDnaDrift(source: HarmonicDNA, target: HarmonicDNA): number {
    // Levenshtein distance normalized
    const sourceArr = source.macro;
    const targetArr = target.macro;
    
    if (sourceArr.length === 0 && targetArr.length === 0) return 0;
    if (sourceArr.length === 0 || targetArr.length === 0) return 1;

    const matrix: number[][] = [];
    for (let i = 0; i <= targetArr.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= sourceArr.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= targetArr.length; i++) {
      for (let j = 1; j <= sourceArr.length; j++) {
        if (targetArr[i - 1] === sourceArr[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    const maxLen = Math.max(sourceArr.length, targetArr.length);
    const distance = matrix[targetArr.length][sourceArr.length];
    
    return distance / maxLen;
  }

  private calculateStructuralDrift(source: StructuralSkeleton, target: StructuralSkeleton): number {
    let penalty = 0;
    
    // Did a heavy pillar disappear?
    for (const sourcePillar of source.pillars) {
      const match = target.pillars.find(p => p.strand === sourcePillar.strand);
      if (!match) {
        // If it was downgraded to a connector, less penalty than disappearing entirely
        const downgradeMatch = target.connectors.find(c => c.strand === sourcePillar.strand);
        if (downgradeMatch) {
          penalty += sourcePillar.weight * 0.5; // Downgraded
        } else {
          penalty += sourcePillar.weight; // Completely destroyed
        }
      } else {
        // Pillar exists, but did its weight drastically change?
        penalty += Math.abs(sourcePillar.weight - match.weight) * 0.3;
      }
    }

    // Connectors disappearance
    for (const sourceConn of source.connectors) {
      if (!target.connectors.find(c => c.strand === sourceConn.strand) && 
          !target.pillars.find(p => p.strand === sourceConn.strand)) {
        penalty += sourceConn.weight * 0.4;
      }
    }

    // Normalize (theoretical max penalty could exceed 1.0 depending on number of pillars, so we cap)
    // Assume a typical phrase has 1-2 pillars.
    return Math.min(1.0, penalty / 1.5);
  }

  private calculatePerceptualDrift(source: ContextualInterpretation, target: ContextualInterpretation): number {
    const sOver = source.overlay;
    const tOver = target.overlay;

    const diff = 
      Math.abs(sOver.perceivedClosureStrength - tOver.perceivedClosureStrength) +
      Math.abs(sOver.perceivedTension - tOver.perceivedTension) +
      Math.abs(sOver.perceivedGravity - tOver.perceivedGravity);

    return Math.min(1.0, diff / 3.0);
  }

  private determineSeverity(overall: number, structural: number, dna: number): DriftSeverity {
    if (structural > 0.7 || dna > 0.8 || overall > 0.8) {
      return DriftSeverity.IdentityCollapse;
    }
    
    if (structural > 0.3 || overall > 0.5) {
      return DriftSeverity.Structural;
    }

    if (overall > 0.25) {
      return DriftSeverity.Behavioral;
    }

    if (overall > 0.1) {
      return DriftSeverity.Decorative;
    }

    return DriftSeverity.Cosmetic;
  }
}
