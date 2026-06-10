// Sprint C3.3 — Recommendation Decision Explainer Tests
// Run with: npx tsx src/utils/music/tests/recommendationExplanation.test.ts

import { 
  explainRecommendationDecision,
  findSimilarProgressions,
  analyzeProgression,
  generateFingerprint
} from '../analysis/functionalAnalysis';
import type { 
  RecommendationPath,
  HarmonicConstraint,
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
  finalScore: number,
  breakdown: {
    goalAlignment: number;
    pedagogicalScore: number;
    goalAchievement: number;
    constraintPenalty: number;
  },
  metrics: {
    tension: number;
    chromaticism: number;
    bassSmoothness: number;
    functionalStability: number;
    voiceLeadingQuality: number;
  },
  passedConstraints: boolean = true,
  failedMetric?: string,
  failedOperator?: string,
  failedValue?: number
): RecommendationPath {
  const evaluations = failedMetric ? [
    {
      constraint: {
        metric: failedMetric as any,
        operator: failedOperator as any,
        value: failedValue ?? 0,
        strict: true
      },
      satisfied: false,
      violation: 0.2,
      metricValue: 0.5
    }
  ] : [];

  return {
    steps: [
      {
        id,
        opportunityId: 'opp-' + id,
        family: 'FUNCTIONAL_SUBSTITUTION',
        confidence: 0.9,
        musicalImpact: 0.5,
        similarityImpact: 0.5,
        physicalComplexity: 0.3,
        pedagogicalDifficulty: 0.4
      }
    ],
    accumulatedImpact: 0.5,
    accumulatedDifficulty: 0.4,
    finalScore,
    scoreBreakdown: {
      ...breakdown,
      finalScore
    },
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
      constraintEvaluation: {
        passed: passedConstraints,
        hardViolations: failedMetric ? 1 : 0,
        softViolations: 0,
        totalPenalty: breakdown.constraintPenalty,
        evaluations: evaluations as any
      }
    }
  };
}

// ═══════════════════════════════════════════════════════════
// 1. Caso 1 — Testar LOWER_GOAL_ALIGNMENT
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Testar LOWER_GOAL_ALIGNMENT');
{
  const pathA = createMockPath(
    'path-A',
    0.8,
    { goalAlignment: 0.8, pedagogicalScore: 0.6, goalAchievement: 0.7, constraintPenalty: 0.0 },
    { tension: 0.8, chromaticism: 0.3, bassSmoothness: 0.6, functionalStability: 0.9, voiceLeadingQuality: 0.8 }
  );

  const pathB = createMockPath(
    'path-B',
    0.4,
    { goalAlignment: 0.2, pedagogicalScore: 0.6, goalAchievement: 0.3, constraintPenalty: 0.0 },
    { tension: 0.3, chromaticism: 0.1, bassSmoothness: 0.5, functionalStability: 0.9, voiceLeadingQuality: 0.8 }
  );

  const decision = explainRecommendationDecision(pathA, [pathA, pathB], 'INCREASE_TENSION');
  
  assert(decision.selectedPathId === 'path-A', 'Caminho vencedor é path-A');
  assert(decision.discardedAlternatives.length === 1, 'Registrou 1 alternativa descartada');
  if (decision.discardedAlternatives.length > 0) {
    const discarded = decision.discardedAlternatives[0];
    assert(discarded.pathId === 'path-B', 'Alternativa descartada é path-B');
    assert(discarded.reason === 'LOWER_GOAL_ALIGNMENT', `Motivo do descarte é LOWER_GOAL_ALIGNMENT, obtido: ${discarded.reason}`);
    assert(discarded.description.includes('Menor alinhamento'), 'Descrição de descarte coerente');
  }
}

// ═══════════════════════════════════════════════════════════
// 2. Caso 2 — Testar HARD_CONSTRAINT_FAILURE e descrição
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Testar HARD_CONSTRAINT_FAILURE');
{
  const pathA = createMockPath(
    'path-A',
    0.7,
    { goalAlignment: 0.6, pedagogicalScore: 0.6, goalAchievement: 0.6, constraintPenalty: 0.0 },
    { tension: 0.7, chromaticism: 0.2, bassSmoothness: 0.6, functionalStability: 0.9, voiceLeadingQuality: 0.8 }
  );

  const pathB = createMockPath(
    'path-B',
    -999.0,
    { goalAlignment: 0.5, pedagogicalScore: 0.6, goalAchievement: 0.5, constraintPenalty: 0.5 },
    { tension: 0.6, chromaticism: 0.2, bassSmoothness: 0.6, functionalStability: 0.4, voiceLeadingQuality: 0.8 },
    false, // passedConstraints
    'FUNCTIONAL_STABILITY',
    'GREATER_THAN',
    0.8
  );

  const constraints: HarmonicConstraint[] = [
    {
      metric: 'FUNCTIONAL_STABILITY',
      operator: 'GREATER_THAN',
      value: 0.8,
      strict: true
    }
  ];

  const decision = explainRecommendationDecision(pathA, [pathA, pathB], 'INCREASE_TENSION', constraints);
  
  assert(decision.discardedAlternatives.length === 1, 'Registrou 1 alternativa descartada');
  if (decision.discardedAlternatives.length > 0) {
    const discarded = decision.discardedAlternatives[0];
    assert(discarded.pathId === 'path-B', 'Alternativa descartada é path-B');
    assert(discarded.reason === 'HARD_CONSTRAINT_FAILURE', `Motivo do descarte é HARD_CONSTRAINT_FAILURE, obtido: ${discarded.reason}`);
    assert(discarded.violatedConstraintDescription === 'estabilidade funcional ≥ 80%', `Descrição da restrição violada correta: ${discarded.violatedConstraintDescription}`);
    assert(discarded.description.includes('estabilidade funcional ≥ 80%'), 'Descrição amigável inclui a restrição violada');
  }
}

