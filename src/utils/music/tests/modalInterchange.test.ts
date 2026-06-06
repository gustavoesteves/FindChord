// Sprint 6E — Modal Interchange Tests
// Run with: npx tsx src/utils/music/tests/modalInterchange.test.ts

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
// Test 1 — Backdoor Cadence Precedence (Bb7 -> Cmaj7)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 1 — Backdoor Cadence Precedence (Bb7 -> Cmaj7)');
{
  const a = analyzeProgression(['Bb7', 'Cmaj7']);
  assert(a.tonalCenter.root === 'C', 'Key is C');
  
  const backdoorCadence = a.cadences?.find(c => c.type === 'BACKDOOR');
  assert(backdoorCadence !== undefined, 'Backdoor cadence detected');
  
  const bb7Chord = a.chords[0];
  assert(bb7Chord.chordSymbol === 'Bb7', 'Found Bb7');
  // Should NOT be marked as modal borrowing because it is part of backdoor cadence
  assert(bb7Chord.contextualFunction !== 'MODAL_BORROWING', 'Bb7 NOT classified as MODAL_BORROWING');
  assert(bb7Chord.modalBorrowing === undefined, 'Bb7 modalBorrowing is undefined');
}

// ═══════════════════════════════════════════════════════════
// Test 2 — Secondary Dominant Precedence (Cmaj7 A7 Dm7 G7)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 2 — Secondary Dominant Precedence (Cmaj7 -> A7 -> Dm7 -> G7)');
{
  const a = analyzeProgression(['Cmaj7', 'A7', 'Dm7', 'G7']);
  const a7Chord = a.chords[1];
  
  assert(a7Chord.chordSymbol === 'A7', 'Found A7');
  assert(a7Chord.contextualFunction === 'SECONDARY_DOMINANT', 'A7 is SECONDARY_DOMINANT');
  assert(a7Chord.modalBorrowing === undefined, 'A7 modalBorrowing is undefined (NOT modal borrowing)');
}


// ═══════════════════════════════════════════════════════════
// Test 3 — Napolitano Chord (bII maj7 -> Phrygian)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 3 — Napolitano bII (Dbmaj7 -> PHRYGIAN)');
{
  const a = analyzeProgression(['Cmaj7', 'Dbmaj7', 'G7', 'Cmaj7']);
  const dbmaj7 = a.chords[1];
  
  assert(dbmaj7.chordSymbol === 'Dbmaj7', 'Found Dbmaj7');
  assert(dbmaj7.contextualFunction === 'MODAL_BORROWING', 'Dbmaj7 is MODAL_BORROWING');
  if (dbmaj7.modalBorrowing) {
    assert(dbmaj7.modalBorrowing.sourceMode === 'PHRYGIAN', 'Dbmaj7 sourceMode is PHRYGIAN');
    assert(dbmaj7.confidence === 0.98, 'Dbmaj7 confidence is 0.98');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 4 — Picardy Third (Cm -> Ab -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 4 — Picardy Third (Cm -> Ab -> G7 -> C)');
{
  const a = analyzeProgression(['Cm', 'Ab', 'G7', 'C']);
  assert(a.tonalCenter.root === 'C' && a.tonalCenter.mode === 'MINOR', 'Key is C Minor');
  
  const lastChord = a.chords[3];
  assert(lastChord.chordSymbol === 'C', 'Last chord is C');
  assert(lastChord.contextualFunction === 'MODAL_BORROWING', 'Last chord is MODAL_BORROWING');
  if (lastChord.modalBorrowing) {
    assert(lastChord.modalBorrowing.sourceMode === 'IONIAN', 'Last chord sourceMode is IONIAN');
    assert(lastChord.confidence === 1.00, 'Last chord confidence is 1.00');
    assert(lastChord.analysisTags.includes('PICARDY_THIRD'), 'Last chord has PICARDY_THIRD tag');
  }
}


// ═══════════════════════════════════════════════════════════
// Test 5 — Mixolydian vs Aeolian (Bbmaj7 vs Bb7)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 5 — Mixolydian vs Aeolian (Bbmaj7 vs Bb7)');
{
  // Bbmaj7 has major-type quality -> Mixolydian borrowing
  const aMix = analyzeProgression(['Cmaj7', 'Bbmaj7', 'Cmaj7']);
  const bbmaj7 = aMix.chords[1];
  assert(bbmaj7.chordSymbol === 'Bbmaj7', 'Found Bbmaj7');
  assert(bbmaj7.contextualFunction === 'MODAL_BORROWING', 'Bbmaj7 is MODAL_BORROWING');
  if (bbmaj7.modalBorrowing) {
    assert(bbmaj7.modalBorrowing.sourceMode === 'MIXOLYDIAN', 'Bbmaj7 sourceMode is MIXOLYDIAN');
    assert(bbmaj7.confidence === 0.95, 'Bbmaj7 confidence is 0.95');
  }

  // Bb7 has dominant quality, but is NOT resolving to Cmaj7 (so not Backdoor)
  // E.g. Cmaj7 -> Bb7 -> Fmaj7 -> Cmaj7 (Bb7 is not resolving to Cmaj7, but Fmaj7)
  const aAeol = analyzeProgression(['Cmaj7', 'Bb7', 'Fmaj7', 'Cmaj7']);
  const bb7 = aAeol.chords[1];
  assert(bb7.chordSymbol === 'Bb7', 'Found Bb7');
  assert(bb7.contextualFunction === 'MODAL_BORROWING', 'Bb7 is MODAL_BORROWING');
  if (bb7.modalBorrowing) {
    assert(bb7.modalBorrowing.sourceMode === 'AEOLIAN', 'Bb7 sourceMode is AEOLIAN');
    assert(bb7.confidence === 0.95, 'Bb7 confidence is 0.95');
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
