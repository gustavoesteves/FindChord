// Sprint 6B — Harmonic Field Logic Tests
// Run with: npx tsx src/utils/music/tests/harmonicField.test.ts

import { generateHarmonicField } from '../analysis/harmonicField';

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
// Test 1 — C MAJOR Field (Triad and Tetrad formats)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 1 — C MAJOR Diatonic Field');
{
  const triads = generateHarmonicField('C', 'MAJOR', 'triad', 'natural', []);
  const tetrads = generateHarmonicField('C', 'MAJOR', 'tetrad', 'natural', []);

  assert(triads.length === 7, 'Triads length = 7');
  assert(tetrads.length === 7, 'Tetrads length = 7');

  // Verify Triads
  assert(triads[0].chordSymbol === 'C', 'I = C', `got ${triads[0].chordSymbol}`);
  assert(triads[1].chordSymbol === 'Dm', 'ii = Dm', `got ${triads[1].chordSymbol}`);
  assert(triads[4].chordSymbol === 'G', 'V = G', `got ${triads[4].chordSymbol}`);
  assert(triads[5].chordSymbol === 'Am', 'vi = Am', `got ${triads[5].chordSymbol}`);
  assert(triads[6].chordSymbol === 'Bdim', 'vii° = Bdim', `got ${triads[6].chordSymbol}`);

  // Verify Tetrads
  assert(tetrads[0].chordSymbol === 'Cmaj7', 'I = Cmaj7', `got ${tetrads[0].chordSymbol}`);
  assert(tetrads[1].chordSymbol === 'Dm7', 'ii = Dm7', `got ${tetrads[1].chordSymbol}`);
  assert(tetrads[4].chordSymbol === 'G7', 'V = G7', `got ${tetrads[4].chordSymbol}`);
  assert(tetrads[5].chordSymbol === 'Am7', 'vi = Am7', `got ${tetrads[5].chordSymbol}`);
  assert(tetrads[6].chordSymbol === 'Bm7b5', 'vii° = Bm7b5', `got ${tetrads[6].chordSymbol}`);
}

// ═══════════════════════════════════════════════════════════
// Test 2 — A MINOR Natural Field
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 2 — A MINOR Natural Field');
{
  const triads = generateHarmonicField('A', 'MINOR', 'triad', 'natural', []);
  const tetrads = generateHarmonicField('A', 'MINOR', 'tetrad', 'natural', []);

  assert(triads[0].chordSymbol === 'Am', 'i = Am', `got ${triads[0].chordSymbol}`);
  assert(triads[4].chordSymbol === 'Em', 'v = Em', `got ${triads[4].chordSymbol}`);
  assert(triads[6].chordSymbol === 'G', 'bVII = G', `got ${triads[6].chordSymbol}`);

  assert(tetrads[0].chordSymbol === 'Am7', 'i = Am7', `got ${tetrads[0].chordSymbol}`);
  assert(tetrads[4].chordSymbol === 'Em7', 'v = Em7', `got ${tetrads[4].chordSymbol}`);
  assert(tetrads[6].chordSymbol === 'G7', 'bVII = G7', `got ${tetrads[6].chordSymbol}`);
}

// ═══════════════════════════════════════════════════════════
// Test 3 — A MINOR Harmonic Field (User feedback test case)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 3 — A MINOR Harmonic Field (V7 and vii° dim7)');
{
  const triads = generateHarmonicField('A', 'MINOR', 'triad', 'harmonic', []);
  const tetrads = generateHarmonicField('A', 'MINOR', 'tetrad', 'harmonic', []);

  assert(triads[4].chordSymbol === 'E', 'V = E (major)', `got ${triads[4].chordSymbol}`);
  assert(triads[6].chordSymbol === 'G#dim', 'vii° = G#dim', `got ${triads[6].chordSymbol}`);
  assert(triads[2].chordSymbol === 'Caug', 'bIII+ = Caug', `got ${triads[2].chordSymbol}`);

  assert(tetrads[4].chordSymbol === 'E7', 'V = E7 (dominant)', `got ${tetrads[4].chordSymbol}`);
  assert(tetrads[6].chordSymbol === 'G#dim7', 'vii° = G#dim7 (diminished 7th)', `got ${tetrads[6].chordSymbol}`);
  assert(tetrads[2].chordSymbol === 'Cmaj7', 'bIII+ = Cmaj7 (substitute)', `got ${tetrads[2].chordSymbol}`);
}

// ═══════════════════════════════════════════════════════════
// Test 4 — Active Chord Highlighting (isActive)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 4 — Active chord highlighting (isActive)');
{
  // Progression contains 'Dm7' and 'G9' (dominant-type matching diatonic G7 V)
  const progression = ['Dm7', 'G9', 'C'];
  const fields = generateHarmonicField('C', 'MAJOR', 'tetrad', 'natural', progression);

  assert(fields[0].isActive === true, 'C is active (matches Cmaj7 root/type)', `got ${fields[0].isActive}`);
  assert(fields[1].isActive === true, 'Dm7 is active', `got ${fields[1].isActive}`);
  assert(fields[4].isActive === true, 'G7 is active (matches G9 dominant type)', `got ${fields[4].isActive}`);
  assert(fields[2].isActive === false, 'Em7 is NOT active', `got ${fields[2].isActive}`);
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
