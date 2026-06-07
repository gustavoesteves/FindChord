// Sprint 12A — Tonal Narrative & Structural Reduction Tests
// Run with: npx tsx src/utils/music/tests/tonalNarrative.test.ts

import { analyzeProgression, generateTonalNarrative } from '../analysis/functionalAnalysis';
import type { TonalRegion, TonalSummary } from '../analysis/models/FunctionalAnalysis';

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
// Caso 1 — Pop Diatônico Simples (STATIC)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Diatônico Simples (STATIC) (Cmaj7 -> Fmaj7 -> G7 -> Cmaj7)');
{
  const analysis = analyzeProgression(['Cmaj7', 'Fmaj7', 'G7', 'Cmaj7']);
  
  assert(analysis.narrative !== undefined, 'narrative is defined');
  if (analysis.narrative) {
    const n = analysis.narrative;
    assert(n.narrativeType === 'STATIC', `narrativeType is STATIC (got ${n.narrativeType})`);
    assert(n.primaryTrajectory.length === 1, `primaryTrajectory has length 1 (got ${n.primaryTrajectory.length})`);
    assert(n.primaryTrajectory[0].root === 'C' && n.primaryTrajectory[0].mode === 'MAJOR', 'Trajectory contains only C MAJOR');
    assert(n.summaryText.includes('permanece totalmente estável'), `summaryText is appropriate: "${n.summaryText}"`);
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 2 — Cadeia de Tonicizações (TONICIZATION_CHAIN)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Cadeia de Tonicizações (TONICIZATION_CHAIN)');
{
  const homeKey = { root: 'C', mode: 'MAJOR' as const, confidence: 1.0 };
  const mockRegions: TonalRegion[] = [
    { key: homeKey, startIndex: 0, endIndex: 1, duration: 2, type: 'ESTABLISHED_MODULATION', isHomeKey: true, stabilityScore: 0.90, cadenceIndexes: [] },
    { key: { root: 'D', mode: 'MINOR' as const, confidence: 0.8 }, startIndex: 2, endIndex: 3, duration: 2, type: 'TONICIZATION', isHomeKey: false, stabilityScore: 0.30, cadenceIndexes: [] },
    { key: homeKey, startIndex: 4, endIndex: 5, duration: 2, type: 'ESTABLISHED_MODULATION', isHomeKey: true, stabilityScore: 0.90, cadenceIndexes: [] }
  ];

  const mockSummary: TonalSummary = {
    homeKey,
    tonalComplexity: 0.2,
    tonalStability: 0.8,
    regionalCoherenceScore: 1.0,
    modulationCount: 0,
    tonicizationCount: 1,
    longestRegion: mockRegions[0],
    deepestNestingLevel: 0,
    visitedKeys: [homeKey, mockRegions[1].key],
    regionalTransitionCount: 2,
    keyModulationRelations: ['DISTANT', 'DISTANT'],
    cadenceCount: 0,
    resolvedCadenceCount: 0,
    modalBorrowingCount: 0,
    secondaryFunctionCount: 0,
    chromaticChordCount: 0
  };

  const n = generateTonalNarrative(mockRegions, null, [], mockSummary);
  assert(n !== null, 'Narrative generated');
  if (n) {
    assert(n.narrativeType === 'TONICIZATION_CHAIN', `narrativeType is TONICIZATION_CHAIN (got ${n.narrativeType})`);
    assert(n.primaryTrajectory.length === 1, `primaryTrajectory filters out local tonicizations (got length ${n.primaryTrajectory.length})`);
    assert(n.primaryTrajectory[0].root === 'C' && n.primaryTrajectory[0].mode === 'MAJOR', 'Primary trajectory remains C MAJOR');
    assert(n.summaryText.includes('apresentando breves tonicizações'), `summaryText details local desvios: "${n.summaryText}"`);
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Round Trip (C -> Am -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Modulação com Retorno (ROUND_TRIP) (C -> Am -> C)');
{
  const analysis = analyzeProgression([
    'Cmaj7', 'Dm7', 'G7', 'Cmaj7', 'Bm7(b5)', 'E7', 'Am7', 'Dm7', 'G7', 'Cmaj7'
  ]);
  
  assert(analysis.narrative !== undefined, 'narrative is defined');
  if (analysis.narrative) {
    const n = analysis.narrative;
    assert(n.narrativeType === 'ROUND_TRIP', `narrativeType is ROUND_TRIP (got ${n.narrativeType})`);
    
    // Trajetória deve ser C -> Am -> C
    assert(n.primaryTrajectory.length === 3, `primaryTrajectory has 3 steps (got ${n.primaryTrajectory.length})`);
    if (n.primaryTrajectory.length === 3) {
      assert(n.primaryTrajectory[0].root === 'C', 'Starts in C');
      assert(n.primaryTrajectory[1].root === 'A' && n.primaryTrajectory[1].mode === 'MINOR', 'Modulates to Am');
      assert(n.primaryTrajectory[2].root === 'C', 'Returns to C');
    }
    
    // Deve haver um evento estrutural marcando modulação de C para Am
    const e = n.structuralEvents.find(ev => ev.relation === 'RELATIVE');
    assert(e !== undefined, 'Registered RELATIVE modulation event');
    if (e) {
      assert(e.significance === 'STRUCTURAL', `Event significance is STRUCTURAL (got ${e.significance})`);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 4 — Modulação Direta (MODULATING) (C -> G)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 4 — Modulação Direta (MODULATING) (Cmaj7 -> Fmaj7 -> Cmaj7 -> D7 -> Gmaj7 -> Am7 -> D7 -> Gmaj7)');
{
  const analysis = analyzeProgression(['Cmaj7', 'Fmaj7', 'Cmaj7', 'D7', 'Gmaj7', 'Am7', 'D7', 'Gmaj7']);
  
  assert(analysis.narrative !== undefined, 'narrative is defined');
  if (analysis.narrative) {
    const n = analysis.narrative;
    assert(n.narrativeType === 'MODULATING', `narrativeType is MODULATING (got ${n.narrativeType})`);
    assert(n.primaryTrajectory.length === 2, `primaryTrajectory has 2 steps (got ${n.primaryTrajectory.length})`);
    if (n.primaryTrajectory.length === 2) {
      assert(n.primaryTrajectory[0].root === 'C', 'Departure key C');
      assert(n.primaryTrajectory[1].root === 'G', 'Arrival key G');
    }
    assert(n.summaryText.includes('modulação estrutural direta'), `summaryText points out direct modulation: "${n.summaryText}"`);
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 5 — Teste de Limiar Regional (REGIONAL_SHIFT >= 0.45)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 5 — Unit Test: Limiar Regional (REGIONAL_SHIFT >= 0.45)');
{
  const homeKey = { root: 'C', mode: 'MAJOR' as const, confidence: 1.0 };
  const mockRegions: TonalRegion[] = [
    { key: homeKey, startIndex: 0, endIndex: 3, duration: 4, type: 'ESTABLISHED_MODULATION', isHomeKey: true, stabilityScore: 0.90, cadenceIndexes: [] },
    // Shift instável (stability 0.30)
    { key: { root: 'D', mode: 'MAJOR' as const, confidence: 0.8 }, startIndex: 4, endIndex: 7, duration: 4, type: 'REGIONAL_SHIFT', isHomeKey: false, stabilityScore: 0.30, cadenceIndexes: [] },
    // Shift estável (stability 0.50)
    { key: { root: 'E', mode: 'MAJOR' as const, confidence: 0.9 }, startIndex: 8, endIndex: 11, duration: 4, type: 'REGIONAL_SHIFT', isHomeKey: false, stabilityScore: 0.50, cadenceIndexes: [] }
  ];

  const mockSummary: TonalSummary = {
    homeKey,
    tonalComplexity: 0.5,
    tonalStability: 0.5,
    regionalCoherenceScore: 1.0,
    modulationCount: 0,
    tonicizationCount: 0,
    longestRegion: mockRegions[0],
    deepestNestingLevel: 0,
    visitedKeys: [homeKey, mockRegions[1].key, mockRegions[2].key],
    regionalTransitionCount: 2,
    keyModulationRelations: ['DISTANT', 'DISTANT'],
    cadenceCount: 0,
    resolvedCadenceCount: 0,
    modalBorrowingCount: 0,
    secondaryFunctionCount: 0,
    chromaticChordCount: 0
  };

  const narrative = generateTonalNarrative(mockRegions, null, [], mockSummary);
  assert(narrative !== null, 'Narrative generated successfully');
  if (narrative) {
    // Apenas a Home Key e a região de E Major estável (0.50 >= 0.45) devem entrar na redução.
    // D Major instável (0.30 < 0.45) deve ser descartada.
    assert(narrative.primaryTrajectory.length === 2, `primaryTrajectory has 2 entries (got ${narrative.primaryTrajectory.length})`);
    if (narrative.primaryTrajectory.length === 2) {
      assert(narrative.primaryTrajectory[0].root === 'C', 'First structural key is C');
      assert(narrative.primaryTrajectory[1].root === 'E', 'Second structural key is E (stable shift included, D excluded)');
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Resumo Geral
// ═══════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(50)}`);
console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'═'.repeat(50)}\n`);

if (failed > 0) {
  throw new Error(`${failed} tests failed!`);
}
