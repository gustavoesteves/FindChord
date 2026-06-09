import type { HarmonicFingerprint } from '../models/HarmonicFingerprint';
import type { SimilarityResult } from '../models/Similarity';
import type { 
  SimilarityInsight, 
  InterpretiveInsight, 
  PedagogicalTransformation,
  TransformationEffect,
  EvidenceGraph,
  EvidenceTrace,
  EvidenceExplanation,
  EvidenceContribution,
  SensitivityAnalysis
} from '../models/Discovery';
import { computeLevenshtein } from './similarityEngine';
import { buildEvidenceGraph, findEvidenceTraces } from './evidenceGraphBuilder';
import { rankEvidence, buildCausalExplanation } from './evidenceRankingEngine';
import { analyzeSensitivity } from './counterfactualEngine';

/**
 * Gera os insights de similaridade detalhados para cada eixo ativo.
 */
export function generateSimilarityInsights(
  query: HarmonicFingerprint,
  item: HarmonicFingerprint,
  report: SimilarityResult
): SimilarityInsight[] {
  const insights: SimilarityInsight[] = [];
  const bd = report.breakdown;
  const weights = report.activeWeights;

  if (bd.structural !== undefined && weights.structural > 0) {
    insights.push({
      axis: 'STRUCTURAL',
      score: bd.structural,
      importance: weights.structural,
      evidence: [
        `Tension profile size: query=${query.layers.structural?.events.length || 0}, item=${item.layers.structural?.events.length || 0}`,
        `Relative tension alignment via DTW distance`
      ],
      explanation: {
        technical: 'Alinhamento temporal das curvas de tensão harmônica relativa e estados estruturais via DTW.',
        pedagogical: 'Ambas as progressões seguem um padrão de aumento, pico e alívio de tensão muito parecido.'
      }
    });
  }

  if (bd.harmonic !== undefined && weights.harmonic > 0) {
    insights.push({
      axis: 'HARMONIC',
      score: bd.harmonic,
      importance: weights.harmonic,
      evidence: [
        `Cosine similarity of device frequency vectors`,
        `Diatonic chord ratios compared`
      ],
      explanation: {
        technical: 'Proporção e frequência de dispositivos harmônicos cromáticos comparados por similaridade de cosseno.',
        pedagogical: 'Utilizam uma paleta de acordes especiais (empréstimos, dominantes secundárias) com pesos equivalentes.'
      }
    });
  }

  if (bd.formal !== undefined && weights.formal > 0) {
    insights.push({
      axis: 'FORMAL',
      score: bd.formal,
      importance: weights.formal,
      evidence: [
        `Phrase role edit distance (Levenshtein)`,
        `Total phrase count match ratio`
      ],
      explanation: {
        technical: 'Distância de edição entre funções formais de frase (Levenshtein) e razão de partição de compassos.',
        pedagogical: 'Estruturam o início, meio e fim de suas frases e cadências com organização correspondente.'
      }
    });
  }

  if (bd.regional !== undefined && weights.regional > 0) {
    insights.push({
      axis: 'REGIONAL',
      score: bd.regional,
      importance: weights.regional,
      evidence: [
        `Edit distance of tonal region visited path`,
        `Mother key mode mode match`
      ],
      explanation: {
        technical: 'Distância de edição Levenshtein das trajetórias de transição regional e concordância modal.',
        pedagogical: 'Caminham e modulam pelas mesmas regiões e tonalidades vizinhas ao longo da progressão.'
      }
    });
  }

  if (bd.functional !== undefined && weights.functional > 0) {
    insights.push({
      axis: 'FUNCTIONAL',
      score: bd.functional,
      importance: weights.functional,
      evidence: [
        `DTW alignment of Layer 5 functional equivalence role sequences`
      ],
      explanation: {
        technical: 'Alinhamento dinâmico DTW sobre a sequência de papéis funcionais equivalentes.',
        pedagogical: 'O significado local de repouso e preparação harmônica conta exatamente a mesma história estrutural.'
      }
    });
  }

  if (bd.voiceLeading !== undefined && weights.voiceLeading > 0) {
    insights.push({
      axis: 'VOICE_LEADING',
      score: bd.voiceLeading,
      importance: weights.voiceLeading,
      evidence: [
        `Smoothness score curve comparison via DTW`,
        `Guide-tone resolution count differences`
      ],
      explanation: {
        technical: 'DTW de curvas de suavidade linear de condução e contraponto físico de vozes guia.',
        pedagogical: 'As vozes internas se movem com caminhos e suavidade contrapontística equivalentes.'
      }
    });
  }

  // Eixo opcional de Função Aparente retrospectiva (Layer 7)
  const apA = query.layers.extendedLayers?.apparentFunction;
  const apB = item.layers.extendedLayers?.apparentFunction;
  if (apA && apB) {
    const seqA = apA.events.map(e => e.apparentRole);
    const seqB = apB.events.map(e => e.apparentRole);
    const maxLen = Math.max(seqA.length, seqB.length);
    const score = maxLen > 0 ? 1.0 - (computeLevenshtein(seqA, seqB) / maxLen) : 1.0;

    insights.push({
      axis: 'APPARENT_FUNCTION',
      score: Math.max(0, Math.min(1.0, score)),
      importance: 0.15, // Peso padrão para insights interpretativos na busca
      evidence: [
        `Apparent role sequence matching (Levenshtein)`,
        `Retrospective resolution status agreement`
      ],
      explanation: {
        technical: 'Distância de edição entre as sequências de funções aparentes reinterpretadas na Layer 7.',
        pedagogical: 'O comportamento das expectativas de atração resolvidas retrospectivamente é equivalente.'
      }
    });
  }

  // Ordenar por importância (peso) decrescente
  return insights.sort((a, b) => b.importance - a.importance);
}

