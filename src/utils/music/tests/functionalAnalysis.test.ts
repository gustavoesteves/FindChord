// Sprint 6A — Functional Analysis Verification Tests
// Run with: npx tsx src/utils/music/tests/functionalAnalysis.test.ts

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
// Test 1 — Major key II-V-I
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 1 — Dm7 G7 Cmaj7 → C MAJOR');
{
  const a = analyzeProgression(['Dm7', 'G7', 'Cmaj7']);
  assert(a.tonalCenter.root === 'C', 'Key = C', `got ${a.tonalCenter.root}`);
  assert(a.tonalCenter.mode === 'MAJOR', 'Mode = MAJOR', `got ${a.tonalCenter.mode}`);
  assert(a.tonalCenter.confidence > 0.5, `Confidence > 0.5 (${a.tonalCenter.confidence})`);
  assert(a.chords[0].harmonicFunction === 'SUBDOMINANT', 'Dm7 = SD', `got ${a.chords[0].harmonicFunction}`);
  assert(a.chords[1].harmonicFunction === 'DOMINANT', 'G7 = D', `got ${a.chords[1].harmonicFunction}`);
  assert(a.chords[2].harmonicFunction === 'TONIC', 'Cmaj7 = T', `got ${a.chords[2].harmonicFunction}`);
  assert(a.chords[0].isDiatonic === true, 'Dm7 isDiatonic');
  assert(a.chords[1].isDiatonic === true, 'G7 isDiatonic');
  assert(a.chords[2].isDiatonic === true, 'Cmaj7 isDiatonic');
}

// ═══════════════════════════════════════════════════════════
// Test 2 — Minor key
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 2 — Am Dm E7 Am → A MINOR');
{
  const a = analyzeProgression(['Am', 'Dm', 'E7', 'Am']);
  assert(a.tonalCenter.root === 'A', 'Key = A', `got ${a.tonalCenter.root}`);
  assert(a.tonalCenter.mode === 'MINOR', 'Mode = MINOR', `got ${a.tonalCenter.mode}`);
  assert(a.chords[0].harmonicFunction === 'TONIC', 'Am = T', `got ${a.chords[0].harmonicFunction}`);
  assert(a.chords[1].harmonicFunction === 'SUBDOMINANT', 'Dm = SD', `got ${a.chords[1].harmonicFunction}`);
  assert(a.chords[2].harmonicFunction === 'DOMINANT', 'E7 = D', `got ${a.chords[2].harmonicFunction}`);
  assert(a.chords[3].harmonicFunction === 'TONIC', 'Am (last) = T', `got ${a.chords[3].harmonicFunction}`);
}

// ═══════════════════════════════════════════════════════════
// Test 3 — Non-diatonic chord
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 3 — Cmaj7 Db7 Cmaj7 → Db7 isDiatonic=false');
{
  const a = analyzeProgression(['Cmaj7', 'Db7', 'Cmaj7']);
  assert(a.tonalCenter.root === 'C', 'Key = C', `got ${a.tonalCenter.root}`);
  assert(a.chords[1].isDiatonic === false, 'Db7 isDiatonic = false', `got ${a.chords[1].isDiatonic}`);
  assert(a.chords[1].harmonicFunction === 'DOMINANT', 'Db7 function = DOMINANT (SubV)', `got ${a.chords[1].harmonicFunction}`);
}

// ═══════════════════════════════════════════════════════════
// Test 4 — Pop progression I-V-vi-IV
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 4 — C G Am F → C MAJOR, functions T-D-T-SD');
{
  const a = analyzeProgression(['C', 'G', 'Am', 'F']);
  assert(a.tonalCenter.root === 'C', 'Key = C', `got ${a.tonalCenter.root}`);
  assert(a.tonalCenter.mode === 'MAJOR', 'Mode = MAJOR', `got ${a.tonalCenter.mode}`);
  assert(a.chords[0].harmonicFunction === 'TONIC', 'C = T', `got ${a.chords[0].harmonicFunction}`);
  assert(a.chords[1].harmonicFunction === 'DOMINANT', 'G = D', `got ${a.chords[1].harmonicFunction}`);
  assert(a.chords[2].harmonicFunction === 'TONIC', 'Am = T', `got ${a.chords[2].harmonicFunction}`);
  assert(a.chords[3].harmonicFunction === 'SUBDOMINANT', 'F = SD', `got ${a.chords[3].harmonicFunction}`);
}

// ═══════════════════════════════════════════════════════════
// Test 5 — Ambiguity: Am7 Dm7 G7 Cmaj7 → C MAJOR
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 5 — Am7 Dm7 G7 Cmaj7 → C MAJOR (V7→I cadence is decisive)');
{
  const a = analyzeProgression(['Am7', 'Dm7', 'G7', 'Cmaj7']);
  assert(a.tonalCenter.root === 'C', 'Key = C', `got ${a.tonalCenter.root}`);
  assert(a.tonalCenter.mode === 'MAJOR', 'Mode = MAJOR', `got ${a.tonalCenter.mode}`);
}

// ═══════════════════════════════════════════════════════════
// Test 6 — Determinism
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 6 — Determinism');
{
  const prog = ['Dm7', 'G7', 'Cmaj7', 'Am7'];
  const a1 = analyzeProgression(prog);
  const a2 = analyzeProgression(prog);
  assert(
    JSON.stringify(a1) === JSON.stringify(a2),
    'Two consecutive calls produce identical results'
  );
}

// ═══════════════════════════════════════════════════════════
// Test 7 — Empty progression
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 7 — Empty progression → default');
{
  const a = analyzeProgression([]);
  assert(a.tonalCenter.root === 'C', 'Default key = C', `got ${a.tonalCenter.root}`);
  assert(a.tonalCenter.mode === 'MAJOR', 'Default mode = MAJOR', `got ${a.tonalCenter.mode}`);
  assert(a.tonalCenter.confidence === 0, 'Confidence = 0', `got ${a.tonalCenter.confidence}`);
  assert(a.chords.length === 0, 'No chords');
}

// ═══════════════════════════════════════════════════════════
// Test 8 — Minor vs Relative Major (critical disambiguation)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 8a — Am Dm E7 Am → A MINOR (V7→Im cadence)');
{
  const a = analyzeProgression(['Am', 'Dm', 'E7', 'Am']);
  assert(a.tonalCenter.root === 'A', 'Key = A', `got ${a.tonalCenter.root}`);
  assert(a.tonalCenter.mode === 'MINOR', 'Mode = MINOR', `got ${a.tonalCenter.mode}`);
}

console.log('\n🎵 Test 8b — Am Dm G7 C → C MAJOR (V7→I cadence)');
{
  const a = analyzeProgression(['Am', 'Dm', 'G7', 'C']);
  assert(a.tonalCenter.root === 'C', 'Key = C', `got ${a.tonalCenter.root}`);
  assert(a.tonalCenter.mode === 'MAJOR', 'Mode = MAJOR', `got ${a.tonalCenter.mode}`);
}

// ═══════════════════════════════════════════════════════════
// Test 9 — scaleDegree field
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 9 — scaleDegree field');
{
  const a = analyzeProgression(['Dm7', 'G7', 'Cmaj7']);
  assert(a.chords[0].scaleDegree === 'ii', `Dm7 scaleDegree = ii`, `got ${a.chords[0].scaleDegree}`);
  assert(a.chords[1].scaleDegree === 'V', `G7 scaleDegree = V`, `got ${a.chords[1].scaleDegree}`);
  assert(a.chords[2].scaleDegree === 'I', `Cmaj7 scaleDegree = I`, `got ${a.chords[2].scaleDegree}`);
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
