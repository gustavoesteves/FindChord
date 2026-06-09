import type { HarmonicFingerprint } from '../models/HarmonicFingerprint';
import type { SimilarityResult, SimilarityWeights } from '../models/Similarity';
import type { 
  EvidenceGraph,
  EvidenceContribution,
  CounterfactualResult,
  SensitivityAnalysis,
  SensitivityTier
} from '../models/Discovery';
import { compareFingerprints } from './similarityEngine';

/**
 * Mapeia o ID do nó de evidência ao seu respectivo eixo de similaridade no breakdown.
 */
function getNodeAxis(nodeId: string): string {
  const id = nodeId.toLowerCase();
  if (id.includes('functional') || id.includes('tritone') || id.includes('modal_borrowing')) return 'functional';
  if (id.includes('voice_leading') || id.includes('bass_smoothing')) return 'voiceLeading';
  if (id.includes('structural')) return 'structural';
  if (id.includes('harmonic')) return 'harmonic';
  if (id.includes('formal')) return 'formal';
  if (id.includes('regional')) return 'regional';
  return 'functional';
}

/**
 * Realiza a ablação virtual de um nó (eixo, transformação ou interpretação) nos
 * fingerprints ou na matriz de pesos, evitando a reanálise pesada (como processamento Viterbi).
 */
export function ablateNode(
  query: HarmonicFingerprint,
  item: HarmonicFingerprint,
  weights: SimilarityWeights,
  nodeId: string
): { ablatedQuery: HarmonicFingerprint; ablatedItem: HarmonicFingerprint; ablatedWeights: SimilarityWeights } {
  // Clona profundamente os fingerprints para evitar efeitos colaterais
  const ablatedQuery = JSON.parse(JSON.stringify(query)) as HarmonicFingerprint;
  const ablatedItem = JSON.parse(JSON.stringify(item)) as HarmonicFingerprint;
  const ablatedWeights = { ...weights };

  const id = nodeId.toLowerCase();

  // 1. Ablação de Eixo de Similaridade Genérico
  if (id.startsWith('similarity:')) {
    const axis = id.substring('similarity:'.length);
    if (axis === 'functional') ablatedWeights.functional = 0;
    else if (axis === 'voice_leading') ablatedWeights.voiceLeading = 0;
    else if (axis === 'structural') ablatedWeights.structural = 0;
    else if (axis === 'harmonic') ablatedWeights.harmonic = 0;
    else if (axis === 'formal') ablatedWeights.formal = 0;
    else if (axis === 'regional') ablatedWeights.regional = 0;
  }
  // 2. Ablação de Transformações Específicas
  else if (id.startsWith('transformation:')) {
    const mechanism = id.substring('transformation:'.length).toUpperCase();

    if (mechanism === 'TRITONE_SUBSTITUTION' || mechanism === 'MODAL_BORROWING') {
      const feQ = ablatedQuery.layers.extendedLayers?.functionalEquivalence;
      if (feQ && feQ.events) {
        feQ.events.forEach((e, idx) => {
          if (e.mechanism === mechanism) {
            e.mechanism = 'DIRECT';
            // Se desativada a transformação, o acorde atua de forma oposta (TONIC)
            // gerando um mismatch total contra a função esperada (DOMINANT).
            e.role = 'TONIC';
            if (feQ.roleSequence) {
              feQ.roleSequence[idx] = 'TONIC';
            }
          }
        });
      }
      const feI = ablatedItem.layers.extendedLayers?.functionalEquivalence;
      if (feI && feI.events) {
        feI.events.forEach((e, idx) => {
          if (e.mechanism === mechanism) {
            e.mechanism = 'DIRECT';
            e.role = 'TONIC';
            if (feI.roleSequence) {
              feI.roleSequence[idx] = 'TONIC';
            }
          }
        });
      }

      // Ajusta na camada harmônica desconsiderando o dispositivo analítico
      const harmQ = ablatedQuery.layers.harmonic;
      if (harmQ) {
        const count = harmQ.deviceFrequency[mechanism] || 0;
        if (count > 0) {
          harmQ.deviceFrequency[mechanism] = 0;
        }
        harmQ.devices = harmQ.devices.filter(d => d.deviceType !== mechanism);
      }
      const harmI = ablatedItem.layers.harmonic;
      if (harmI) {
        const count = harmI.deviceFrequency[mechanism] || 0;
        if (count > 0) {
          harmI.deviceFrequency[mechanism] = 0;
        }
        harmI.devices = harmI.devices.filter(d => d.deviceType !== mechanism);
      }
    }
    else if (mechanism === 'CADENTIAL_REINTERPRETATION') {
      const apQ = ablatedQuery.layers.extendedLayers?.apparentFunction;
      const ablatedIndices: number[] = [];
      if (apQ && apQ.events) {
        apQ.events.forEach(e => {
          if (e.apparentSubtype === 'CADENTIAL_64') {
            e.apparentSubtype = undefined;
            e.resolution.confidence = 0.0;
            ablatedIndices.push(e.chordIndex);
          }
        });
      }
      const apI = ablatedItem.layers.extendedLayers?.apparentFunction;
      if (apI && apI.events) {
        apI.events.forEach(e => {
          if (e.apparentSubtype === 'CADENTIAL_64') {
            e.apparentSubtype = undefined;
            e.resolution.confidence = 0.0;
            ablatedIndices.push(e.chordIndex);
          }
        });
      }

      // Também penaliza o alinhamento funcional na Layer 5 se for reinterpretação cadencial
      const feQ = ablatedQuery.layers.extendedLayers?.functionalEquivalence;
      if (feQ && feQ.events) {
        feQ.events.forEach((e, idx) => {
          if (ablatedIndices.includes(e.chordIndex)) {
            e.role = 'UNRESOLVED';
            if (feQ.roleSequence) feQ.roleSequence[idx] = 'UNRESOLVED';
          }
        });
      }
      const feI = ablatedItem.layers.extendedLayers?.functionalEquivalence;
      if (feI && feI.events) {
        feI.events.forEach((e, idx) => {
          if (ablatedIndices.includes(e.chordIndex)) {
            e.role = 'UNRESOLVED';
            if (feI.roleSequence) feI.roleSequence[idx] = 'UNRESOLVED';
          }
        });
      }
    }
  }
  // 3. Ablação de Interpretação Específica (ex: Apparent Subtype por índice)
  else if (id.startsWith('interpretation:')) {
    const parts = id.split(':');
    const index = parts.length > 2 ? parseInt(parts[2], 10) : -1;

    const apQ = ablatedQuery.layers.extendedLayers?.apparentFunction;
    if (apQ && apQ.events && index !== -1) {
      apQ.events.forEach(e => {
        if (e.chordIndex === index) {
          e.apparentSubtype = undefined;
          e.resolution.confidence = 0.0;
        }
      });
    }
  }

  return { ablatedQuery, ablatedItem, ablatedWeights };
}