/**
 * Extrai insights interpretativos contextuais e retrospectivos individuais.
 */
export function generateInterpretiveInsights(
  query: HarmonicFingerprint
): InterpretiveInsight[] {
  const insights: InterpretiveInsight[] = [];

  const apQ = query.layers.extendedLayers?.apparentFunction;

  if (apQ && apQ.events) {
    apQ.events.forEach(event => {
      // Caso 1: Cadencial 6/4 detectado
      if (event.apparentSubtype === 'CADENTIAL_64') {
        insights.push({
          source: 'APPARENT_FUNCTION',
          importance: 0.85,
          evidence: [`CADENTIAL_64 found at chord index ${event.chordIndex} with confidence ${event.resolution.confidence}`],
          explanation: {
            technical: 'Reinterpretação cadencial de tônica em segunda inversão precedendo a dominante.',
            pedagogical: 'O acorde atua como um prolongamento de repouso instável, gerando forte expectativa para a chegada da dominante.'
          }
        });
      }

      // Caso 2: Sexta Aumentada detectada
      if (
        event.apparentSubtype === 'GERMAN_AUGMENTED_SIXTH' ||
        event.apparentSubtype === 'FRENCH_AUGMENTED_SIXTH' ||
        event.apparentSubtype === 'ITALIAN_AUGMENTED_SIXTH'
      ) {
        insights.push({
          source: 'APPARENT_FUNCTION',
          importance: 0.90,
          evidence: [`${event.apparentSubtype} resolved to octave/unison at transition index ${event.chordIndex} with confidence ${event.resolution.confidence}`],
          explanation: {
            technical: `Acorde de sexta aumentada (${event.apparentSubtype.split('_')[0]}) identificado via resolução intervalar de voz guia.`,
            pedagogical: 'Usa uma condução cromática interna de sexta aumentada que se abre para repousar com grande atração sobre o baixo de dominante.'
          }
        });
      }

      // Caso 3: Resolução Deceptiva
      if (event.apparentSubtype === 'DECEPTIVE_RESOLUTION') {
        insights.push({
          source: 'APPARENT_FUNCTION',
          importance: 0.80,
          evidence: [`DECEPTIVE_RESOLUTION to target index ${event.resolution.targetChordIndex} with confidence ${event.resolution.confidence}`],
          explanation: {
            technical: 'Resolução retrospectiva interrompida por cadência deceptiva (V -> vi/bVI).',
            pedagogical: 'A expectativa de resolução tonal da dominante é frustrada, desviando a música para um repouso menor inesperado.'
          }
        });
      }
    });
  }

  return insights;
}

