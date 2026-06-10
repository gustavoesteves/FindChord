// Sprint C3.4 — Multi-Objective Optimization Engine Tests
// Run with: npx tsx src/utils/music/tests/multiObjectiveOptimization.test.ts

import { 
  dominates,
  computeParetoFrontier,
  rankParetoFrontier,
  extractObjectiveVector,
  findSimilarProgressions,
  analyzeProgression,
  generateFingerprint
} from '../analysis/functionalAnalysis';
import type { 
  RecommendationPath,
  ObjectiveVector,
  CorpusItem
} from '../analysis/functionalAnalysis';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

// Helper to create a basic mock path
function createMockPath(
  id: string,
  metrics: {
    tension: number;
    chromaticism: number;
    bassSmoothness: number;
    functionalStability: number;
    voiceLeadingQuality: number;
    physicalComplexity: number;
    pedagogicalImpact: number;
    goalAchievement: number;
  }
): RecommendationPath {
  return {
    steps: [
      {
        id,
        opportunityId: 'opp-' + id,
        family: 'FUNCTIONAL_SUBSTITUTION',
        confidence: 0.9,
        musicalImpact: metrics.pedagogicalImpact,
        similarityImpact: 0.5,
        physicalComplexity: metrics.physicalComplexity,
        pedagogicalDifficulty: 0.4
      }
    ],
    accumulatedImpact: metrics.pedagogicalImpact,
    accumulatedDifficulty: 0.4,
    finalScore: 0.5,
    executionResult: {
      applications: [],
      finalProgression: ['C', 'Db7', 'C'],
      confidence: 0.9,
      stateTransition: {
        before: {
          tension: 0.2,
          chromaticism: 0.0,
          bassSmoothness: 0.5,
          functionalStability: 0.9,
          voiceLeadingQuality: 0.9
        },
        after: {
          tension: metrics.tension,
          chromaticism: metrics.chromaticism,
          bassSmoothness: metrics.bassSmoothness,
          functionalStability: metrics.functionalStability,
          voiceLeadingQuality: metrics.voiceLeadingQuality
        },
        tensionDelta: metrics.tension - 0.2,
        chromaticismDelta: metrics.chromaticism - 0.0,
        bassSmoothnessDelta: metrics.bassSmoothness - 0.5,
        functionalStabilityDelta: metrics.functionalStability - 0.9,
        voiceLeadingQualityDelta: metrics.voiceLeadingQuality - 0.9
      },
      goalAchievement: {
        score: metrics.goalAchievement,
        confidence: 0.9
      }
    }
  };
}

// ═══════════════════════════════════════════════════════════
// 1. Caso 1 — Testar dominates(A, B)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Testar dominância dominates(A, B)');
{
  const a: ObjectiveVector = {
    tension: 0.8, chromaticism: 0.5, bassSmoothness: 0.6, functionalStability: 0.7, voiceLeading: 0.8,
    physicalComplexity: 0.2, playability: 0.8, pedagogicalImpact: 0.6, goalAchievement: 0.7
  };

  const b: ObjectiveVector = {
    tension: 0.5, chromaticism: 0.5, bassSmoothness: 0.6, functionalStability: 0.7, voiceLeading: 0.8,
    physicalComplexity: 0.5, playability: 0.5, pedagogicalImpact: 0.6, goalAchievement: 0.7
  };

  const c: ObjectiveVector = {
    tension: 0.9, chromaticism: 0.5, bassSmoothness: 0.6, functionalStability: 0.7, voiceLeading: 0.8,
    physicalComplexity: 0.8, playability: 0.2, pedagogicalImpact: 0.6, goalAchievement: 0.7
  };

  assert(dominates(a, b) === true, 'A domina B (A é melhor em tensão e menor complexidade)');
  assert(dominates(b, a) === false, 'B não domina A');
  assert(dominates(a, c) === false, 'A não domina C (conflito: A tem menor complexidade, C tem maior tensão)');
  assert(dominates(c, a) === false, 'C não domina A (conflito)');
}

