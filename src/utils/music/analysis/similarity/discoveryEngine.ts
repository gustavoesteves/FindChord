import type { HarmonicFingerprint, FingerprintDensity } from '../models/HarmonicFingerprint';
import type { 
  CorpusItem, 
  PrepareCorpusOptions, 
  DiscoveryOptions, 
  DiscoveryMatch,
  DiscoveryStrategy
} from '../models/Discovery';
import { analyzeProgression } from '../orchestrators/progressionAnalysis';
import { generateFingerprint } from '../narrative/narrativeFingerprint';
import { compareFingerprints } from './similarityEngine';
import { generateExplainabilityReport } from './explainabilityEngine';
import { renderExplanation } from './narrativeRenderer';
import { attributePrimaryReason } from './evidenceRankingEngine';
import { detectOpportunities } from './transformationSpaceEngine';
import { buildTransformationGraph, generateRecommendedPaths } from './transformationGraphEngine';

/**
 * Pré-calcula e armazena em cache os fingerprints para os itens do corpus.
 * Permite selecionar a densidade desejada (default: STANDARD).
 */
export function prepareCorpus(
  corpus: CorpusItem[],
  options?: PrepareCorpusOptions
): CorpusItem[] {
  const density = options?.density || 'STANDARD';
  const tuning = options?.tuning;

  return corpus.map(item => {
    // Se já houver um cache compatível com a densidade solicitada, reaproveita
    if (item.cachedFingerprint && item.cachedFingerprint.density === density) {
      return item;
    }

    try {
      const analysis = analyzeProgression(item.progression);
      const fingerprint = generateFingerprint(analysis, { density, tuning });
      return {
        ...item,
        cachedFingerprint: {
          density,
          fingerprint
        }
      };
    } catch (error) {
      console.error(`Erro ao processar progressão para o corpus (id: ${item.id}):`, error);
      return item;
    }
  });
}

/**
 * Busca progressões semelhantes no corpus baseando-se em estratégias de similaridade de múltiplos eixos,
 * suportando ordenações, filtros, tratamento fino de camadas e explicações estruturadas.
 */
