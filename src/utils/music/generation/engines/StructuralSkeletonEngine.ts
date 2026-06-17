import type { HarmonicDNA } from '../models/HarmonicDNA';
import { DnaStrand } from '../models/HarmonicDNA';
import type { FunctionalFingerprint } from '../models/FunctionalFingerprint';
import type { StructuralSkeleton, StructuralElement } from '../models/StructuralSkeleton';

/**
 * Structural Skeleton Engine (F14-X1)
 * Extracts the true temporal hierarchy of a progression by categorizing
 * its DNA strands into Pillars, Connectors, and Decorations.
 */
export class StructuralSkeletonEngine {

  public extractSkeleton(dna: HarmonicDNA, fingerprint: FunctionalFingerprint): StructuralSkeleton {
    const pillars: StructuralElement[] = [];
    const connectors: StructuralElement[] = [];
    const decorations: StructuralElement[] = [];

    // Combine all strands for evaluation
    const allStrands = [...dna.macro, ...dna.micro];

    for (const strand of allStrands) {
      const weight = this.calculateWeight(strand, fingerprint);

      switch (strand) {
        // Pillars: Anchor and Dominance
        case DnaStrand.Anchor:
        case DnaStrand.Dominance:
          // A Dominance is only a pillar if its structural weight is high enough, otherwise it's a connector or decoration
          if (weight >= 0.5) {
            pillars.push({ strand, weight });
          } else if (weight >= 0.3) {
            connectors.push({ strand, weight });
          } else {
            decorations.push({ strand, weight });
          }
          break;

        // Connectors: Preparation and Connection
        case DnaStrand.Preparation:
        case DnaStrand.Connection:
          if (weight >= 0.4) {
            connectors.push({ strand, weight });
          } else {
            decorations.push({ strand, weight });
          }
          break;

        // Decorations: Expansion and Suspension
        case DnaStrand.Expansion:
        case DnaStrand.Suspension:
          // Suspensions and expansions are overwhelmingly decorations, unless they act as a massive structural substitute
          if (weight > 0.8) {
            connectors.push({ strand, weight });
          } else {
            decorations.push({ strand, weight });
          }
          break;
      }
    }

    return { pillars, connectors, decorations };
  }

  private calculateWeight(strand: DnaStrand, fingerprint: FunctionalFingerprint): number {
    const structure = fingerprint.structure;
    const hierarchy = fingerprint.hierarchy;
    const narrative = fingerprint.narrativeIntent;

    let baseWeight = 0;

    switch (strand) {
      case DnaStrand.Anchor:
        baseWeight = hierarchy.structuralWeight * 0.8 + fingerprint.stability.harmonicStability * 0.2;
        break;
      case DnaStrand.Dominance:
        baseWeight = structure.dominantWeight * 0.6 + hierarchy.structuralWeight * 0.4;
        break;
      case DnaStrand.Preparation:
        baseWeight = narrative.preparation * 0.7 + hierarchy.structuralWeight * 0.3;
        break;
      case DnaStrand.Connection:
        baseWeight = hierarchy.decorativeWeight * 0.4 + fingerprint.momentum.forwardPull * 0.6;
        break;
      case DnaStrand.Expansion:
        baseWeight = narrative.expansion * 0.5 + hierarchy.decorativeWeight * 0.5;
        break;
      case DnaStrand.Suspension:
        baseWeight = narrative.suspension * 0.7 + hierarchy.decorativeWeight * 0.3;
        break;
    }

    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, baseWeight));
  }
}