// ═══════════════════════════════════════════════════════════
// 2. Caso 2 — Testar computeParetoFrontier
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Testar redução à fronteira de Pareto');
{
  // Criamos 5 caminhos:
  // p1: tension: 0.9, complexity: 0.8 (não-dominada, extremo de tensão)
  const p1 = createMockPath('p1', {
    tension: 0.9, chromaticism: 0.5, bassSmoothness: 0.5, functionalStability: 0.5, voiceLeadingQuality: 0.5,
    physicalComplexity: 0.8, pedagogicalImpact: 0.5, goalAchievement: 0.5
  });

  // p2: tension: 0.5, complexity: 0.2 (não-dominada, extremo de tocabilidade)
  const p2 = createMockPath('p2', {
    tension: 0.5, chromaticism: 0.5, bassSmoothness: 0.5, functionalStability: 0.5, voiceLeadingQuality: 0.5,
    physicalComplexity: 0.2, pedagogicalImpact: 0.5, goalAchievement: 0.5
  });

  // p3: tension: 0.8, complexity: 0.3 (não-dominada, bom equilíbrio intermediário)
  const p3 = createMockPath('p3', {
    tension: 0.8, chromaticism: 0.5, bassSmoothness: 0.5, functionalStability: 0.5, voiceLeadingQuality: 0.5,
    physicalComplexity: 0.3, pedagogicalImpact: 0.5, goalAchievement: 0.5
  });

  // p4: tension: 0.4, complexity: 0.6 (dominada por p2 e p3)
  const p4 = createMockPath('p4', {
    tension: 0.4, chromaticism: 0.5, bassSmoothness: 0.5, functionalStability: 0.5, voiceLeadingQuality: 0.5,
    physicalComplexity: 0.6, pedagogicalImpact: 0.5, goalAchievement: 0.5
  });

  // p5: tension: 0.7, complexity: 0.5 (dominada por p3)
  const p5 = createMockPath('p5', {
    tension: 0.7, chromaticism: 0.5, bassSmoothness: 0.5, functionalStability: 0.5, voiceLeadingQuality: 0.5,
    physicalComplexity: 0.5, pedagogicalImpact: 0.5, goalAchievement: 0.5
  });

  const frontier = computeParetoFrontier([p1, p2, p3, p4, p5], false);

  assert(frontier.frontierSize === 3, `Fronteira possui 3 caminhos não-dominados, obtido: ${frontier.frontierSize}`);
  assert(frontier.dominatedCount === 2, `Detectou 2 caminhos dominados, obtido: ${frontier.dominatedCount}`);

  const ids = frontier.paths.map(p => p.pathId);
  assert(ids.includes('p1'), 'p1 está na fronteira');
  assert(ids.includes('p2'), 'p2 está na fronteira');
  assert(ids.includes('p3'), 'p3 está na fronteira');
  assert(!ids.includes('p4'), 'p4 NÃO está na fronteira (dominado)');
  assert(!ids.includes('p5'), 'p5 NÃO está na fronteira (dominado)');
}

// ═══════════════════════════════════════════════════════════
// 3. Caso 3 — Complexidade Física / Tocabilidade
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Tocabilidade e Complexidade Física');
{
  const path = createMockPath('path', {
    tension: 0.5, chromaticism: 0.5, bassSmoothness: 0.5, functionalStability: 0.5, voiceLeadingQuality: 0.5,
    physicalComplexity: 0.3, pedagogicalImpact: 0.5, goalAchievement: 0.5
  });

  const objectives = extractObjectiveVector(path, false);
  assert(objectives.physicalComplexity === 0.3, `Complexidade física extraída correta: ${objectives.physicalComplexity}`);
  assert(objectives.playability === 0.65, `Tocabilidade (playability) calculada correta: ${objectives.playability}`);
}

