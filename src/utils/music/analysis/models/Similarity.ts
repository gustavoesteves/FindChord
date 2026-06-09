export interface SimilarityWeights {
  structural: number;    // Peso do eixo estrutural (Layer 1)
  harmonic: number;      // Peso do eixo harmônico (Layer 2)
  formal: number;        // Peso do eixo formal (Layer 3)
  regional: number;      // Peso do eixo regional (Layer 4)
  functional: number;    // Peso do eixo funcional (Layer 5)
  voiceLeading: number;  // Peso do eixo voice-leading (Layer 6)
}

export interface SimilarityBreakdown {
  structural?: number;   // 0.0 a 1.0 se ativo
  harmonic?: number;     // 0.0 a 1.0 se ativo
  formal?: number;       // 0.0 a 1.0 se ativo
  regional?: number;     // 0.0 a 1.0 se ativo
  functional?: number;   // 0.0 a 1.0 se ativo
  voiceLeading?: number; // 0.0 a 1.0 se ativo
}

export interface SimilarityResult {
  overallScore: number;          // Score final ponderado normalizado entre 0.0 e 1.0
  breakdown: SimilarityBreakdown; // Detalhamento por eixo analisado
  activeWeights: SimilarityWeights; // Pesos aplicados após redistribuição dinâmica
}
