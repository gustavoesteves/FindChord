// Sprint 11 — Regional Transition Solver & Key Relation Tests
// Run with: npx tsx src/utils/music/tests/regionalTransitions.test.ts

import { analyzeProgression } from '../analysis/functionalAnalysis';
import { getKeyRelation } from '../analysis/pathResolver';
import type { TonalCenter } from '../analysis/models/FunctionalAnalysis';

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

// Helper para criar mock de TonalCenter
function makeMockCenter(root: string, mode: 'MAJOR' | 'MINOR'): TonalCenter {
  return { root, mode, confidence: 1.0 };
}

// ═══════════════════════════════════════════════════════════
// Caso 1 — Classificação de Relações de Modulação (KeyRelation)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Classificação de Relações de Modulação (KeyRelation)');
{
  const cMaj = makeMockCenter('C', 'MAJOR');
  const aMin = makeMockCenter('A', 'MINOR');
  const cMin = makeMockCenter('C', 'MINOR');
  const gMaj = makeMockCenter('G', 'MAJOR');
  const fMaj = makeMockCenter('F', 'MAJOR');
  const eMin = makeMockCenter('E', 'MINOR');
  const eMaj = makeMockCenter('E', 'MAJOR');
  const fSharpMaj = makeMockCenter('F#', 'MAJOR');
  const dMaj = makeMockCenter('D', 'MAJOR');

  assert(getKeyRelation(cMaj, aMin) === 'RELATIVE', 'C Major -> A Minor is RELATIVE');
  assert(getKeyRelation(aMin, cMaj) === 'RELATIVE', 'A Minor -> C Major is RELATIVE');
  assert(getKeyRelation(cMaj, cMin) === 'PARALLEL', 'C Major -> C Minor is PARALLEL');
  assert(getKeyRelation(cMaj, gMaj) === 'DOMINANT', 'C Major -> G Major is DOMINANT');
  assert(getKeyRelation(cMaj, fMaj) === 'SUBDOMINANT', 'C Major -> F Major is SUBDOMINANT');
  assert(getKeyRelation(cMaj, eMin) === 'MEDIANT', 'C Major -> E Minor (iii) is MEDIANT');
  assert(getKeyRelation(cMaj, eMaj) === 'CHROMATIC_MEDIANT', 'C Major -> E Major (III) is CHROMATIC_MEDIANT');
  assert(getKeyRelation(cMaj, fSharpMaj) === 'TRITONE', 'C Major -> F# Major is TRITONE');
  assert(getKeyRelation(cMaj, dMaj) === 'DISTANT', 'C Major -> D Major is DISTANT');
}

// ═══════════════════════════════════════════════════════════
// Caso 2 — Perfil de Modulação Viterbi (Diferenciação Estilística)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Perfil de Modulação Viterbi (COMMON_PRACTICE vs CHROMATIC_FUNCTIONAL)');
{
  // Cmaj7 -> F#maj7 -> F#7 -> Bmaj7 (modula para B ou F#)
  const progression = ['Cmaj7', 'F#maj7', 'F#7', 'Bmaj7'];

  // Sob COMMON_PRACTICE, modulações distantes são pesadamente penalizadas, então o solver
  // deve preferir interpretar tudo sob a Home Key C Major (ou evitar saltar para F# diretamente)
  const aCommon = analyzeProgression(progression, 'COMMON_PRACTICE');
  
  // Sob CHROMATIC_FUNCTIONAL, há maior tolerância para caminhos cromáticos distantes.
  const aChromatic = analyzeProgression(progression, 'CHROMATIC_FUNCTIONAL');

  console.log(`     • COMMON_PRACTICE Visitados: ${aCommon.summary?.visitedKeys.map(k => `${k.root} ${k.mode}`).join(', ')}`);
  console.log(`     • CHROMATIC_FUNCTIONAL Visitados: ${aChromatic.summary?.visitedKeys.map(k => `${k.root} ${k.mode}`).join(', ')}`);

  // O comportamento esperado é que CHROMATIC_FUNCTIONAL seja mais aceitável a chaves distantes
  assert(aCommon.summary !== undefined && aChromatic.summary !== undefined, 'Summaries are defined');
  if (aCommon.summary && aChromatic.summary) {
    // A coerência da transição distante sob CHROMATIC_FUNCTIONAL é maior do que em COMMON_PRACTICE
    assert(aCommon.summary.tonalStability >= aChromatic.summary.tonalStability, 'Common practice is more stable (stays in key/fewer jumps)');
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Regional Coherence Score & Transition Count
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Coherence Score e Transition Count (C -> Am -> C)');
{
  const progression = ['Cmaj7', 'Dm7', 'G7', 'Cmaj7', 'Bm7(b5)', 'E7', 'Am7', 'Dm7', 'G7', 'Cmaj7'];
  const analysis = analyzeProgression(progression, 'COMMON_PRACTICE');

  assert(analysis.summary !== undefined, 'Summary is defined');
  if (analysis.summary) {
    const s = analysis.summary;
    
    // C Major -> A Minor -> C Major = 2 transições regionais
    assert(s.regionalTransitionCount === 2, `regionalTransitionCount is 2 (got ${s.regionalTransitionCount})`);
    
    // Relações devem ser RELATIVE nas duas modulações
    assert(s.keyModulationRelations.length === 2, `2 relations registered (got ${s.keyModulationRelations.length})`);
    if (s.keyModulationRelations.length === 2) {
      assert(s.keyModulationRelations[0] === 'RELATIVE', 'First transition is RELATIVE');
      assert(s.keyModulationRelations[1] === 'RELATIVE', 'Second transition is RELATIVE');
    }

    // Coerência regional deve ser alta pois C <-> Am é uma relação próxima (multiplier 0.80)
    assert(s.regionalCoherenceScore === 0.80, `regionalCoherenceScore is 0.80 (got ${s.regionalCoherenceScore})`);
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
