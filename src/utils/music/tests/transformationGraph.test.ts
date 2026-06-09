// Sprint F10-C.5 — Transformation Dependency Graph Tests
// Run with: npx tsx src/utils/music/tests/transformationGraph.test.ts

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
// 1. Caso 1 — Sequenciamento ENABLES (C -> Dm -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Sequenciamento ENABLES (C Dm G7 C)');
{
  const progression = ['C', 'Dm', 'G7', 'C'];
  const opportunities = detectOpportunities(progression);

  const graph = buildTransformationGraph(opportunities);

  // Deve haver um nó de Expansão (TENSION_INJECTION) e um de Reinterpretação Cadencial (CADENTIAL_REINTERPRETATION)
  const expansionNode = graph.nodes.find(n => n.family === 'TENSION_INJECTION');
  const cadentialNode = graph.nodes.find(n => n.family === 'CADENTIAL_REINTERPRETATION');

  assert(expansionNode !== undefined, 'Expansion node found');
  assert(cadentialNode !== undefined, 'Cadential reinterpretation node found');

  if (expansionNode && cadentialNode) {
    // Verifica se há uma aresta ENABLES conectando Expansion -> Cadential
    const enablesEdge = graph.edges.find(e => 
      e.from === expansionNode.id && 
      e.to === cadentialNode.id && 
      e.relation === 'ENABLES'
    );
    assert(enablesEdge !== undefined, 'Edge ENABLES from Expansion to Cadential reinterpretation exists');
    if (enablesEdge) {
      assert(enablesEdge.stateDelta !== undefined && enablesEdge.stateDelta.includes(cadentialNode.opportunityId), 'Edge contains expected stateDelta');
    }
  }
}

// ═══════════════════════════════════════════════════════════
// 2. Caso 2 — Conflitos no mesmo acorde (C -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Conflitos no mesmo acorde (C G7 C)');
{
  const progression = ['C', 'G7', 'C'];
  const opportunities = detectOpportunities(progression);
  
  const graph = buildTransformationGraph(opportunities);

  const tritoneNode = graph.nodes.find(n => n.family === 'FUNCTIONAL_SUBSTITUTION');
  const modalNode = graph.nodes.find(n => n.family === 'MODAL_REINTERPRETATION');

  assert(tritoneNode !== undefined, 'Tritone node found');
  assert(modalNode !== undefined, 'Modal borrowing node found');

  if (tritoneNode && modalNode) {
    // Ambas estão no index 1 (G7)
    const conflictEdge = graph.edges.find(e => 
      e.relation === 'CONFLICTS_WITH' &&
      ((e.from === tritoneNode.id && e.to === modalNode.id) || (e.from === modalNode.id && e.to === tritoneNode.id))
    );
    assert(conflictEdge !== undefined, 'Mutual CONFLICTS_WITH edge found at the same index');

    // As oportunidades devem listar os conflitos correspondentes
    const oppTritone = opportunities.find(o => o.id === tritoneNode.opportunityId);
    const oppModal = opportunities.find(o => o.id === modalNode.opportunityId);

    assert(oppTritone !== undefined, 'Tritone opportunity exists');
    assert(oppModal !== undefined, 'Modal opportunity exists');

    if (oppTritone && oppModal) {
      assert(oppTritone.conflictingOpportunities?.includes(oppModal.id) === true, 'Tritone lists Modal as conflict');
      assert(oppModal.conflictingOpportunities?.includes(oppTritone.id) === true, 'Modal lists Tritone as conflict');
    }
  }
}

// ═══════════════════════════════════════════════════════════
// 3. Caso 3 — Ranking Pedagógico de Caminhos
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Ranking Pedagógico de Caminhos');
{
  const progression = ['C', 'Dm', 'G7', 'C'];
  const opportunities = detectOpportunities(progression);
  const graph = buildTransformationGraph(opportunities);
  const paths = generateRecommendedPaths(opportunities, graph);

  assert(paths.length > 0, 'Recommended paths generated');
  if (paths.length > 0) {
    // O primeiro caminho recomendado deve ter o melhor score pedagógico
    const scores = paths.map(p => p.accumulatedImpact - (p.accumulatedDifficulty * 0.5));
    let isSorted = true;
    for (let i = 0; i < scores.length - 1; i++) {
      if (scores[i] < scores[i + 1]) {
        isSorted = false;
        break;
      }
    }
    assert(isSorted, 'Recommended paths are sorted by pedagogical score descending');
    console.log(`  Top Path score: ${scores[0].toFixed(4)}, Second Path score: ${scores[1]?.toFixed(4) ?? 'N/A'}`);
  }
}

// ═══════════════════════════════════════════════════════════
// 4. Integração Geral e Narrative Renderer
// ═══════════════════════════════════════════════════════════
console.log('\n🔍 Integração do pipeline e Narrative Renderer');
{
  const resultQ = analyzeProgression(['C', 'Dm', 'G7', 'C']);
  const fpQ = generateFingerprint(resultQ, { density: 'STANDARD' });

  const corpus = [
    {
      id: 'mock-2',
      name: 'Standard Tonic Dominant Mock 2',
      progression: ['C', 'G7', 'C']
    }
  ];

  const prepared = prepareCorpus(corpus, { density: 'STANDARD' });
  const matches = findSimilarProgressions(fpQ, prepared);

  assert(matches.length > 0, 'Discovery match found');
  if (matches.length > 0) {
    const match = matches[0];
    assert(match.transformationGraph !== undefined, 'transformationGraph populated in DiscoveryMatch');
    assert(match.recommendedPaths !== undefined, 'recommendedPaths populated in DiscoveryMatch');

    const explanation = match.explanation;
    assert(explanation !== undefined, 'Natural language explanation with recommended paths generated');
    if (explanation) {
      assert(explanation.includes('Caminhos de Transformação Recomendados'), 'Narrative includes suggested path section');
      console.log('  Narrativa Sugerida:\n', explanation.substring(explanation.indexOf('**Caminhos de Transformação Recomendados')));
    }
  }
}

console.log(`\n==================================================`);
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`==================================================`);

if (failed > 0) {
  throw new Error(`Transformation graph engine tests failed with ${failed} failures.`);
}
