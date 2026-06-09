// Sprint F11 — Functional Equivalence Engine Tests
// Run with: npx tsx src/utils/music/tests/functionalEquivalence.test.ts

import { analyzeProgression } from '../analysis/functionalAnalysis';
import { resolveFunctionalEquivalences } from '../analysis/narrative/functionalEquivalenceEngine';

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
// Caso 1 — Tritone Sub Equivalency
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Tritone Sub Equivalency');
{
  const res1 = analyzeProgression(['C', 'G7', 'C']);
  const res2 = analyzeProgression(['C', 'Db7', 'C']);

  const eq1 = resolveFunctionalEquivalences(res1);
  const eq2 = resolveFunctionalEquivalences(res2);

  assert(eq1.roleSequence.join(',') === 'TONIC,DOMINANT,TONIC', 'C - G7 - C functional role sequence is TONIC,DOMINANT,TONIC');
  assert(eq2.roleSequence.join(',') === 'TONIC,DOMINANT,TONIC', 'C - Db7 - C functional role sequence is TONIC,DOMINANT,TONIC');
  assert(eq2.events[1].mechanism === 'TRITONE_SUBSTITUTION', 'Db7 mechanism is TRITONE_SUBSTITUTION');
  assert(eq2.events[1].equivalentRoman === 'V7', `Db7 equivalent roman is V7, got: ${eq2.events[1].equivalentRoman}`);
  assert(eq2.events[1].targetDegree === undefined, `Db7 targetDegree should be undefined (resolves to tonic I), got: ${eq2.events[1].targetDegree}`);
}

