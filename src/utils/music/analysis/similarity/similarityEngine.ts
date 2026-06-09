import type { HarmonicFingerprint } from '../models/HarmonicFingerprint';
import type { 
  SimilarityWeights, 
  SimilarityBreakdown, 
  SimilarityResult 
} from '../models/Similarity';
import type { FunctionalRole } from '../models/FunctionalEquivalence';

// ============================================================================
// Algoritmos Matemáticos Auxiliares
// ============================================================================

/**
 * Calcula a Distância de Levenshtein (edit distance) entre duas sequências de strings.
 */
export function computeLevenshtein(a: string[], b: string[]): number {
  const n = a.length;
  const m = b.length;
  if (n === 0) return m;
  if (m === 0) return n;

  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));

  for (let i = 0; i <= n; i++) dp[i][0] = i;
  for (let j = 0; j <= m; j++) dp[0][j] = j;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,       // Delecão
        dp[i][j - 1] + 1,       // Inserção
        dp[i - 1][j - 1] + cost // Substituição
      );
    }
  }

  return dp[n][m];
}

/**
 * Calcula o custo do alinhamento Dynamic Time Warping (DTW) entre duas sequências.
 */
export function computeDTW<T>(a: T[], b: T[], costFn: (x: T, y: T) => number): number {
  const n = a.length;
  const m = b.length;
  if (n === 0 && m === 0) return 0;
  if (n === 0 || m === 0) return Infinity;

  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(Infinity));
  dp[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = costFn(a[i - 1], b[j - 1]);
      
      // Encontra a melhor transição anterior
      const prevMin = Math.min(
        dp[i - 1][j],     // Compressão
        dp[i][j - 1],     // Dilatação
        dp[i - 1][j - 1]  // Alinhamento diagonal
      );
      
      if (prevMin !== Infinity) {
        dp[i][j] = cost + prevMin;
      }
    }
  }

  return dp[n][m];
}

// ============================================================================
// Motores de Similaridade por Eixo
// ============================================================================

/**
 * Calcula similaridade estrutural (Layer 1) usando DTW nas tensões relativas e estados.
 */
function compareStructural(fpA: HarmonicFingerprint, fpB: HarmonicFingerprint): number {
  const eventsA = fpA.layers.structural?.events || [];
  const eventsB = fpB.layers.structural?.events || [];

  if (eventsA.length === 0 && eventsB.length === 0) return 1.0;
  if (eventsA.length === 0 || eventsB.length === 0) return 0.0;

  const costFn = (e1: typeof eventsA[0], e2: typeof eventsB[0]) => {
    const tensionDiff = Math.abs(e1.relativeTension - e2.relativeTension);
    const statePenalty = e1.state !== e2.state ? 0.4 : 0.0;
    return tensionDiff + statePenalty;
  };

  const dtwCost = computeDTW(eventsA, eventsB, costFn);
  const maxLen = Math.max(eventsA.length, eventsB.length);

  if (dtwCost === Infinity || maxLen === 0) return 0.0;
  
  // Normalização exponencial
  return Math.max(0, Math.min(1.0, Math.exp(-dtwCost / maxLen)));
}

/**
 * Calcula similaridade harmônica (Layer 2) usando Cosseno de Frequências dos dispositivos.
 * Incorpora acordes diatônicos residuais para dar peso às proporções harmônicas globais.
 */
