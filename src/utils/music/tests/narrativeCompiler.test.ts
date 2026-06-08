// Sprint F9 — Harmonic Narrative Fact Engine & Compiler Tests
// Run with: npx tsx src/utils/music/tests/narrativeCompiler.test.ts

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
// Caso 1 — Período e Resolução Autêntica (C -> G7 -> C -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Período e Resolução Autêntica');
{
  const result = analyzeProgression([
    'C', 'G7', 'C',
    'C', 'G7', 'C'
  ]);

  assert(result.narrativeFacts !== undefined, 'narrativeFacts is defined');
  assert(result.narrativeExplanation !== undefined, 'narrativeExplanation is defined');

  if (result.narrativeFacts && result.narrativeExplanation) {
    const facts = result.narrativeFacts;
    const expl = result.narrativeExplanation;

    // Deve ter gerado fatos de período ou frases avulsas
    const periodFacts = facts.overviewFacts.filter(f => f.type === 'PERIOD_RELATION');
    const standaloneFacts = facts.overviewFacts.filter(f => f.type === 'STANDALONE_PHRASE');
    assert(periodFacts.length > 0 || standaloneFacts.length > 0, 'Found period or standalone overview facts');

    // Valida se a visão geral em português foi gerada
    assert(expl.overview.length > 0, 'Overview narrative text is generated');
    const lowerOverview = expl.overview.toLowerCase();
    assert(lowerOverview.includes('frase') || lowerOverview.includes('progressão'), 'Overview describes phrases/progression');


    // Acorde 1 (G7) deve ter resolução dominante
    const g7Facts = facts.chordFacts[1] || [];
    assert(g7Facts.some(f => f.type === 'PRIMARY_DOMINANT_RESOLUTION'), 'Chord G7 has PRIMARY_DOMINANT_RESOLUTION fact');
    
    // Prioridades e SourceEngines
    const resFact = g7Facts.find(f => f.type === 'PRIMARY_DOMINANT_RESOLUTION');
    if (resFact) {
      assert(resFact.priority === 90, 'PRIMARY_DOMINANT_RESOLUTION has priority 90');
      assert(resFact.sourceEngine === 'F7', 'PRIMARY_DOMINANT_RESOLUTION has sourceEngine F7');
    }

    const g7Expl = expl.chords[1];
    assert(g7Expl.roleDescription.includes('Resolução'), `G7 role is resolution-based, got: ${g7Expl.roleDescription}`);
    assert(g7Expl.compositionalChoice.includes('resolução') || g7Expl.compositionalChoice.includes('liberando'), 'G7 compositional choice explains resolution');
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 2 — Dominante Secundária (C -> A7 -> Dm -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Dominante Secundária');
{
  const result = analyzeProgression(['C', 'A7', 'Dm', 'G7', 'C']);

  if (result.narrativeFacts && result.narrativeExplanation) {
    const facts = result.narrativeFacts;
    const expl = result.narrativeExplanation;

    // Acorde 1 (A7) deve ser dominante secundária preparando o acorde 2 (Dm)
    const a7Facts = facts.chordFacts[1] || [];
    const secDomFact = a7Facts.find(f => f.type === 'SECONDARY_DOMINANT_PREPARATION');
    
    assert(secDomFact !== undefined, 'A7 chord has SECONDARY_DOMINANT_PREPARATION fact');
    if (secDomFact) {
      assert(secDomFact.priority === 100, 'SECONDARY_DOMINANT_PREPARATION has priority 100');
      assert(secDomFact.sourceEngine === 'F6', 'SECONDARY_DOMINANT_PREPARATION has sourceEngine F6');
    }

    const a7Expl = expl.chords[1];
    assert(a7Expl.roleDescription === 'Dominante Secundária', 'A7 role description is Dominante Secundária');
    assert(a7Expl.compositionalChoice.includes('dominante secundária') || a7Expl.compositionalChoice.includes('preparar'), 'A7 choice explains secondary dominant function');
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Empréstimo Modal (C -> Fm -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Empréstimo Modal');
{
  const result = analyzeProgression(['C', 'Fm', 'C']);

  if (result.narrativeFacts && result.narrativeExplanation) {
    const facts = result.narrativeFacts;
    const expl = result.narrativeExplanation;

    // Acorde 1 (Fm) deve ser empréstimo modal
    const fmFacts = facts.chordFacts[1] || [];
    const modalFact = fmFacts.find(f => f.type === 'MODAL_BORROWING_COLORATION');

    assert(modalFact !== undefined, 'Fm chord has MODAL_BORROWING_COLORATION fact');
    if (modalFact) {
      assert(modalFact.priority === 85, 'MODAL_BORROWING_COLORATION has priority 85');
      assert(modalFact.sourceEngine === 'F6', 'MODAL_BORROWING_COLORATION has sourceEngine F6');
    }

    const fmExpl = expl.chords[1];
    assert(fmExpl.roleDescription === 'Empréstimo Modal', 'Fm role description is Empréstimo Modal');
    assert(fmExpl.compositionalChoice.includes('empréstimo modal') || fmExpl.compositionalChoice.includes('dramática'), 'Fm choice explains modal borrowing');
  }
}

console.log(`\n=== RESULTADOS: ${passed} passados, ${failed} falhos ===`);
if (failed > 0) {
  throw new Error(`narrativeCompiler test suite failed with ${failed} failures.`);
}

