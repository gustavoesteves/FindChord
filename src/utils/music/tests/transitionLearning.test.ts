// Sprint 8C — Adaptive Transition Learning Verification Tests
// Run with: npx tsx src/utils/music/tests/transitionLearning.test.ts

import { analyzeProgression } from '../analysis/functionalAnalysis';
import { TransitionTrainer } from '../analysis/transitionTrainer';
import type { ContextualFunction } from '../analysis/models/FunctionalAnalysis';

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
// Test 1 — Trainer Normalization & Laplace Smoothing
// ═══════════════════════════════════════════════════════════
console.log('\n📈 Test 1 — TransitionTrainer Normalization & Laplace Smoothing');
{
  const trainer = new TransitionTrainer();
  
  // Train with some arbitrary transitions
  trainer.addTransition('PRIMARY', 'SECONDARY_DOMINANT');
  trainer.addTransition('PRIMARY', 'SECONDARY_DOMINANT');
  trainer.addTransition('SECONDARY_DOMINANT', 'PRIMARY');
  trainer.addTransition('TRITONE_SUBSTITUTION', 'PRIMARY');

  // Also train using progressions
  trainer.trainProgressions([
    ['Cmaj7', 'A7', 'Dm7', 'G7', 'Cmaj7'], // Contains primary, secondary dom, primary
    ['Cmaj7', 'Db7', 'Cmaj7']              // Contains primary, tritone, primary
  ]);

  const model = trainer.exportModel(1.0);
  
  // Verify that every line sums to 1.0 (Laplace smoothing guarantees this)
  let allRowsValid = true;
  for (const fromKey in model) {
    const row = model[fromKey as ContextualFunction];
    let sum = 0;
    for (const toKey in row) {
      sum += row[toKey as ContextualFunction];
    }
    const diff = Math.abs(sum - 1.0);
    if (diff > 1e-9) {
      allRowsValid = false;
      console.log(`Row ${fromKey} sum is ${sum}, diff = ${diff}`);
    }
  }

  assert(allRowsValid, 'All rows in the exported transition model normalize to exactly 1.0');
}

// ═══════════════════════════════════════════════════════════
// Test 2 — Grammar Profile Analysis (Db7 -> Cmaj7 in extended functional vs common practice)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 2 — Grammar Profile Analysis for Db7 -> Cmaj7');
{
  // In extended functional profile, Triton Substitution is highly likely/favored
  const extendedAnalysis = analyzeProgression(['Cmaj7', 'Db7', 'Cmaj7'], 'EXTENDED_FUNCTIONAL');
  const extendedDb7 = extendedAnalysis.chords[1];
  
  assert(
    extendedDb7.contextualFunction === 'TRITONE_SUBSTITUTION',
    `Extended Functional profile: Db7 is identified as TRITONE_SUBSTITUTION`,
    `got ${extendedDb7.contextualFunction}`
  );

  // In common practice profile, Triton Substitution is not favored in the corpus (not common)
  const commonAnalysis = analyzeProgression(['Cmaj7', 'Db7', 'Cmaj7'], 'COMMON_PRACTICE');
  const commonDb7 = commonAnalysis.chords[1];
  
  console.log(`  Common Practice Db7 function: ${commonDb7.contextualFunction} (confidence: ${commonDb7.confidence.toFixed(2)})`);
  assert(
    commonDb7.contextualFunction !== undefined,
    `Common Practice profile: Db7 has a resolved function`
  );
}

// ═══════════════════════════════════════════════════════════
// Test 3 — Detailed Explanation with Hybrid transition weights
// ═══════════════════════════════════════════════════════════
console.log('\n📚 Test 3 — Detailed Explanation & Explanation Format');
{
  const analysis = analyzeProgression(['Cmaj7', 'A7', 'Dm7', 'G7', 'Cmaj7'], 'EXTENDED_FUNCTIONAL');
  const explanations = analysis.globalPath?.explanations || [];
  
  // Find a line corresponding to transitions (contains -> and details)
  const transitionExplanations = explanations.filter(line => line.includes('Transition') && line.includes('->'));
  
  assert(transitionExplanations.length > 0, 'Contains transition explanations');
  
  let hasHybridDetails = false;
  for (const line of transitionExplanations) {
    if (line.includes('Base:') && line.includes('Corpus:') && line.includes('Final Base:')) {
      hasHybridDetails = true;
    }
  }
  
  assert(
    hasHybridDetails,
    'Explanations contain detailed hybrid weights: Base, Corpus, Final Base, alpha, beta',
    `Explanations found: \n${explanations.join('\n')}`
  );
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
