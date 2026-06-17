export interface SimilarityBands {
  identitySimilarity: number;
  behaviorSimilarity: number;
  surfaceSimilarity: number;
  textureSimilarity: number;
}

export interface AsymmetricComparison {
  similarity: SimilarityBands;
  preservationScoreA_to_B: number;
  preservationScoreB_to_A: number;
  
  expansionScore: number;
  compressionScore: number;
}

export interface BandWeights {
  identityBand: number;
  behaviorBand: number;
  surfaceBand: number;
  textureBand: number;
}

export interface AxisWeights {
  narrative: number;
  cadential: number;
  structural: number;
  modal: number;
  energy: number;
  color: number;
}

export interface WeightProfile {
  bands: BandWeights;
  axes: AxisWeights;
}

export const TONAL_WEIGHT_PROFILE: WeightProfile = {
  bands: { identityBand: 0.50, behaviorBand: 0.30, surfaceBand: 0.15, textureBand: 0.05 },
  axes: { cadential: 0.35, structural: 0.35, narrative: 0.15, modal: 0.05, energy: 0.05, color: 0.05 }
};

export const MODAL_WEIGHT_PROFILE: WeightProfile = {
  bands: { identityBand: 0.40, behaviorBand: 0.40, surfaceBand: 0.15, textureBand: 0.05 },
  axes: { modal: 0.40, narrative: 0.20, structural: 0.20, cadential: 0.05, energy: 0.10, color: 0.05 }
};

export const EXPERIMENTAL_WEIGHT_PROFILE: WeightProfile = {
  bands: { identityBand: 0.30, behaviorBand: 0.50, surfaceBand: 0.10, textureBand: 0.10 },
  axes: { narrative: 0.40, energy: 0.25, color: 0.15, modal: 0.10, structural: 0.05, cadential: 0.05 }
};

export interface DriftProfile {
  narrativeDrift: number;
  cadentialDrift: number;
  modalDrift: number;
  structuralDrift: number;
}
