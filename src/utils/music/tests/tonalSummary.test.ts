// Sprint 10B — Tonal Summary Layer Tests
// Run with: npx tsx src/utils/music/tests/tonalSummary.test.ts

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
// Caso 1 — Pop Diatônico Simples (C -> Am -> Dm -> G -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Diatônico Simples (Cmaj7 -> Am7 -> Dm7 -> G7 -> Cmaj7)');
{
  const analysis = analyzeProgression(['Cmaj7', 'Am7', 'Dm7', 'G7', 'Cmaj7']);
  
  assert(analysis.summary !== undefined, 'summary is defined');
  if (analysis.summary) {
    const s = analysis.summary;
    assert(s.homeKey.root === 'C' && s.homeKey.mode === 'MAJOR', 'Home key is C MAJOR');
    assert(s.modulationCount === 0, `modulationCount is 0 (got ${s.modulationCount})`);
    assert(s.tonicizationCount === 0, `tonicizationCount is 0 (got ${s.tonicizationCount})`);
    assert(s.deepestNestingLevel === 0, `deepestNestingLevel is 0 (got ${s.deepestNestingLevel})`);
    
    // Devem haver zero acordes não diatônicos
    assert(s.chromaticChordCount === 0, `chromaticChordCount is 0 (got ${s.chromaticChordCount})`);
    
    // Apenas C MAJOR deve ter sido visitado
    assert(s.visitedKeys.length === 1, `visitedKeys contains exactly 1 key (got ${s.visitedKeys.length})`);
    assert(s.visitedKeys[0].root === 'C' && s.visitedKeys[0].mode === 'MAJOR', 'Visited key is C MAJOR');
    
    // Complexidade deve ser muito baixa (pop simples diatônico)
    assert(s.tonalComplexity < 0.15, `tonalComplexity is low: ${s.tonalComplexity}`);
    
    // Estabilidade deve ser máxima
    assert(s.tonalStability > 0.90, `tonalStability is high: ${s.tonalStability}`);
    
    // Contagem de cadências diatônicas
    assert(s.cadenceCount > 0, `cadenceCount is non-zero (got ${s.cadenceCount})`);
    assert(s.resolvedCadenceCount > 0, `resolvedCadenceCount is non-zero (got ${s.resolvedCadenceCount})`);
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 2 — Jazz Modulante (Cmaj7 -> A7 -> Dm7 -> G7 -> Cmaj7 -> E7 -> Am7 -> D7 -> Gmaj7)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Jazz Modulante com Modulação e Tonicizações');
{
  const analysis = analyzeProgression([
    'Cmaj7', 'A7', 'Dm7', 'G7', 'Cmaj7', 'E7', 'Am7', 'D7', 'Gmaj7'
  ]);
  
  assert(analysis.summary !== undefined, 'summary is defined');
  if (analysis.summary) {
    const s = analysis.summary;
    assert(s.homeKey.root === 'C' && s.homeKey.mode === 'MAJOR', 'Home key is C MAJOR');
    
    // Am7 -> D7 -> Gmaj7 estabelece modulação estrutural para G Major (ou Am7 dependendo de Viterbi, vamos verificar os visitados)
    assert(s.visitedKeys.length >= 2, `Visited at least 2 keys (got ${s.visitedKeys.length})`);
    
    // A7 e E7 são dominantes secundários/modulantes, portanto temos acordes não-diatônicos
    assert(s.chromaticChordCount >= 2, `chromaticChordCount is at least 2 (got ${s.chromaticChordCount})`);
    
    // Funções secundárias
    assert(s.secondaryFunctionCount >= 2, `secondaryFunctionCount is at least 2 (got ${s.secondaryFunctionCount})`);
    
    // Complexidade deve ser intermediária para alta por conta de desvios, aninhamento e não-diatonicidade
    assert(s.tonalComplexity > 0.20, `tonalComplexity is intermediate/high: ${s.tonalComplexity}`);
    
    // Estabilidade deve ser menor do que a da progressão puramente diatônica
    assert(s.tonalStability < 0.90, `tonalStability is reduced: ${s.tonalStability}`);
    
    console.log('  📊 Valores Obtidos no Jazz Modulante:');
    console.log(`     • Visited Keys: ${s.visitedKeys.map(k => `${k.root} ${k.mode}`).join(', ')}`);
    console.log(`     • Modulações: ${s.modulationCount}, Tonicizações: ${s.tonicizationCount}`);
    console.log(`     • Profundidade Árvore: ${s.deepestNestingLevel}`);
    console.log(`     • Complexidade Tonal: ${s.tonalComplexity}`);
    console.log(`     • Estabilidade Tonal: ${s.tonalStability}`);
    console.log(`     • Acordes Cromáticos: ${s.chromaticChordCount}`);
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
