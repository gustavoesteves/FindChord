// Sprint C3.1 — Transformation Execution Engine Tests
// Run with: npx tsx src/utils/music/tests/transformationExecution.test.ts

import { 
  analyzeProgression, 
  generateFingerprint,
  prepareCorpus,
  findSimilarProgressions,
  detectOpportunities,
  buildTransformationGraph,
  executePathTransformations
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
// 1. Caso 1 — Substituição Tritônica (C -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Substituição Tritônica (C G7 C)');
{
  const progression = ['C', 'G7', 'C'];
  const opportunities = detectOpportunities(progression);
  const graph = buildTransformationGraph(opportunities);

  const tritoneNode = graph.nodes.find(n => n.family === 'FUNCTIONAL_SUBSTITUTION');
  assert(tritoneNode !== undefined, 'Tritone node found');
  if (tritoneNode) {
    const result = executePathTransformations(progression, [tritoneNode], opportunities);
    assert(JSON.stringify(result.finalProgression) === JSON.stringify(['C', 'Db7', 'C']), 'Tritone substitution result matches expected [' + result.finalProgression.join(', ') + ']');
    assert(result.applications.length > 0, 'At least one application computed');
    assert(result.confidence > 0, 'Confidence is computed and positive');
  }
}

// ═══════════════════════════════════════════════════════════
// 2. Caso 2 — Empréstimo Modal (C -> F -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Empréstimo Modal (C F G7 C)');
{
  const progression = ['C', 'F', 'G7', 'C'];
  const opportunities = detectOpportunities(progression);
  const graph = buildTransformationGraph(opportunities);

  const modalNode = graph.nodes.find(n => n.family === 'MODAL_REINTERPRETATION' && n.opportunityId.includes('borrowing:1'));
  assert(modalNode !== undefined, 'Modal borrowing node found');
  if (modalNode) {
    const result = executePathTransformations(progression, [modalNode], opportunities);
    assert(JSON.stringify(result.finalProgression) === JSON.stringify(['C', 'Fm', 'G7', 'C']), 'Modal borrowing results in Fm');
    assert(result.applications[0]?.explanation.includes('Empréstimo Modal'), 'Justification in Portuguese contains Empréstimo Modal');
  }
}

// ═══════════════════════════════════════════════════════════
// 3. Caso 3 — Expansão Funcional (C -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Expansão Funcional (C G7 C)');
{
  const progression = ['C', 'G7', 'C'];
  const opportunities = detectOpportunities(progression);
  const graph = buildTransformationGraph(opportunities);

  const expansionNode = graph.nodes.find(n => n.family === 'TENSION_INJECTION');
  assert(expansionNode !== undefined, 'Expansion node found');
  if (expansionNode) {
    const result = executePathTransformations(progression, [expansionNode], opportunities);
    assert(JSON.stringify(result.finalProgression) === JSON.stringify(['C', 'Dm7', 'G7', 'C']), 'Expansion inserts Dm7 before G7');
  }
}

// ═══════════════════════════════════════════════════════════
// 4. Caso 4 — Reinterpretação Cadencial (C -> Dm -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 4 — Reinterpretação Cadencial (C Dm G7 C)');
{
  const progression = ['C', 'Dm', 'G7', 'C'];
  const opportunities = detectOpportunities(progression);
  const graph = buildTransformationGraph(opportunities);

  const cadentialNode = graph.nodes.find(n => n.family === 'CADENTIAL_REINTERPRETATION');
  assert(cadentialNode !== undefined, 'Cadential reinterpretation node found');
  if (cadentialNode) {
    const result = executePathTransformations(progression, [cadentialNode], opportunities);
    assert(JSON.stringify(result.finalProgression) === JSON.stringify(['C', 'C/G', 'G7', 'C']), 'Cadential reinterpretation replaces Dm with C/G, yielding C -> C/G -> G7 -> C');
  }
}

// ═══════════════════════════════════════════════════════════
// 5. Caso 5 — Compressão Funcional (C -> Dm -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 5 — Compressão Funcional (C Dm G7 C)');
{
  const progression = ['C', 'Dm', 'G7', 'C'];
  const opportunities = detectOpportunities(progression);
  const graph = buildTransformationGraph(opportunities);

  const compressionNode = graph.nodes.find(n => n.family === 'PATH_OPTIMIZATION');
  assert(compressionNode !== undefined, 'Functional compression node found');
  if (compressionNode) {
    const result = executePathTransformations(progression, [compressionNode], opportunities);
    assert(JSON.stringify(result.finalProgression) === JSON.stringify(['C', 'G7', 'C']), 'Compression removes Dm, yielding C -> G7 -> C');
  }
}

// ═══════════════════════════════════════════════════════════
// 6. Caso 6 — Resolução de Deslocamento de Índices (Múltiplas Transformações)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 6 — Resolução de Deslocamento de Índices (Múltiplas Transformações)');
{
  const progression = ['C', 'F', 'G7', 'C'];
  const opportunities = detectOpportunities(progression);
  
  const oppExp = opportunities.find(o => o.mechanism === 'FUNCTIONAL_EXPANSION' && o.chordIndex === 1);
  const oppTritone = opportunities.find(o => o.mechanism === 'TRITONE_SUBSTITUTION' && o.chordIndex === 2);

  assert(oppExp !== undefined, 'Expansion opportunity detected at index 1');
  assert(oppTritone !== undefined, 'Tritone substitution opportunity detected at index 2');

  if (oppExp && oppTritone) {
    const steps = [
      {
        id: 'node:opp:functional_expansion:1',
        opportunityId: oppExp.id,
        family: 'TENSION_INJECTION' as const,
        confidence: 0.85,
        musicalImpact: 0.5,
        similarityImpact: 0.8,
        physicalComplexity: 0.4,
        pedagogicalDifficulty: 0.4
      },
      {
        id: 'node:opp:tritone_substitution:2',
        opportunityId: oppTritone.id,
        family: 'FUNCTIONAL_SUBSTITUTION' as const,
        confidence: 0.9,
        musicalImpact: 0.8,
        similarityImpact: 0.6,
        physicalComplexity: 0.8,
        pedagogicalDifficulty: 0.8
      }
    ];

    const result = executePathTransformations(progression, steps, opportunities);
    
    // Esperado: Tritone no index 2 (G7 -> Db7), Expansão no index 1 (F -> Cm7 antes de F)
    // Inicial: C | F | G7 | C
    // Substituição Tritônica no index 2 (G7): C | F | Db7 | C
    // Expansão Funcional no index 1 (F): C | Cm7 | F | Db7 | C
    assert(JSON.stringify(result.finalProgression) === JSON.stringify(['C', 'Cm7', 'F', 'Db7', 'C']), 'Index shift solved correctly. Result: [' + result.finalProgression.join(', ') + ']');
    assert(result.applications.length === 2, 'Two applications recorded');
    
    // Primeira aplicação na ordem cronológica (esquerda para a direita) deve ser a Expansão Funcional de F
    assert(result.applications[0].transformationId === oppExp.id, 'First cronological application is Functional Expansion');
  }
}

// ═══════════════════════════════════════════════════════════
// 7. Caso 7 — Integração Geral e Narrative Renderer
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
  const matches = findSimilarProgressions(fpQ, prepared);

  assert(matches.length > 0, 'Discovery match found');
  if (matches.length > 0) {
    const match = matches[0];
    assert(match.recommendedPaths !== undefined, 'recommendedPaths populated');
    const firstPath = match.recommendedPaths?.[0];
    assert(firstPath?.executionResult !== undefined, 'executionResult populated on recommended path');
    assert(match.explanation !== undefined, 'Explanation narrative generated');
    if (match.explanation) {
      assert(match.explanation.includes('Transformação Sugerida:'), 'Narrative includes concrete suggested transformation section');
      console.log('  Narrativa Sugerida Completa (Excerto):\n', match.explanation.substring(match.explanation.indexOf('**Transformação Sugerida:')));
    }
  }
}

console.log(`\n==================================================`);
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`==================================================`);

if (failed > 0) {
  throw new Error(`Transformation execution engine tests failed with ${failed} failures.`);
}
