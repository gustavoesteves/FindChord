// Sprint F4 — Modal Axis Solver Tests
// Run with: npx tsx src/utils/music/tests/modalAxis.test.ts

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
// Test 1 — Dorian Vamp (Dm7 -> G -> Dm7 -> G)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 1 — Dorian Vamp (Dm7 -> G -> Dm7 -> G)');
{
  const a = analyzeProgression(['Dm7', 'G', 'Dm7', 'G'], 'MODAL_FUNCTIONAL');
  
  // Under D Dorian, first chord is Dm7 (Tonic)
  assert(a.tonalCenter.root === 'D', 'Parent tonal root is D');
  assert(a.tonalCenter.mode === 'MINOR', 'Parent tonal mode is MINOR');

  const chords = a.chords;
  assert(chords.length === 4, 'Has 4 chords');
  
  // Dm7 should be i
  assert(chords[0].romanNumeral === 'im7', `Dm7 is im7 (got ${chords[0].romanNumeral})`);
  assert(chords[0].harmonicFunction === 'TONIC', 'Dm7 function is TONIC');

  // G should be IV
  assert(chords[1].romanNumeral === 'IV', `G is IV (got ${chords[1].romanNumeral})`);
  assert(chords[1].harmonicFunction === 'SUBDOMINANT', 'G function is SUBDOMINANT');

  // Check ModalAxisContext
  const dmModal = chords[0].modal?.axisContext;
  assert(dmModal !== undefined, 'Dm7 has ModalAxisContext');
  assert(dmModal?.axis === 'DORIAN_AXIS', 'Axis is DORIAN_AXIS');
  assert(dmModal?.mode === 'DORIAN', 'Mode is DORIAN');
  assert(dmModal?.active === true, 'Modal context is active');

  // Check cadences
  const cad = a.cadences || [];
  assert(cad.length > 0, 'Found cadences');
  const modalCad = cad.find(c => c.name.includes('Dórica'));
  assert(modalCad !== undefined, 'Found Dorian approach cadence');

  // Check regional segmentation
  assert(a.regions !== undefined, 'regions is populated');
  const mRegs = a.regions?.filter(r => r.type === 'MODAL_AXIS') || [];
  assert(mRegs.length === 1, `Has exactly 1 modal region (got ${mRegs.length})`);
  assert(mRegs[0].state.mode === 'DORIAN', 'Regional mode is DORIAN');
}

// ═══════════════════════════════════════════════════════════
// Test 2 — Lydian Vamp (C -> D -> C -> D)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 2 — Lydian Vamp (C -> D -> C -> D)');
{
  const a = analyzeProgression(['C', 'D', 'C', 'D'], 'MODAL_FUNCTIONAL');
  assert(a.tonalCenter.root === 'C', 'Key is C');
  assert(a.tonalCenter.mode === 'MAJOR', 'Mode is MAJOR');

  const chords = a.chords;
  // C is I
  assert(chords[0].romanNumeral === 'I', `C is I (got ${chords[0].romanNumeral})`);
  assert(chords[0].harmonicFunction === 'TONIC', 'C is TONIC');

  // D is II
  assert(chords[1].romanNumeral === 'II', `D is II (got ${chords[1].romanNumeral})`);
  assert(chords[1].harmonicFunction === 'DOMINANT', 'D is DOMINANT');

  assert(chords[0].modal?.axisContext?.mode === 'LYDIAN', 'Modal mode is LYDIAN');
  const modalCad = a.cadences?.find(c => c.name.includes('Lídia'));
  assert(modalCad !== undefined, 'Found Lydian approach cadence');
}

// ═══════════════════════════════════════════════════════════
// Test 3 — Mixolydian Vamp (G -> F -> G -> F)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 3 — Mixolydian Vamp (G -> F -> G -> F)');
{
  const a = analyzeProgression(['G', 'F', 'G', 'F'], 'MODAL_FUNCTIONAL');
  assert(a.tonalCenter.root === 'G', 'Key is G');
  assert(a.tonalCenter.mode === 'MAJOR', 'Mode is MAJOR');

  const chords = a.chords;
  assert(chords[0].romanNumeral === 'I', 'G is I');
  assert(chords[1].romanNumeral === 'bVII', `F is bVII (got ${chords[1].romanNumeral})`);
  assert(chords[0].modal?.axisContext?.mode === 'MIXOLYDIAN', 'Modal mode is MIXOLYDIAN');
  
  const modalCad = a.cadences?.find(c => c.name.includes('Mixolídia'));
  assert(modalCad !== undefined, 'Found Mixolydian approach cadence');
}

