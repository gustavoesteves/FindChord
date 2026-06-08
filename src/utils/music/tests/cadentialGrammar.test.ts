// Sprint F7 — Cadential Grammar Engine Tests
// Run with: npx tsx src/utils/music/tests/cadentialGrammar.test.ts

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

console.log('🎼 Cadential Grammar Engine Tests');

// ═══════════════════════════════════════════════════════════
// Caso 1 — Authentic Cadence (ii -> V7 -> I)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — ii -> V7 -> I (Strong Authentic Resolved)');
{
  const a = analyzeProgression(['Dm7', 'G7', 'Cmaj7']);
  const cad = a.cadences?.find(c => c.type === 'AUTHENTIC' && c.resolution.status === 'RESOLVED');
  assert(cad !== undefined, 'Authentic Resolved cadence detected');
  if (cad) {
    assert(cad.strength === 'STRONG', `Strength is STRONG (got ${cad.strength})`);
    assert(cad.cadentialWeight >= 0.90 && cad.cadentialWeight <= 1.0, `Weight is high: ${cad.cadentialWeight}`);
    assert(cad.resolution.explanation.length > 0, 'Explanation trace populated');
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 2 — Half Cadence (I -> V)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — I -> V (Half Cadence)');
{
  const a = analyzeProgression(['Cmaj7', 'G7']);
  const cad = a.cadences?.find(c => c.type === 'HALF');
  assert(cad !== undefined, 'Half cadence detected');
  if (cad) {
    assert(cad.resolution.status === 'INTERRUPTED', 'Status is INTERRUPTED');
    assert(cad.strength === 'MODERATE' || cad.strength === 'WEAK', `Strength is appropriate: ${cad.strength}`);
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Phrygian Cadence (iv -> V)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — iv -> V in minor (Phrygian Cadence)');
{
  const a = analyzeProgression(['Am7', 'Dm7', 'E7']);
  const cad = a.cadences?.find(c => c.type === 'PHRYGIAN');
  assert(cad !== undefined, 'Phrygian cadence detected');
  if (cad) {
    assert(cad.resolution.status === 'INTERRUPTED', 'Status is INTERRUPTED');
    assert(cad.strength === 'MODERATE', `Strength is MODERATE (got ${cad.strength})`);
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 4 — Deceptive Cadence (V7 -> vi)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 4 — V7 -> vi (Deceptive Resolution)');
{
  const a = analyzeProgression(['Cmaj7', 'G7', 'Am7']);
  const cad = a.cadences?.find(c => c.type === 'AUTHENTIC' && c.resolution.status === 'DECEPTIVE');
  assert(cad !== undefined, 'Authentic Deceptive cadence detected');
  if (cad) {
    assert(cad.strength === 'MODERATE' || cad.strength === 'WEAK', `Strength is appropriate: ${cad.strength}`);
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 5 — Evaded Cadence (V7 -> bIImaj7)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 5 — V7 -> bIImaj7 (Evaded Resolution)');
{
  const a = analyzeProgression(['Cmaj7', 'G7', 'Dbmaj7']);
  const cad = a.cadences?.find(c => c.type === 'AUTHENTIC' && c.resolution.status === 'EVADED');
  assert(cad !== undefined, 'Authentic Evaded cadence detected');
  if (cad) {
    assert(cad.strength === 'WEAK', `Strength is WEAK (got ${cad.strength})`);
  }
}

// ═══════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(50)}`);
console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'═'.repeat(50)}\n`);

if (failed > 0) {
  throw new Error(`${failed} tests failed!`);
}
