import type { FunctionalFingerprint } from './FunctionalFingerprint';
import type { SimilarityBands, WeightProfile } from './FunctionalSimilarity';

export type NeighborClusterType = 
  | 'IDENTITY_TWIN'
  | 'MODAL_TWIN'
  | 'NARRATIVE_COUSIN'
  | 'BEHAVIORAL_COUSIN'
  | 'TEXTURE_NEIGHBOR'
  | 'SEMANTIC_EXPANSION';

export const NeighborClusterType = {
  IdentityTwin: 'IDENTITY_TWIN' as NeighborClusterType,
  ModalTwin: 'MODAL_TWIN' as NeighborClusterType,
  NarrativeCousin: 'NARRATIVE_COUSIN' as NeighborClusterType,
  BehavioralCousin: 'BEHAVIORAL_COUSIN' as NeighborClusterType,
  TextureNeighbor: 'TEXTURE_NEIGHBOR' as NeighborClusterType,
  SemanticExpansion: 'SEMANTIC_EXPANSION' as NeighborClusterType
};

export interface NeighborSearchQuery {
  target: FunctionalFingerprint;
  weightProfile?: WeightProfile;

  minimumIdentityThreshold?: number;
  minimumBehaviorThreshold?: number;
  maximumCadentialDrift?: number;
  maximumSurfaceThreshold?: number;
}

export interface NeighborResult {
  candidateId: string;
  fingerprint: FunctionalFingerprint;
  cluster: NeighborClusterType;
  similarity: SimilarityBands;
  preservationScore: number;
  archetypeConfidenceBonus: number;
  finalScore: number;
}