// ═══════════════════════════════════════════════════════════
// 3. Caso 3 — Testar compensações de TENSION vs FUNCTIONAL_STABILITY
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Testar compensações (Trade-offs)');
{
  // Path A (selected): maior Tensão (0.8 vs 0.5), menor Estabilidade Funcional (0.7 vs 0.9)
  const pathA = createMockPath(
    'path-A',
    0.75,
    { goalAlignment: 0.7, pedagogicalScore: 0.8, goalAchievement: 0.6, constraintPenalty: 0.0 },
    { tension: 0.8, chromaticism: 0.3, bassSmoothness: 0.6, functionalStability: 0.7, voiceLeadingQuality: 0.8 }
  );

  const pathB = createMockPath(
    'path-B',
    0.70,
    { goalAlignment: 0.5, pedagogicalScore: 0.8, goalAchievement: 0.5, constraintPenalty: 0.0 },
    { tension: 0.5, chromaticism: 0.3, bassSmoothness: 0.6, functionalStability: 0.9, voiceLeadingQuality: 0.8 }
  );

  const decision = explainRecommendationDecision(pathA, [pathA, pathB], 'INCREASE_TENSION');
  
  assert(decision.tradeoffs.length > 0, 'Gerou pelo menos 1 trade-off');
  if (decision.tradeoffs.length > 0) {
    const tradeoff = decision.tradeoffs[0];
    assert(tradeoff.comparisonPathId === 'path-B', 'Comparou com path-B');
    assert(tradeoff.metric === 'TENSION', `Métrica ganha é TENSION, obtida: ${tradeoff.metric}`);
    assert(tradeoff.lostMetric === 'FUNCTIONAL_STABILITY', `Métrica perdida é FUNCTIONAL_STABILITY, obtida: ${tradeoff.lostMetric}`);
    assert(Math.abs(tradeoff.gained - 0.3) < 0.001, `Valor de ganho correto: ${tradeoff.gained}`);
    assert(Math.abs(tradeoff.lost - 0.2) < 0.001, `Valor de perda correto: ${tradeoff.lost}`);
    assert(tradeoff.explanation.includes('estabilidade funcional') && tradeoff.explanation.includes('tensão harmônica'), 'Explicação descreve o trade-off corretamente');
  }
}

// ═══════════════════════════════════════════════════════════
// 4. Caso 4 — Testar cálculo de confiança no intervalo [0.0 - 1.0]
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 4 — Testar cálculo de confiança');
{
  const pathA = createMockPath(
    'path-A',
    0.85,
    { goalAlignment: 0.8, pedagogicalScore: 0.7, goalAchievement: 0.8, constraintPenalty: 0.1 },
    { tension: 0.8, chromaticism: 0.2, bassSmoothness: 0.6, functionalStability: 0.9, voiceLeadingQuality: 0.8 }
  );

  const pathB = createMockPath(
    'path-B',
    0.65,
    { goalAlignment: 0.6, pedagogicalScore: 0.7, goalAchievement: 0.6, constraintPenalty: 0.0 },
    { tension: 0.6, chromaticism: 0.2, bassSmoothness: 0.6, functionalStability: 0.9, voiceLeadingQuality: 0.8 }
  );

  // scoreGap = 0.85 - 0.65 = 0.20
  // constraintMargin = 1.0 - 0.1 = 0.90
  // goalAlignment = 0.80
  // geometryFactor = 1.0 (default fallback since no paretoFrontier is passed)
  // rawConfidence = (0.20 * 0.3) + (0.90 * 0.25) + (0.80 * 0.25) + (1.0 * 0.2) = 0.06 + 0.225 + 0.20 + 0.20 = 0.685
  const decision = explainRecommendationDecision(pathA, [pathA, pathB], 'INCREASE_TENSION');
  
  assert(Math.abs((decision.rawConfidence ?? 0) - 0.685) < 0.001, `Confiança bruta calculada corretamente: ${decision.rawConfidence} (esperado 0.685)`);
  assert(decision.confidence >= 0.0 && decision.confidence <= 1.0, 'Confiança está no intervalo [0.0 - 1.0]');
}

