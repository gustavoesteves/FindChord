// Sprint 8B — Global Harmonic Path Resolver Tests
// Run with: npx tsx src/utils/music/tests/globalPath.test.ts

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
// Test 1 — Diminished Ambiguity (C -> C#dim7 -> Dm7 -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 1 — Diminished Ambiguity (C -> C#dim7 -> Dm7 -> G7 -> C)');
{
  const a = analyzeProgression(['Cmaj7', 'C#dim7', 'Dm7', 'G7', 'Cmaj7']);
  const cSharp = a.chords[1];

  assert(a.globalPath !== undefined, 'globalPath is defined in output DTO');
  if (a.globalPath) {
    assert(typeof a.globalPath.totalScore === 'number', `totalScore is number, got ${a.globalPath.totalScore}`);
    assert(typeof a.globalPath.localScore === 'number', `localScore is number, got ${a.globalPath.localScore}`);
    assert(typeof a.globalPath.transitionScore === 'number', `transitionScore is number, got ${a.globalPath.transitionScore}`);
    assert(a.globalPath.explanations.length > 0, 'explanations are populated');
  }

  // Without Viterbi, SECONDARY_LEADING_TONE and PASSING_DIMINISHED tied at 0.95.
  // With Viterbi, SECONDARY_LEADING_TONE (vii°7/ii) resolves perfectly to Dm7 (ii), receiving target resolution bonus.
  // PASSING_DIMINISHED (target next = Dm7) also has target but SLT -> PRIMARY base transition (1.25) is higher than PASSING_DIMINISHED -> PRIMARY (1.10).
  // Thus, SECONDARY_LEADING_TONE wins.
  assert(cSharp.contextualFunction === 'SECONDARY_LEADING_TONE', `C#dim7 winner is SECONDARY_LEADING_TONE, got ${cSharp.contextualFunction}`);
  assert(cSharp.romanNumeral === 'vii°7/ii', `C#dim7 romanNumeral is vii°7/ii, got ${cSharp.romanNumeral}`);
}

// ═══════════════════════════════════════════════════════════
// Test 2 — Chained Dominants (E7 -> A7 -> D7 -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 2 — Chained Dominants (E7 -> A7 -> D7 -> G7 -> C)');
{
  const a = analyzeProgression(['E7', 'A7', 'D7', 'G7', 'Cmaj7']);

  const e7 = a.chords[0];
  const a7 = a.chords[1];
  const d7 = a.chords[2];
  const g7 = a.chords[3];

  assert(e7.contextualFunction === 'SECONDARY_DOMINANT', `E7 is SECONDARY_DOMINANT, got ${e7.contextualFunction}`);
  assert(e7.romanNumeral === 'V7/vi', `E7 romanNumeral is V7/vi, got ${e7.romanNumeral}`); // Resolves to A7 (vi relative to C, or target V7/ii)

  assert(a7.contextualFunction === 'SECONDARY_DOMINANT', `A7 is SECONDARY_DOMINANT, got ${a7.contextualFunction}`);
  assert(a7.romanNumeral === 'V7/ii', `A7 romanNumeral is V7/ii, got ${a7.romanNumeral}`); // Resolves to D7

  assert(d7.contextualFunction === 'SECONDARY_DOMINANT', `D7 is SECONDARY_DOMINANT, got ${d7.contextualFunction}`);
  assert(d7.romanNumeral === 'V7/V', `D7 romanNumeral is V7/V, got ${d7.romanNumeral}`); // Resolves to G7

  assert(g7.contextualFunction === 'PRIMARY', `G7 is PRIMARY (diatonic V7), got ${g7.contextualFunction}`);
}

// ═══════════════════════════════════════════════════════════
// Test 3 — Deviation Resilience (C -> C#dim7 -> Dm7 -> Fmaj7 -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 3 — Deviation Resilience (C -> C#dim7 -> Dm7 -> Fmaj7 -> G7 -> C)');
{
  const a = analyzeProgression(['Cmaj7', 'C#dim7', 'Dm7', 'Fmaj7', 'G7', 'Cmaj7']);
  const cSharp = a.chords[1];
  const fmaj7 = a.chords[3];

  assert(cSharp.contextualFunction === 'SECONDARY_LEADING_TONE', `C#dim7 resolves correctly as SECONDARY_LEADING_TONE, got ${cSharp.contextualFunction}`);
  assert(fmaj7.contextualFunction === 'PRIMARY', `Fmaj7 resolves correctly as PRIMARY, got ${fmaj7.contextualFunction}`);
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