/**
 * Identifica as transformações pedagógicas aplicadas entre a consulta e o item.
 */
export function detectPedagogicalTransformations(
  query: HarmonicFingerprint,
  item: HarmonicFingerprint
): PedagogicalTransformation[] {
  const transformations: PedagogicalTransformation[] = [];

  const feQ = query.layers.extendedLayers?.functionalEquivalence;
  const feI = item.layers.extendedLayers?.functionalEquivalence;
  const vlQ = query.layers.extendedLayers?.voiceLeading;
  const vlI = item.layers.extendedLayers?.voiceLeading;
  const apQ = query.layers.extendedLayers?.apparentFunction;
  const apI = item.layers.extendedLayers?.apparentFunction;

  if (!feQ || !feI) return transformations;

  const chordsQ = query.metadata.chordsCount;
  const chordsI = item.metadata.chordsCount;

  // 1. Expansão vs Compressão Funcional
  if (chordsQ > chordsI) {
    // Check if query has more predominant/preparation chords
    const predCountQ = feQ.events.filter(e => e.role === 'PREDOMINANT' || e.mechanism === 'SECONDARY_FUNCTION').length;
    const predCountI = feI.events.filter(e => e.role === 'PREDOMINANT' || e.mechanism === 'SECONDARY_FUNCTION').length;
    if (predCountQ > predCountI) {
      transformations.push({
        mechanism: 'FUNCTIONAL_EXPANSION',
        effects: ['TENSION_PRESERVATION'],
        technicalDescription: 'Expansão da cadeia de preparação funcional (predominante ampliada).',
        pedagogicalDescription: 'Adiciona acordes de preparação intermediários para criar um caminho maior e enriquecer a chegada sobre a dominante/tônica.'
      });
    }
  } else if (chordsQ < chordsI) {
    const predCountQ = feQ.events.filter(e => e.role === 'PREDOMINANT' || e.mechanism === 'SECONDARY_FUNCTION').length;
    const predCountI = feI.events.filter(e => e.role === 'PREDOMINANT' || e.mechanism === 'SECONDARY_FUNCTION').length;
    if (predCountQ < predCountI) {
      transformations.push({
        mechanism: 'FUNCTIONAL_COMPRESSION',
        effects: ['TENSION_PRESERVATION'],
        technicalDescription: 'Compressão e simplificação da cadeia de preparação funcional.',
        pedagogicalDescription: 'Simplifica a progressão, removendo preparações e caminhando de forma mais direta para a resolução.'
      });
    }
  }

  // Mapear correspondência de acordes
  const minLen = Math.min(feQ.events.length, feI.events.length);
  let tritoneSubCount = 0;
  let modalBorrowingCount = 0;

  for (let p = 0; p < minLen; p++) {
    const evQ = feQ.events[p];
    const evI = feI.events[p];

    // 2. Substituição Tritônica
    const isQSub = evQ.mechanism === 'TRITONE_SUBSTITUTION';
    const isISub = evI.mechanism === 'TRITONE_SUBSTITUTION';
    if ((isQSub && !isISub) || (!isQSub && isISub)) {
      tritoneSubCount++;
    }

    // 3. Empréstimo Modal
    const isQBorrow = evQ.mechanism === 'MODAL_BORROWING';
    const isIBorrow = evI.mechanism === 'MODAL_BORROWING';
    if ((isQBorrow && !isIBorrow) || (!isQBorrow && isIBorrow)) {
      modalBorrowingCount++;
    }
  }

  if (tritoneSubCount > 0) {
    const effects: TransformationEffect[] = ['FUNCTION_PRESERVATION'];
    // Check if bass resolved cromaticamente in query
    if (vlQ && vlQ.events.some(e => e.movements.some(m => m.stringIndex === 5 && Math.abs(m.semitoneDiff) === 1))) {
      effects.push('BASS_SMOOTHING');
    }

    transformations.push({
      mechanism: 'TRITONE_SUBSTITUTION',
      effects,
      technicalDescription: 'Substituição tritônica de acorde dominante primário ou secundário.',
      pedagogicalDescription: 'Substitui o acorde dominante por outro a distância de um trítono, preservando o tritono de atração mas promovendo uma resolução suave do baixo por semitono descendente.'
    });
  }

  if (modalBorrowingCount > 0) {
    transformations.push({
      mechanism: 'MODAL_BORROWING',
      effects: ['TENSION_PRESERVATION'],
      technicalDescription: 'Empréstimo modal de região paralela (Intercâmbio Modal).',
      pedagogicalDescription: 'Importa acordes do modo paralelo para adicionar cores harmônicas melancólicas (menor na tonalidade maior) sem mudar a função do trecho.'
    });
  }

  // 4. Cadential Reinterpretation
  let cadReinterpret = false;
  if (apQ && apI) {
    const subtypesQ = apQ.events.map(e => e.apparentSubtype).filter(Boolean);
    const subtypesI = apI.events.map(e => e.apparentSubtype).filter(Boolean);
    if (subtypesQ.length !== subtypesI.length || subtypesQ.some((s, idx) => s !== subtypesI[idx])) {
      cadReinterpret = true;
    }
  }
  if (cadReinterpret) {
    transformations.push({
      mechanism: 'CADENTIAL_REINTERPRETATION',
      effects: ['TENSION_PRESERVATION', 'FUNCTION_PRESERVATION'],
      technicalDescription: 'Reinterpretação cadencial retrospectiva via voice leading.',
      pedagogicalDescription: 'Os acordes ganham novos papéis e expectativas funcionais retrospectivas dependendo de como suas vozes internas resolveram fisicamente.'
    });
  }

  // 5. Preservação de Voice Leading
  if (vlQ && vlI) {
    const smoothnessDiff = Math.abs(vlQ.averageSmoothness - vlI.averageSmoothness);
    if (smoothnessDiff < 0.12 && transformations.length > 0) {
      // Se houve transformações de acordes, mas o voice-leading continua suave
      transformations.forEach(t => {
        if (!t.effects.includes('VOICE_LEADING_PRESERVATION')) {
          t.effects.push('VOICE_LEADING_PRESERVATION');
        }
      });
    }
  }

  return transformations;
}

