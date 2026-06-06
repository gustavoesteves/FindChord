// Sprint 7C — Explanatory DTO & Regression Tests
// Run with: npx tsx src/utils/music/tests/explanatoryDto.test.ts

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
// Test 1 — Lookahead Candidate Resolutions Logging
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 1 — Lookahead Candidate Resolutions');
{
  const a = analyzeProgression(['Cmaj7', 'C#dim7', 'Dm7', 'G7', 'Cmaj7']);
  const cSharp = a.chords[1];

  assert(cSharp.candidateResolutions !== undefined, 'candidateResolutions is populated');
  if (cSharp.candidateResolutions) {
    assert(cSharp.candidateResolutions.length >= 2, `Has at least 2 candidates, got ${cSharp.candidateResolutions.length}`);
    
    // Check that Dm7 and G7 resolutions are evaluated in candidates
    const hasDm7 = cSharp.candidateResolutions.some(c => c.targetChordIndex === 2);
    const hasG7 = cSharp.candidateResolutions.some(c => c.targetChordIndex === 3);
    assert(hasDm7, 'Evaluated Dm7 target in lookahead');
    assert(hasG7, 'Evaluated G7 target in lookahead');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 2 — Pedagogical Explanations
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 2 — Pedagogical Explanations');
{
  const a = analyzeProgression(['Cmaj7', 'A7', 'Dm7', 'G7', 'Cmaj7']);
  
  // Secondary Dominant A7
  const a7 = a.chords[1];
  assert(a7.explanation !== undefined, 'A7 has explanations');
  if (a7.explanation) {
    assert(a7.explanation.some(e => e.includes('Secondary dominant')), `Secondary dominant explanation exists, got: ${JSON.stringify(a7.explanation)}`);
  }

  // Primary / Diatonic Cmaj7 (now has a primary explanation under the new Viterbi path resolver)
  const cMaj = a.chords[0];
  assert(
    cMaj.explanation !== undefined && cMaj.explanation.includes('Diatonic chord in this key center'),
    'Primary chord has diatonic explanation by default',
    `got: ${JSON.stringify(cMaj.explanation)}`
  );
}

// ═══════════════════════════════════════════════════════════
// Test 3 — Regression Caso A (C -> C#°7 -> Dm7)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 3 — Caso A (C -> C#°7 -> Dm7)');
{
  const a = analyzeProgression(['Cmaj7', 'C#dim7', 'Dm7', 'G7', 'Cmaj7']);
  const cSharp = a.chords[1];
  
  assert(cSharp.contextualFunction === 'SECONDARY_LEADING_TONE', `C#dim7 function is SECONDARY_LEADING_TONE, got ${cSharp.contextualFunction}`);
  assert(cSharp.romanNumeral === 'vii°7/ii', `Roman numeral is vii°7/ii, got ${cSharp.romanNumeral}`);
  if (cSharp.explanation) {
    assert(cSharp.explanation.some(e => e.includes('secondary leading-tone')), 'Explanation mentions leading tone');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 4 — Regression Caso B (C -> C#°7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 4 — Caso B (C -> C#°7 -> C)');
{
  const a = analyzeProgression(['Cmaj7', 'C#dim7', 'Cmaj7']);
  const cSharp = a.chords[1];

  assert(cSharp.contextualFunction === 'NEIGHBOR_DIMINISHED', `C#dim7 function is NEIGHBOR_DIMINISHED, got ${cSharp.contextualFunction}`);
  assert(cSharp.romanNumeral === '#I°7', `Roman numeral is #I°7, got ${cSharp.romanNumeral}`);
  if (cSharp.explanation) {
    assert(cSharp.explanation.some(e => e.includes('Neighbor diminished')), 'Explanation mentions Neighbor diminished');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 5 — Regression Caso C (C -> C#°7 -> D7)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 5 — Caso C (C -> C#°7 -> D7)');
{
  // We add G7 at the end to help establish the key as C Major and resolve D7 functionally
  const a = analyzeProgression(['Cmaj7', 'C#dim7', 'D7', 'G7', 'Cmaj7']);
  const cSharp = a.chords[1];

  assert(cSharp.contextualFunction === 'SECONDARY_LEADING_TONE', `C#dim7 function is SECONDARY_LEADING_TONE, got ${cSharp.contextualFunction}`);
  assert(cSharp.romanNumeral === 'vii°7/ii', `Roman numeral resolves to root degree: vii°7/ii, got ${cSharp.romanNumeral}`);
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
