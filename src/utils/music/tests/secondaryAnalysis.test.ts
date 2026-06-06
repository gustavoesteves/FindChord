// Sprint 6C — Secondary Dominants & SubV7 Analysis Tests
// Run with: npx tsx src/utils/music/tests/secondaryAnalysis.test.ts

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
// Test 1 — Classic Secondary Dominant (V7/ii)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 1 — Classic Secondary Dominant (A7 -> Dm7)');
{
  const a = analyzeProgression(['Cmaj7', 'A7', 'Dm7', 'G7']);
  
  assert(a.tonalCenter.root === 'C', 'Key is C');
  assert(a.chords[1].chordSymbol === 'A7', 'A7 chord found');
  assert(a.chords[1].romanNumeral === 'V7/ii', 'A7 romanNumeral = V7/ii', `got ${a.chords[1].romanNumeral}`);
  assert(a.chords[1].harmonicFunction === 'DOMINANT', 'A7 harmonicFunction = DOMINANT');
  assert(a.chords[1].analysisTags.includes('SECONDARY_DOMINANT'), 'A7 has SECONDARY_DOMINANT tag');
  assert(a.chords[1].secondaryTarget === 'ii', 'A7 secondaryTarget = ii');
  assert(a.chords[1].confidence === 0.95, 'A7 confidence boosted to 0.95', `got ${a.chords[1].confidence}`);
  assert(a.chords[1].contextualAnalysis?.resolutionDistance === 1, 'A7 resolutionDistance = 1');
}

// ═══════════════════════════════════════════════════════════
// Test 2 — Lookahead Resolution (Distance 2)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 2 — Lookahead Resolution (A7 -> Fmaj7 -> Dm7)');
{
  const a = analyzeProgression(['Cmaj7', 'A7', 'Fmaj7', 'Dm7', 'G7']);
  
  assert(a.chords[1].chordSymbol === 'A7', 'A7 chord found');
  assert(a.chords[1].romanNumeral === 'V7/ii', 'A7 romanNumeral = V7/ii (resolves to Dm7 skipping Fmaj7)', `got ${a.chords[1].romanNumeral}`);
  assert(a.chords[1].analysisTags.includes('SECONDARY_DOMINANT'), 'A7 has SECONDARY_DOMINANT tag');
  assert(a.chords[1].contextualAnalysis?.resolutionDistance === 2, 'A7 resolutionDistance = 2');
}

// ═══════════════════════════════════════════════════════════
// Test 3 — Chained Dominants Resolution (Simplification)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 3 — Chained Dominants (E7 -> A7 -> D7 -> G7 -> C)');
{
  const a = analyzeProgression(['E7', 'A7', 'D7', 'G7', 'C']);
  
  assert(a.tonalCenter.root === 'C', 'Key is C');
  
  // E7 -> targets A7 (root A, diatonic root of vi). Resolved to V7/vi.
  assert(a.chords[0].romanNumeral === 'V7/vi', 'E7 = V7/vi', `got ${a.chords[0].romanNumeral}`);
  assert(a.chords[0].analysisTags.includes('SECONDARY_DOMINANT'), 'E7 has SECONDARY_DOMINANT tag');

  // A7 -> targets D7 (root D, diatonic root of ii). Resolved to V7/ii.
  assert(a.chords[1].romanNumeral === 'V7/ii', 'A7 = V7/ii', `got ${a.chords[1].romanNumeral}`);
  assert(a.chords[1].analysisTags.includes('SECONDARY_DOMINANT'), 'A7 has SECONDARY_DOMINANT tag');

  // D7 -> targets G7 (root G, diatonic root of V). Resolved to V7/V.
  assert(a.chords[2].romanNumeral === 'V7/V', 'D7 = V7/V', `got ${a.chords[2].romanNumeral}`);
  assert(a.chords[2].analysisTags.includes('SECONDARY_DOMINANT'), 'D7 has SECONDARY_DOMINANT tag');

  // G7 -> primary dominant (diatonic). No secondary tags.
  assert(a.chords[3].romanNumeral === 'V7', 'G7 = V7 (primary dominant)');
  assert(!a.chords[3].analysisTags.includes('SECONDARY_DOMINANT'), 'G7 does NOT have SECONDARY_DOMINANT tag');
}

// ═══════════════════════════════════════════════════════════
// Test 4 — SubV7 vs Major False Positive
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 4 — SubV7 vs Major quality check');
{
  // Dbmaj7 (major quality) should NOT resolve as Tritone Sub
  const aMajor = analyzeProgression(['Cmaj7', 'Dbmaj7', 'Cmaj7']);
  assert(aMajor.chords[1].romanNumeral !== 'subVmaj7/I', 'Dbmaj7 is not subV7/I', `got ${aMajor.chords[1].romanNumeral}`);
  assert(!aMajor.chords[1].analysisTags.includes('TRITONE_SUBSTITUTION'), 'Dbmaj7 has no tritone sub tag');

  // Db7 (dominant quality) SHOULD resolve as Tritone Sub
  const aDom = analyzeProgression(['Cmaj7', 'Db7', 'Cmaj7']);
  assert(aDom.chords[1].romanNumeral === 'subV7/I', 'Db7 = subV7/I', `got ${aDom.chords[1].romanNumeral}`);
  assert(aDom.chords[1].analysisTags.includes('TRITONE_SUBSTITUTION'), 'Db7 has TRITONE_SUBSTITUTION tag');
  assert(aDom.chords[1].secondaryTarget === 'I', 'Db7 secondaryTarget = I');
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
