export interface VoicingScoreBreakdown {
  coverage: number;       // Cobertura estrutural (+45 máximo)
  bassRole: number;       // Nota do baixo e inversão correspondente (+60 máximo)
  duplications: number;   // Penalidades por duplicações (ex: Terça -6, Sétima -4)
  density: number;        // Densidade de vozes (+50 máximo)
  spacing: number;        // Distribuição acústica (+20 máximo)
  ergonomics: number;     // Facilidade física de montagem (stretch, dedos, trastes)
  total: number;          // Qualidade final calculada
}