// ═══════════════════════════════════════════════════════════
// Test 4 — Phrygian Vamp (Em -> F -> Em -> F)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 4 — Phrygian Vamp (Em -> F -> Em -> F)');
{
  const a = analyzeProgression(['Em', 'F', 'Em', 'F'], 'MODAL_FUNCTIONAL');
  assert(a.tonalCenter.root === 'E', 'Key is E');
  assert(a.tonalCenter.mode === 'MINOR', 'Mode is MINOR');

  const chords = a.chords;
  assert(chords[0].romanNumeral === 'i', 'Em is i');
  assert(chords[1].romanNumeral === 'bII', `F is bII (got ${chords[1].romanNumeral})`);
  assert(chords[0].modal?.axisContext?.mode === 'PHRYGIAN', 'Modal mode is PHRYGIAN');

  const modalCad = a.cadences?.find(c => c.name.includes('Frígia'));
  assert(modalCad !== undefined, 'Found Phrygian approach cadence');
}

// ═══════════════════════════════════════════════════════════
// Test 5 — Locrian Vamp (Bm7b5 -> F -> Bm7b5 -> F)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 5 — Locrian Vamp (Bm7b5 -> F -> Bm7b5 -> F)');
{
  const a = analyzeProgression(['Bm7b5', 'F', 'Bm7b5', 'F'], 'MODAL_FUNCTIONAL');
  assert(a.tonalCenter.root === 'B', 'Key is B');
  assert(a.tonalCenter.mode === 'MINOR', 'Mode is MINOR');

  const chords = a.chords;
  assert(chords[0].romanNumeral === 'iø', `Bm7b5 is iø (got ${chords[0].romanNumeral})`);
  assert(chords[1].romanNumeral === 'bV', `F is bV (got ${chords[1].romanNumeral})`);
  assert(chords[0].modal?.axisContext?.mode === 'LOCRIAN', 'Modal mode is LOCRIAN');

  const modalCad = a.cadences?.find(c => c.name.includes('Lócria'));
  assert(modalCad !== undefined, 'Found Locrian approach cadence');
}

// ═══════════════════════════════════════════════════════════
// Test 6 — Mixed Transition Modulation (Cmaj7 -> G7 -> Cmaj7 -> Dm7 -> G -> Dm7 -> G)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 6 — Mixed Modulation (Tonal C Major -> Dorian D Dórico)');
{
  // Cmaj7 -> G7 -> Cmaj7 (tonal C major) then Dm7 -> G -> Dm7 -> G (Dorian vamp)
  const a = analyzeProgression(['Cmaj7', 'G7', 'Cmaj7', 'Dm7', 'G', 'Dm7', 'G'], 'GENERAL');
  
  const chords = a.chords;
  assert(chords.length === 7, 'Has 7 chords');

  // First part should be C Major tonal
  assert(chords[0].tonal?.tonalCenter.root === 'C', 'First chord center is C');
  assert(chords[0].modal?.axisContext === undefined, 'First chord is tonal (no modal axis)');

  // Second part (chords 3 to 6) should modularize/transition to D Dorian
  assert(chords[4].tonal?.tonalCenter.root === 'D', 'Fifth chord center is D');
  assert(chords[4].modal?.axisContext?.mode === 'DORIAN', 'Fifth chord is in DORIAN axis');
  
  // Verify regional segment boundaries
  const mRegs2 = a.regions?.filter(r => r.type === 'MODAL_AXIS') || [];
  assert(mRegs2.length === 1, `Has exactly 1 modal region (got ${mRegs2.length})`);
  assert(mRegs2[0].startIndex === 3, `Dorian starts at index 3 (got ${mRegs2[0].startIndex})`);
  assert(mRegs2[0].endIndex === 6, `Dorian ends at index 6 (got ${mRegs2[0].endIndex})`);
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