// ═══════════════════════════════════════════════════════════
// Caso 2 — Secondary Preparations
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Secondary Preparations');
{
  // We use complete progressions to ensure they both resolve to C MAJOR key
  const resA = analyzeProgression(['C', 'A7', 'Dm', 'G7', 'C']);
  const resEb = analyzeProgression(['C', 'Eb7', 'Dm', 'G7', 'C']);

  const eqA = resolveFunctionalEquivalences(resA);
  const eqEb = resolveFunctionalEquivalences(resEb);

  assert(eqA.roleSequence.join(',') === 'TONIC,DOMINANT,PREDOMINANT,DOMINANT,TONIC', `C - A7 - Dm - G7 - C role sequence is TONIC,DOMINANT,PREDOMINANT,DOMINANT,TONIC, got: ${eqA.roleSequence.join(',')}`);
  assert(eqEb.roleSequence.join(',') === 'TONIC,DOMINANT,PREDOMINANT,DOMINANT,TONIC', `C - Eb7 - Dm - G7 - C role sequence is TONIC,DOMINANT,PREDOMINANT,DOMINANT,TONIC, got: ${eqEb.roleSequence.join(',')}`);
  assert(eqA.events[1].mechanism === 'SECONDARY_FUNCTION', 'A7 mechanism is SECONDARY_FUNCTION');
  assert(eqEb.events[1].mechanism === 'TRITONE_SUBSTITUTION', 'Eb7 mechanism is TRITONE_SUBSTITUTION');
  assert(eqA.events[1].targetDegree === 'ii', `A7 targetDegree is ii, got: ${eqA.events[1].targetDegree}`);
  assert(eqEb.events[1].targetDegree === 'ii', `Eb7 targetDegree is ii, got: ${eqEb.events[1].targetDegree}`);
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Modal Borrowing Integration
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Modal Borrowing Integration');
{
  // C - Eb - C (Eb is bIII modal borrowing in C Major)
  const resEb = analyzeProgression(['C', 'Eb', 'C']);
  const eqEb = resolveFunctionalEquivalences(resEb);

  assert(eqEb.roleSequence.join(',') === 'TONIC,TONIC,TONIC', `C - Eb - C role sequence is TONIC,TONIC,TONIC, got: ${eqEb.roleSequence.join(',')}`);
  assert(eqEb.events[1].mechanism === 'MODAL_BORROWING', 'Eb mechanism is MODAL_BORROWING');
  assert(eqEb.events[1].tonicStrength === 'WEAK', 'Eb tonicStrength is WEAK');

  // C - Fm - C (Fm is iv modal borrowing in C Major)
  const resFm = analyzeProgression(['C', 'Fm', 'C']);
  const eqFm = resolveFunctionalEquivalences(resFm);

  assert(eqFm.roleSequence.join(',') === 'TONIC,PREDOMINANT,TONIC', `C - Fm - C role sequence is TONIC,PREDOMINANT,TONIC, got: ${eqFm.roleSequence.join(',')}`);
  assert(eqFm.events[1].mechanism === 'MODAL_BORROWING', 'Fm mechanism is MODAL_BORROWING');
  assert(eqFm.events[1].tonicStrength === undefined, 'Fm tonicStrength is undefined (not a TONIC chord)');
}

// ═══════════════════════════════════════════════════════════
// Caso 4 — Equivalência Parcial
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 4 — Equivalência Parcial');
{
  const res1 = analyzeProgression(['C', 'G7', 'C']);
  const res2 = analyzeProgression(['C', 'Db7', 'C']);

  const eq1 = resolveFunctionalEquivalences(res1);
  const eq2 = resolveFunctionalEquivalences(res2);

  assert(eq1.roleSequence.join(',') === eq2.roleSequence.join(','), 'Role sequences are identical');
  assert(eq1.mechanismSequence.join(',') !== eq2.mechanismSequence.join(','), 'Mechanism sequences are different');
  assert(eq1.mechanismSequence[1] === 'DIRECT', 'G7 is DIRECT');
  assert(eq2.mechanismSequence[1] === 'TRITONE_SUBSTITUTION', 'Db7 is TRITONE_SUBSTITUTION');
}

// ═══════════════════════════════════════════════════════════
// Caso 5 — Equivalência por Diminuto
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 5 — Equivalência por Diminuto');
{
  const resG7 = analyzeProgression(['C', 'G7', 'C']);
  const resBdim7 = analyzeProgression(['C', 'Bdim7', 'C']);

  const eqG7 = resolveFunctionalEquivalences(resG7);
  const eqBdim7 = resolveFunctionalEquivalences(resBdim7);

  assert(eqG7.roleSequence.join(',') === eqBdim7.roleSequence.join(','), 'Role sequences are identical (TONIC,DOMINANT,TONIC)');
  assert(eqBdim7.events[1].mechanism === 'DIMINISHED_EQUIVALENCE', `Bdim7 mechanism is DIMINISHED_EQUIVALENCE, got: ${eqBdim7.events[1].mechanism}`);
  assert(eqBdim7.events[1].equivalentRoman === 'vii°7', `Bdim7 equivalentRoman is vii°7, got: ${eqBdim7.events[1].equivalentRoman}`);
}

// ═══════════════════════════════════════════════════════════
// Caso 6 — Equivalência Funcional com Superfície Diferente
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 6 — Equivalência Funcional com Superfície Diferente');
{
  const resDiatonic = analyzeProgression(['C', 'Dm', 'G7', 'C']);
  const resSubstituted = analyzeProgression(['C', 'F', 'Db7', 'C']);

  const eqDiatonic = resolveFunctionalEquivalences(resDiatonic);
  const eqSubstituted = resolveFunctionalEquivalences(resSubstituted);

  assert(
    eqDiatonic.roleSequence.join(',') === 'TONIC,PREDOMINANT,DOMINANT,TONIC',
    `Diatonic role sequence is TONIC,PREDOMINANT,DOMINANT,TONIC, got: ${eqDiatonic.roleSequence.join(',')}`
  );
  assert(
    eqSubstituted.roleSequence.join(',') === 'TONIC,PREDOMINANT,DOMINANT,TONIC',
    `Substituted role sequence is TONIC,PREDOMINANT,DOMINANT,TONIC, got: ${eqSubstituted.roleSequence.join(',')}`
  );

  // functionalSignature derived field check
  assert(
    eqDiatonic.functionalSignature === 'TONIC>PREDOMINANT>DOMINANT>TONIC',
    `Diatonic functionalSignature is derived correctly, got: ${eqDiatonic.functionalSignature}`
  );
  assert(
    eqSubstituted.functionalSignature === 'TONIC>PREDOMINANT>DOMINANT>TONIC',
    `Substituted functionalSignature is derived correctly, got: ${eqSubstituted.functionalSignature}`
  );

  // Mechanism divergence check
  assert(
    eqDiatonic.mechanismSequence.join(',') === 'DIRECT,DIRECT,DIRECT,DIRECT',
    `Diatonic mechanisms are all DIRECT, got: ${eqDiatonic.mechanismSequence.join(',')}`
  );
  assert(
    eqSubstituted.mechanismSequence.join(',') === 'DIRECT,DIRECT,TRITONE_SUBSTITUTION,DIRECT',
    `Substituted mechanisms include TRITONE_SUBSTITUTION, got: ${eqSubstituted.mechanismSequence.join(',')}`
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