// ═══════════════════════════════════════════════════════════
// 4. Caso 4 — Testar perfil MAX_PLAYABILITY
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 4 — Perfil MAX_PLAYABILITY');
{
  const pComplexo = createMockPath('complexo', {
    tension: 0.9, chromaticism: 0.5, bassSmoothness: 0.5, functionalStability: 0.5, voiceLeadingQuality: 0.5,
    physicalComplexity: 0.9, pedagogicalImpact: 0.5, goalAchievement: 0.5
  });

  const pSimples = createMockPath('simples', {
    tension: 0.4, chromaticism: 0.5, bassSmoothness: 0.5, functionalStability: 0.5, voiceLeadingQuality: 0.5,
    physicalComplexity: 0.1, pedagogicalImpact: 0.5, goalAchievement: 0.5
  });

  const frontier = computeParetoFrontier([pComplexo, pSimples], false);
  rankParetoFrontier(frontier, 'MAX_PLAYABILITY');

  assert(frontier.paths[0].pathId === 'simples', `MAX_PLAYABILITY colocou o mais simples no topo: ${frontier.paths[0].pathId}`);
}

// ═══════════════════════════════════════════════════════════
// 5. Caso 5 — Testar perfil MAX_TENSION
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 5 — Perfil MAX_TENSION');
{
  const pComplexo = createMockPath('complexo', {
    tension: 0.9, chromaticism: 0.5, bassSmoothness: 0.5, functionalStability: 0.5, voiceLeadingQuality: 0.5,
    physicalComplexity: 0.9, pedagogicalImpact: 0.5, goalAchievement: 0.5
  });

  const pSimples = createMockPath('simples', {
    tension: 0.4, chromaticism: 0.5, bassSmoothness: 0.5, functionalStability: 0.5, voiceLeadingQuality: 0.5,
    physicalComplexity: 0.1, pedagogicalImpact: 0.5, goalAchievement: 0.5
  });

  const frontier = computeParetoFrontier([pComplexo, pSimples], false);
  rankParetoFrontier(frontier, 'MAX_TENSION');

  assert(frontier.paths[0].pathId === 'complexo', `MAX_TENSION colocou o mais tenso no topo: ${frontier.paths[0].pathId}`);
}

// ═══════════════════════════════════════════════════════════
// 6. Caso 6 — Narrativa Integrada
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 6 — Narrativa Integrada e Busca');
{
  const corpus: CorpusItem[] = [
    {
      id: 'item-1',
      name: 'Item do Corpus',
      progression: ['C', 'F', 'G7', 'C'],
      harmonicCategory: 'DIATONIC_AXIS',
      functionalCategory: 'CADENTIAL_PROGRESSION'
    }
  ];

  const queryProg = ['C', 'G7', 'C'];
  const queryResult = analyzeProgression(queryProg);
  const queryFp = generateFingerprint(queryResult, { density: 'FULL' });

  // Rodamos com perfil MAX_PLAYABILITY
  const matches = findSimilarProgressions(queryFp, corpus, {
    strategy: 'OVERALL',
    goal: 'INCREASE_TENSION',
    optimizationProfile: 'MAX_PLAYABILITY'
  });

  assert(matches.length > 0, 'Encontrou correspondências com otimização multiobjetivo');
  if (matches.length > 0) {
    const match = matches[0];
    assert(match.paretoFrontier !== undefined, 'Fronteira de Pareto anexada ao match');
    assert(match.explanation !== undefined, 'Narrativa gerada com sucesso');

    if (match.explanation) {
      assert(match.explanation.includes('Fronteira de Pareto'), 'Narrativa inclui a seção Fronteira de Pareto');
      assert(match.explanation.includes('Perfil de Otimização'), 'Narrativa inclui a seção Perfil de Otimização');
      assert(match.explanation.includes('MAX_PLAYABILITY'), 'Narrativa faz referência ao perfil ativo');
      assert(match.explanation.includes('Esta recomendação foi escolhida porque, dentro do perfil MAX_PLAYABILITY'), 'Narrativa traduz a justificativa do perfil em linguagem amigável');

      console.log('\n--- EXCERT OF REAL MULTI-OBJECTIVE NARRATIVE ---');
      console.log(match.explanation.substring(match.explanation.indexOf('**Fronteira de Pareto')));
      console.log('-------------------------------------------------\n');
    }
  }
}

console.log(`\n==================================================`);
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`==================================================`);

if (failed > 0) {
  throw new Error(`Multi-objective optimization tests failed with ${failed} failures.`);
}
