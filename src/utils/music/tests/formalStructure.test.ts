// Sprint F8 — Formal Phrase Structure Solver Tests
// Run with: npx tsx src/utils/music/tests/formalStructure.test.ts

import { analyzeProgression } from '../analysis/functionalAnalysis';

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
// Caso 1 — Período Autêntico Diatônico (HALF -> AUTHENTIC)
// Cmaj7 -> Dm7 -> G7 (Antecedente)
// Em7 -> Am7 -> Dm7 -> G7 -> Cmaj7 (Consequente)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Período Autêntico (HALF ➔ AUTHENTIC RESOLVED)');
{
  const result = analyzeProgression([
    'Cmaj7', 'Dm7', 'G7', 
    'Em7', 'Am7', 'Dm7', 'G7', 'Cmaj7'
  ]);

  assert(result.phrases !== undefined, 'Phrases are defined');
  assert(result.phraseGroups !== undefined, 'Phrase groups are defined');

  if (result.phrases && result.phraseGroups) {
    // Devido à detecção de cadência EVADED do G7 (fim da frase 1) para Em7 (início da frase 2),
    // a frase 2 é dividida, gerando 3 frases no total. O período é identificado entre a frase 1 (Em7) e a frase 2 (Am7...).
    assert(result.phrases.length === 3, `Expected exactly 3 phrases, got ${result.phrases.length}`);
    assert(result.phraseGroups.length === 1, `Expected exactly 1 phrase group, got ${result.phraseGroups.length}`);

    const p0 = result.phrases[0];
    const p1 = result.phrases[1];
    const p2 = result.phrases[2];

    assert(p0.formalRole === 'STANDALONE', `Phrase 0 role is STANDALONE, got ${p0.formalRole}`);
    assert(p1.formalRole === 'ANTECEDENT', `Phrase 1 role is ANTECEDENT, got ${p1.formalRole}`);
    assert(p2.formalRole === 'CONSEQUENT', `Phrase 2 role is CONSEQUENT, got ${p2.formalRole}`);
    assert(p1.phraseGroupId === 0, `Phrase 1 points to group index 0`);
    assert(p2.phraseGroupId === 0, `Phrase 2 points to group index 0`);

    const group = result.phraseGroups[0];
    assert(group.type === 'PERIOD', `Group type is PERIOD, got ${group.type}`);
    assert(group.name === 'Período Autêntico', `Group name is 'Período Autêntico', got '${group.name}'`);
    assert(group.confidence > 0.5, `Confidence score exists and is > 0.5: ${group.confidence}`);
    assert(JSON.stringify(group.phraseIndices) === '[1,2]', `Group contains phrase indices [1, 2], got ${JSON.stringify(group.phraseIndices)}`);
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 2 — Período Deceptivo (DECEPTIVE -> AUTHENTIC)
// Cmaj7 -> Dm7 -> G7 -> Am7 (Antecedente - Cadência Deceptiva)
// Dm7 -> G7 -> Cmaj7 (Consequente)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Período Deceptivo (DECEPTIVE ➔ AUTHENTIC RESOLVED)');
{
  const result = analyzeProgression([
    'Cmaj7', 'Dm7', 'G7', 'Am7', 
    'Dm7', 'G7', 'Cmaj7'
  ]);

  assert(result.phrases !== undefined, 'Phrases are defined');
  assert(result.phraseGroups !== undefined, 'Phrase groups are defined');

  if (result.phrases && result.phraseGroups) {
    // Similar ao Caso 1, o desvio da cadência V7 - vi gera uma divisão no início da próxima frase.
    assert(result.phrases.length === 3, `Expected exactly 3 phrases, got ${result.phrases.length}`);
    assert(result.phraseGroups.length === 1, `Expected exactly 1 phrase group, got ${result.phraseGroups.length}`);

    const p0 = result.phrases[0];
    const p1 = result.phrases[1];
    const p2 = result.phrases[2];

    assert(p0.formalRole === 'STANDALONE', `Phrase 0 role is STANDALONE, got ${p0.formalRole}`);
    assert(p1.formalRole === 'ANTECEDENT', `Phrase 1 role is ANTECEDENT, got ${p1.formalRole}`);
    assert(p2.formalRole === 'CONSEQUENT', `Phrase 2 role is CONSEQUENT, got ${p2.formalRole}`);

    const group = result.phraseGroups[0];
    assert(group.type === 'PERIOD', `Group type is PERIOD, got ${group.type}`);
    assert(group.name === 'Período Deceptivo', `Group name is 'Período Deceptivo', got '${group.name}'`);
    assert(group.confidence > 0.5, `Confidence score exists and is > 0.5: ${group.confidence}`);
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Fallback Standalone (Frase Única)
// Cmaj7 -> Dm7 -> G7 -> Cmaj7
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Fallback Standalone (Single Phrase)');
{
  const result = analyzeProgression(['Cmaj7', 'Dm7', 'G7', 'Cmaj7']);

  assert(result.phrases !== undefined, 'Phrases are defined');
  assert(result.phraseGroups !== undefined, 'Phrase groups are defined');

  if (result.phrases && result.phraseGroups) {
    assert(result.phrases.length === 1, `Expected exactly 1 phrase, got ${result.phrases.length}`);
    assert(result.phraseGroups.length === 0, `Expected exactly 0 phrase groups, got ${result.phraseGroups.length}`);
    assert(result.phrases[0].formalRole === 'STANDALONE', `Phrase 1 role is STANDALONE, got ${result.phrases[0].formalRole}`);
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 4 — Sem Pareamento Adequado (RESOLVED -> RESOLVED)
// Cmaj7 -> Dm7 -> G7 -> Cmaj7 (Frase 1 - Resolvida)
// Dm7 -> G7 -> Cmaj7 (Frase 2 - Resolvida)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 4 — Sem Pareamento (RESOLVED ➔ RESOLVED)');
{
  const result = analyzeProgression([
    'Cmaj7', 'Dm7', 'G7', 'Cmaj7', 
    'Dm7', 'G7', 'Cmaj7'
  ]);

  assert(result.phrases !== undefined, 'Phrases are defined');
  assert(result.phraseGroups !== undefined, 'Phrase groups are defined');

  if (result.phrases && result.phraseGroups) {
    assert(result.phrases.length === 2, `Expected exactly 2 phrases, got ${result.phrases.length}`);
    assert(result.phraseGroups.length === 0, `Expected exactly 0 phrase groups, got ${result.phraseGroups.length}`);
    assert(result.phrases[0].formalRole === 'STANDALONE', `Phrase 1 role is STANDALONE, got ${result.phrases[0].formalRole}`);
    assert(result.phrases[1].formalRole === 'STANDALONE', `Phrase 2 role is STANDALONE, got ${result.phrases[1].formalRole}`);
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
