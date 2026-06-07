// Sprint 9B — Tonal Grammar & Hierarchical Analysis Tests
// Run with: npx tsx src/utils/music/tests/tonalGrammar.test.ts

import { analyzeProgression, segmentTonalRegions } from '../analysis/functionalAnalysis';
import type { FunctionalChord, CadenceInfo, TonalCenter } from '../analysis/models/FunctionalAnalysis';

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
// Caso 1 — Diatonic Stable Progression
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Diatonic Stable (Cmaj7 -> Am7 -> Dm7 -> G7 -> Cmaj7)');
{
  const a = analyzeProgression(['Cmaj7', 'Am7', 'Dm7', 'G7', 'Cmaj7']);
  
  assert(a.regions !== undefined, 'regions is defined');
  if (a.regions) {
    assert(a.regions.length === 1, `Exactly 1 region detected (got ${a.regions.length})`);
    const reg = a.regions[0];
    assert(reg.key.root === 'C' && reg.key.mode === 'MAJOR', 'Region is C MAJOR');
    assert(reg.isHomeKey, 'isHomeKey is true');
    assert(reg.duration === 5, 'duration is 5');
    assert(reg.type === 'ESTABLISHED_MODULATION', `type is ESTABLISHED_MODULATION (got ${reg.type})`);
    assert(reg.stabilityScore > 0.80, `stabilityScore is high: ${reg.stabilityScore}`);
  }

  assert(a.phrases !== undefined, 'phrases is defined');
  if (a.phrases) {
    assert(a.phrases.length === 1, `Exactly 1 phrase detected (got ${a.phrases.length})`);
    const phrase = a.phrases[0];
    assert(phrase.startIndex === 0 && phrase.endIndex === 4, 'Phrase spans from 0 to 4');
    assert(phrase.terminatingCadence?.type === 'PERFECT', 'Phrase is terminated by a PERFECT cadence');
  }
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

  assert(a.regions !== undefined, 'regions is defined');
  if (a.regions) {
    // Should have 3 regions: C MAJOR -> A MINOR -> C MAJOR
    assert(a.regions.length === 3, `3 regions detected (got ${a.regions.length})`);
    
    const reg0 = a.regions[0];
    assert(reg0.key.root === 'C' && reg0.key.mode === 'MAJOR', 'First region is C MAJOR');
    assert(reg0.isHomeKey, 'First region isHomeKey is true');
    assert(reg0.type === 'ESTABLISHED_MODULATION', 'First region type is ESTABLISHED_MODULATION');

    const reg1 = a.regions[1];
    assert(reg1.key.root === 'A' && reg1.key.mode === 'MINOR', 'Second region is A MINOR');
    assert(!reg1.isHomeKey, 'Second region isHomeKey is false');
    assert(reg1.type === 'ESTABLISHED_MODULATION', 'Second region type is ESTABLISHED_MODULATION');
    assert(reg1.stabilityScore > 0.70, `Second region stability is stable: ${reg1.stabilityScore}`);

    const reg2 = a.regions[2];
    assert(reg2.key.root === 'C' && reg2.key.mode === 'MAJOR', 'Third region is C MAJOR');
    assert(reg2.isHomeKey, 'Third region isHomeKey is true');
  }

  assert(a.phrases !== undefined, 'phrases is defined');
  if (a.phrases) {
    // Phrasing should break at cadences
    assert(a.phrases.length >= 2, `At least 2 phrases segmented (got ${a.phrases.length})`);
    const p0 = a.phrases[0];
    assert(p0.terminatingCadence?.type === 'PERFECT', `First phrase terminated by structural cadence (got ${p0.terminatingCadence?.type})`);
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Tonicization Classification
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Tonicization Classification (1-2 chords transition)');
{
  const mockHomeKey: TonalCenter = { root: 'C', mode: 'MAJOR', confidence: 1.0 };
  const mockChords: FunctionalChord[] = [
    { index: 0, chordSymbol: 'Cmaj7', romanNumeral: 'Imaj7', scaleDegree: 'I', harmonicFunction: 'TONIC', degree: 1, isDiatonic: true, confidence: 1.0, analysisTags: [], tonal: { tonalCenter: { root: 'C', mode: 'MAJOR', confidence: 1.0 } } },
    { index: 1, chordSymbol: 'F#dim7', romanNumeral: 'vii°7', scaleDegree: 'vii°', harmonicFunction: 'DOMINANT', degree: 7, isDiatonic: false, confidence: 0.90, analysisTags: [], tonal: { tonalCenter: { root: 'G', mode: 'MAJOR', confidence: 1.0 } } }, // 1-chord tonicization
    { index: 2, chordSymbol: 'Cmaj7', romanNumeral: 'Imaj7', scaleDegree: 'I', harmonicFunction: 'TONIC', degree: 1, isDiatonic: true, confidence: 1.0, analysisTags: [], tonal: { tonalCenter: { root: 'C', mode: 'MAJOR', confidence: 1.0 } } }
  ];
  const mockCadences: CadenceInfo[] = [];

  const segmented = segmentTonalRegions(mockChords, mockCadences, mockHomeKey);
  assert(segmented.length === 3, `Segmented mock into 3 regions (got ${segmented.length})`);
  if (segmented.length === 3) {
    assert(segmented[0].type === 'TONICIZATION', `Region 0 (duration 1) is TONICIZATION (got ${segmented[0].type})`);
    assert(segmented[1].type === 'TONICIZATION', `Region 1 (duration 1) is TONICIZATION (got ${segmented[1].type})`);
    assert(segmented[2].type === 'TONICIZATION', `Region 2 (duration 1) is TONICIZATION (got ${segmented[2].type})`);
    assert(segmented[0].isHomeKey === true, 'Region 0 isHomeKey: true');
    assert(segmented[1].isHomeKey === false, 'Region 1 isHomeKey: false');
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
