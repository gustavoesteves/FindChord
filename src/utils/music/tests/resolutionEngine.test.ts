// Sprint 7A — Harmonic Resolution Engine Tests
// Run with: npx tsx src/utils/music/tests/resolutionEngine.test.ts

import { analyzeProgression } from '../analysis/functionalAnalysis';
import { calculateResolutionEvidence, scoreResolutionEvidence } from '../analysis/resolutionEngine';

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
// Test 1 — Diatonic Resolution (G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 1 — Diatonic Resolution (G7 -> C)');
{
  const raw = calculateResolutionEvidence('G7', 'C', 1, 1);
  
  // Verify physical attributes under the greedy non-reuse and closeness rules:
  // - G (7) -> G (7) (COMMON_TONE = 1)
  // - B (11) -> C (0) (SEMITONE_ASCENDING = 1)
  // - F (5) -> E (4) (SEMITONE_DESCENDING = 1)
  // - D (2) is not mapped (B has only 3 unique notes), but since it is within 2 semitones of C/E, unresolvedTones is 0.
  assert(raw.commonTones === 1, 'G7 -> C has exactly 1 common tone (G)', `got ${raw.commonTones}`);
  assert(raw.ascendingSemitoneResolutions === 1, 'G7 -> C has 1 ascending semitone resolution (B -> C)', `got ${raw.ascendingSemitoneResolutions}`);
  assert(raw.descendingSemitoneResolutions === 1, 'G7 -> C has 1 descending semitone resolution (F -> E)', `got ${raw.descendingSemitoneResolutions}`);
  assert(raw.wholeToneResolutions === 0, 'G7 -> C has 0 whole tone resolutions because D is unmapped', `got ${raw.wholeToneResolutions}`);
  assert(raw.unresolvedTones === 0, 'G7 -> C has 0 unresolved tones (D has close step alternatives)', `got ${raw.unresolvedTones}`);

  // Test non-reuse of target notes
  const pairB = raw.resolvedPairs.find(p => p.fromChroma === 11);
  assert(pairB !== undefined && pairB.toChroma === 0, 'B resolves to C');
  
  const pairD = raw.resolvedPairs.find(p => p.fromChroma === 2);
  assert(pairD === undefined, 'D remains unmapped under strict non-reuse');

  // Score G7 -> C
  const score = scoreResolutionEvidence(raw, 'G7', 'C');
  assert(Math.abs(score - 0.625) < 0.001, `G7 -> C has a resolution score of 0.625: ${score}`);
}

// ═══════════════════════════════════════════════════════════
// Test 2 — Chromatic/Diminished Resolution (C#dim7 -> Dm7, lookahead +2)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 2 — Chromatic/Diminished Resolution (C#dim7 -> Dm7, lookahead +2)');
{
  // Progression: Cmaj7 (0) -> C#dim7 (1) -> Fmaj7 (2) -> Dm7 (3)
  const a = analyzeProgression(['Cmaj7', 'C#dim7', 'Fmaj7', 'Dm7']);
  const cSharp = a.chords[1];
  
  assert(cSharp.chordSymbol === 'C#dim7', 'Found C#dim7');
  assert(cSharp.resolution?.resolutionEvidence !== undefined, 'C#dim7 has resolutionEvidence');
  
  if (cSharp.resolution?.resolutionEvidence) {
    // Fmaj7 score is 0.625. Dm7 score is 0.675. Since Dm7 has a higher score, it resolves to Dm7.
    assert(cSharp.resolution.resolutionEvidence.targetChordIndex === 3, 'Resolution target is Dm7 (index 3)', `got ${cSharp.resolution.resolutionEvidence.targetChordIndex}`);
    assert(cSharp.resolution.resolutionEvidence.resolutionDistance === 2, 'Resolution distance is 2', `got ${cSharp.resolution.resolutionEvidence.resolutionDistance}`);
    assert(cSharp.resolution.resolutionEvidence.harmonicResolutionScore === 0.675, `Resolution score is 0.675: ${cSharp.resolution.resolutionEvidence.harmonicResolutionScore}`);
  }
}

