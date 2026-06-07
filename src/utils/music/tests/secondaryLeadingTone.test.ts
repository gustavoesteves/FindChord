// Sprint 7B — Secondary Leading-Tone Tests
// Run with: npx tsx src/utils/music/tests/secondaryLeadingTone.test.ts

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
// Test 1 — Diatonic Resolution (C -> C#dim7 -> Dm7 -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 1 — Diatonic Resolution (C -> C#dim7 -> Dm7)');
{
  const a = analyzeProgression(['Cmaj7', 'C#dim7', 'Dm7', 'G7', 'Cmaj7']);
  assert(a.tonalCenter.root === 'C', 'Key is C');

  const cSharp = a.chords[1];
  assert(cSharp.chordSymbol === 'C#dim7', 'Found C#dim7');
  assert(cSharp.secondary?.contextualFunction === 'SECONDARY_LEADING_TONE', 'contextualFunction is SECONDARY_LEADING_TONE');
  assert(cSharp.romanNumeral === 'vii°7/ii', `Roman numeral is vii°7/ii, got ${cSharp.romanNumeral}`);
  assert(cSharp.secondary?.secondaryTarget === 'ii', 'secondaryTarget is ii');
  assert(cSharp.confidence === 0.95, 'Confidence is 0.95');
}

// ═══════════════════════════════════════════════════════════
// Test 2 — Half-Diminished Resolution (C -> C#m7(b5) -> Dm7 -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 2 — Half-Diminished Resolution (C -> C#m7(b5) -> Dm7)');
{
  const a = analyzeProgression(['Cmaj7', 'C#m7(b5)', 'Dm7', 'G7', 'Cmaj7']);
  const cSharp = a.chords[1];

  assert(cSharp.chordSymbol === 'C#m7(b5)', 'Found C#m7(b5)');
  assert(cSharp.secondary?.contextualFunction === 'SECONDARY_LEADING_TONE', 'contextualFunction is SECONDARY_LEADING_TONE');
  assert(cSharp.romanNumeral === 'viiø7/ii', `Roman numeral is viiø7/ii, got ${cSharp.romanNumeral}`);
  assert(cSharp.secondary?.secondaryTarget === 'ii', 'secondaryTarget is ii');
}

// ═══════════════════════════════════════════════════════════
// Test 3 — Precedência vs Chromatic Harmony
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 3 — Precedência vs Chromatic Harmony (C -> C#dim7 -> Dm7)');
{
  const a = analyzeProgression(['Cmaj7', 'C#dim7', 'Dm7', 'G7', 'Cmaj7']);
  const cSharp = a.chords[1];
 
  assert(cSharp.secondary?.contextualFunction === 'SECONDARY_LEADING_TONE', 'Classified as SECONDARY_LEADING_TONE');
  // Verify it is NOT classified as chromatic passing diminished
  assert(cSharp.modal?.chromaticAnalysis === undefined, 'chromaticAnalysis is undefined (overwritten/skipped by precedence)');
}

// ═══════════════════════════════════════════════════════════
// Test 4 — Lookahead Resolution com Inversão (C#dim7 -> Dm/A -> Dm -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 4 — Lookahead Resolution com Inversão (C#dim7 -> Dm/A -> Dm)');
{
  const a = analyzeProgression(['Cmaj7', 'C#dim7', 'Dm/A', 'Dm', 'G7', 'Cmaj7']);
  const cSharp = a.chords[1];
 
  assert(cSharp.secondary?.contextualFunction === 'SECONDARY_LEADING_TONE', 'Found SECONDARY_LEADING_TONE with inversion target');
  assert(cSharp.romanNumeral === 'vii°7/ii', `Roman numeral resolves to root degree: vii°7/ii, got ${cSharp.romanNumeral}`);
}

// ═══════════════════════════════════════════════════════════
// Test 5 — Lookahead Ambiguity (C#dim7 -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 5 — Lookahead Ambiguity (C#dim7 -> G7 -> C)');
{
  const a = analyzeProgression(['C#dim7', 'G7', 'Cmaj7']);
  const cSharp = a.chords[0];

  // In C#dim7 -> G7 -> Cmaj7, G7 has no note resolving as leading tone from C#dim7.
  // Therefore, cSharp should NOT be marked as SECONDARY_LEADING_TONE.
  // It falls back to chromatic harmony, resolving as a neighbor diminished to Cmaj7.
  assert(cSharp.modal?.contextualFunction === 'NEIGHBOR_DIMINISHED', `contextualFunction is NEIGHBOR_DIMINISHED, got ${cSharp.modal?.contextualFunction}`);
}

// ═══════════════════════════════════════════════════════════
// Test 6 — Diminished Symmetry (B°7 -> Cmaj7 and D°7 -> Ebmaj7)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 6 — Diminished Symmetry (B°7 -> Cmaj7 and D°7 -> Ebmaj7)');
{
  // 6.1 B°7 -> Cmaj7 in C Major (resolves to C, B is the leading tone)
  const a1 = analyzeProgression(['Bdim7', 'Cmaj7', 'Fmaj7', 'G7', 'Cmaj7']);
  const bDim = a1.chords[0];
  assert(bDim.secondary?.contextualFunction === 'SECONDARY_LEADING_TONE', 'Bdim7 is SECONDARY_LEADING_TONE');
  assert(bDim.romanNumeral === 'vii°7/I', `Bdim7 romanNumeral is vii°7/I, got ${bDim.romanNumeral}`);
 
  // 6.2 D°7 -> Ebmaj7 in C Minor (resolves to Eb, D is the leading tone)
  const a2 = analyzeProgression(['Cm', 'Ddim7', 'Ebmaj7', 'Ab', 'G7', 'Cm']);
  const dDim = a2.chords[1];
  assert(dDim.secondary?.contextualFunction === 'SECONDARY_LEADING_TONE', 'Ddim7 is SECONDARY_LEADING_TONE');
  assert(dDim.romanNumeral === 'vii°7/bIII', `Ddim7 romanNumeral is vii°7/bIII, got ${dDim.romanNumeral}`);
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
