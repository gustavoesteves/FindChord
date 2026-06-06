// Sprint 9A — Modulation Tracking Tests
// Run with: npx tsx src/utils/music/tests/modulationTracking.test.ts

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
// Caso 1 — Diatonic Progression (No Modulation)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Diatonic Progression (Cmaj7 -> Am7 -> Dm7 -> G7 -> Cmaj7)');
{
  const a = analyzeProgression(['Cmaj7', 'Am7', 'Dm7', 'G7', 'Cmaj7']);
  
  assert(a.tonalCenter.root === 'C' && a.tonalCenter.mode === 'MAJOR', 'Overall Key = C MAJOR');
  
  const allInC = a.chords.every(c => c.tonalCenter?.root === 'C' && c.tonalCenter?.mode === 'MAJOR');
  assert(allInC, 'All chords resolved under C MAJOR tonal center');
  assert((a.globalPath?.modulations?.length ?? 0) === 0, 'No modulation events detected');
}

// ═══════════════════════════════════════════════════════════
// Caso 2 — Persistent Modulation (C -> Am -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Persistent Modulation (C -> Am -> C)');
{
  const a = analyzeProgression([
    'Cmaj7', 'Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Dm7', 'G7', 'Cmaj7',
    'Bm7(b5)', 'E7', 'Am7', 'Dm7', 'E7', 'Am7', 'Dm7', 'G7', 'Cmaj7'
  ]);

  const keys = a.chords.map(c => `${c.tonalCenter?.root} ${c.tonalCenter?.mode}`);
  console.log('  Resolved Keys sequence:', keys.join(' -> '));

  assert(keys[0] === 'C MAJOR', 'Starts in C MAJOR');
  
  // The cadence Bm7(b5) E7 Am7 should pull it into A MINOR
  const hasAm = keys.includes('A MINOR');
  assert(hasAm, 'Modulates to A MINOR at some point');

  // Dm7 G7 Cmaj7 should pull it back to C MAJOR
  assert(keys[keys.length - 1] === 'C MAJOR', 'Resolves back to C MAJOR at the end');

  const mods = a.globalPath?.modulations || [];
  console.log('  Detected Modulations:');
  mods.forEach(m => console.log(`    Index ${m.chordIndex}: ${m.from.root} ${m.from.mode} -> ${m.to.root} ${m.to.mode} (${m.reason})`));

  assert(mods.length >= 2, `At least 2 modulation events registered (got ${mods.length})`);
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Tonicization Prevention (A7 -> Dm7 in C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Tonicization Prevention (Cmaj7 -> Fmaj7 -> G7 -> Cmaj7 -> A7 -> Dm7 -> G7 -> Cmaj7)');
{
  const a = analyzeProgression(['Cmaj7', 'Fmaj7', 'G7', 'Cmaj7', 'A7', 'Dm7', 'G7', 'Cmaj7']);

  const keys = a.chords.map(c => `${c.tonalCenter?.root} ${c.tonalCenter?.mode}`);
  console.log('  Resolved Keys sequence:', keys.join(' -> '));

  const allInC = a.chords.every(c => c.tonalCenter?.root === 'C' && c.tonalCenter?.mode === 'MAJOR');
  assert(allInC, 'Remained in C MAJOR the whole progression, avoiding key-hopping for brief tonicization');
  
  const a7 = a.chords[4];
  assert(a7.contextualFunction === 'SECONDARY_DOMINANT', 'A7 resolved as SECONDARY_DOMINANT');
  assert(a7.romanNumeral === 'V7/ii', `A7 Roman numeral is V7/ii, got ${a7.romanNumeral}`);
}

// ═══════════════════════════════════════════════════════════
// Caso 4 — Modulation Event Structure
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 4 — Modulation Event Structure');
{
  const a = analyzeProgression([
    'Cmaj7', 'Dm7', 'G7', 'Cmaj7', 'Fmaj7', 'Dm7', 'G7', 'Cmaj7',
    'Bm7(b5)', 'E7', 'Am7', 'Dm7', 'E7', 'Am7', 'Dm7', 'G7', 'Cmaj7'
  ]);
  const mods = a.globalPath?.modulations || [];
  
  if (mods.length > 0) {
    const firstMod = mods[0];
    assert(typeof firstMod.chordIndex === 'number', 'chordIndex is a number');
    assert(typeof firstMod.from === 'object' && firstMod.from !== null, 'from TonalCenter is an object');
    assert(typeof firstMod.to === 'object' && firstMod.to !== null, 'to TonalCenter is an object');
    assert(typeof firstMod.confidence === 'number' && firstMod.confidence >= 0 && firstMod.confidence <= 1, 'confidence is a number between 0 and 1');
    assert(typeof firstMod.reason === 'string' && firstMod.reason.length > 0, 'reason is a non-empty string');
  } else {
    assert(false, 'No modulations detected for structure check');
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