export interface ExplainabilityReport {
  insights: SimilarityInsight[];
  interpretiveInsights: InterpretiveInsight[];
  transformations: PedagogicalTransformation[];
  evidenceGraph: EvidenceGraph;
  traces: EvidenceTrace[];
  contributions: EvidenceContribution[];
  causalExplanation: EvidenceExplanation;
  sensitivityAnalysis: SensitivityAnalysis;
}

/**
 * Gera um relatório explicativo completo consolidando insights, transformações,
 * o grafo de evidências, os caminhos de rastreamento (EvidenceTrace), o ranking causal e a explicação estruturada.
 */
export function generateExplainabilityReport(
  query: HarmonicFingerprint,
  item: HarmonicFingerprint,
  report: SimilarityResult
): ExplainabilityReport {
  const insights = generateSimilarityInsights(query, item, report);
  const interpretiveInsights = generateInterpretiveInsights(query);
  const transformations = detectPedagogicalTransformations(query, item);
  const evidenceGraph = buildEvidenceGraph(query, item, insights, interpretiveInsights, transformations);
  const traces = findEvidenceTraces(evidenceGraph);
  const contributions = rankEvidence(evidenceGraph, report);
  const causalExplanation = buildCausalExplanation(evidenceGraph, contributions);
  const sensitivityAnalysis = analyzeSensitivity(query, item, report, evidenceGraph, contributions);

  return {
    insights,
    interpretiveInsights,
    transformations,
    evidenceGraph,
    traces,
    contributions,
    causalExplanation,
    sensitivityAnalysis
  };
}
