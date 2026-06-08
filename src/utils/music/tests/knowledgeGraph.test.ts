// Sprint Infra-2 — Harmonic Knowledge Graph Engine Tests
// Run with: npx tsx src/utils/music/tests/knowledgeGraph.test.ts

import { analyzeProgression, HarmonicGraphEngine } from '../analysis/functionalAnalysis';

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
// Caso 1 — Grafo Tonal Básico (C -> G -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Grafo Tonal Básico (C -> G -> C)');
{
  const result = analyzeProgression(['C', 'G', 'C']);
  
  assert(result.knowledgeGraph !== undefined, 'knowledgeGraph is defined');
  if (result.knowledgeGraph) {
    const kg = result.knowledgeGraph;
    const engine = new HarmonicGraphEngine(kg);

    // Nós de tipo CHORD devem estar presentes
    const chords = engine.getNodesByType('CHORD');
    assert(chords.length === 3, `Expected 3 chords, got ${chords.length}`);
    assert(chords[0].id === 'chord:0', 'First chord ID is chord:0');
    assert(chords[1].id === 'chord:1', 'Second chord ID is chord:1');
    assert(chords[2].id === 'chord:2', 'Third chord ID is chord:2');

    // Nós de tipo REGION e PHRASE
    const regions = engine.getNodesByType('REGION');
    const phrases = engine.getNodesByType('PHRASE');
    assert(regions.length === 1, `Expected 1 region, got ${regions.length}`);
    assert(phrases.length === 1, `Expected 1 phrase, got ${phrases.length}`);

    // Aresta CONTAINS
    const regionPhraseContains = kg.edges.some(
      (e) => e.sourceId === 'region:0' && e.targetId === 'phrase:0' && e.relation === 'CONTAINS'
    );
    assert(regionPhraseContains, 'Region contains Phrase');

    const phraseChordContains = kg.edges.some(
      (e) => e.sourceId === 'phrase:0' && e.targetId === 'chord:0' && e.relation === 'CONTAINS'
    );
    assert(phraseChordContains, 'Phrase contains Chord 0');

    // Aresta FOLLOWS
    const follows01 = kg.edges.some(
      (e) => e.sourceId === 'chord:0' && e.targetId === 'chord:1' && e.relation === 'FOLLOWS'
    );
    assert(follows01, 'chord:0 -> FOLLOWS -> chord:1');

    const follows12 = kg.edges.some(
      (e) => e.sourceId === 'chord:1' && e.targetId === 'chord:2' && e.relation === 'FOLLOWS'
    );
    assert(follows12, 'chord:1 -> FOLLOWS -> chord:2');

    // Aresta RESOLVES da cadência diatônica
    const resolvesDirect = kg.edges.some(
      (e) => e.sourceId === 'chord:1' && e.targetId === 'chord:2' && e.relation === 'RESOLVES'
    );
    assert(resolvesDirect, 'chord:1 (G) -> RESOLVES -> chord:2 (C)');

    // APIs da Engine
    const chordsOfPhrase = engine.getPhraseChords('phrase:0');
    assert(chordsOfPhrase.length === 3, `Engine found ${chordsOfPhrase.length} chords in phrase:0`);
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 2 — Grafo de Período (Pareamento F8 ANSWERS)
// Cmaj7 -> Dm7 -> G7 (Antecedente) -> Em7 -> Am7 -> Dm7 -> G7 -> Cmaj7 (Consequente)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Grafo de Período (Pareamento F8 ANSWERS)');
{
  const result = analyzeProgression([
    'Cmaj7', 'Dm7', 'G7', 
    'Em7', 'Am7', 'Dm7', 'G7', 'Cmaj7'
  ]);

  assert(result.knowledgeGraph !== undefined, 'knowledgeGraph is defined');
  if (result.knowledgeGraph) {
    const kg = result.knowledgeGraph;
    const engine = new HarmonicGraphEngine(kg);

    // Frase 1 e Frase 2 devem estar ligadas pela aresta ANSWERS
    const answersEdge = kg.edges.find((e) => e.relation === 'ANSWERS');
    assert(answersEdge !== undefined, 'ANSWERS edge found');
    if (answersEdge) {
      assert(answersEdge.sourceId === 'phrase:1', `ANSWERS source is phrase:1 (Antecedente), got ${answersEdge.sourceId}`);
      assert(answersEdge.targetId === 'phrase:2', `ANSWERS target is phrase:2 (Consequente), got ${answersEdge.targetId}`);
    }

    // Engine de travessia do consequente
    const consequent = engine.getPeriodConsequent('phrase:1');
    assert(consequent !== null, 'Engine successfully found consequent');
    if (consequent) {
      assert(consequent.id === 'phrase:2', `Consequent ID is phrase:2, got ${consequent.id}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Grafo de Modulações (MODULATES_TO)
// C -> Am -> C com modulações estruturais
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Grafo de Modulações (MODULATES_TO)');
{
  const result = analyzeProgression([
    'Cmaj7', 'Dm7', 'G7', 'Cmaj7',
    'Bm7(b5)', 'E7', 'Am7',
    'Dm7', 'G7', 'Cmaj7'
  ]);

  assert(result.knowledgeGraph !== undefined, 'knowledgeGraph is defined');
  if (result.knowledgeGraph) {
    const kg = result.knowledgeGraph;
    const engine = new HarmonicGraphEngine(kg);

    const regions = engine.getNodesByType('REGION');
    assert(regions.length >= 2, `Expected at least 2 regions, got ${regions.length}`);

    // Deve existir uma aresta MODULATES_TO ligando as regiões
    const modulationEdge = kg.edges.find((e) => e.relation === 'MODULATES_TO');
    assert(modulationEdge !== undefined, 'MODULATES_TO edge found');
    if (modulationEdge) {
      assert(modulationEdge.sourceId.startsWith('region:'), 'Source is a region node');
      assert(modulationEdge.targetId.startsWith('region:'), 'Target is a region node');
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 4 — Dominantes Secundárias e Resolutivas (PREPARES & RESOLVES)
// Cmaj7 -> A7 -> Dm7 -> G7 -> Cmaj7
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 4 — Dominantes Secundárias e Resolutivas (PREPARES & RESOLVES)');
{
  const result = analyzeProgression(['Cmaj7', 'A7', 'Dm7', 'G7', 'Cmaj7']);

  assert(result.knowledgeGraph !== undefined, 'knowledgeGraph is defined');
  if (result.knowledgeGraph) {
    const kg = result.knowledgeGraph;
    const engine = new HarmonicGraphEngine(kg);
    
    // Teste de consulta via engine
    const nodeA7 = engine.getNodeById('chord:1');
    assert(nodeA7 !== null && nodeA7.properties.chordSymbol === 'A7', 'Engine retrieved chord:1 (A7)');

    // chord:1 (A7) deve preparar chord:2 (Dm7) via PREPARES
    const preparesA7 = kg.edges.find(
      (e) => e.sourceId === 'chord:1' && e.targetId === 'chord:2' && e.relation === 'PREPARES'
    );
    assert(preparesA7 !== undefined, 'A7 -> PREPARES -> Dm7 edge found');
    if (preparesA7) {
      assert(preparesA7.properties?.targetDegree === 'ii', `Expected targetDegree 'ii', got ${preparesA7.properties?.targetDegree}`);
    }

    // chord:3 (G7) deve resolver em chord:4 (Cmaj7) via RESOLVES
    const resolvesG7 = kg.edges.find(
      (e) => e.sourceId === 'chord:3' && e.targetId === 'chord:4' && e.relation === 'RESOLVES'
    );
    assert(resolvesG7 !== undefined, 'G7 -> RESOLVES -> Cmaj7 edge found');
    if (resolvesG7) {
      assert(resolvesG7.properties?.deceptive === false, 'G7 resolves directly (not deceptive)');
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Resumo Geral
// ═══════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(50)}`);
console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'═'.repeat(50)}\n`);

if (failed > 0) {
  throw new Error(`${failed} tests failed!`);
}
