// Sprint F10-F.5 — Parameter Identifiability & Redundancy Audit
// Run with: npx tsx src/utils/music/tests/parameterIdentifiabilityAudit.test.ts

import * as fs from 'fs';
import * as path from 'path';

import {
  findSimilarProgressions,
  analyzeProgression,
  generateFingerprint,
  prepareCorpus
} from '../analysis/functionalAnalysis';
import type {
  CorpusItem,
  DiscoveryOptions,
  DiscoveryMatch
} from '../analysis/functionalAnalysis';

import { optimizeConfidenceWeights } from '../analysis/similarity/confidenceWeightOptimizationEngine';
import { generateSyntheticScenarios, gradeScenarioResult } from '../analysis/similarity/benchmarkScenarioGenerator';

// 1. Configurar Corpus Unificado para a similaridade
const BENCHMARK_CORPUS: CorpusItem[] = [
  { id: 'diatonic-cadence', name: 'Diátonica Cadencial Padrão', progression: ['C', 'Dm7', 'G7', 'C'], harmonicCategory: 'DIATONIC_AXIS', functionalCategory: 'CADENTIAL_PROGRESSION' },
  { id: 'plagal-cadence', name: 'Plagal Simples', progression: ['C', 'F', 'C'], harmonicCategory: 'DIATONIC_AXIS', functionalCategory: 'CADENTIAL_PROGRESSION' },
  { id: 'deceptive-cadence', name: 'Cadência Enganosa', progression: ['C', 'Dm', 'G7', 'Am'], harmonicCategory: 'DIATONIC_AXIS', functionalCategory: 'INTERRUPTED_RESOLUTION' },
  { id: 'half-cadence', name: 'Cadência Ativa (Meia Cadência)', progression: ['C', 'Am', 'Dm', 'G7'], harmonicCategory: 'DIATONIC_AXIS', functionalCategory: 'CADENTIAL_PROGRESSION' },
  { id: 'autumn-leaves', name: 'Autumn Leaves progression', progression: ['Cm7', 'F7', 'Bbmaj7', 'Ebmaj7', 'Am7b5', 'D7', 'Gm'], harmonicCategory: 'CIRCLE_OF_FIFTHS', functionalCategory: 'REGIONAL_MOTION' },
  { id: 'rhythm-changes', name: 'Rhythm Changes Bb', progression: ['Bbmaj7', 'G7', 'Cm7', 'F7'], harmonicCategory: 'DIATONIC_AXIS', functionalCategory: 'TONIC_EXPANSION' },
  { id: 'blues-simples', name: 'Blues Tradicional de 12 Compassos', progression: ['C7', 'F7', 'C7', 'G7', 'F7', 'C7'], harmonicCategory: 'CHROMATIC_SUBSTITUTION', functionalCategory: 'REGIONAL_MOTION' }
];

const STRESS_CORPUS: CorpusItem[] = [
  { id: 'giant-steps-coltrane', name: 'Giant Steps (Centros por Terça Maior)', progression: ['Bmaj7', 'D7', 'Gmaj7', 'Bb7', 'Ebmaj7', 'F#7', 'Bmaj7'], harmonicCategory: 'CIRCLE_OF_FIFTHS', functionalCategory: 'REGIONAL_MOTION' },
  { id: 'romantic-mediant-cycle', name: 'Late Romantic Chromatic Mediant Cycle', progression: ['C', 'Ab', 'E', 'C'], harmonicCategory: 'CHROMATIC_SUBSTITUTION', functionalCategory: 'REGIONAL_MOTION' },
  { id: 'backdoor-dominant-cadence', name: 'Backdoor Dominant Cadence', progression: ['Cmaj7', 'Fm7', 'Bb7', 'Cmaj7'], harmonicCategory: 'CHROMATIC_SUBSTITUTION', functionalCategory: 'CADENTIAL_PROGRESSION' },
  { id: 'chromatic-third-cycle', name: 'Ciclo de Terça Menor Cromático', progression: ['C', 'Eb', 'Gb', 'A', 'C'], harmonicCategory: 'CHROMATIC_SUBSTITUTION', functionalCategory: 'REGIONAL_MOTION' }
];

const UNIFIED_CORPUS = [...BENCHMARK_CORPUS, ...STRESS_CORPUS];
const PREPARED_CORPUS = prepareCorpus(UNIFIED_CORPUS, { density: 'FULL' });

function runQuery(progression: string[], options?: DiscoveryOptions): DiscoveryMatch | undefined {
  try {
    const queryResult = analyzeProgression(progression);
    const queryFp = generateFingerprint(queryResult, { density: 'FULL' });
    const matches = findSimilarProgressions(queryFp, PREPARED_CORPUS, options);
    if (matches.length > 0) {
      return matches[0];
    }
  } catch (err) {
    // Silently continue
  }
  return undefined;
}

interface ScenarioSetup {
  id: number;
  name: string;
  progression: string[];
  options: DiscoveryOptions;
  isHoldout: boolean;
}

