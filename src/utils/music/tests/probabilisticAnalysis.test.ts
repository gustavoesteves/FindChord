// Sprint 8A — Probabilistic Functional Analysis Tests
// Run with: npx tsx src/utils/music/tests/probabilisticAnalysis.test.ts

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
// Test 1 — Real Ambiguity (C -> C#dim7 -> Dm7)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 1 — Real Ambiguity (C -> C#dim7 -> Dm7)');
{
  const a = analyzeProgression(['Cmaj7', 'C#dim7', 'Dm7', 'G7', 'Cmaj7']);
  const cSharp = a.chords[1];

  assert(cSharp.functionalHypotheses !== undefined, 'functionalHypotheses is defined');
  if (cSharp.functionalHypotheses) {
    assert(cSharp.functionalHypotheses.length >= 2, `Has at least 2 hypotheses, got ${cSharp.functionalHypotheses.length}`);
    
    // Check for SECONDARY_LEADING_TONE and PASSING_DIMINISHED
    const hasLeadingTone = cSharp.functionalHypotheses.some(h => h.contextualFunction === 'SECONDARY_LEADING_TONE');
    const hasPassing = cSharp.functionalHypotheses.some(h => h.contextualFunction === 'PASSING_DIMINISHED');

    assert(hasLeadingTone, 'Has SECONDARY_LEADING_TONE hypothesis');
    assert(hasPassing, 'Has PASSING_DIMINISHED hypothesis');

    // Verify both have the same confidence (0.95)
    const ltHyp = cSharp.functionalHypotheses.find(h => h.contextualFunction === 'SECONDARY_LEADING_TONE');
    const psHyp = cSharp.functionalHypotheses.find(h => h.contextualFunction === 'PASSING_DIMINISHED');

    if (ltHyp && psHyp) {
      assert(ltHyp.confidence === 0.95, 'Leading tone hypothesis has 0.95 confidence');
      assert(psHyp.confidence === 0.95, 'Passing diminished hypothesis has 0.95 confidence');
    }

    // Verify winner selection via precedence tie-breaking (SECONDARY_LEADING_TONE wins over PASSING_DIMINISHED)
    assert(cSharp.contextualFunction === 'SECONDARY_LEADING_TONE', `Winner is SECONDARY_LEADING_TONE, got ${cSharp.contextualFunction}`);
  }
}

// ═══════════════════════════════════════════════════════════
// Test 2 — Diatonic Compatibility (PRIMARY)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 2 — Diatonic Compatibility (PRIMARY)');
{
  const a = analyzeProgression(['Dm7', 'G7', 'Cmaj7']);
  
  const dm7 = a.chords[0];
  assert(dm7.contextualFunction === 'PRIMARY', `Dm7 winner is PRIMARY, got ${dm7.contextualFunction}`);
  assert(dm7.functionalHypotheses !== undefined, 'Dm7 has functionalHypotheses');
  if (dm7.functionalHypotheses) {
    assert(dm7.functionalHypotheses[0].contextualFunction === 'PRIMARY', 'PRIMARY is the first (winning) hypothesis');
    assert(dm7.functionalHypotheses[0].confidence === 1.0, 'PRIMARY has 1.0 confidence');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 3 — Structured Resolution Evidence in Hypotheses
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 3 — Structured Evidence in Hypotheses');
{
  const a = analyzeProgression(['Cmaj7', 'C#dim7', 'Dm7', 'G7', 'Cmaj7']);
  const cSharp = a.chords[1];

  if (cSharp.functionalHypotheses) {
    const ltHyp = cSharp.functionalHypotheses.find(h => h.contextualFunction === 'SECONDARY_LEADING_TONE');
    assert(ltHyp !== undefined, 'Found leading tone hypothesis');
    if (ltHyp) {
      assert(ltHyp.evidence !== undefined, 'Hypothesis contains resolution evidence');
      if (ltHyp.evidence) {
        assert(typeof ltHyp.evidence.resolutionScore === 'number', `Has resolutionScore, got ${ltHyp.evidence.resolutionScore}`);
        assert(ltHyp.evidence.targetChordIndex === 2, `Has targetChordIndex pointing to Dm7 (2), got ${ltHyp.evidence.targetChordIndex}`);
        assert(ltHyp.evidence.commonTones === 0, `Has commonTones = 0, got ${ltHyp.evidence.commonTones}`);
        assert(ltHyp.evidence.stepwiseCount === 3, `Has stepwiseCount = 3 steps, got ${ltHyp.evidence.stepwiseCount}`);
      }
    }
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
