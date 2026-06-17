export interface SimilarityScore {
  structuralSimilarity: number;
  narrativeSimilarity: number;
  cadentialSimilarity: number;
  modalSimilarity: number;
  colorSimilarity: number;
  energySimilarity: number;

  overallSimilarity: number;
}

export interface DriftProfile {
  narrativeDrift: number;
  cadentialDrift: number;
  modalDrift: number;
  structuralDrift: number;
}