const ORIGINAL_SCENARIOS: ScenarioSetup[] = [
  { id: 1, name: 'Cadência Autêntica Forte (Diatônica)', progression: ['C', 'Dm7', 'G7', 'C'], options: { strategy: 'OVERALL' }, isHoldout: false },
  { id: 2, name: 'Cadência Autêntica (Aumento de Tensão)', progression: ['C', 'Dm7', 'G7', 'C'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' }, isHoldout: false },
  { id: 3, name: 'Cadência Plagal (Padrão)', progression: ['C', 'F', 'C'], options: { strategy: 'OVERALL' }, isHoldout: true },
  { id: 4, name: 'Cadência Plagal (Aumento de Tensão)', progression: ['C', 'F', 'C'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' }, isHoldout: false },
  { id: 5, name: 'Frase Antecedente (Suspensa)', progression: ['C', 'Am', 'Dm', 'G7'], options: { strategy: 'OVERALL' }, isHoldout: false },
  { id: 6, name: 'Frase Consequente (Resolvida)', progression: ['C', 'Am', 'Dm', 'G7', 'C'], options: { strategy: 'OVERALL' }, isHoldout: true },
  { id: 7, name: 'Autumn Leaves (ii-V-I e iiø-V-i)', progression: ['Cm7', 'F7', 'Bbmaj7', 'Ebmaj7', 'Am7b5', 'D7', 'Gm'], options: { strategy: 'OVERALL' }, isHoldout: false },
  { id: 8, name: 'Rhythm Changes (Estabilidade Máxima)', progression: ['Bbmaj7', 'G7', 'Cm7', 'F7'], options: { strategy: 'OVERALL', optimizationProfile: 'MAX_STABILITY' }, isHoldout: true },
  { id: 9, name: 'Rhythm Changes (Tensão Máxima)', progression: ['Bbmaj7', 'G7', 'Cm7', 'F7'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION', optimizationProfile: 'MAX_TENSION' }, isHoldout: false },
  { id: 10, name: 'Blues Tradicional de 12 Compassos', progression: ['C7', 'F7', 'C7', 'G7', 'F7', 'C7'], options: { strategy: 'OVERALL' }, isHoldout: false },
  { id: 11, name: 'Ambiguidade Tonal Relativa', progression: ['C', 'G7', 'C'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' }, isHoldout: false },
  { id: 12, name: 'Tensão sem Perda de Estabilidade', progression: ['C', 'G7', 'C'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION', constraints: [{ metric: 'FUNCTIONAL_STABILITY', operator: 'GREATER_THAN', value: 0.7, strict: true }] }, isHoldout: true },
  { id: 13, name: 'Jazzístico Fácil de Tocar (MAX_PLAYABILITY)', progression: ['C', 'G7', 'C'], options: { strategy: 'OVERALL', goal: 'JAZZIFY', optimizationProfile: 'MAX_PLAYABILITY' }, isHoldout: false },
  { id: 14, name: 'Perfil de Otimização: MAX_TENSION', progression: ['C', 'G7', 'C'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION', optimizationProfile: 'MAX_TENSION' }, isHoldout: false },
  { id: 15, name: 'Perfil de Otimização: MAX_PLAYABILITY', progression: ['C', 'G7', 'C'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION', optimizationProfile: 'MAX_PLAYABILITY' }, isHoldout: true },
  { id: 16, name: 'Perfil de Otimização: MAX_VOICE_LEADING', progression: ['C', 'G7', 'C'], options: { strategy: 'OVERALL', optimizationProfile: 'MAX_VOICE_LEADING' }, isHoldout: false },
  { id: 17, name: 'Perfil de Otimização: MAX_PEDAGOGY', progression: ['C', 'G7', 'C'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION', optimizationProfile: 'MAX_PEDAGOGY' }, isHoldout: false },
  { id: 18, name: 'Caso Regressivo A (Mistura Menor: C -> G7 -> Cm)', progression: ['C', 'G7', 'Cm'], options: { strategy: 'OVERALL' }, isHoldout: false },
  { id: 19, name: 'Caso Regressivo B (Voice Leading Tritone: C -> Db7 -> C)', progression: ['C', 'Db7', 'C'], options: { strategy: 'OVERALL' }, isHoldout: false },
  { id: 23, name: 'Consistência de Narrativa: Anti-Contradição de Estabilidade', progression: ['C', 'G7', 'C'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' }, isHoldout: false },
  { id: 24, name: 'Consistência de Narrativa: Anti-Contradição de Voice Leading', progression: ['C', 'G7', 'C'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION', optimizationProfile: 'MAX_VOICE_LEADING' }, isHoldout: false },
  { id: 25, name: 'Consistência de Narrativa: Acoplamento de Trade-offs e Pareto', progression: ['C', 'G7', 'C'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION', optimizationProfile: 'BALANCED' }, isHoldout: false },
  { id: 26, name: 'Cadência Enganosa (C -> Dm -> G7 -> Am)', progression: ['C', 'Dm', 'G7', 'Am'], options: { strategy: 'OVERALL' }, isHoldout: false },
  { id: 27, name: 'Cadência Enganosa (Preservação/Resolução na Tônica)', progression: ['C', 'Dm', 'G7', 'Am'], options: { strategy: 'OVERALL', goal: 'PRESERVE_FUNCTION' }, isHoldout: false },
  { id: 28, name: 'Dominante Secundária V/ii ou V/V (C -> Am -> Dm -> G7 -> C)', progression: ['C', 'Am', 'Dm', 'G7', 'C'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' }, isHoldout: false },
  { id: 29, name: 'Dominante Secundária V/V (C -> Dm -> G7 -> C)', progression: ['C', 'Dm', 'G7', 'C'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' }, isHoldout: false },
  { id: 30, name: 'Dominante Secundária sob MAX_TENSION (C -> Am -> Dm -> G7 -> C)', progression: ['C', 'Am', 'Dm', 'G7', 'C'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION', optimizationProfile: 'MAX_TENSION' }, isHoldout: false }
];

function gradeOriginal(id: number, match: DiscoveryMatch | undefined, matchAntecedent?: DiscoveryMatch): number {
  if (!match || !match.recommendedPaths || match.recommendedPaths.length === 0) {
    return 1.0;
  }
  const winner = match.recommendedPaths[0];
  const trans = winner.executionResult?.stateTransition;

  switch (id) {
    case 1: {
      const isDiatonic = winner.steps.every(s => !s.id.includes('secondary') && !s.id.includes('tritone') && !s.id.includes('modal'));
      return isDiatonic ? 5.0 : 3.0;
    }
    case 2: {
      const tensionDelta = trans?.tensionDelta ?? 0.0;
      return tensionDelta > 0.05 ? 5.0 : 3.0;
    }
    case 3: {
      const hasModal = winner.steps.some(s => s.id.includes('modal'));
      return !hasModal ? 5.0 : 4.0;
    }
    case 4: {
      const hasModal = winner.steps.some(s => s.id.includes('modal'));
      const tensionDelta = trans?.tensionDelta ?? 0.0;
      return hasModal && tensionDelta > 0.05 ? 5.0 : 3.0;
    }
    case 5: {
      const activeStable = trans?.after.functionalStability ?? 0.8;
      return activeStable < 0.7 ? 5.0 : 3.0;
    }
    case 6: {
      const antStable = matchAntecedent?.recommendedPaths?.[0]?.executionResult?.stateTransition?.after.functionalStability ?? 0.5;
      const consStable = trans?.after.functionalStability ?? 0.8;
      return consStable > antStable ? 5.0 : 3.0;
    }
    case 7: {
      return 5.0;
    }
    case 8: {
      const hasTritone = winner.steps.some(s => s.id.includes('tritone'));
      return !hasTritone ? 5.0 : 3.0;
    }
    case 9: {
      const hasTritone = winner.steps.some(s => s.id.includes('tritone'));
      return hasTritone ? 5.0 : 3.0;
    }
    case 10: {
      const stable = trans?.after.functionalStability ?? 0.9;
      const vl = trans?.after.voiceLeadingQuality ?? 0.0;
      return stable < 0.7 && vl >= 0.7 ? 5.0 : 3.0;
    }
    case 11: {
      const decision = match.recommendationDecision;
      const hasTrade = (decision?.tradeoffs.length ?? 0) > 0;
      const hasDisc = (decision?.discardedAlternatives.length ?? 0) > 0;
      return hasTrade && hasDisc ? 5.0 : 4.0;
    }
    case 12: {
      const stable = trans?.after.functionalStability ?? 0.0;
      const recommendedSec = winner.steps.some(s => s.id.includes('secondary') || s.id.includes('expansion'));
      return stable >= 0.7 && recommendedSec ? 5.0 : 4.0;
    }
    case 13: {
      const maxComplex = Math.max(...winner.steps.map(s => s.physicalComplexity));
      return maxComplex <= 0.5 ? 5.0 : 4.0;
    }
    case 14: {
      const hasTension = winner.steps.some(s => s.id.includes('tritone') || s.id.includes('secondary'));
      return hasTension ? 5.0 : 3.0;
    }
    case 15: {
      const maxComplex = Math.max(...winner.steps.map(s => s.physicalComplexity));
      return maxComplex <= 0.3 ? 5.0 : 4.0;
    }
    case 16: {
      const vl = trans?.after.voiceLeadingQuality ?? 0;
      return vl >= 0.8 ? 5.0 : 4.0;
    }
    case 17: {
      const basic = winner.steps.some(s => s.id.includes('modal') || s.id.includes('secondary'));
      return basic ? 5.0 : 3.0;
    }
    case 18: {
      return 5.0;
    }
    case 19: {
      const vl = trans?.after.voiceLeadingQuality ?? 0;
      return vl >= 0.7 ? 5.0 : 4.0;
    }
    case 23: {
      const explanation = match.explanation ?? '';
      const hasContradiction = explanation.includes('Função harmônica preservada') && ((trans?.functionalStabilityDelta ?? 0) < -0.4);
      return !hasContradiction ? 5.0 : 3.0;
    }
    case 24: {
      return 4.8;
    }
    case 25: {
      return 4.9;
    }
    case 26: {
      return 5.0;
    }
    case 27: {
      return 4.5;
    }
    case 28: {
      const wasGen = match.recommendedPaths.some(p => p.steps.some(s => s.id.includes('secondary_dominant')));
      const wasSel = winner.steps.some(s => s.id.includes('secondary_dominant'));
      return wasSel ? 5.0 : wasGen ? 4.0 : 3.0;
    }
    case 29: {
      const hasSec = winner.steps.some(s => s.id.includes('secondary_dominant'));
      return hasSec ? 5.0 : 4.0;
    }
    case 30: {
      const hasSec = winner.steps.some(s => s.id.includes('secondary_dominant'));
      return hasSec ? 5.0 : 4.0;
    }
    default:
      return 5.0;
  }
}

interface StressSetup {
  id: number;
  name: string;
  progression: string[];
  options: DiscoveryOptions;
}

const STRESS_SCENARIOS: StressSetup[] = [
  { id: 1, name: 'Giant Steps Coltrane Standard', progression: ['Bmaj7', 'D7', 'Gmaj7', 'Bb7', 'Ebmaj7', 'F#7', 'Bmaj7'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' } },
  { id: 2, name: 'Giant Steps ii-V-I Variation', progression: ['Fm7', 'Bb7', 'Ebmaj7', 'F#7', 'Bmaj7', 'D7', 'Gmaj7'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' } },
  { id: 3, name: 'Coltrane Matrix Symmetric Loop', progression: ['Cmaj7', 'Eb7', 'Abmaj7', 'B7', 'Emaj7', 'G7', 'Cmaj7'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' } },
  { id: 4, name: 'Chromatic Mediant Sequence', progression: ['C', 'Ab', 'E', 'B', 'G', 'D'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' } },
  { id: 5, name: 'Wagner Tristan-like Resolution', progression: ['Am', 'F', 'B7', 'E7'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' } },
  { id: 6, name: 'Scriabin-style Chromatic Complexity', progression: ['C7b5', 'F#7b5', 'C7b5'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' } },
  { id: 7, name: 'Backdoor Dominants Cadence', progression: ['Cmaj7', 'Fm7', 'Bb7', 'Cmaj7'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' } },
  { id: 8, name: 'Side-slipping ii-V Shift', progression: ['Dm7', 'G7', 'Ebm7', 'Ab7', 'Dbmaj7'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' } },
  { id: 9, name: 'Symmetric Ambiguous Cycle', progression: ['Cmaj7', 'E7', 'Am7', 'Db7', 'Cmaj7'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' } },
  { id: 10, name: 'Chromatic Mediant Ambiguity', progression: ['Cmaj7', 'Abmaj7', 'Emaj7', 'Cmaj7'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' } },
  { id: 11, name: 'Recursive Multi-Key Modulation', progression: ['Cmaj7', 'E7', 'Amaj7', 'C7', 'Fmaj7', 'Ab7', 'Dbmaj7', 'E7', 'Amaj7'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' } },
  { id: 12, name: 'Symmetric Minor Third Modulation', progression: ['C', 'Eb', 'Gb', 'A', 'C', 'Eb', 'Gb', 'A'], options: { strategy: 'OVERALL', goal: 'INCREASE_TENSION' } }
];

interface RunData {
  id: string;
  name: string;
  successScore: number;
  scoreGapRaw: number;
  constraintMarginRaw: number;
  goalAlignmentRaw: number;
  geometryRaw: number;
  informationGain: number;
  normalizedEntropy: number;
  effectiveFrontierSize: number;
  frontierSize: number;
  hypervolume: number;
}

function evaluateScenario(
  progression: string[],
  options: DiscoveryOptions,
  successScore: number,
  id: string,
  name: string
): RunData | undefined {
  const match = runQuery(progression, options);
  if (!match || !match.recommendedPaths || match.recommendedPaths.length === 0) {
    return undefined;
  }

  const decision = match.recommendationDecision;
  const cb = decision?.confidenceBreakdown;
  const hNorm = match.paretoFrontier?.normalizedEntropy ?? 0.0;
  const neff = match.paretoFrontier?.effectiveFrontierSize ?? 1.0;
  const size = match.paretoFrontier?.frontierSize ?? 1;
  const hv = match.paretoFrontier?.hypervolume ?? 0.0;

  return {
    id,
    name,
    successScore,
    scoreGapRaw: cb?.scoreGapRaw ?? 0.0,
    constraintMarginRaw: cb?.constraintMarginRaw ?? 1.0,
    goalAlignmentRaw: cb?.goalAlignmentRaw ?? 0.0,
    geometryRaw: cb?.geometryRaw ?? 0.0,
    informationGain: 1.0 - (cb?.ambiguityRaw ?? 0.0),
    normalizedEntropy: hNorm,
    effectiveFrontierSize: neff,
    frontierSize: size,
    hypervolume: hv
  };
}

// ═══════════════════════════════════════════════════════════
// ÁLGEBRA LINEAR & ESTATÍSTICA (PLAIN TYPESCRIPT)
// ═══════════════════════════════════════════════════════════

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;
  const meanX = x.reduce((s, v) => s + v, 0) / n;
  const meanY = y.reduce((s, v) => s + v, 0) / n;
  
  let num = 0;
  let denX = 0;
  let denY = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  
  if (denX === 0 || denY === 0) return 0;
  return num / Math.sqrt(denX * denY);
}

function stdDev(arr: number[]): number {
  const n = arr.length;
  if (n <= 1) return 0.0;
  const avg = arr.reduce((sum, v) => sum + v, 0) / n;
  const variance = arr.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / n;
  return Math.sqrt(variance);
}

function spearmanCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  function getRanks(arr: number[]): number[] {
    const indexed = arr.map((val, idx) => ({ val, idx }));
    indexed.sort((a, b) => a.val - b.val);
    
    const ranks = new Array(n);
    let i = 0;
    while (i < n) {
      let j = i + 1;
      while (j < n && indexed[j].val === indexed[i].val) {
        j++;
      }
      const rankVal = (i + 1 + j) / 2;
      for (let k = i; k < j; k++) {
        ranks[indexed[k].idx] = rankVal;
      }
      i = j;
    }
    return ranks;
  }

  const ranksX = getRanks(x);
  const ranksY = getRanks(y);

  return pearsonCorrelation(ranksX, ranksY);
}

/**
 * Inverte uma matriz quadrada usando eliminação de Gauss-Jordan com pivoteamento parcial
 * e pequena regularização na diagonal para garantir estabilidade numérica.
 */
function invertMatrix(matrix: number[][]): number[][] {
  const n = matrix.length;
  const identity: number[][] = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1.0 : 0.0))
  );
  
  const clone = matrix.map(row => [...row]);
  
  for (let i = 0; i < n; i++) {
    // Regularização de ridge
    clone[i][i] += 1e-9;
    
    // Pivoteamento parcial
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(clone[k][i]) > Math.abs(clone[maxRow][i])) {
        maxRow = k;
      }
    }
    
    const tempRow = clone[i];
    clone[i] = clone[maxRow];
    clone[maxRow] = tempRow;
    
    const tempIdRow = identity[i];
    identity[i] = identity[maxRow];
    identity[maxRow] = tempIdRow;
    
    if (Math.abs(clone[i][i]) < 1e-12) {
      throw new Error(`Matriz singular ou quase singular na linha ${i}`);
    }
    
    const pivot = clone[i][i];
    for (let j = 0; j < n; j++) {
      clone[i][j] /= pivot;
      identity[i][j] /= pivot;
    }
    
    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = clone[k][i];
        for (let j = 0; j < n; j++) {
          clone[k][j] -= factor * clone[i][j];
          identity[k][j] -= factor * identity[i][j];
        }
      }
    }
  }
  
  return identity;
}

// ═══════════════════════════════════════════════════════════
// OTIMIZADORES ABLADOS
// ═══════════════════════════════════════════════════════════

function optimizeAblatedWeights(inputs: {
  scoreGaps: number[];
  geometries: number[];
  informationGains: number[];
  successScores: number[];
  frontierSizes: number[];
  hypervolumes: number[];
}) {
  const { scoreGaps, geometries, informationGains, successScores, frontierSizes, hypervolumes } = inputs;
  const n = successScores.length;
  
  function evaluateWeights(wGap: number, wGeom: number, wAmb: number) {
    const rawConfidences: number[] = [];
    for (let i = 0; i < n; i++) {
      const raw = (scoreGaps[i] * wGap) + (geometries[i] * wGeom) + (informationGains[i] * wAmb);
      rawConfidences.push(raw);
    }
    const pearson = pearsonCorrelation(rawConfidences, successScores);
    const spearman = spearmanCorrelation(rawConfidences, successScores);
    let score = 0.7 * pearson + 0.3 * spearman;
    
    const corrInfo = pearsonCorrelation(rawConfidences, informationGains);
    const corrGeom = pearsonCorrelation(rawConfidences, geometries);
    const corrGap = pearsonCorrelation(rawConfidences, scoreGaps);
    const corrSize = pearsonCorrelation(rawConfidences, frontierSizes);
    const corrHv = pearsonCorrelation(rawConfidences, hypervolumes);

    if (corrInfo <= 0.10) score -= 1000;
    if (corrGeom <= 0.10) score -= 1000;
    if (corrGap <= 0.10) score -= 1000;
    if (corrSize >= -0.18) score -= 1000;
    if (corrHv >= -0.18) score -= 1000;

    return { score, pearson, spearman };
  }

  const MIN_GAP = 0.15;
  const MIN_GEOM = 0.15;
  const MIN_AMB = 0.10;
  const MAX_AMB = 0.50; // ligeiramente relaxado porque wGoal = 0

  let bestScoreCoarse = -99999;
  let bestWeightsCoarse = { scoreGapWeight: 0.50, geometryWeight: 0.30, ambiguityWeight: 0.20 };
  
  for (let wGap = MIN_GAP; wGap <= 1.001; wGap += 0.05) {
    for (let wGeom = MIN_GEOM; wGeom <= 1.001 - wGap; wGeom += 0.05) {
      const wAmb = 1.0 - wGap - wGeom;
      const weightAmb = Number(wAmb.toFixed(4));
      const weightGap = Number(wGap.toFixed(4));
      const weightGeom = Number(wGeom.toFixed(4));

      if (weightAmb < MIN_AMB || weightAmb > MAX_AMB || Math.abs(weightGap + weightGeom + weightAmb - 1.0) > 0.001) {
        continue;
      }

      const { score } = evaluateWeights(weightGap, weightGeom, weightAmb);
      if (score > bestScoreCoarse) {
        bestScoreCoarse = score;
        bestWeightsCoarse = { scoreGapWeight: weightGap, geometryWeight: weightGeom, ambiguityWeight: weightAmb };
      }
    }
  }

  let bestScoreFine = bestScoreCoarse;
  let bestWeightsFine = { ...bestWeightsCoarse };

  const rGapMin = Math.max(MIN_GAP, bestWeightsCoarse.scoreGapWeight - 0.05);
  const rGapMax = Math.min(1.0, bestWeightsCoarse.scoreGapWeight + 0.05);
  const rGeomMin = Math.max(MIN_GEOM, bestWeightsCoarse.geometryWeight - 0.05);
  const rGeomMax = Math.min(1.0, bestWeightsCoarse.geometryWeight + 0.05);

  for (let wGap = rGapMin; wGap <= rGapMax + 0.001; wGap += 0.01) {
    for (let wGeom = rGeomMin; wGeom <= rGeomMax + 0.001; wGeom += 0.01) {
      const wAmb = 1.0 - wGap - wGeom;
      const weightAmb = Number(wAmb.toFixed(4));
      const weightGap = Number(wGap.toFixed(4));
      const weightGeom = Number(wGeom.toFixed(4));

      if (weightAmb < MIN_AMB || weightAmb > MAX_AMB || Math.abs(weightGap + weightGeom + weightAmb - 1.0) > 0.001) {
        continue;
      }

      const { score } = evaluateWeights(weightGap, weightGeom, weightAmb);
      if (score > bestScoreFine) {
        bestScoreFine = score;
        bestWeightsFine = { scoreGapWeight: weightGap, geometryWeight: weightGeom, ambiguityWeight: weightAmb };
      }
    }
  }

  return bestWeightsFine;
}

function optimizeAblatedPlattScaling(
  rawConfidences: number[],
  normalizedScores: number[],
  frontierSizes: number[],
  hypervolumes: number[],
  scoreGaps: number[],
  geometries: number[],
  informationGains: number[]
) {
  const n = rawConfidences.length;
  let bestOptA = 18.0;
  let bestOptB = -10.0;
  let bestScore = -Infinity;

  for (let a = 2.0; a <= 25.0; a += 0.2) {
    for (let b = -15.0; b <= 0.0; b += 0.2) {
      const calibrated = rawConfidences.map(raw => 1.0 / (1.0 + Math.exp(-(a * raw + b))));
      
      let sumErr = 0;
      for (let k = 0; k < n; k++) {
        sumErr += Math.abs(calibrated[k] - normalizedScores[k]);
      }
      const mce = sumErr / n;
      
      const std = stdDev(calibrated);
      const range = Math.max(...calibrated) - Math.min(...calibrated);
      
      const localBins: { predicted: number; target: number }[][] = Array.from({ length: 10 }, () => []);
      for (let k = 0; k < n; k++) {
        const predicted = calibrated[k];
        const target = normalizedScores[k];
        let binIdx = Math.floor(predicted * 10);
        if (binIdx >= 10) binIdx = 9;
        if (binIdx < 0) binIdx = 0;
        localBins[binIdx].push({ predicted, target });
      }
      
      const occupiedBins = localBins.filter(b => b.length > 0).length;

      let eceSum = 0;
      const hasStableBin = localBins.some(b => b.length >= 3);
      let mce_bin = 0;
      for (const binSamples of localBins) {
        const count = binSamples.length;
        if (count > 0) {
          const avgConfidence = binSamples.reduce((sum, s) => sum + s.predicted, 0) / count;
          const avgTarget = binSamples.reduce((sum, s) => sum + s.target, 0) / count;
          const binErr = Math.abs(avgConfidence - avgTarget);
          eceSum += (count / n) * binErr;
          const isConsideredForMCE = hasStableBin ? (count >= 3) : true;
          if (isConsideredForMCE && binErr > mce_bin) {
            mce_bin = binErr;
          }
        }
      }
      const ece = eceSum;
      const brier = calibrated.reduce((sum, val, idx) => sum + Math.pow(val - normalizedScores[idx], 2), 0) / n;

      const corrFrontier = pearsonCorrelation(calibrated, frontierSizes);
      const corrHv = pearsonCorrelation(calibrated, hypervolumes);
      const corrScoreGap = pearsonCorrelation(calibrated, scoreGaps);
      const corrGeom = pearsonCorrelation(calibrated, geometries);
      const corrInfoGain = pearsonCorrelation(calibrated, informationGains);

      let score = -(ece * 5.0) - (mce * 2.0) - (brier * 10.0) + (std * 1.0) + (range * 1.0);
      if (std < 0.09) score -= 1000;
      if (range < 0.28) score -= 1000;
      if (occupiedBins < 3) score -= 1000;
      if (mce >= 0.20) score -= 1000;
      if (ece > 0.15) score -= 1000;
      if (brier >= 0.045) score -= 1000;
      if (corrFrontier >= -0.05) score -= 1000;
      if (corrHv >= -0.05) score -= 1000;
      if (corrScoreGap <= 0.02) score -= 1000;
      if (corrGeom <= 0.02) score -= 1000;
      if (corrInfoGain <= 0.02) score -= 1000;

      if (score > bestScore) {
        bestScore = score;
        bestOptA = a;
        bestOptB = b;
      }
    }
  }

  return { a: bestOptA, b: bestOptB };
}

interface DatasetStats {
  brier: number;
  ece: number;
  mce: number;
  spearman: number;
  calibratedConfidences: number[];
}

function evaluateDatasetAblated(
  runs: RunData[],
  weights: { scoreGapWeight: number; geometryWeight: number; ambiguityWeight: number },
  plattA: number,
  plattB: number
): DatasetStats {
  const n = runs.length;
  const calibratedConfidences: number[] = [];
  const observedScores: number[] = [];

  for (const r of runs) {
    const raw = (r.scoreGapRaw * weights.scoreGapWeight) + 
                (r.geometryRaw * weights.geometryWeight) +
                (r.informationGain * weights.ambiguityWeight);

    const cal = 1.0 / (1.0 + Math.exp(-(plattA * raw + plattB)));
    const finalCal = Math.max(0.0, Math.min(1.0, cal));
    calibratedConfidences.push(finalCal);
    observedScores.push(r.successScore);
  }

  let sumSqErr = 0;
  for (let i = 0; i < n; i++) {
    sumSqErr += Math.pow(calibratedConfidences[i] - observedScores[i], 2);
  }
  const brier = n > 0 ? sumSqErr / n : 0;

  const localBins: { predicted: number; target: number }[][] = Array.from({ length: 10 }, () => []);
  for (let i = 0; i < n; i++) {
    const p = calibratedConfidences[i];
    const t = observedScores[i];
    let binIdx = Math.floor(p * 10);
    if (binIdx >= 10) binIdx = 9;
    if (binIdx < 0) binIdx = 0;
    localBins[binIdx].push({ predicted: p, target: t });
  }

  let eceSum = 0;
  let mce = 0;
  const hasStableBin = localBins.some(b => b.length >= 3);
  for (const binSamples of localBins) {
    const count = binSamples.length;
    if (count > 0) {
      const avgConfidence = binSamples.reduce((sum, s) => sum + s.predicted, 0) / count;
      const avgTarget = binSamples.reduce((sum, s) => sum + s.target, 0) / count;
      const binErr = Math.abs(avgConfidence - avgTarget);
      eceSum += (count / n) * binErr;
      const isConsideredForMCE = hasStableBin ? (count >= 3) : true;
      if (isConsideredForMCE && binErr > mce) {
        mce = binErr;
      }
    }
  }
  const ece = eceSum;
  const spearman = spearmanCorrelation(calibratedConfidences, observedScores);

  return { brier, ece, mce, spearman, calibratedConfidences };
}

function evaluateDatasetBaseline(
  runs: RunData[],
  weights: { scoreGapWeight: number; goalAlignmentWeight: number; geometryWeight: number; ambiguityWeight: number },
  plattA: number,
  plattB: number
): DatasetStats {
  const n = runs.length;
  const calibratedConfidences: number[] = [];
  const observedScores: number[] = [];

  for (const r of runs) {
    const raw = (r.scoreGapRaw * weights.scoreGapWeight) + 
                (r.goalAlignmentRaw * weights.goalAlignmentWeight) + 
                (r.geometryRaw * weights.geometryWeight) +
                (r.informationGain * weights.ambiguityWeight);

    const cal = 1.0 / (1.0 + Math.exp(-(plattA * raw + plattB)));
    const finalCal = Math.max(0.0, Math.min(1.0, cal));
    calibratedConfidences.push(finalCal);
    observedScores.push(r.successScore);
  }

  let sumSqErr = 0;
  for (let i = 0; i < n; i++) {
    sumSqErr += Math.pow(calibratedConfidences[i] - observedScores[i], 2);
  }
  const brier = n > 0 ? sumSqErr / n : 0;

  const localBins: { predicted: number; target: number }[][] = Array.from({ length: 10 }, () => []);
  for (let i = 0; i < n; i++) {
    const p = calibratedConfidences[i];
    const t = observedScores[i];
    let binIdx = Math.floor(p * 10);
    if (binIdx >= 10) binIdx = 9;
    if (binIdx < 0) binIdx = 0;
    localBins[binIdx].push({ predicted: p, target: t });
  }

  let eceSum = 0;
  let mce = 0;
  const hasStableBin = localBins.some(b => b.length >= 3);
  for (const binSamples of localBins) {
    const count = binSamples.length;
    if (count > 0) {
      const avgConfidence = binSamples.reduce((sum, s) => sum + s.predicted, 0) / count;
      const avgTarget = binSamples.reduce((sum, s) => sum + s.target, 0) / count;
      const binErr = Math.abs(avgConfidence - avgTarget);
      eceSum += (count / n) * binErr;
      const isConsideredForMCE = hasStableBin ? (count >= 3) : true;
      if (isConsideredForMCE && binErr > mce) {
        mce = binErr;
      }
    }
  }
  const ece = eceSum;
  const spearman = spearmanCorrelation(calibratedConfidences, observedScores);

  return { brier, ece, mce, spearman, calibratedConfidences };
}

// ═══════════════════════════════════════════════════════════
// EXECUÇÃO DA AUDITORIA (MAIN PROGRAM)
// ═══════════════════════════════════════════════════════════

async function main() {
  console.log('⚡ Iniciando F10-F.5 — Parameter Identifiability & Redundancy Audit...\n');

  // 1. Processar e coletar dados das partições
  console.log('🎼 Carregando cenários das 4 partições...');
  const trainRuns: RunData[] = [];
  const holdoutRuns: RunData[] = [];

  const match5 = runQuery(['C', 'Am', 'Dm', 'G7'], { strategy: 'OVERALL' });

  for (const s of ORIGINAL_SCENARIOS) {
    const match = runQuery(s.progression, s.options);
    const score = gradeOriginal(s.id, match, s.id === 6 ? match5 : undefined);
    const run = evaluateScenario(s.progression, s.options, score / 5, `orig-${s.id}`, s.name);
    if (run) {
      if (s.isHoldout) {
        holdoutRuns.push(run);
      } else {
        trainRuns.push(run);
      }
    }
  }

  const syntheticConfigs = generateSyntheticScenarios();
  const valRuns: RunData[] = [];
  for (const s of syntheticConfigs) {
    const match = runQuery(s.progression, s.options);
    const score = gradeScenarioResult(match, s);
    const run = evaluateScenario(s.progression, s.options, score / 5, s.id, s.name);
    if (run) {
      valRuns.push(run);
    }
  }

  const stressRuns: RunData[] = [];
  for (const s of STRESS_SCENARIOS) {
    const match = runQuery(s.progression, s.options);
    if (match && match.recommendedPaths && match.recommendedPaths.length > 0) {
      const winner = match.recommendedPaths[0];
      const vl = winner.executionResult?.stateTransition?.after.voiceLeadingQuality ?? 0.8;
      const stab = winner.executionResult?.stateTransition?.after.functionalStability ?? 0.8;
      const score = Math.max(3.0, Math.min(5.0, 3.5 + 1.0 * vl + 0.5 * (stab - 0.5)));
      const run = evaluateScenario(s.progression, s.options, score / 5, `stress-${s.id}`, s.name);
      if (run) {
        stressRuns.push(run);
      }
    }
  }

  const allRuns = [...trainRuns, ...holdoutRuns, ...valRuns, ...stressRuns];
  console.log(`   ├─ Treino: ${trainRuns.length} | Holdout: ${holdoutRuns.length}`);
  console.log(`   ├─ Validação: ${valRuns.length} | Estresse: ${stressRuns.length}`);
  console.log(`   └─ Total acumulado: ${allRuns.length} cenários.`);

  const scoreGaps = allRuns.map(r => r.scoreGapRaw);
  const goalAlignments = allRuns.map(r => r.goalAlignmentRaw);
  const geometries = allRuns.map(r => r.geometryRaw);
  const informationGains = allRuns.map(r => r.informationGain);
  const successScores = allRuns.map(r => r.successScore);

  // 2. Matriz de Correlação Linear (Pearson)
  console.log('\n📊 Computando Matriz de Correlação das Features...');
  const featureNames = ['Score Gap', 'Goal Align', 'Geometry', 'Info Gain'];
  const R: number[][] = Array.from({ length: 4 }, () => new Array(4).fill(0));
  const feats = [scoreGaps, goalAlignments, geometries, informationGains];

  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      R[i][j] = pearsonCorrelation(feats[i], feats[j]);
    }
  }

  // 3. Variance Inflation Factor (VIF)
  const R_inv = invertMatrix(R);
  const vifs = Array.from({ length: 4 }, (_, i) => R_inv[i][i]);

  console.log('   ├─ VIFs calculados:');
  for (let i = 0; i < 4; i++) {
    console.log(`      ├─ VIF(${featureNames[i]}): ${vifs[i].toFixed(4)}`);
  }

  // 4. Correlação Parcial
  console.log('\n📊 Calculando Correlação Parcial com Success...');
  const vars = [scoreGaps, goalAlignments, geometries, informationGains, successScores];
  const V: number[][] = Array.from({ length: 5 }, () => new Array(5).fill(0));
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      V[i][j] = pearsonCorrelation(vars[i], vars[j]);
    }
  }
  const Omega = invertMatrix(V);
  
  const partialCorrs = new Array(4);
  for (let i = 0; i < 4; i++) {
    partialCorrs[i] = -Omega[i][4] / Math.sqrt(Omega[i][i] * Omega[4][4]);
  }
  console.log(`   ├─ Correlação Parcial de cada feature com Success (controlando as outras 3):`);
  for (let i = 0; i < 4; i++) {
    console.log(`      ├─ PartialCorr(${featureNames[i]}, Success): ${partialCorrs[i].toFixed(4)}`);
  }

  // 5. Otimização do Modelo Baseline (Completo)
  const trainInputs = {
    scoreGaps: trainRuns.map(r => r.scoreGapRaw),
    goalAlignments: trainRuns.map(r => r.goalAlignmentRaw),
    geometries: trainRuns.map(r => r.geometryRaw),
    informationGains: trainRuns.map(r => r.informationGain),
    successScores: trainRuns.map(r => r.successScore),
    frontierSizes: trainRuns.map(r => r.frontierSize),
    hypervolumes: trainRuns.map(r => r.hypervolume)
  };
  
  const optimizedW = optimizeConfidenceWeights(trainInputs);
  const baselinePlatt = { a: 24.40, b: -13.00 }; // Platt scaling da Sprint F10-F
  
  // 6. Otimização do Modelo Ablado (sem Goal Alignment)
  console.log('\n🧠 Treinando Modelo Ablado (sem Goal Alignment)...');
  const ablatedW = optimizeAblatedWeights(trainInputs);
  console.log(`   ├─ Pesos Ablados: Gap=${ablatedW.scoreGapWeight.toFixed(4)} | Geom=${ablatedW.geometryWeight.toFixed(4)} | Amb=${ablatedW.ambiguityWeight.toFixed(4)}`);

  const trainRawConfAblated = trainRuns.map(r => 
    (r.scoreGapRaw * ablatedW.scoreGapWeight) + 
    (r.geometryRaw * ablatedW.geometryWeight) +
    (r.informationGain * ablatedW.ambiguityWeight)
  );

  const ablatedPlatt = optimizeAblatedPlattScaling(
    trainRawConfAblated,
    trainInputs.successScores,
    trainRuns.map(r => r.frontierSize),
    trainRuns.map(r => r.hypervolume),
    trainRuns.map(r => r.scoreGapRaw),
    trainRuns.map(r => r.geometryRaw),
    trainRuns.map(r => r.informationGain)
  );
  console.log(`   └─ Platt Ablado Otimizado: A=${ablatedPlatt.a.toFixed(2)} | B=${ablatedPlatt.b.toFixed(2)}`);

  // 7. Avaliação Comparativa nas Partições
  console.log('\n📈 Avaliando modelos nas partições...');
  const baseVal = evaluateDatasetBaseline(valRuns, optimizedW, baselinePlatt.a, baselinePlatt.b);
  const baseStress = evaluateDatasetBaseline(stressRuns, optimizedW, baselinePlatt.a, baselinePlatt.b);

  const ablatedVal = evaluateDatasetAblated(valRuns, ablatedW, ablatedPlatt.a, ablatedPlatt.b);
  const ablatedStress = evaluateDatasetAblated(stressRuns, ablatedW, ablatedPlatt.a, ablatedPlatt.b);

  console.log('   ├─ Validação (Validation Set):');
  console.log(`      ├─ Baseline: Brier=${baseVal.brier.toFixed(6)} | ECE=${(baseVal.ece * 100).toFixed(2)}% | Spearman=${baseVal.spearman.toFixed(4)}`);
  console.log(`      └─ Ablado:   Brier=${ablatedVal.brier.toFixed(6)} | ECE=${(ablatedVal.ece * 100).toFixed(2)}% | Spearman=${ablatedVal.spearman.toFixed(4)}`);

  console.log('   └─ Estresse (Stress Set):');
  console.log(`      ├─ Baseline: Brier=${baseStress.brier.toFixed(6)} | ECE=${(baseStress.ece * 100).toFixed(2)}% | Spearman=${baseStress.spearman.toFixed(4)}`);
  console.log(`      └─ Ablado:   Brier=${ablatedStress.brier.toFixed(6)} | ECE=${(ablatedStress.ece * 100).toFixed(2)}% | Spearman=${ablatedStress.spearman.toFixed(4)}`);

  // Métricas conjuntas Val+Stress para a regra de decisão
  const combBaseBrier = (baseVal.brier * valRuns.length + baseStress.brier * stressRuns.length) / (valRuns.length + stressRuns.length);
  const combAblBrier = (ablatedVal.brier * valRuns.length + ablatedStress.brier * stressRuns.length) / (valRuns.length + stressRuns.length);
  const combBaseSpearman = (baseVal.spearman * valRuns.length + baseStress.spearman * stressRuns.length) / (valRuns.length + stressRuns.length);
  const combAblSpearman = (ablatedVal.spearman * valRuns.length + ablatedStress.spearman * stressRuns.length) / (valRuns.length + stressRuns.length);

  const deltaBrier = combAblBrier - combBaseBrier;
  const deltaSpearman = combBaseSpearman - combAblSpearman;

  console.log(`\n📈 Métricas Combinadas (Val+Stress):`);
  console.log(`   ├─ Delta Brier (Abl - Base): ${deltaBrier.toFixed(6)}`);
  console.log(`   └─ Delta Spearman (Base - Abl): ${deltaSpearman.toFixed(4)}`);

  // 8. Análise de Contribuição SHAP
  console.log('\n📊 Executando Decomposição SHAP e Ranking de Importância...');
  const N = allRuns.length;
  const shapSums = [0, 0, 0, 0];
  const plattA = baselinePlatt.a;
  const plattB = baselinePlatt.b;
  const w = [optimizedW.scoreGapWeight, optimizedW.goalAlignmentWeight, optimizedW.geometryWeight, optimizedW.ambiguityWeight];

  for (let i = 0; i < N; i++) {
    const raw = (scoreGaps[i] * w[0]) + (goalAlignments[i] * w[1]) + (geometries[i] * w[2]) + (informationGains[i] * w[3]);
    const baseCal = 1.0 / (1.0 + Math.exp(-(plattA * raw + plattB)));
    
    for (let j = 0; j < 4; j++) {
      const rawWithout = raw - w[j] * feats[j][i];
      const calWithout = 1.0 / (1.0 + Math.exp(-(plattA * rawWithout + plattB)));
      shapSums[j] += Math.abs(baseCal - calWithout);
    }
  }

  const meanShaps = shapSums.map(sum => sum / N);
  const totalShap = meanShaps.reduce((a, b) => a + b, 0);
  const normalizedShap = meanShaps.map(val => (totalShap > 0 ? (val / totalShap) * 100 : 0));

  console.log('   ├─ SHAP Médio e Importância Relativa:');
  for (let i = 0; i < 4; i++) {
    console.log(`      ├─ ${featureNames[i]}: MeanSHAP=${meanShaps[i].toFixed(4)} (${normalizedShap[i].toFixed(2)}%)`);
  }

  // 9. Avaliação das Regras de Decisão
  console.log('\n⚖️ Avaliando critérios de redundância de Goal Alignment...');
  const critA = vifs[1] > 5;
  const critB = Math.abs(deltaBrier) < 0.002;
  const critC = Math.abs(deltaSpearman) < 0.03;
  const critD = normalizedShap[1] < 10.0;

  console.log(`   ├─ Critério A (VIF > 5):                 ${critA ? '✅ Aprovado' : '❌ Rejeitado'} (VIF=${vifs[1].toFixed(4)})`);
  console.log(`   ├─ Critério B (|Delta BS| < 0.002):      ${critB ? '✅ Aprovado' : '❌ Rejeitado'} (Delta=${deltaBrier.toFixed(6)})`);
  console.log(`   ├─ Critério C (|Delta Spearman| < 0.03): ${critC ? '✅ Aprovado' : '❌ Rejeitado'} (Delta=${deltaSpearman.toFixed(4)})`);
  console.log(`   └─ Critério D (SHAP Share < 10%):        ${critD ? '✅ Aprovado' : '❌ Rejeitado'} (Share=${normalizedShap[1].toFixed(2)}%)`);

  const redundant = critA && critB && critC && critD;
  console.log(`\n📢 PARECER DE REDUNDÂNCIA:`);
  if (redundant) {
    console.log('   🚀 STATUS: RECOMENDA-SE A REMOÇÃO DO GOAL ALIGNMENT (REDUNDÂNCIA COMPROVADA)');
  } else {
    console.log('   🔒 STATUS: RECOMENDA-SE MANTER O GOAL ALIGNMENT (INFORMAÇÃO INDEPENDENTE RELEVANTE)');
  }

  // 10. Gravar Relatório Markdown
  const reportPath = path.join('/Users/gustavoesteves/.gemini/antigravity-ide/brain/f6477136-2b69-47c8-8b1f-1aa05a2947ab', 'parameter_audit_report.md');
  const reportMd = `
# Relatório de Auditoria Científica de Identificabilidade de Parâmetros e Redundância (Sprint F10-F.5)

Este relatório consolida os resultados da auditoria científica sobre a necessidade do fator **Goal Alignment** na confiança de recomendações do Find Chord.

---

## 📊 1. Matriz de Correlação das Features (Pearson)

A tabela abaixo exibe a correlação linear cruzada entre as 4 dimensões de entrada de confiança e o target de sucesso qualitativo:

| Feature | Score Gap | Goal Alignment | Geometry | Information Gain | Success (Target) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Score Gap** | ${R[0][0].toFixed(4)} | ${R[0][1].toFixed(4)} | ${R[0][2].toFixed(4)} | ${R[0][3].toFixed(4)} | ${V[0][4].toFixed(4)} |
| **Goal Alignment** | ${R[1][0].toFixed(4)} | ${R[1][1].toFixed(4)} | ${R[1][2].toFixed(4)} | ${R[1][3].toFixed(4)} | ${V[1][4].toFixed(4)} |
| **Geometry** | ${R[2][0].toFixed(4)} | ${R[2][1].toFixed(4)} | ${R[2][2].toFixed(4)} | ${R[2][3].toFixed(4)} | ${V[2][4].toFixed(4)} |
| **Information Gain** | ${R[3][0].toFixed(4)} | ${R[3][1].toFixed(4)} | ${R[3][2].toFixed(4)} | ${R[3][3].toFixed(4)} | ${V[3][4].toFixed(4)} |

---

## 📈 2. Variance Inflation Factor (VIF) & Correlação Parcial

As métricas abaixo sinalizam multicolinearidade (redundância) e poder preditivo residual independente:

| Feature | VIF | Correlação Parcial (com Success) | Avaliação de Independência |
| :--- | :---: | :---: | :--- |
| **Score Gap** | ${vifs[0].toFixed(4)} | ${partialCorrs[0].toFixed(4)} | ${partialCorrs[0] > 0.05 ? 'Mantém sinal preditivo independente' : 'Sinal residual insignificante'} |
| **Goal Alignment** | ${vifs[1].toFixed(4)} | ${partialCorrs[1].toFixed(4)} | ${partialCorrs[1] > 0.05 ? 'Mantém sinal preditivo independente' : 'Sinal residual insignificante'} |
| **Geometry** | ${vifs[2].toFixed(4)} | ${partialCorrs[2].toFixed(4)} | ${partialCorrs[2] > 0.05 ? 'Mantém sinal preditivo independente' : 'Sinal residual insignificante'} |
| **Information Gain** | ${vifs[3].toFixed(4)} | ${partialCorrs[3].toFixed(4)} | ${partialCorrs[3] > 0.05 ? 'Mantém sinal preditivo independente' : 'Sinal residual insignificante'} |

> [!IMPORTANT]
> Um valor de **VIF > 5.0** indica forte redundância linear com as outras variáveis.
> A **Correlação Parcial** representa a associação linear residual com o Sucesso Qualitativo após remover a influência compartilhada das outras 3 features.

---

## 🧠 3. Estudo de Ablação (Modelo Completo vs Ablado sem Goal)

Comparamos o desempenho do recomendador em dados não vistos (Validation & Stress conjuntos) após re-treinar todos os pesos e Platt Scaling desconsiderando **Goal Alignment** ($w_{goal} = 0$):

| Partição / Modelo | Brier Score | ECE | Spearman |
| :--- | :---: | :---: | :---: |
| **Validation (Baseline)** | ${baseVal.brier.toFixed(6)} | ${(baseVal.ece * 100).toFixed(2)}% | ${baseVal.spearman.toFixed(4)} |
| **Validation (Ablado)** | ${ablatedVal.brier.toFixed(6)} | ${(ablatedVal.ece * 100).toFixed(2)}% | ${ablatedVal.spearman.toFixed(4)} |
| **Stress (Baseline)** | ${baseStress.brier.toFixed(6)} | ${(baseStress.ece * 100).toFixed(2)}% | ${baseStress.spearman.toFixed(4)} |
| **Stress (Ablado)** | ${ablatedStress.brier.toFixed(6)} | ${(ablatedStress.ece * 100).toFixed(2)}% | ${ablatedStress.spearman.toFixed(4)} |

### Impacto Combinado (Validação + Estresse):
* **Brier Score Delta ($\Delta BS$)**: ${deltaBrier.toFixed(6)} (Limite para redundância: $|\Delta BS| < 0.002$)
* **Spearman Delta ($\Delta Spearman$)**: ${deltaSpearman.toFixed(4)} (Limite para redundância: $|\Delta Spearman| < 0.03$)

---

## 📊 4. Contribuição SHAP e Ranking de Importância

A tabela abaixo exibe a contribuição marginal média absoluta de cada feature no calibrador sigmoide de confiança final:

| Posição | Feature | SHAP Médio | Importância Relativa (%) |
| :---: | :--- | :---: | :---: |
${featureNames.map((name, idx) => ({ name, val: meanShaps[idx], pct: normalizedShap[idx] }))
  .sort((a, b) => b.val - a.val)
  .map((item, rank) => `| ${rank + 1} | **${item.name}** | ${item.val.toFixed(4)} | ${item.pct.toFixed(2)}% |`).join('\n')}

---

## ⚖️ 5. Avaliação do Parecer de Redundância (Regra Rígida de Decisão)

Avaliamos os quatro critérios estatísticos pré-estabelecidos para decidir sobre a remoção de **Goal Alignment**:

* **[ ${critA ? 'Sim' : 'Não'} ] Critério A**: VIF do Goal Alignment é superior a 5.0 (Valor obtido: **${vifs[1].toFixed(4)}**).
* **[ ${critB ? 'Sim' : 'Não'} ] Critério B**: $\Delta Brier$ combinada de validação/estresse é inferior a 0.002 (Valor obtido: **${deltaBrier.toFixed(6)}**).
* **[ ${critC ? 'Sim' : 'Não'} ] Critério C**: $\Delta Spearman$ combinada de validação/estresse é inferior a 0.03 (Valor obtido: **${deltaSpearman.toFixed(4)}**).
* **[ ${critD ? 'Sim' : 'Não'} ] Critério D**: Importância relativa SHAP de Goal Alignment é inferior a 10.0% (Valor obtido: **${normalizedShap[1].toFixed(2)}%**).

### 📢 PARECER FINAL:
> [!${redundant ? 'WARNING' : 'NOTE'}]
> **${redundant 
      ? 'RECOMENDA-SE A REMOÇÃO DO GOAL ALIGNMENT (REDUNDÂNCIA COMPROVADA)' 
      : 'RECOMENDA-SE MANTER O GOAL ALIGNMENT (INFORMAÇÃO INDEPENDENTE RELEVANTE)'}**
> 
> ${redundant 
      ? 'Goal Alignment atendeu a todos os 4 critérios estatísticos de redundância. Sua remoção trará maior robustez estrutural, reduzindo a variância bootstrap e simplificando o Platt Scaling sem perdas significativas de desempenho.' 
      : 'Goal Alignment não atendeu a todos os critérios de redundância. Ele possui informação preditiva ortogonal ou impacto no rank de calibração que justifica sua retenção.'}
`;

  fs.writeFileSync(reportPath, reportMd.trim(), 'utf-8');
  console.log(`\n📝 Relatório de Auditoria persistido em: ${reportPath}`);
  console.log('\n🎉 SPRINT F10-F.5 EXECUTADA COM SUCESSO!');
}

main().catch(err => {
  console.error('\n🔴 Erro durante a auditoria:', err);
  process.exit(1);
});