// ═══════════════════════════════════════════════════════════
// Test 3 — Lookahead Resolution with Inversion (C#dim7 -> Dm/A -> Dm)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 3 — Lookahead Resolution with Inversion (C#dim7 -> Dm/A -> Dm)');
{
  const a = analyzeProgression(['C#dim7', 'Dm/A', 'Dm']);
  const cSharp = a.chords[0];
  
  assert(cSharp.chordSymbol === 'C#dim7', 'Found C#dim7');
  assert(cSharp.resolution?.resolutionEvidence !== undefined, 'C#dim7 has resolutionEvidence');
  
  if (cSharp.resolution?.resolutionEvidence) {
    // Both Dm/A (index 1) and Dm (index 2) have the same score (0.675). The engine prefers index 1 because it is closer.
    assert(cSharp.resolution.resolutionEvidence.targetChordIndex === 1, `Target chord index is 1 (Dm/A), got ${cSharp.resolution.resolutionEvidence.targetChordIndex}`);
    assert(cSharp.resolution.resolutionEvidence.resolutionDistance === 1, `Resolution distance is 1, got ${cSharp.resolution.resolutionEvidence.resolutionDistance}`);
  }
}

// ═══════════════════════════════════════════════════════════
// Test 4 — Ambiguity: Dm vs C resolution targets
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 4 — Ambiguity: Dm vs C resolution targets');
{
  // Dm case (strong resolution to Dm at lookahead 2, score 0.675 > G7 score 0.65)
  const aDm = analyzeProgression(['C#dim7', 'G7', 'Dm']);
  const cSharpDm = aDm.chords[0];
  assert(cSharpDm.resolution?.resolutionEvidence !== undefined, 'C#dim7 in Dm case has resolutionEvidence');
  assert(cSharpDm.resolution?.resolutionEvidence?.targetChordIndex === 2, `C#dim7 resolves to Dm (index 2), got ${cSharpDm.resolution?.resolutionEvidence?.targetChordIndex}`);

  // C case (C#dim7 -> G7 is 0.65, C#dim7 -> C is 0.425. So it resolves to G7 (index 1))
  const aC = analyzeProgression(['C#dim7', 'G7', 'C']);
  const cSharpC = aC.chords[0];
  assert(cSharpC.resolution?.resolutionEvidence !== undefined, 'C#dim7 in C case has resolutionEvidence');
  assert(cSharpC.resolution?.resolutionEvidence?.targetChordIndex === 1, `C#dim7 resolves to G7 (index 1), got ${cSharpC.resolution?.resolutionEvidence?.targetChordIndex}`);
}

// ═══════════════════════════════════════════════════════════
// Test 5 — Greedy Non-Reuse Resolution (4 notes to 3 notes)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 5 — Greedy Non-Reuse Resolution (Cmaj7 -> C)');
{
  const raw = calculateResolutionEvidence('Cmaj7', 'C', 1, 1);
  
  // Cmaj7 (C, E, G, B) to C (C, E, G)
  // Greedy maps C->C (0), E->E (0), G->G (0).
  // Target notes are now empty.
  // Note B has no available target notes. But closest to B (11) is C (0) (distance 1 <= 2). So unresolvedTones is 0.
  assert(raw.commonTones === 3, 'Cmaj7 -> C has exactly 3 common tones (C, E, G)', `got ${raw.commonTones}`);
  assert(raw.ascendingSemitoneResolutions === 0, 'Cmaj7 -> C has 0 semitone resolutions', `got ${raw.ascendingSemitoneResolutions}`);
  assert(raw.unresolvedTones === 0, 'Cmaj7 -> C has exactly 0 unresolved tones (B is close to C)', `got ${raw.unresolvedTones}`);
  assert(raw.resolvedPairs.length === 3, 'Greedy matching maps exactly 3 pairs', `got ${raw.resolvedPairs.length}`);
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
