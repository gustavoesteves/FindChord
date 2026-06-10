// Sprint C3.2-C — Constraint Satisfaction Engine Tests
// Run with: npx tsx src/utils/music/tests/constraintEvaluation.test.ts

import { 
  analyzeProgression,
  generateFingerprint,
  prepareCorpus,
  findSimilarProgressions,
  detectOpportunities,
  buildTransformationGraph,
  generateRecommendedPaths,
  executePathTransformations,
  evaluatePathConstraints 
} from '../analysis/functionalAnalysis';
import type { 
  HarmonicConstraint, 
  TransformationNode, 
  RecommendationPath 
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

// ═══════════════════════════════════════════════════════════
// 1. Caso 1 — Voice-leading preservado (C G7 C -> C Dm7 G7 C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Restrição VOICE_LEADING PRESERVE');
{
  const beforeProg = ['C', 'G7', 'C'];

  const constraints: HarmonicConstraint[] = [
    {
      metric: 'VOICE_LEADING',
      operator: 'PRESERVE',
      value: 0.0,
      strict: true
    }
  ];

  // Executamos com a restrição
  const opportunities = detectOpportunities(beforeProg);
  const graph = buildTransformationGraph(opportunities);
  
  // Dm7 inserido é uma Expansão Funcional
  const expansionNode = graph.nodes.find(n => n.family === 'TENSION_INJECTION');
  assert(expansionNode !== undefined, 'Encontrou o nó de Expansão Funcional');

  if (expansionNode) {
    const result = executePathTransformations(beforeProg, [expansionNode], opportunities, undefined, constraints);
    
    assert(result.constraintEvaluation !== undefined, 'Avaliação de restrições realizada');
    if (result.constraintEvaluation) {
      assert(result.constraintEvaluation.passed === true, 'Caminho passou na restrição (passed = true)');
      assert(result.constraintEvaluation.hardViolations === 0, 'Zero violações estritas (hard)');
      console.log(`  Voice Leading - Antes: ${result.stateTransition?.before.voiceLeadingQuality}, Depois: ${result.stateTransition?.after.voiceLeadingQuality}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// 2. Caso 2 — Estabilidade mínima (C G7 C -> C Db7 C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Restrição FUNCTIONAL_STABILITY GREATER_THAN 0.8');
{
  const beforeProg = ['C', 'G7', 'C'];
  
  const constraints: HarmonicConstraint[] = [
    {
      metric: 'FUNCTIONAL_STABILITY',
      operator: 'GREATER_THAN',
      value: 0.8,
      strict: true
    }
  ];

  const opportunities = detectOpportunities(beforeProg);
  const graph = buildTransformationGraph(opportunities);
  const tritoneNode = graph.nodes.find(n => n.family === 'FUNCTIONAL_SUBSTITUTION');
  
  assert(tritoneNode !== undefined, 'Encontrou o nó de Substituição Tritônica');

  if (tritoneNode) {
    const result = executePathTransformations(beforeProg, [tritoneNode], opportunities, undefined, constraints);
    
    assert(result.constraintEvaluation !== undefined, 'Avaliação de restrições realizada');
    if (result.constraintEvaluation) {
      assert(result.constraintEvaluation.passed === false, 'Caminho FALHOU na restrição estrita (passed = false)');
      assert(result.constraintEvaluation.hardViolations === 1, 'Registrou 1 violação estrita (hard)');
      assert(result.constraintEvaluation.evaluations[0].reason !== undefined, 'Traceability: Razão preenchida');
      console.log(`  Estabilidade Funcional obtida: ${result.stateTransition?.after.functionalStability} (Razão: ${result.constraintEvaluation.evaluations[0].reason})`);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// 3. Caso 3 — Complexidade física (Soft Constraint)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Restrição PHYSICAL_COMPLEXITY LESS_THAN 0.5 (Soft)');
{
  const steps: TransformationNode[] = [
    {
      id: 'step-1',
      opportunityId: 'opp-1',
      family: 'FUNCTIONAL_SUBSTITUTION',
      confidence: 0.9,
      musicalImpact: 0.6,
      similarityImpact: 0.5,
      physicalComplexity: 0.8, // Excede 0.5
      pedagogicalDifficulty: 0.6
    }
  ];

  const path: RecommendationPath = {
    steps,
    accumulatedImpact: 0.6,
    accumulatedDifficulty: 0.6
  };

  const beforeProfile = {
    tension: 0.2, chromaticism: 0.0, bassSmoothness: 0.5, functionalStability: 0.9, voiceLeadingQuality: 0.9
  };
  const afterProfile = {
    tension: 0.3, chromaticism: 0.3, bassSmoothness: 0.8, functionalStability: 0.4, voiceLeadingQuality: 0.8
  };

  const result = {
    applications: [],
    finalProgression: ['C', 'Db7', 'C'],
    confidence: 0.9,
    stateTransition: {
      before: beforeProfile,
      after: afterProfile,
      tensionDelta: 0.1,
      chromaticismDelta: 0.3,
      bassSmoothnessDelta: 0.3,
      functionalStabilityDelta: -0.5,
      voiceLeadingQualityDelta: -0.1
    }
  };

  const constraints: HarmonicConstraint[] = [
    {
      metric: 'PHYSICAL_COMPLEXITY',
      operator: 'LESS_THAN',
      value: 0.5,
      weight: 2.0,
      strict: false // Soft Constraint
    }
  ];

  const evalResult = evaluatePathConstraints(path, result, constraints);

  assert(evalResult.passed === true, 'Passou pois a violação é soft (passed = true)');
  assert(evalResult.softViolations === 1, 'Registrou 1 violação soft');
  assert(evalResult.totalPenalty > 0, 'Penalidade total é positiva');
  // Violação: 0.8 - 0.5 = 0.3. Normalizada: 0.3 / 1.0 = 0.3. Peso: 2.0. Total = 0.6
  assert(Math.abs(evalResult.totalPenalty - 0.6) < 0.001, `Penalidade calculada corretamente: ${evalResult.totalPenalty} (esperado 0.6)`);
}

// ═══════════════════════════════════════════════════════════
// 4. Caso 4 — Ranqueamento Penalizado / Filtrado
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 4 — Ranqueamento Penalizado / Filtrado');
{
  const progression = ['C', 'G7', 'C'];
  const opportunities = detectOpportunities(progression);
  const graph = buildTransformationGraph(opportunities);

  // Sem restrições: a Substituição Tritônica deve ficar no topo devido ao alinhamento estético
  const rawPaths = generateRecommendedPaths(opportunities, graph, 'INCREASE_TENSION');
  const topRawPath = rawPaths[0];
  assert(topRawPath.steps.some(s => s.family === 'FUNCTIONAL_SUBSTITUTION'), 'Sem restrições: Substituição Tritônica no topo');

  // Com restrição estrita de estabilidade funcional:
  // Substituição Tritônica cai na estabilidade e deve ser FILTRADA (descartada)
  const constraints: HarmonicConstraint[] = [
    {
      metric: 'FUNCTIONAL_STABILITY',
      operator: 'GREATER_THAN',
      value: 0.8,
      strict: true // Filtra
    }
  ];

  const filteredPaths = generateRecommendedPaths(opportunities, graph, 'INCREASE_TENSION', constraints, progression);
  
  assert(filteredPaths.length > 0, 'Caminhos recomendados gerados com restrições');
  const containsTritone = filteredPaths.some(p => p.steps.some(s => s.family === 'FUNCTIONAL_SUBSTITUTION'));
  assert(!containsTritone, 'Caminho de Substituição Tritônica foi descartado das recomendações');
  
  if (filteredPaths.length > 0) {
    console.log(`  Novo Top Path steps: ${filteredPaths[0].steps.map(s => s.family).join(' + ')} (Score: ${filteredPaths[0].finalScore})`);
  }
}

// ═══════════════════════════════════════════════════════════
// 5. Caso 5 — Integração e Narrativa
// ═══════════════════════════════════════════════════════════
console.log('\n🔍 Integração do pipeline e Narrative Renderer (Constraint-Aware)');
{
  const resultQ = analyzeProgression(['C', 'G7', 'C']);
  const fpQ = generateFingerprint(resultQ, { density: 'STANDARD' });

  const corpus = [
    {
      id: 'mock-1',
      name: 'Tonic Dominant Mock',
      progression: ['C', 'G7', 'C']
    }
  ];

  const constraints: HarmonicConstraint[] = [
    {
      metric: 'VOICE_LEADING',
      operator: 'PRESERVE',
      value: 0.0,
      strict: true
    },
    {
      metric: 'FUNCTIONAL_STABILITY',
      operator: 'GREATER_THAN',
      value: 0.8,
      strict: false // Soft, causará penalidade para demonstrar
    }
  ];

  const prepared = prepareCorpus(corpus, { density: 'STANDARD' });
  const matches = findSimilarProgressions(fpQ, prepared, { 
    goal: 'INCREASE_TENSION',
    constraints
  });

  assert(matches.length > 0, 'Discovery match found');
  if (matches.length > 0) {
    const match = matches[0];
    const explanation = match.explanation;
    assert(explanation !== undefined, 'Explicação gerada com sucesso');

    if (explanation) {
      assert(explanation.includes('**Restrições Aplicadas:**'), 'Narrativa inclui cabeçalho de Restrições Aplicadas');
      assert(explanation.includes('**Penalidade Total:**'), 'Narrativa inclui Penalidade Total');
      assert(explanation.includes('**Score Final:**'), 'Narrativa inclui Score Final');
      
      console.log('  Narrativa Sugerida Completa (Excerto):\n', explanation.substring(explanation.indexOf('**Transformação Sugerida:')));
    }
  }
}

console.log(`\n==================================================`);
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`==================================================`);

if (failed > 0) {
  throw new Error(`Constraint satisfaction engine tests failed with ${failed} failures.`);
}
