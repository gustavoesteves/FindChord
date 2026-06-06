// Sprint 6F — Advanced Chromatic Harmony Tests
// Run with: npx tsx src/utils/music/tests/chromaticAnalysis.test.ts

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
// Test 1 — Passing Diminished (Cmaj7 -> Bbdim7 -> Am7 -> G7 -> Cmaj7)
console.log('\n🎵 Test 1 — Passing Diminished (Cmaj7 -> Bbdim7 -> Am7)');
{
  const a = analyzeProgression(['Cmaj7', 'Bbdim7', 'Am7', 'G7', 'Cmaj7']);
  assert(a.tonalCenter.root === 'C', 'Key is C');
  
  const bbDim = a.chords[1];
  assert(bbDim.chordSymbol === 'Bbdim7', 'Found Bbdim7');
  assert(bbDim.contextualFunction === 'PASSING_DIMINISHED', `contextualFunction is PASSING_DIMINISHED, got ${bbDim.contextualFunction}`);
  if (bbDim.chromaticAnalysis) {
    assert(bbDim.chromaticAnalysis.type === 'PASSING_DIMINISHED', 'Type is PASSING_DIMINISHED');
    assert(bbDim.romanNumeral === 'bvii°7', 'Roman Numeral is formatted to bvii°7', `got ${bbDim.romanNumeral}`);
    assert(bbDim.confidence === 0.95, 'Confidence is 0.95');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 2 — Passing Diminished Descending (Fmaj7 -> Edim7 -> Dm7)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 2 — Passing Diminished Descending (Fmaj7 -> Edim7 -> Dm7)');
{
  const a = analyzeProgression(['Cmaj7', 'Fmaj7', 'Edim7', 'Dm7', 'G7']);
  assert(a.tonalCenter.root === 'C', 'Key is C');
  
  const eDim = a.chords[2];
  assert(eDim.chordSymbol === 'Edim7', 'Found Edim7');
  assert(eDim.contextualFunction === 'PASSING_DIMINISHED', `contextualFunction is PASSING_DIMINISHED, got ${eDim.contextualFunction}`);
  if (eDim.chromaticAnalysis) {
    assert(eDim.chromaticAnalysis.type === 'PASSING_DIMINISHED', 'Type is PASSING_DIMINISHED');
    assert(eDim.romanNumeral === 'vii°7', 'Roman Numeral is vii°7 (leading-tone/passing to Dm7)', `got ${eDim.romanNumeral}`);
    assert(eDim.confidence === 0.95, 'Confidence is 0.95');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 3 — Common-Tone & Neighbor Diminished (Cdim7 and C#dim7 resolving to C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 3 — Common-Tone & Neighbor Diminished (Cdim7 and C#dim7)');
{
  // Cdim7 (offset 0)
  const aCdim = analyzeProgression(['Cmaj7', 'Cdim7', 'Cmaj7']);
  const cDim = aCdim.chords[1];
  assert(cDim.chordSymbol === 'Cdim7', 'Found Cdim7');
  assert(cDim.contextualFunction === 'COMMON_TONE_DIMINISHED', `Cdim7 function is COMMON_TONE_DIMINISHED, got ${cDim.contextualFunction}`);
  if (cDim.chromaticAnalysis) {
    assert(cDim.chromaticAnalysis.type === 'COMMON_TONE_DIMINISHED', 'Cdim7 type is COMMON_TONE_DIMINISHED');
    assert(cDim.romanNumeral === 'I°7', 'Cdim7 romanNumeral is I°7', `got ${cDim.romanNumeral}`);
    assert(cDim.confidence === 0.90, 'Cdim7 confidence is 0.90');
  }

  // C#dim7 (offset 1)
  const aCSharp = analyzeProgression(['Cmaj7', 'C#dim7', 'Cmaj7']);
  const cSharp = aCSharp.chords[1];
  assert(cSharp.chordSymbol === 'C#dim7', 'Found C#dim7');
  assert(cSharp.contextualFunction === 'NEIGHBOR_DIMINISHED', `C#dim7 function is NEIGHBOR_DIMINISHED, got ${cSharp.contextualFunction}`);
  if (cSharp.chromaticAnalysis) {
    assert(cSharp.chromaticAnalysis.type === 'NEIGHBOR_DIMINISHED', 'C#dim7 type is NEIGHBOR_DIMINISHED');
    assert(cSharp.romanNumeral === '#I°7', 'C#dim7 romanNumeral is #I°7', `got ${cSharp.romanNumeral}`);
    assert(cSharp.confidence === 0.90, 'C#dim7 confidence is 0.90');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 4 — Chromatic Approach (F#maj7 -> Fmaj7)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 4 — Chromatic Approach (F#maj7 -> Fmaj7)');
{
  const a = analyzeProgression(['Cmaj7', 'F#maj7', 'Fmaj7', 'Cmaj7']);
  const fSharp = a.chords[1];
  assert(fSharp.chordSymbol === 'F#maj7', 'Found F#maj7');
  assert(fSharp.contextualFunction === 'CHROMATIC_APPROACH', 'contextualFunction is CHROMATIC_APPROACH');
  if (fSharp.chromaticAnalysis) {
    assert(fSharp.chromaticAnalysis.type === 'CHROMATIC_APPROACH', 'Type is CHROMATIC_APPROACH');
    assert(fSharp.romanNumeral === 'bVmaj7' || fSharp.romanNumeral === '#IVmaj7', 'Roman numeral kept functional', `got ${fSharp.romanNumeral}`);
    assert(fSharp.confidence === 0.85, 'Confidence is 0.85');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 5 — Precedência Tritone Substitution vs Chromatic Approach
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 5 — Tritone Substitution Precedence (Db7 -> Cmaj7)');
{
  const a = analyzeProgression(['Cmaj7', 'Db7', 'Cmaj7']);
  const db7 = a.chords[1];
  assert(db7.chordSymbol === 'Db7', 'Found Db7');
  assert(db7.contextualFunction === 'TRITONE_SUBSTITUTION', 'Db7 is TRITONE_SUBSTITUTION');
  assert(db7.chromaticAnalysis === undefined, 'Db7 chromaticAnalysis is undefined');
}

// ═══════════════════════════════════════════════════════════
// Test 6 — Precedência Modal Borrowing vs Chromatic Approach
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 6 — Modal Borrowing Precedence (Dbmaj7 -> Cmaj7)');
{
  const a = analyzeProgression(['Cmaj7', 'Dbmaj7', 'Cmaj7']);
  const dbmaj7 = a.chords[1];
  assert(dbmaj7.chordSymbol === 'Dbmaj7', 'Found Dbmaj7');
  assert(dbmaj7.contextualFunction === 'MODAL_BORROWING', 'Dbmaj7 is MODAL_BORROWING');
  assert(dbmaj7.chromaticAnalysis === undefined, 'Dbmaj7 chromaticAnalysis is undefined');
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