/**
 * Mapeia a perda de score para o SensitivityTier correspondente.
 */
function getSensitivityTier(scoreImpact: number): SensitivityTier {
  if (scoreImpact >= 0.25) return 'CRITICAL';
  if (scoreImpact >= 0.15) return 'HIGH';
  if (scoreImpact >= 0.05) return 'MODERATE';
  return 'LOW';
}

/**
 * Executa a análise contrafactual sobre todos os nós passíveis de ablação
 * (níveis CONCLUSION e INTERPRETATION, blindando OBSERVATION).
 */
export function analyzeSensitivity(
  query: HarmonicFingerprint,
  item: HarmonicFingerprint,
  report: SimilarityResult,
  graph: EvidenceGraph,
  contributions: EvidenceContribution[]
): SensitivityAnalysis {
  const results: CounterfactualResult[] = [];
  const originalOverallScore = report.overallScore;

  // Filtra apenas nós lógicos passíveis de ablação (blindagem de OBSERVATION)
  const candidateNodes = graph.nodes.filter(
    n => n.level === 'CONCLUSION' || n.level === 'INTERPRETATION'
  );

  candidateNodes.forEach(node => {
    // Apenas eixos de similaridade, transformações ou interpretações são elegíveis para ablação
    if (
      node.sourceType !== 'SIMILARITY_AXIS' &&
      node.sourceType !== 'TRANSFORMATION' &&
      node.sourceType !== 'APPARENT_FUNCTION_EVENT'
    ) {
      return;
    }

    const axis = getNodeAxis(node.id);
    const breakdown = report.breakdown as Record<string, number | undefined>;
    const originalAxisScore = breakdown[axis] ?? report.overallScore;

    const { ablatedQuery, ablatedItem, ablatedWeights } = ablateNode(
      query,
      item,
      report.activeWeights,
      node.id
    );

    // Recomputa similaridade com as modificações contrafactuais locais
    const recomputedResult = compareFingerprints(ablatedQuery, ablatedItem, ablatedWeights);
    const recomputedBreakdown = recomputedResult.breakdown as Record<string, number | undefined>;
    const counterfactualAxisScore = node.sourceType === 'SIMILARITY_AXIS' 
      ? 0.0 
      : (recomputedBreakdown[axis] ?? recomputedResult.overallScore);

    // Mede impacto absoluto e relativo
    const scoreImpact = Number(Math.max(0, originalAxisScore - counterfactualAxisScore).toFixed(4));
    const impactPercentage = originalAxisScore > 0 
      ? Math.round((scoreImpact / originalAxisScore) * 100) 
      : 0;

    const tier = getSensitivityTier(scoreImpact);

    // Encontra a contribuição original calculada no Evidence Ranking
    const nodeContribution = contributions.find(c => c.nodeId === node.id)?.contribution ?? 0;

    // Importância causal ponderada: 70% impacto de score contrafactual + 30% contribuição original
    const causalImportance = Number(((scoreImpact * 0.7) + (nodeContribution * 0.3)).toFixed(2));

    const localImpact = scoreImpact;
    const globalImpact = Number(Math.max(0, originalOverallScore - recomputedResult.overallScore).toFixed(4));

    results.push({
      nodeId: node.id,
      originalScore: originalAxisScore,
      counterfactualScore: counterfactualAxisScore,
      scoreImpact,
      impactPercentage,
      causalImportance,
      tier,
      localImpact,
      globalImpact
    });
  });

  // Ordena os resultados decrescentemente por importância causal
  results.sort((a, b) => b.causalImportance - a.causalImportance);

  // Elege o dominantFactor (apenas a partir de nós específicos de transformação ou interpretação)
  const specificResults = results.filter(r => !r.nodeId.startsWith('similarity:'));
  let dominantFactor: string | undefined = undefined;
  if (specificResults.length > 0 && specificResults[0].scoreImpact > 0) {
    dominantFactor = specificResults[0].nodeId;
  }

  return {
    results,
    dominantFactor,
    counterfactualFormulaVersion: 'F10C3-v1'
  };
}
