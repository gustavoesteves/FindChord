// Sprint C3.2-A — Goal-Oriented Recommendation Engine Tests
// Run with: npx tsx src/utils/music/tests/goalMatching.test.ts

import { 
  analyzeProgression, 
  generateFingerprint,
  prepareCorpus,
  findSimilarProgressions,
  detectOpportunities,
  buildTransformationGraph,
  generateRecommendedPaths
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
// 1. Caso 1 — Ranking Orientado a INCREASE_TENSION (C -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Ranking Orientado a INCREASE_TENSION (C G7 C)');
{
  const progression = ['C', 'G7', 'C'];
  const opportunities = detectOpportunities(progression);
  const graph = buildTransformationGraph(opportunities);
  
  // Executa com goal
  const tensionGoalPaths = generateRecommendedPaths(opportunities, graph, 'INCREASE_TENSION');

  assert(tensionGoalPaths.length > 0, 'Recommended paths generated for INCREASE_TENSION');
  
  if (tensionGoalPaths.length > 0) {
    const topPath = tensionGoalPaths[0];
    const containsTritone = topPath.steps.some(s => s.family === 'FUNCTIONAL_SUBSTITUTION');
    assert(containsTritone, 'Top path for INCREASE_TENSION contains Tritone Substitution');
    
    // Mostra a diferença no ranking
    console.log(`  Top path steps: ${topPath.steps.map(s => s.family).join(' + ')}`);
  }
}

// ═══════════════════════════════════════════════════════════
// 2. Caso 2 — Ranking Orientado a SMOOTHER_BASS (C -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Ranking Orientado a SMOOTHER_BASS (C G7 C)');
{
  const progression = ['C', 'G7', 'C'];
  const opportunities = detectOpportunities(progression);
  const graph = buildTransformationGraph(opportunities);
  
  const smoothBassPaths = generateRecommendedPaths(opportunities, graph, 'SMOOTHER_BASS');

  assert(smoothBassPaths.length > 0, 'Recommended paths generated for SMOOTHER_BASS');
  
  if (smoothBassPaths.length > 0) {
    const topPath = smoothBassPaths[0];
    const containsExpansion = topPath.steps.some(s => s.family === 'TENSION_INJECTION');
    assert(containsExpansion, 'Top path for SMOOTHER_BASS contains Functional Expansion');
    
    console.log(`  Top path steps: ${topPath.steps.map(s => s.family).join(' + ')}`);
  }
}

// ═══════════════════════════════════════════════════════════
// 3. Caso 3 — Integração Geral e Renderização Narrativa
// ═══════════════════════════════════════════════════════════
console.log('\n🔍 Integração do pipeline e Narrative Renderer');
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

  const prepared = prepareCorpus(corpus, { density: 'STANDARD' });
  const matches = findSimilarProgressions(fpQ, prepared, { goal: 'INCREASE_TENSION' });

  assert(matches.length > 0, 'Discovery match found');
  if (matches.length > 0) {
    const match = matches[0];
    const explanation = match.explanation;
    assert(explanation !== undefined, 'Explanation narrative generated');
    
    if (explanation) {
      assert(explanation.includes('**Objetivo:** Aumentar tensão harmônica'), 'Narrative includes goal target header');
      assert(explanation.includes('Alinhamento com o objetivo: 92%'), 'Narrative contains 92% alignment for Tritone under INCREASE_TENSION');
      assert(explanation.includes('**Resultado Previsto:**'), 'Narrative includes Predicted Outcomes section');
      assert(explanation.includes('✓ Mais cromatismo'), 'Predicted Outcomes checks for chromaticism');
      assert(explanation.includes('✓ Maior atração dominante / tensão'), 'Predicted Outcomes checks for tension');

      console.log('  Narrativa Sugerida Completa (Excerto):\n', explanation.substring(explanation.indexOf('**Objetivo:')));
    }
  }
}

console.log(`\n==================================================`);
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`==================================================`);

if (failed > 0) {
  throw new Error(`Goal-oriented engine tests failed with ${failed} failures.`);
}
