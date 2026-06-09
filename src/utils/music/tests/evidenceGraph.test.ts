// Sprint F10-C.1 — Evidence Graph & Analytical Traceability Tests
// Run with: npx tsx src/utils/music/tests/evidenceGraph.test.ts

import { 
  analyzeProgression, 
  generateFingerprint,
  generateExplainabilityReport,
  findSimilarProgressions,
  compareFingerprints
} from '../analysis/functionalAnalysis';
import type { 
  CorpusItem,
  EvidenceGraph
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

// Helper para verificar se um nó existe no grafo
function hasNode(graph: EvidenceGraph, id: string): boolean {
  return graph.nodes.some(n => n.id === id);
}

// Helper para verificar se um link existe no grafo
function hasLink(graph: EvidenceGraph, from: string, to: string, relation?: string): boolean {
  return graph.links.some(l => l.from === from && l.to === to && (!relation || l.relation === relation));
}

// ═══════════════════════════════════════════════════════════
// Caso 1 — Cadência Autêntica Simples (C -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Cadência Autêntica Simples');
{
  const resultQ = analyzeProgression(['C', 'G7', 'C']);
  const fpQ = generateFingerprint(resultQ, { density: 'FULL' });

  const resultI = analyzeProgression(['C', 'G7', 'C']);
  const fpI = generateFingerprint(resultI, { density: 'FULL' });

  const report = compareFingerprints(fpQ, fpI);
  const expReport = generateExplainabilityReport(fpQ, fpI, report);
  const graph = expReport.evidenceGraph;

  assert(graph !== undefined, 'Evidence Graph was generated');
  if (graph) {
    // Verificar nós brutos (Layer 5 e 6) da Query
    assert(hasNode(graph, 'query:layer5:function:1'), 'Contains query Layer 5 functional node for G7');
    assert(hasNode(graph, 'query:layer6:voice-leading:0'), 'Contains query Layer 6 voice leading node');

    // Verificar nós do Match (Corpus)
    assert(hasNode(graph, 'match:layer5:function:1'), 'Contains match Layer 5 functional node for G7');
    assert(hasNode(graph, 'match:layer6:voice-leading:0'), 'Contains match Layer 6 voice leading node');

    // Verificar links SUPPORTS / SUPPORTED_BY
    assert(
      hasLink(graph, 'query:layer5:function:1', 'similarity:functional', 'SUPPORTS'),
      'Query functional node SUPPORTS functional similarity axis node'
    );
    assert(
      hasLink(graph, 'similarity:functional', 'query:layer5:function:1', 'DERIVES_FROM'),
      'Functional similarity axis DERIVES_FROM query functional node'
    );

    // Verificar que eixos têm ids de evidências apontando para nós brutos
    const functionalInsight = expReport.insights.find(ins => ins.axis === 'FUNCTIONAL');
    assert(
      functionalInsight !== undefined && functionalInsight.evidenceNodeIds !== undefined && functionalInsight.evidenceNodeIds.includes('query:layer5:function:1'),
      'Functional insight points to functional node in evidenceNodeIds'
    );
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 2 — Cadencial 6/4 (C -> C/G -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Cadencial 6/4');
{
  const resultQ = analyzeProgression(['C', 'C/G', 'G7', 'C']);
  const fpQ = generateFingerprint(resultQ, { density: 'FULL' });

  const resultI = analyzeProgression(['C', 'G7', 'C']);
  const fpI = generateFingerprint(resultI, { density: 'FULL' });

  const report = compareFingerprints(fpQ, fpI);
  const expReport = generateExplainabilityReport(fpQ, fpI, report);
  const graph = expReport.evidenceGraph;

  if (graph) {
    // Verificar nó de Layer 7 (Cadencial 6/4)
    const cadNode = graph.nodes.find(n => n.id === 'query:layer7:apparent:1');
    assert(cadNode !== undefined, 'Contains query Layer 7 apparent node at index 1');
    
    if (cadNode) {
      assert(cadNode.level === 'INTERPRETATION', 'Layer 7 node level is INTERPRETATION');
      assert(cadNode.metadata !== undefined && cadNode.metadata.apparentSubtype === 'CADENTIAL_64', 'Metadata stores apparentSubtype = CADENTIAL_64');
      assert(cadNode.weight === 0.96, 'Confidence/weight of Cadential 6/4 is 0.96');
    }

    // Verificar links de dependência de Layer 7 (deriva de Layer 5 e 6)
    assert(
      hasLink(graph, 'query:layer7:apparent:1', 'query:layer5:function:1', 'DERIVES_FROM'),
      'Apparent function node DERIVES_FROM functional node'
    );
    assert(
      hasLink(graph, 'query:layer7:apparent:1', 'query:layer6:voice-leading:0', 'DERIVES_FROM'),
      'Apparent function node DERIVES_FROM voice leading transition node'
    );
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Substituição Tritônica (C -> Db7 -> C vs C -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Substituição Tritônica');
{
  const resultQ = analyzeProgression(['C', 'Db7', 'C']);
  const fpQ = generateFingerprint(resultQ, { density: 'FULL' });

  const resultI = analyzeProgression(['C', 'G7', 'C']);
  const fpI = generateFingerprint(resultI, { density: 'FULL' });

  const report = compareFingerprints(fpQ, fpI);
  const expReport = generateExplainabilityReport(fpQ, fpI, report);
  const graph = expReport.evidenceGraph;

  if (graph) {
    const tritoneNode = graph.nodes.find(n => n.id === 'transformation:tritone_substitution');
    assert(tritoneNode !== undefined, 'Contains tritone substitution transformation node');

    if (tritoneNode) {
      assert(tritoneNode.level === 'CONCLUSION', 'Transformation node level is CONCLUSION');
      assert(tritoneNode.metadata !== undefined && tritoneNode.metadata.mechanism === 'TRITONE_SUBSTITUTION', 'Metadata stores mechanism = TRITONE_SUBSTITUTION');
    }

    // Verificar link conectando o nó de transformação (CONCLUSION) aos eventos da Layer 5 (OBSERVATION)
    assert(
      hasLink(graph, 'transformation:tritone_substitution', 'query:layer5:function:1', 'DERIVES_FROM'),
      'Transformation node DERIVES_FROM functional event node with tritone sub'
    );
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 4 — Busca Completa (Discovery Engine)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 4 — Busca Completa (Discovery Engine)');
{
  const corpus: CorpusItem[] = [
    {
      id: 'prog1',
      name: 'Simples Cadencial',
      progression: ['C', 'G7', 'C'],
      harmonicCategory: 'DIATONIC_AXIS',
      functionalCategory: 'CADENTIAL_PROGRESSION'
    }
  ];

  const queryResult = analyzeProgression(['C', 'C/G', 'G7', 'C']);
  const queryFp = generateFingerprint(queryResult, { density: 'FULL' });

  const matches = findSimilarProgressions(queryFp, corpus, { strategy: 'OVERALL' });
  assert(matches.length > 0, 'Discovery Engine found matches');

  if (matches.length > 0) {
    const bestMatch = matches[0];
    assert(bestMatch.evidenceGraph !== undefined, 'Best match contains evidenceGraph populated');
    
    if (bestMatch.evidenceGraph) {
      assert(bestMatch.evidenceGraph.nodes.length > 0, 'Evidence Graph has nodes');
      assert(bestMatch.evidenceGraph.links.length > 0, 'Evidence Graph has links');
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 5 — Traceabilidade Completa
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 5 — Traceabilidade Completa');
{
  const resultQ = analyzeProgression(['C', 'Db7', 'C']);
  const fpQ = generateFingerprint(resultQ, { density: 'FULL' });

  const resultI = analyzeProgression(['C', 'G7', 'C']);
  const fpI = generateFingerprint(resultI, { density: 'FULL' });

  const report = compareFingerprints(fpQ, fpI);
  const expReport = generateExplainabilityReport(fpQ, fpI, report);
  const graph = expReport.evidenceGraph;

  assert(expReport.traces !== undefined, 'Explainability report computes traces array');
  
  if (expReport.traces && graph) {
    assert(expReport.traces.length > 0, `Computed ${expReport.traces.length} traces`);

    // Procurar por um trace que parte de transformation:tritone_substitution
    const tritoneTrace = expReport.traces.find(t => t.targetNodeId === 'transformation:tritone_substitution');
    assert(tritoneTrace !== undefined, 'Contains trace starting at transformation:tritone_substitution');

    if (tritoneTrace) {
      // Verificar que o caminho termina em um nó de observação bruta
      const finalNodeId = tritoneTrace.path[tritoneTrace.path.length - 1];
      const finalNode = graph.nodes.find(n => n.id === finalNodeId);
      
      assert(finalNode !== undefined, `Trace path ends at a valid node ID: ${finalNodeId}`);
      if (finalNode) {
        assert(finalNode.level === 'OBSERVATION', `Final node level is OBSERVATION, got ${finalNode.level}`);
      }
      
      console.log(`  Path trace log: ${tritoneTrace.path.join(' -> ')}`);
    }
  }
}

console.log(`\n==================================================`);
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`==================================================`);

if (failed > 0) {
  throw new Error(`Evidence Graph integration tests failed with ${failed} failures.`);
}
