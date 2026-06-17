import type { FunctionalFingerprint } from '../models/FunctionalFingerprint';
import { ArchetypeClass } from '../models/FunctionalArchetype';
import type { ArchetypeMatch } from '../models/FunctionalArchetype';
import { FunctionalSimilarityEngine } from './functionalSimilarityEngine';
import { TONAL_WEIGHT_PROFILE, EXPERIMENTAL_WEIGHT_PROFILE } from '../models/FunctionalSimilarity';

/**
 * Functional Archetype Engine (F14-A2.3)
 * Provides foundational 'Gold Standard' DNA vectors (Archetypes) for the system
 * and classifies incoming progressions against this dictionary.
 */
export class FunctionalArchetypeEngine {
  private readonly similarityEngine: FunctionalSimilarityEngine;
  private archetypesCache: Map<string, { class: ArchetypeClass, fingerprint: FunctionalFingerprint }> | null = null;

  constructor() {
    this.similarityEngine = new FunctionalSimilarityEngine();
  }

  /**
   * Lazy-loads and returns the foundational dictionary of Functional Archetypes.
   */
  public getArchetypes(): Map<string, { class: ArchetypeClass, fingerprint: FunctionalFingerprint }> {
    if (this.archetypesCache) {
      return this.archetypesCache;
    }

    const dict = new Map<string, { class: ArchetypeClass, fingerprint: FunctionalFingerprint }>();

    // Mock: Harmonic Archetypes (e.g., ii-V-I, Backdoor, Plagal)
    dict.set('authentic_cadence', {
      class: ArchetypeClass.Harmonic,
      fingerprint: this.createMockArcheprint({
        structure: { establishmentWeight: 0.1, prolongationWeight: 0.3, dominantWeight: 0.4, cadentialWeight: 0.2 },
        cadentialSignature: { authentic: 1.0, plagal: 0.0, deceptive: 0.0, modal: 0.0 }
      })
    });

    dict.set('backdoor_cadence', {
      class: ArchetypeClass.Harmonic,
      fingerprint: this.createMockArcheprint({
        structure: { establishmentWeight: 0.1, prolongationWeight: 0.3, dominantWeight: 0.4, cadentialWeight: 0.2 },
        cadentialSignature: { authentic: 0.0, plagal: 0.0, deceptive: 0.0, modal: 1.0 },
        modalProfile: { dorianWeight: 0.0, phrygianWeight: 0.0, lydianWeight: 0.0, mixolydianWeight: 0.9, aeolianWeight: 0.1 }
      })
    });

    // Mock: Narrative Archetypes (e.g., Preparation -> Suspension -> Resolution)
    dict.set('suspension_resolution_arc', {
      class: ArchetypeClass.Narrative,
      fingerprint: this.createMockArcheprint({
        narrativeIntent: { expansion: 0.0, preparation: 0.4, suspension: 0.4, confirmation: 0.0, diversion: 0.0, resolution: 0.2 },
        momentum: { forwardPull: 0.5, backwardPull: 0.0, staticHold: 0.5 }
      })
    });

    this.archetypesCache = dict;
    return dict;
  }

  /**
   * Scans a target fingerprint against the entire archetype base and returns matches.
   * A progression can be a mix of archetypes (e.g., 70% Backdoor, 30% Plagal).
   */
  public classifyProgression(fingerprint: FunctionalFingerprint): ArchetypeMatch[] {
    const archetypes = this.getArchetypes();
    const matches: ArchetypeMatch[] = [];

    archetypes.forEach((data, id) => {
      // For harmonic archetypes, use TONAL weights. For narrative, use EXPERIMENTAL to prioritize behavior.
      const profile = data.class === ArchetypeClass.Harmonic ? TONAL_WEIGHT_PROFILE : EXPERIMENTAL_WEIGHT_PROFILE;
      
      const similarity = this.similarityEngine.calculateSimilarity(fingerprint, data.fingerprint, profile);

      // We consider a match if identity or behavior is strong enough
      const confidence = (similarity.identitySimilarity * 0.6) + (similarity.behaviorSimilarity * 0.4);

      if (confidence > 0.50) { // Threshold for inclusion
        matches.push({
          archetypeId: id,
          archetypeClass: data.class,
          confidence,
          identitySimilarity: similarity.identitySimilarity,
          behaviorSimilarity: similarity.behaviorSimilarity
        });
      }
    });

    // Sort by confidence descending
    return matches.sort((a, b) => b.confidence - a.confidence);
  }

  // Helper to quickly generate a base 0.0 fingerprint and override it for the dictionary
  private createMockArcheprint(overrides?: Partial<FunctionalFingerprint>): FunctionalFingerprint {
    return {
      structure: { establishmentWeight: 0.0, prolongationWeight: 0.0, dominantWeight: 0.0, cadentialWeight: 0.0 },
      energy: { tensionIndex: 0.0, relaxationIndex: 0.0 },
      momentum: { forwardPull: 0.0, backwardPull: 0.0, staticHold: 0.0 },
      gravity: { tonalGravity: 0.0, modalGravity: 0.0, symmetricGravity: 0.0 },
      direction: { expansion: 0.0, compression: 0.0, suspension: 0.0, resolution: 0.0 },
      perception: { ambiguityIndex: 0.0, closureStrength: 0.0 },
      stability: { harmonicStability: 0.0 },
      color: { modalColor: 0.0, chromaticColor: 0.0, extensionDensity: 0.0 },
      hierarchy: { structuralWeight: 0.0, decorativeWeight: 0.0 },
      cadentialSignature: { authentic: 0.0, plagal: 0.0, deceptive: 0.0, modal: 0.0 },
      modalProfile: { dorianWeight: 0.0, phrygianWeight: 0.0, lydianWeight: 0.0, mixolydianWeight: 0.0, aeolianWeight: 0.0 },
      narrativeIntent: { expansion: 0.0, preparation: 0.0, suspension: 0.0, confirmation: 0.0, diversion: 0.0, resolution: 0.0 },
      identitySignature: [],
      ...overrides
    };
  }
}