export function findSimilarProgressions(
  query: HarmonicFingerprint,
  corpus: CorpusItem[],
  options?: DiscoveryOptions
): DiscoveryMatch[] {
  const strategy = options?.strategy || 'OVERALL';

  // Se a estratégia requerida exigir uma camada ausente na QUERY, retorna vazio
  // porque a consulta não possui informação necessária para realizar o ranking.
  if (strategy === 'FUNCTIONAL' && !query.layers.extendedLayers?.functionalEquivalence) {
    return [];
  }
  if (strategy === 'VOICE_LEADING' && !query.layers.extendedLayers?.voiceLeading) {
    return [];
  }

  const matches: DiscoveryMatch[] = [];

  for (const item of corpus) {
    // 1. Filtragem preliminar (por categorias e quantidade de acordes)
    if (options?.filters) {
      const f = options.filters;
      if (f.harmonicCategory && item.harmonicCategory !== f.harmonicCategory) continue;
      if (f.functionalCategory && item.functionalCategory !== f.functionalCategory) continue;
      if (f.minChordsCount !== undefined && item.progression.length < f.minChordsCount) continue;
      if (f.maxChordsCount !== undefined && item.progression.length > f.maxChordsCount) continue;
    }

    // 2. Resolução do Fingerprint com Cache
    const requiredDensity: FingerprintDensity = 
      (strategy === 'FUNCTIONAL' || strategy === 'VOICE_LEADING' || query.layers.extendedLayers) 
        ? 'STANDARD' 
        : 'CORE';
    let itemFingerprint: HarmonicFingerprint | undefined = undefined;

    const cache = item.cachedFingerprint;
    const isCacheCompatible = cache && (
      cache.density === 'FULL' ||
      (cache.density === 'STANDARD' && (requiredDensity as string) !== 'FULL') ||
      (cache.density === 'CORE' && requiredDensity === 'CORE')
    );

    if (isCacheCompatible && cache) {
      itemFingerprint = cache.fingerprint;
    } else if (item.progression && item.progression.length > 0) {
      try {
        const analysis = analyzeProgression(item.progression);
        itemFingerprint = generateFingerprint(analysis, { density: requiredDensity });
      } catch (error) {
        console.error(`Erro ao analisar progressão do corpus sob demanda (id: ${item.id}):`, error);
        continue;
      }
    } else if (cache) {
      itemFingerprint = cache.fingerprint;
    }

    if (!itemFingerprint) continue;

    // Se a estratégia requerida exigir uma camada ausente no ITEM do corpus,
    // o item é marcado como undefined e excluído do ranking (continue).
    if (strategy === 'FUNCTIONAL' && !itemFingerprint.layers.extendedLayers?.functionalEquivalence) {
      continue;
    }
    if (strategy === 'VOICE_LEADING' && !itemFingerprint.layers.extendedLayers?.voiceLeading) {
      continue;
    }

    // 3. Execução da Comparação
    const report = compareFingerprints(query, itemFingerprint, options?.customWeights);

    // 4. Mapeamento de Score por Estratégia
    let score = 0;
    const bd = report.breakdown;

    if (strategy === 'OVERALL') {
      score = report.overallScore;
    } else if (strategy === 'STRUCTURAL') {
      score = bd.structural ?? 0;
    } else if (strategy === 'HARMONIC') {
      score = bd.harmonic ?? 0;
    } else if (strategy === 'FORMAL') {
      score = bd.formal ?? 0;
    } else if (strategy === 'REGIONAL') {
      score = bd.regional ?? 0;
    } else if (strategy === 'FUNCTIONAL') {
      if (bd.functional === undefined) continue; // Exclusão
      score = bd.functional;
    } else if (strategy === 'VOICE_LEADING') {
      if (bd.voiceLeading === undefined) continue; // Exclusão
      score = bd.voiceLeading;
    }

    // Filtro de Score Mínimo
    if (score < (options?.minScore ?? 0.0)) {
      continue;
    }

    // 5. Geração de Explicações Estruturadas (Eixo Dominante)
    let dominantAxis: DiscoveryStrategy = 'STRUCTURAL';
    let dominantScore = -1;

    if (bd.structural !== undefined && bd.structural > dominantScore) {
      dominantScore = bd.structural;
      dominantAxis = 'STRUCTURAL';
    }
    if (bd.harmonic !== undefined && bd.harmonic > dominantScore) {
      dominantScore = bd.harmonic;
      dominantAxis = 'HARMONIC';
    }
    if (bd.formal !== undefined && bd.formal > dominantScore) {
      dominantScore = bd.formal;
      dominantAxis = 'FORMAL';
    }
    if (bd.regional !== undefined && bd.regional > dominantScore) {
      dominantScore = bd.regional;
      dominantAxis = 'REGIONAL';
    }
    if (bd.functional !== undefined && bd.functional > dominantScore) {
      dominantScore = bd.functional;
      dominantAxis = 'FUNCTIONAL';
    }
    if (bd.voiceLeading !== undefined && bd.voiceLeading > dominantScore) {
      dominantScore = bd.voiceLeading;
      dominantAxis = 'VOICE_LEADING';
    }

    const queryProgression = query.metadata.queryProgression;
    const transformationOpportunities = queryProgression ? detectOpportunities(queryProgression) : undefined;
    const transformationGraph = transformationOpportunities ? buildTransformationGraph(transformationOpportunities) : undefined;
    const recommendedPaths = (transformationOpportunities && transformationGraph) ? generateRecommendedPaths(transformationOpportunities, transformationGraph) : undefined;

    const expReport = generateExplainabilityReport(query, itemFingerprint, report);
    const explanation = renderExplanation(
      expReport.insights,
      expReport.transformations,
      expReport.interpretiveInsights,
      expReport.causalExplanation,
      expReport.sensitivityAnalysis,
      transformationOpportunities,
      recommendedPaths
    );
    const primaryReason = attributePrimaryReason(expReport.evidenceGraph, expReport.contributions);

    matches.push({
      item,
      score,
      report,
      fingerprint: itemFingerprint,
      explanation,
      topInsights: expReport.insights,
      interpretiveInsights: expReport.interpretiveInsights,
      transformations: expReport.transformations,
      primaryReason,
      evidenceGraph: expReport.evidenceGraph,
      causalExplanation: expReport.causalExplanation,
      contributions: expReport.contributions,
      sensitivityAnalysis: expReport.sensitivityAnalysis,
      explanationData: {
        dominantAxis,
        dominantScore
      },
      transformationOpportunities,
      transformationGraph,
      recommendedPaths
    });
  }

  // 6. Ordenação Descendente e Limite
  matches.sort((a, b) => b.score - a.score);
  const limit = options?.limit ?? 10;
  return matches.slice(0, limit);
}
