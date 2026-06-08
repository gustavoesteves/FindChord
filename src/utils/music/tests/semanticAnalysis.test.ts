// Sprint F6 — Semantic Harmonic Context Engine Tests (V5)
// Run with: npx tsx src/utils/music/tests/semanticAnalysis.test.ts

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

// Helper to check if any string in array contains substring
function hasExplanation(exps: string[], sub: string): boolean {
  return exps.some(e => e.toLowerCase().includes(sub.toLowerCase()));
}

// ═══════════════════════════════════════════════════════════
// Test 1 — Simple Pop Diatonic (Cmaj7 -> Am7 -> Dm7 -> G7 -> Cmaj7)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 1 — Simple Pop Diatonic (Cmaj7 -> Am7 -> Dm7 -> G7 -> Cmaj7)');
{
  const result = analyzeProgression(['Cmaj7', 'Am7', 'Dm7', 'G7', 'Cmaj7']);
  const chords = result.chords;

  assert(chords.length === 5, 'Has exactly 5 analyzed chords');

  // Cmaj7 (Index 0) - OPENING, PROLONGATION
  const c1 = chords[0];
  assert(c1.semantic !== undefined, 'Cmaj7 (0) has semantic context');
  if (c1.semantic) {
    assert(c1.semantic.phraseRole === 'OPENING', `Cmaj7 (0) role is OPENING, got ${c1.semantic.phraseRole}`);
    assert(c1.semantic.intent === 'PROLONGATION', `Cmaj7 (0) intent is PROLONGATION, got ${c1.semantic.intent}`);
    assert(c1.semantic.supports !== undefined && c1.semantic.supports.includes('PHRASE_OPENING') === true, 'Cmaj7 (0) supports contains PHRASE_OPENING');
    assert(c1.semantic.causes !== undefined && c1.semantic.causes.includes('TONIC_FUNCTION') === true, 'Cmaj7 (0) causes contains TONIC_FUNCTION');
    
    // Validate factual explanations
    assert(hasExplanation(c1.semantic.explanation, 'PRIMARY'), 'Explanation mentions PRIMARY classification');
    assert(hasExplanation(c1.semantic.explanation, 'Tonic function'), 'Explanation mentions Tonic function');
    assert(hasExplanation(c1.semantic.explanation, 'opening area'), 'Explanation mentions opening area');
    assert(hasExplanation(c1.semantic.explanation, 'Prolongs harmonic stability'), 'Explanation mentions prolonging stability');
  }

  // Am7 (Index 1) - BODY, PROLONGATION
  const am = chords[1];
  assert(am.semantic !== undefined, 'Am7 (1) has semantic context');
  if (am.semantic) {
    assert(am.semantic.phraseRole === 'BODY', `Am7 (1) role is BODY, got ${am.semantic.phraseRole}`);
    assert(am.semantic.intent === 'PROLONGATION', `Am7 (1) intent is PROLONGATION, got ${am.semantic.intent}`);
    assert(am.semantic.supports !== undefined && am.semantic.supports.length === 0, 'Am7 (1) has no redundant supports (empty array)');
    assert(am.semantic.causes !== undefined && am.semantic.causes.includes('TONIC_FUNCTION') === true, 'Am7 (1) causes contains TONIC_FUNCTION');

    assert(hasExplanation(am.semantic.explanation, 'PRIMARY'), 'Explanation mentions PRIMARY classification');
    assert(hasExplanation(am.semantic.explanation, 'Tonic function'), 'Explanation mentions Tonic function');
    assert(hasExplanation(am.semantic.explanation, 'body of the phrase'), 'Explanation mentions phrase body');
  }

  // Dm7 (Index 2) - PRE_CADENTIAL, PREPARATION
  const dm = chords[2];
  assert(dm.semantic !== undefined, 'Dm7 (2) has semantic context');
  if (dm.semantic) {
    assert(dm.semantic.phraseRole === 'PRE_CADENTIAL', `Dm7 (2) role is PRE_CADENTIAL, got ${dm.semantic.phraseRole}`);
    assert(dm.semantic.intent === 'PREPARATION', `Dm7 (2) intent is PREPARATION, got ${dm.semantic.intent}`);
    assert(dm.semantic.supports !== undefined && dm.semantic.supports.includes('CADENCE_PREPARATION') === true, 'Dm7 (2) supports contains CADENCE_PREPARATION');
    assert(dm.semantic.causes !== undefined && dm.semantic.causes.includes('SUBDOMINANT_FUNCTION') === true, 'Dm7 (2) causes contains SUBDOMINANT_FUNCTION');

    assert(hasExplanation(dm.semantic.explanation, 'SUBDOMINANT function'), 'Explanation mentions SUBDOMINANT function');
    assert(hasExplanation(dm.semantic.explanation, 'pre-cadential area'), 'Explanation mentions pre-cadential area');
    assert(hasExplanation(dm.semantic.explanation, 'Prepares cadential movement'), 'Explanation mentions preparing cadential movement');
  }

  // G7 (Index 3) - CADENTIAL, ATTRACTION
  const g7 = chords[3];
  assert(g7.semantic !== undefined, 'G7 (3) has semantic context');
  if (g7.semantic) {
    assert(g7.semantic.phraseRole === 'CADENTIAL', `G7 (3) role is CADENTIAL, got ${g7.semantic.phraseRole}`);
    assert(g7.semantic.intent === 'ATTRACTION', `G7 (3) intent is ATTRACTION, got ${g7.semantic.intent}`);
    assert(g7.semantic.supports !== undefined && g7.semantic.supports.includes('CADENCE_TENSION') === true, 'G7 (3) supports contains CADENCE_TENSION');
    assert(g7.semantic.causes !== undefined && g7.semantic.causes.includes('DOMINANT_FUNCTION') === true, 'G7 (3) causes contains DOMINANT_FUNCTION');

    assert(hasExplanation(g7.semantic.explanation, 'DOMINANT function'), 'Explanation mentions DOMINANT function');
    assert(hasExplanation(g7.semantic.explanation, 'active cadential area'), 'Explanation mentions active cadential area');
    assert(hasExplanation(g7.semantic.explanation, 'voice-leading attraction'), 'Explanation mentions voice-leading attraction');
  }

  // Cmaj7 (Index 4) - CLOSING, RESOLUTION
  const c2 = chords[4];
  assert(c2.semantic !== undefined, 'Cmaj7 (4) has semantic context');
  if (c2.semantic) {
    assert(c2.semantic.phraseRole === 'CLOSING', `Cmaj7 (4) role is CLOSING, got ${c2.semantic.phraseRole}`);
    assert(c2.semantic.intent === 'RESOLUTION', `Cmaj7 (4) intent is RESOLUTION, got ${c2.semantic.intent}`);
    assert(c2.semantic.supports !== undefined && c2.semantic.supports.includes('CADENCE_RESOLUTION') === true, 'Cmaj7 (4) supports contains CADENCE_RESOLUTION');
    assert(c2.semantic.supports !== undefined && c2.semantic.supports.includes('PHRASE_CLOSING') === true, 'Cmaj7 (4) supports contains PHRASE_CLOSING');
    assert(c2.semantic.causes !== undefined && c2.semantic.causes.includes('TONIC_FUNCTION') === true, 'Cmaj7 (4) causes contains TONIC_FUNCTION');

    assert(hasExplanation(c2.semantic.explanation, 'cadential resolution'), 'Explanation mentions cadential resolution');
    assert(hasExplanation(c2.semantic.explanation, 'Resolves tension'), 'Explanation mentions resolving tension');
    assert(hasExplanation(c2.semantic.explanation, 'Closes the phrase'), 'Explanation mentions closing the phrase');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 2 — Secondary Intensification (Cmaj7 -> A7 -> Dm7 -> G7 -> Cmaj7)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 2 — Secondary Intensification (Cmaj7 -> A7 -> Dm7 -> G7 -> Cmaj7)');
{
  const result = analyzeProgression(['Cmaj7', 'A7', 'Dm7', 'G7', 'Cmaj7']);
  const chords = result.chords;

  // A7 (Index 1) - CADENTIAL, INTENSIFICATION
  const a7 = chords[1];
  assert(a7.semantic !== undefined, 'A7 (1) has semantic context');
  if (a7.semantic) {
    assert(a7.semantic.phraseRole === 'CADENTIAL', `A7 (1) role is CADENTIAL, got ${a7.semantic.phraseRole}`);
    assert(a7.semantic.intent === 'INTENSIFICATION', `A7 (1) intent is INTENSIFICATION, got ${a7.semantic.intent}`);
    assert(a7.semantic.causes !== undefined && a7.semantic.causes.includes('SECONDARY_DOMINANT') === true, 'A7 (1) causes includes SECONDARY_DOMINANT');
    assert(a7.semantic.causes !== undefined && a7.semantic.causes.includes('TONICIZATION') === true, 'A7 (1) causes includes TONICIZATION');
    
    assert(hasExplanation(a7.semantic.explanation, 'SECONDARY_DOMINANT'), 'Explanation mentions SECONDARY_DOMINANT classification');
    assert(hasExplanation(a7.semantic.explanation, 'Targets ii degree'), 'Explanation mentions targeting ii degree');
    assert(hasExplanation(a7.semantic.explanation, 'Increases harmonic tension'), 'Explanation mentions increasing tension');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 3 — Modal Borrowing Coloration (Cmaj7 -> Fm7 -> Cmaj7)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 3 — Modal Borrowing Coloration (Cmaj7 -> Fm7 -> Cmaj7)');
{
  const result = analyzeProgression(['Cmaj7', 'Fm7', 'Cmaj7']);
  const chords = result.chords;

  // Fm7 (Index 1) - BODY (or cadential/pre_cadential), intent COLORATION
  const fm7 = chords[1];
  assert(fm7.semantic !== undefined, 'Fm7 (1) has semantic context');
  if (fm7.semantic) {
    assert(fm7.semantic.intent === 'COLORATION', `Fm7 (1) intent is COLORATION, got ${fm7.semantic.intent}`);
    assert(fm7.semantic.causes !== undefined && fm7.semantic.causes.includes('MODAL_BORROWING') === true, 'Fm7 (1) causes includes MODAL_BORROWING');
    
    assert(hasExplanation(fm7.semantic.explanation, 'MODAL_BORROWING'), 'Explanation mentions MODAL_BORROWING classification');
    assert(hasExplanation(fm7.semantic.explanation, 'color'), 'Explanation mentions modal/chromatic color');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 4 — Deceptive Cadence Resolution (Cmaj7 -> Am7 -> Dm7 -> G7 -> Am7)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 4 — Deceptive Cadence Resolution (Cmaj7 -> Am7 -> Dm7 -> G7 -> Am7)');
{
  const result = analyzeProgression(['Cmaj7', 'Am7', 'Dm7', 'G7', 'Am7']);
  const chords = result.chords;
  const am2 = chords[4];

  assert(am2.semantic !== undefined, 'Am7 (4) has semantic context');
  if (am2.semantic) {
    assert(am2.semantic.phraseRole === 'CLOSING', `Am7 (4) role is CLOSING, got ${am2.semantic.phraseRole}`);
    assert(am2.semantic.intent === 'RESOLUTION', `Am7 (4) intent is RESOLUTION, got ${am2.semantic.intent}`);
    assert(am2.semantic.supports.includes('CADENCE_RESOLUTION') === true, 'Am7 (4) supports contains CADENCE_RESOLUTION');
    assert(am2.semantic.supports.includes('PHRASE_CLOSING') === true, 'Am7 (4) supports contains PHRASE_CLOSING');
  }
}

// ═══════════════════════════════════════════════════════════
// Test 5 — Half Cadence (Cmaj7 -> Dm7 -> G7)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Test 5 — Half Cadence (Cmaj7 -> Dm7 -> G7)');
{
  const result = analyzeProgression(['Cmaj7', 'Dm7', 'G7']);
  const chords = result.chords;
  const g7 = chords[2];

  assert(g7.semantic !== undefined, 'G7 (2) has semantic context');
  if (g7.semantic) {
    assert(g7.semantic.phraseRole === 'CADENTIAL', `G7 (2) role is CADENTIAL (not CLOSING), got ${g7.semantic.phraseRole}`);
    assert(g7.semantic.intent === 'ATTRACTION', `G7 (2) intent is ATTRACTION (not RESOLUTION), got ${g7.semantic.intent}`);
    assert(g7.semantic.supports.includes('CADENCE_TENSION') === true, 'G7 (2) supports contains CADENCE_TENSION');
    assert(g7.semantic.supports.includes('PHRASE_CLOSING') === true, 'G7 (2) supports contains PHRASE_CLOSING');
    assert(hasExplanation(g7.semantic.explanation, 'Closes the phrase'), 'G7 (2) explanation mentions closing the phrase');
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