// ═══════════════════════════════════════════════════════════
// 5. Caso 5 — Testar narrativa em português e integração
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 5 — Testar narrativa em português e integração');
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

  // Rodamos a busca com meta e restrição
  const constraints: HarmonicConstraint[] = [
    {
      metric: 'FUNCTIONAL_STABILITY',
      operator: 'GREATER_THAN',
      value: 0.4, // valor razoável para permitir caminhos passando e falhando
      strict: true
    }
  ];

  const matches = findSimilarProgressions(queryFp, corpus, {
    strategy: 'OVERALL',
    goal: 'INCREASE_TENSION',
    constraints
  });

  assert(matches.length > 0, 'Discovery match found');
  if (matches.length > 0) {
    const match = matches[0];
    const explanation = match.explanation;
    assert(explanation !== undefined, 'Explicação gerada com sucesso');

    if (explanation) {
      assert(explanation.includes('Por que esta recomendação foi escolhida?'), 'Narrativa inclui a seção de justificativa de escolha');
      assert(explanation.includes('Alternativas Consideradas'), 'Narrativa inclui a seção de alternativas consideradas');
      assert(explanation.includes('Confiança da Recomendação'), 'Narrativa inclui a seção de confiança da recomendação');
      
      console.log('\n--- EXCERT OF REAL INTEGRATED EXPLANATION NARRATIVE ---');
      console.log(explanation.substring(explanation.indexOf('**Por que esta recomendação foi escolhida?')));
      console.log('-------------------------------------------------------\n');
    }
  }
}

// ═══════════════════════════════════════════════════════════
// 6. Caso 6 — Testar decisão auditável com DTO completo
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 6 — Testar decisão auditável com DTO completo');
{
  const pathA = createMockPath(
    'path-A',
    0.8,
    { goalAlignment: 0.9, pedagogicalScore: 0.7, goalAchievement: 0.8, constraintPenalty: 0.0 },
    { tension: 0.8, chromaticism: 0.2, bassSmoothness: 0.6, functionalStability: 0.9, voiceLeadingQuality: 0.8 }
  );

  const pathB = createMockPath(
    'path-B',
    0.7,
    { goalAlignment: 0.6, pedagogicalScore: 0.7, goalAchievement: 0.7, constraintPenalty: 0.0 },
    { tension: 0.6, chromaticism: 0.2, bassSmoothness: 0.6, functionalStability: 0.9, voiceLeadingQuality: 0.8 }
  );

  const pathC = createMockPath(
    'path-C',
    -999.0,
    { goalAlignment: 0.5, pedagogicalScore: 0.7, goalAchievement: 0.5, constraintPenalty: 0.5 },
    { tension: 0.5, chromaticism: 0.2, bassSmoothness: 0.6, functionalStability: 0.4, voiceLeadingQuality: 0.8 },
    false, // passedConstraints
    'FUNCTIONAL_STABILITY',
    'GREATER_THAN',
    0.8
  );

  const decision = explainRecommendationDecision(pathA, [pathA, pathB, pathC], 'INCREASE_TENSION');

  assert(decision.selectedPathId === 'path-A', 'Vencedor é path-A');
  assert(decision.dominantFactor === 'GOAL_ALIGNMENT', `Fator dominante é GOAL_ALIGNMENT, obtido: ${decision.dominantFactor}`);
  assert(decision.discardedAlternatives.length === 2, `Possui 2 alternativas descartadas, obtido: ${decision.discardedAlternatives.length}`);
  
  const discB = decision.discardedAlternatives.find(d => d.pathId === 'path-B');
  assert(discB !== undefined, 'Alternativa B está nos descartados');
  if (discB) {
    assert(discB.reason === 'LOWER_GOAL_ALIGNMENT', `Alternativa B descartada por alinhamento inferior: ${discB.reason}`);
  }

  const discC = decision.discardedAlternatives.find(d => d.pathId === 'path-C');
  assert(discC !== undefined, 'Alternativa C está nos descartados');
  if (discC) {
    assert(discC.reason === 'HARD_CONSTRAINT_FAILURE', `Alternativa C descartada por falha na restrição: ${discC.reason}`);
    assert(discC.violatedConstraintDescription === 'estabilidade funcional ≥ 80%', 'Indica restrição violada de estabilidade funcional');
  }

  assert(decision.scoreBreakdown.finalScore === 0.8, `Score breakdown finalScore está correto: ${decision.scoreBreakdown.finalScore}`);
  assert(decision.confidence > 0, `Confiança é positiva: ${decision.confidence}`);
}

console.log(`\n==================================================`);
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`==================================================`);

if (failed > 0) {
  throw new Error(`Recommendation explanation tests failed with ${failed} failures.`);
}
