// Sprint 6D/F7 — Cadence Detection Tests
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
  const authentic = a.cadences?.find(c => c.type === 'AUTHENTIC' && c.resolution.status === 'RESOLVED');
  assert(authentic !== undefined, 'AUTHENTIC RESOLVED cadence found');
  if (authentic) {
    assert(authentic.confidence === 0.98, 'Confidence is 0.98');
    assert(authentic.startIndex === 0 && authentic.endIndex === 2, 'Indices are 0 and 2');
    assert(JSON.stringify(authentic.chordIndexes) === '[0,1,2]', 'Chord indexes are [0,1,2]');
    assert(authentic.strength === 'STRONG', 'Strength is STRONG');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 2 — Diatonic Perfect Cadence (Minor)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 2 — Diatonic Perfect Cadence (Minor)');
{
  const a = analyzeProgression(['Bm7b5', 'E7', 'Am7']);
  assert(a.tonalCenter.root === 'A' && a.tonalCenter.mode === 'MINOR', 'Key is A Minor');
  const authentic = a.cadences?.find(c => c.type === 'AUTHENTIC' && c.resolution.status === 'RESOLVED');
  assert(authentic !== undefined, 'AUTHENTIC RESOLVED cadence found in minor key');
  if (authentic) {
    assert(authentic.confidence === 0.98, 'Confidence is 0.98');
    assert(JSON.stringify(authentic.chordIndexes) === '[0,1,2]', 'Chord indexes are [0,1,2]');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 3 — Secondary Perfect Cadence (ii-V-I of target)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 3 — Secondary Perfect Cadence (Em7 -> A7 -> Dm7)');
{
  const a = analyzeProgression(['Cmaj7', 'Em7', 'A7', 'Dm7', 'G7']);
  assert(a.tonalCenter.root === 'C', 'Key is C');
  const secAuthentic = a.cadences?.find(c => c.type === 'AUTHENTIC' && c.resolution.status === 'RESOLVED' && c.name.includes('Secundário'));
  assert(secAuthentic !== undefined, 'Secondary AUTHENTIC cadence found');
  if (secAuthentic) {
    assert(secAuthentic.confidence === 0.85, 'Confidence is 0.85');
    assert(secAuthentic.name.includes('ii - V - I Secundário de ii'), 'Correct target description');
    assert(JSON.stringify(secAuthentic.chordIndexes) === '[1,2,3]', 'Chord indexes are [1,2,3]');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 4 — Jazz Turnaround & Half Cadence
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 4 — Jazz Turnaround & Half Cadence (Cmaj7 -> A7 -> Dm7 -> G7)');
{
  const a = analyzeProgression(['Cmaj7', 'A7', 'Dm7', 'G7']);
  // A7 -> Dm7 resolves as secondary dominant (index 1 to 2)
  const secondary = a.cadences?.find(c => c.type === 'AUTHENTIC' && c.startIndex === 1 && c.endIndex === 2);
  assert(secondary !== undefined, 'Secondary dominant cadence (A7 -> Dm7) found');
  if (secondary) {
    assert(secondary.resolution.status === 'RESOLVED', 'Resolution is RESOLVED');
  }

  // Dm7 -> G7 resolves to nothing, terminating phrase as a half cadence (index 2 to 3)
  const half = a.cadences?.find(c => c.type === 'HALF');
  assert(half !== undefined, 'HALF cadence (Dm7 -> G7) found');
  if (half) {
    assert(half.resolution.status === 'INTERRUPTED', 'Status is INTERRUPTED');
    assert(JSON.stringify(half.chordIndexes) === '[2,3]', 'Indices are [2,3]');
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
  const deceptive = aDeceptive.cadences?.find(c => c.type === 'AUTHENTIC' && c.resolution.status === 'DECEPTIVE');
  assert(deceptive !== undefined, 'DECEPTIVE resolution cadence found');
  if (deceptive) {
    assert(deceptive.confidence === 0.85, 'Deceptive confidence is 0.85');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 6 — Overlap (Em7 A7 Dm7 G7 Cmaj7)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 6 — Overlap (Em7 A7 Dm7 G7 Cmaj7)');
{
  const a = analyzeProgression(['Em7', 'A7', 'Dm7', 'G7', 'Cmaj7']);
  const secAuthentic = a.cadences?.find(c => c.type === 'AUTHENTIC' && c.name.includes('Secundário'));
  const perfect = a.cadences?.find(c => c.type === 'AUTHENTIC' && !c.name.includes('Secundário'));

  assert(secAuthentic !== undefined, 'Secondary AUTHENTIC found');
  assert(perfect !== undefined, 'Diatonic AUTHENTIC found');

  if (secAuthentic) {
    assert(JSON.stringify(secAuthentic.chordIndexes) === '[0,1,2]', 'SECONDARY indexes: [0,1,2]');
  }
  if (perfect) {
    assert(JSON.stringify(perfect.chordIndexes) === '[2,3,4]', 'DIATONIC indexes: [2,3,4]');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 7 — Backdoor Cadence & Linear authentic
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 7 — Backdoor (Bb7 -> Cmaj7) & Linear Authentic');
{
  const aBackdoor = analyzeProgression(['Bb7', 'Cmaj7']);
  const backdoor = aBackdoor.cadences?.find(c => c.type === 'AUTHENTIC' && c.name.includes('Backdoor'));
  assert(backdoor !== undefined, 'Backdoor cadence found');
  if (backdoor) {
    assert(backdoor.confidence === 0.80, 'Backdoor confidence is 0.80');
    assert(JSON.stringify(backdoor.chordIndexes) === '[0,1]', 'Backdoor indexes: [0,1]');
  }

  const aLinear = analyzeProgression(['G7', 'Cmaj7', 'Dm7']);
  const authentic = aLinear.cadences?.find(c => c.type === 'AUTHENTIC');
  assert(authentic !== undefined, 'Linear AUTHENTIC cadence found');
  if (authentic) {
    assert(JSON.stringify(authentic.chordIndexes) === '[0,1]', 'Linear authentic indexes: [0,1]');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 8 — False Positive Checks
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 8 — False Positive Checks');
{
  const aFalse = analyzeProgression(['Cmaj7', 'Dbmaj7', 'Cmaj7']);
  const backdoor = aFalse.cadences?.find(c => c.type === 'AUTHENTIC' && c.name.includes('Backdoor'));
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