function compareHarmonic(fpA: HarmonicFingerprint, fpB: HarmonicFingerprint): number {
  const harmA = fpA.layers.harmonic;
  const harmB = fpB.layers.harmonic;

  if (!harmA || !harmB) return 1.0;

  const deviceTypes = [
    'SECONDARY_DOMINANT',
    'TRITONE_SUBSTITUTION',
    'MODAL_BORROWING',
    'DECEPTIVE_CADENCE',
    'PASSING_CHROMATIC',
    'DIATONIC'
  ];

  const freqA = { ...harmA.deviceFrequency };
  const freqB = { ...harmB.deviceFrequency };

  // Calcula acordes diatônicos
  const nonDiatonicCountA = harmA.devices.length;
  const nonDiatonicCountB = harmB.devices.length;
  
  freqA['DIATONIC'] = Math.max(0, fpA.metadata.chordsCount - nonDiatonicCountA);
  freqB['DIATONIC'] = Math.max(0, fpB.metadata.chordsCount - nonDiatonicCountB);

  const vA = deviceTypes.map(type => freqA[type] || 0);
  const vB = deviceTypes.map(type => freqB[type] || 0);

  const dotProduct = vA.reduce((sum, val, idx) => sum + val * vB[idx], 0);
  const normA = Math.sqrt(vA.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(vB.reduce((sum, val) => sum + val * val, 0));

  if (normA === 0 || normB === 0) return 1.0;

  return Math.max(0, Math.min(1.0, dotProduct / (normA * normB)));
}

/**
 * Calcula similaridade formal (Layer 3) por igualdade de tipo de período,
 * Levenshtein das funções de frase e razão do total de frases.
 */
function compareFormal(fpA: HarmonicFingerprint, fpB: HarmonicFingerprint): number {
  const formalA = fpA.layers.formal;
  const formalB = fpB.layers.formal;

  if (!formalA || !formalB) return 1.0;

  // 1. Igualdade de Período (30%)
  const periodScore = formalA.isPeriodBased === formalB.isPeriodBased ? 1.0 : 0.0;

  // 2. Levenshtein de papéis formais de frase (50%)
  const seqA = formalA.phrases.map(p => p.role);
  const seqB = formalB.phrases.map(p => p.role);
  const maxPhrases = Math.max(seqA.length, seqB.length);
  
  let phraseRoleScore = 1.0;
  if (maxPhrases > 0) {
    phraseRoleScore = 1.0 - (computeLevenshtein(seqA, seqB) / maxPhrases);
  }

  // 3. Razão de quantidade de frases (20%)
  const minCount = Math.min(formalA.totalPhrases, formalB.totalPhrases);
  const maxCount = Math.max(formalA.totalPhrases, formalB.totalPhrases);
  const countScore = maxCount > 0 ? minCount / maxCount : 1.0;

  return Math.max(0, Math.min(1.0, 
    periodScore * 0.3 + 
    phraseRoleScore * 0.5 + 
    countScore * 0.2
  ));
}

/**
 * Calcula similaridade regional (Layer 4) via Levenshtein dos graus de regiões visitados.
 * Aplica penalidade se a tonalidade mãe divergir de modo (Maior vs Menor).
 */
function compareRegional(fpA: HarmonicFingerprint, fpB: HarmonicFingerprint): number {
  const regA = fpA.layers.regional;
  const regB = fpB.layers.regional;

  if (!regA || !regB) return 1.0;

  const seqA = regA.regionsVisited || [];
  const seqB = regB.regionsVisited || [];
  const maxLen = Math.max(seqA.length, seqB.length);

  let regionalSim = 1.0;
  if (maxLen > 0) {
    regionalSim = 1.0 - (computeLevenshtein(seqA, seqB) / maxLen);
  }

  // Penalidade de modo (Maior vs Menor na tonalidade mãe)
  const isMinorA = regA.homeKey.toUpperCase().includes('MINOR') || regA.homeKey.toUpperCase().includes('AEOLIAN');
  const isMinorB = regB.homeKey.toUpperCase().includes('MINOR') || regB.homeKey.toUpperCase().includes('AEOLIAN');
  if (isMinorA !== isMinorB) {
    regionalSim = Math.max(0, regionalSim - 0.15);
  }

  return Math.max(0, Math.min(1.0, regionalSim));
}

/**
 * Calcula similaridade funcional (Layer 5) usando DTW sobre a sequência de papéis funcionais.
 */
function compareFunctional(fpA: HarmonicFingerprint, fpB: HarmonicFingerprint): number {
  const feA = fpA.layers.extendedLayers?.functionalEquivalence;
  const feB = fpB.layers.extendedLayers?.functionalEquivalence;

  if (!feA || !feB) return 1.0;

  const seqA = feA.roleSequence || [];
  const seqB = feB.roleSequence || [];

  if (seqA.length === 0 && seqB.length === 0) return 1.0;
  if (seqA.length === 0 || seqB.length === 0) return 0.0;

  // Matriz de penalidades funcionais
  const roleCost = (r1: FunctionalRole, r2: FunctionalRole): number => {
    if (r1 === r2) return 0.0;
    if (r1 === 'LINEAR' || r2 === 'LINEAR') return 0.4;
    if (r1 === 'UNRESOLVED' || r2 === 'UNRESOLVED') return 0.8;
    if ((r1 === 'TONIC' && r2 === 'DOMINANT') || (r1 === 'DOMINANT' && r2 === 'TONIC')) return 1.0;
    if ((r1 === 'PREDOMINANT' && r2 === 'DOMINANT') || (r1 === 'DOMINANT' && r2 === 'PREDOMINANT')) return 0.8;
    if ((r1 === 'TONIC' && r2 === 'PREDOMINANT') || (r1 === 'PREDOMINANT' && r2 === 'TONIC')) return 0.8;
    return 1.0;
  };

  const dtwCost = computeDTW(seqA, seqB, roleCost);
  const maxLen = Math.max(seqA.length, seqB.length);

  if (dtwCost === Infinity || maxLen === 0) return 0.0;

  return Math.max(0, Math.min(1.0, Math.exp(-dtwCost / maxLen)));
}

/**
 * Calcula similaridade de voice-leading (Layer 6) usando DTW entre as transições físicas.
 * Ajusta o score com base no desvio global de suavidade.
 */
function compareVoiceLeading(fpA: HarmonicFingerprint, fpB: HarmonicFingerprint): number {
  const vlA = fpA.layers.extendedLayers?.voiceLeading;
  const vlB = fpB.layers.extendedLayers?.voiceLeading;

  if (!vlA || !vlB) return 1.0;

  const eventsA = vlA.events || [];
  const eventsB = vlB.events || [];

  if (eventsA.length === 0 && eventsB.length === 0) return 1.0;
  if (eventsA.length === 0 || eventsB.length === 0) return 0.0;

  const costFn = (e1: typeof eventsA[0], e2: typeof eventsB[0]) => {
    return Math.abs(e1.smoothnessScore - e2.smoothnessScore);
  };

  const dtwCost = computeDTW(eventsA, eventsB, costFn);
  const maxLen = Math.max(eventsA.length, eventsB.length);

  let curveSim = 1.0;
  if (dtwCost !== Infinity && maxLen > 0) {
    curveSim = 1.0 - (dtwCost / maxLen);
  }

  // Diferença global de suavidade
  const avgDiff = Math.abs(vlA.averageSmoothness - vlB.averageSmoothness);

  return Math.max(0, Math.min(1.0, curveSim * 0.7 + (1.0 - avgDiff) * 0.3));
}

// ============================================================================
// Motor de Comparação Principal
// ============================================================================

const DEFAULT_WEIGHTS: SimilarityWeights = {
  structural: 0.25,
  harmonic: 0.15,
  formal: 0.10,
  regional: 0.15,
  functional: 0.25,
  voiceLeading: 0.10
};

/**
 * Compara dois fingerprints harmônicos e calcula uma pontuação ponderada de similaridade.
 * Lida de forma robusta com a ausência de camadas estendidas (Layers 5 e 6),
 * redistribuindo seus pesos proporcionalmente entre as camadas ativas.
 */
export function compareFingerprints(
  fpA: HarmonicFingerprint,
  fpB: HarmonicFingerprint,
  customWeights?: Partial<SimilarityWeights>
): SimilarityResult {
  
  // 1. Resolve os pesos de entrada ou usa os padrões
  const targetWeights = {
    structural: customWeights?.structural ?? DEFAULT_WEIGHTS.structural,
    harmonic: customWeights?.harmonic ?? DEFAULT_WEIGHTS.harmonic,
    formal: customWeights?.formal ?? DEFAULT_WEIGHTS.formal,
    regional: customWeights?.regional ?? DEFAULT_WEIGHTS.regional,
    functional: customWeights?.functional ?? DEFAULT_WEIGHTS.functional,
    voiceLeading: customWeights?.voiceLeading ?? DEFAULT_WEIGHTS.voiceLeading
  };

  // 2. Determina quais eixos possuem dados em AMBOS os fingerprints
  const activeAxes = {
    structural: !!(fpA.layers.structural && fpB.layers.structural),
    harmonic: !!(fpA.layers.harmonic && fpB.layers.harmonic),
    formal: !!(fpA.layers.formal && fpB.layers.formal),
    regional: !!(fpA.layers.regional && fpB.layers.regional),
    functional: !!(fpA.layers.extendedLayers?.functionalEquivalence && fpB.layers.extendedLayers?.functionalEquivalence),
    voiceLeading: !!(fpA.layers.extendedLayers?.voiceLeading && fpB.layers.extendedLayers?.voiceLeading)
  };

  // 3. Redistribuição dinâmica de pesos
  let totalActiveOriginalWeight = 0;
  if (activeAxes.structural) totalActiveOriginalWeight += targetWeights.structural;
  if (activeAxes.harmonic) totalActiveOriginalWeight += targetWeights.harmonic;
  if (activeAxes.formal) totalActiveOriginalWeight += targetWeights.formal;
  if (activeAxes.regional) totalActiveOriginalWeight += targetWeights.regional;
  if (activeAxes.functional) totalActiveOriginalWeight += targetWeights.functional;
  if (activeAxes.voiceLeading) totalActiveOriginalWeight += targetWeights.voiceLeading;

  const activeWeights: SimilarityWeights = {
    structural: 0,
    harmonic: 0,
    formal: 0,
    regional: 0,
    functional: 0,
    voiceLeading: 0
  };

  if (totalActiveOriginalWeight > 0) {
    if (activeAxes.structural) activeWeights.structural = targetWeights.structural / totalActiveOriginalWeight;
    if (activeAxes.harmonic) activeWeights.harmonic = targetWeights.harmonic / totalActiveOriginalWeight;
    if (activeAxes.formal) activeWeights.formal = targetWeights.formal / totalActiveOriginalWeight;
    if (activeAxes.regional) activeWeights.regional = targetWeights.regional / totalActiveOriginalWeight;
    if (activeAxes.functional) activeWeights.functional = targetWeights.functional / totalActiveOriginalWeight;
    if (activeAxes.voiceLeading) activeWeights.voiceLeading = targetWeights.voiceLeading / totalActiveOriginalWeight;
  }

  // 4. Executa os cálculos dos eixos ativos
  const breakdown: SimilarityBreakdown = {};
  let overallScore = 0;

  if (activeAxes.structural) {
    breakdown.structural = compareStructural(fpA, fpB);
    overallScore += breakdown.structural * activeWeights.structural;
  }
  if (activeAxes.harmonic) {
    breakdown.harmonic = compareHarmonic(fpA, fpB);
    overallScore += breakdown.harmonic * activeWeights.harmonic;
  }
  if (activeAxes.formal) {
    breakdown.formal = compareFormal(fpA, fpB);
    overallScore += breakdown.formal * activeWeights.formal;
  }
  if (activeAxes.regional) {
    breakdown.regional = compareRegional(fpA, fpB);
    overallScore += breakdown.regional * activeWeights.regional;
  }
  if (activeAxes.functional) {
    breakdown.functional = compareFunctional(fpA, fpB);
    overallScore += breakdown.functional * activeWeights.functional;
  }
  if (activeAxes.voiceLeading) {
    breakdown.voiceLeading = compareVoiceLeading(fpA, fpB);
    overallScore += breakdown.voiceLeading * activeWeights.voiceLeading;
  }

  return {
    overallScore: Math.max(0, Math.min(1.0, overallScore)),
    breakdown,
    activeWeights
  };
}
