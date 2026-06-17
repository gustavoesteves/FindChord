import type { FunctionalFingerprint } from '../models/FunctionalFingerprint';
import { 
  NeighborClusterType 
} from '../models/FunctionalNeighbor';
import type { NeighborSearchQuery, NeighborResult } from '../models/FunctionalNeighbor';
import { FunctionalSimilarityEngine } from './functionalSimilarityEngine';
import { FunctionalArchetypeEngine } from './functionalArchetypeEngine';
import { TONAL_WEIGHT_PROFILE } from '../models/FunctionalSimilarity';
import type { AsymmetricComparison, DriftProfile } from '../models/FunctionalSimilarity';
import { ArchetypeClass } from '../models/FunctionalArchetype';

/**
 * Functional Neighbor Engine (F14-A2.4)
 * Analyzes candidate progressions against a target and clusters them functionally.
 */
export class FunctionalNeighborEngine {
  private readonly similarityEngine: FunctionalSimilarityEngine;
  private readonly archetypeEngine: FunctionalArchetypeEngine;

  constructor() {
    this.similarityEngine = new FunctionalSimilarityEngine();
    this.archetypeEngine = new FunctionalArchetypeEngine();
  }

  public findNeighbors(
    query: NeighborSearchQuery,
    candidates: { id: string, fingerprint: FunctionalFingerprint }[]
  ): NeighborResult[] {
    const results: NeighborResult[] = [];
    const profile = query.weightProfile ?? TONAL_WEIGHT_PROFILE;

    for (const candidate of candidates) {
      // 1. Calculate Core Distances
      const asymmetric = this.similarityEngine.calculateAsymmetricSimilarity(query.target, candidate.fingerprint, profile);
      const drift = this.similarityEngine.calculateDrift(query.target, candidate.fingerprint);

      // 2. Strict Filters
      if (query.minimumIdentityThreshold !== undefined && asymmetric.similarity.identitySimilarity < query.minimumIdentityThreshold) continue;
      if (query.minimumBehaviorThreshold !== undefined && asymmetric.similarity.behaviorSimilarity < query.minimumBehaviorThreshold) continue;
      if (query.maximumCadentialDrift !== undefined && drift.cadentialDrift > query.maximumCadentialDrift) continue;
      if (query.maximumSurfaceThreshold !== undefined && asymmetric.similarity.surfaceSimilarity > query.maximumSurfaceThreshold) continue;

      // 3. Archetype Bonus
      const archetypeMatches = this.archetypeEngine.classifyProgression(candidate.fingerprint);
      let archetypeConfidenceBonus = 0;
      if (archetypeMatches.length > 0) {
        // Boost if the candidate is a strong, recognizable archetype (especially Harmonic)
        const topMatch = archetypeMatches[0];
        if (topMatch.confidence > 0.8 && topMatch.archetypeClass === ArchetypeClass.Harmonic) {
          archetypeConfidenceBonus = 0.15;
        } else if (topMatch.confidence > 0.6) {
          archetypeConfidenceBonus = 0.05;
        }
      }

      // 4. Determine Cluster
      const cluster = this.determineCluster(asymmetric, drift);

      // 5. Final Score Calculation (Heuristic)
      let finalScore = (asymmetric.similarity.identitySimilarity * 0.4) 
                     + (asymmetric.similarity.behaviorSimilarity * 0.4) 
                     + (asymmetric.preservationScoreA_to_B * 0.2)
                     + archetypeConfidenceBonus;

      // Cap at 1.0
      finalScore = Math.min(1.0, finalScore);

      results.push({
        candidateId: candidate.id,
        fingerprint: candidate.fingerprint,
        cluster,
        similarity: asymmetric.similarity,
        preservationScore: asymmetric.preservationScoreA_to_B,
        archetypeConfidenceBonus,
        finalScore
      });
    }

    // Sort descending by finalScore
    return results.sort((a, b) => b.finalScore - a.finalScore);
  }

  private determineCluster(asymmetric: AsymmetricComparison, drift: DriftProfile): NeighborClusterType {
    const sim = asymmetric.similarity;

    // Semantic Expansion
    if (asymmetric.expansionScore > 0.5 && sim.identitySimilarity > 0.7) {
      return NeighborClusterType.SemanticExpansion;
    }

    // Modal Twin: High Identity & Narrative, but shifted Modal center
    if (sim.identitySimilarity > 0.8 && drift.narrativeDrift < 0.2 && drift.modalDrift > 0.6) {
      return NeighborClusterType.ModalTwin;
    }

    // Identity Twin: Everything matches fundamentally
    if (sim.identitySimilarity > 0.9 && sim.behaviorSimilarity > 0.8) {
      return NeighborClusterType.IdentityTwin;
    }

    // Narrative Cousin: Different identity, same drama (e.g. ii-V-I vs Backdoor)
    if (sim.identitySimilarity < 0.7 && drift.narrativeDrift < 0.3) {
      return NeighborClusterType.NarrativeCousin;
    }

    // Behavioral Cousin: Psychological energy matches, but narrative might differ
    if (sim.behaviorSimilarity > 0.7 && drift.narrativeDrift > 0.3) {
      return NeighborClusterType.BehavioralCousin;
    }

    // Texture Neighbor: Sounds alike (Surface/Texture), but different roles
    if (sim.surfaceSimilarity > 0.8 && sim.identitySimilarity < 0.5) {
      return NeighborClusterType.TextureNeighbor;
    }

    // Fallback if none perfectly match, default to cousin if behavior is decent
    if (sim.behaviorSimilarity > 0.5) {
      return NeighborClusterType.BehavioralCousin;
    }

    // Edge case for purely textural
    return NeighborClusterType.TextureNeighbor;
  }
}
