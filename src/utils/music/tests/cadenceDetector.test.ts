// Sprint 6D — Cadence Detection Tests
// Run with: npx tsx src/utils/music/tests/cadenceDetector.test.ts

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
// Test 1 — Diatonic Perfect Cadence (Major)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 1 — Diatonic Perfect Cadence (Major)');
{
  const a = analyzeProgression(['Dm7', 'G7', 'Cmaj7']);
  assert(a.tonalCenter.root === 'C', 'Key is C');
  assert(a.cadences !== undefined, 'Cadences defined');
  const perfect = a.cadences?.find(c => c.type === 'PERFECT');
  assert(perfect !== undefined, 'PERFECT cadence found');
  if (perfect) {
    assert(perfect.confidence === 0.98, 'Confidence is 0.98');
    assert(perfect.startIndex === 0 && perfect.endIndex === 2, 'Indices are 0 and 2');
    assert(JSON.stringify(perfect.chordIndexes) === '[0,1,2]', 'Chord indexes are [0,1,2]');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 2 — Diatonic Perfect Cadence (Minor)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 2 — Diatonic Perfect Cadence (Minor)');
{
  const a = analyzeProgression(['Bm7b5', 'E7', 'Am7']);
  assert(a.tonalCenter.root === 'A' && a.tonalCenter.mode === 'MINOR', 'Key is A Minor');
  const perfect = a.cadences?.find(c => c.type === 'PERFECT');
  assert(perfect !== undefined, 'PERFECT cadence found in minor key');
  if (perfect) {
    assert(perfect.confidence === 0.98, 'Confidence is 0.98');
    assert(JSON.stringify(perfect.chordIndexes) === '[0,1,2]', 'Chord indexes are [0,1,2]');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 3 — Secondary Perfect Cadence (ii-V-I of target)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 3 — Secondary Perfect Cadence (Em7 -> A7 -> Dm7)');
{
  const a = analyzeProgression(['Cmaj7', 'Em7', 'A7', 'Dm7', 'G7']);
  assert(a.tonalCenter.root === 'C', 'Key is C');
  const secPerfect = a.cadences?.find(c => c.type === 'SECONDARY_PERFECT');
  assert(secPerfect !== undefined, 'SECONDARY_PERFECT cadence found');
  if (secPerfect) {
    assert(secPerfect.confidence === 0.85, 'Confidence is 0.85');
    assert(secPerfect.name.includes('ii - V - I Secundário de ii'), 'Correct target description');
    assert(JSON.stringify(secPerfect.chordIndexes) === '[1,2,3]', 'Chord indexes are [1,2,3]');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 4 — Jazz Turnaround (Composite Detection)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 4 — Jazz Turnaround (Cmaj7 -> A7 -> Dm7 -> G7)');
{
  const a = analyzeProgression(['Cmaj7', 'A7', 'Dm7', 'G7']);
  const turnaround = a.cadences?.find(c => c.type === 'TURNAROUND');
  assert(turnaround !== undefined, 'TURNAROUND found');
  if (turnaround) {
    assert(turnaround.confidence === 0.95, 'Confidence is 0.95');
    assert(JSON.stringify(turnaround.chordIndexes) === '[0,1,2,3]', 'Indices are [0,1,2,3]');
  }

  // Double check composite detection: should also find Dm7 -> G7 -> Cmaj7 (circular)
  const perfect = a.cadences?.find(c => c.type === 'PERFECT');
  assert(perfect !== undefined, 'Composite PERFECT cadence also found');
  if (perfect) {
    assert(JSON.stringify(perfect.chordIndexes) === '[2,3,0]', 'Perfect circular indexes are [2,3,0]');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 5 — Plagal & Deceptive Cadences
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 5 — Plagal and Deceptive');
{
  // Plagal
  const aPlagal = analyzeProgression(['Cmaj7', 'Fmaj7', 'Cmaj7']);
  assert(aPlagal.tonalCenter.root === 'C', 'Plagal key is C');
  const plagal = aPlagal.cadences?.find(c => c.type === 'PLAGAL');
  assert(plagal !== undefined, 'PLAGAL cadence found');
  if (plagal) {
    assert(plagal.confidence === 0.70, 'Plagal confidence is 0.70');
    assert(JSON.stringify(plagal.chordIndexes) === '[1,2]', 'Plagal indexes are [1,2]');
  }

  // Deceptive
  const aDeceptive = analyzeProgression(['Cmaj7', 'G7', 'Am7']);
  const deceptive = aDeceptive.cadences?.find(c => c.type === 'DECEPTIVE');
  assert(deceptive !== undefined, 'DECEPTIVE cadence found');
  if (deceptive) {
    assert(deceptive.confidence === 0.80, 'Deceptive confidence is 0.80');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 6 — Overlap (Em7 A7 Dm7 G7 Cmaj7)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 6 — Overlap (Em7 A7 Dm7 G7 Cmaj7)');
{
  const a = analyzeProgression(['Em7', 'A7', 'Dm7', 'G7', 'Cmaj7']);
  const secPerfect = a.cadences?.find(c => c.type === 'SECONDARY_PERFECT');
  const perfect = a.cadences?.find(c => c.type === 'PERFECT');

  assert(secPerfect !== undefined, 'SECONDARY_PERFECT found');
  assert(perfect !== undefined, 'PERFECT found');

  if (secPerfect) {
    assert(JSON.stringify(secPerfect.chordIndexes) === '[0,1,2]', 'SECONDARY_PERFECT indexes: [0,1,2]');
  }
  if (perfect) {
    assert(JSON.stringify(perfect.chordIndexes) === '[2,3,4]', 'PERFECT indexes: [2,3,4]');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 7 — Circular & Backdoor Cadence
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 7 — Circular & Backdoor (Bb7 -> Cmaj7)');
{
  const aBackdoor = analyzeProgression(['Bb7', 'Cmaj7']);
  const backdoor = aBackdoor.cadences?.find(c => c.type === 'BACKDOOR');
  assert(backdoor !== undefined, 'BACKDOOR cadence found');
  if (backdoor) {
    assert(backdoor.confidence === 0.80, 'Backdoor confidence is 0.80');
    assert(JSON.stringify(backdoor.chordIndexes) === '[0,1]', 'Backdoor indexes: [0,1]');
  }

  // Circular perfect cadence test
  const aCircular = analyzeProgression(['G7', 'Cmaj7', 'Dm7']);
  const perfect = aCircular.cadences?.find(c => c.type === 'PERFECT');
  assert(perfect !== undefined, 'Circular PERFECT cadence found');
  if (perfect) {
    assert(JSON.stringify(perfect.chordIndexes) === '[2,0,1]', 'Circular perfect indexes: [2,0,1]');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 8 — False Positive Checks
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 8 — False Positive Checks');
{
  const aFalse = analyzeProgression(['Cmaj7', 'Dbmaj7', 'Cmaj7']);
  const backdoor = aFalse.cadences?.find(c => c.type === 'BACKDOOR');
  assert(backdoor === undefined, 'Dbmaj7 does NOT trigger BACKDOOR cadence');
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
