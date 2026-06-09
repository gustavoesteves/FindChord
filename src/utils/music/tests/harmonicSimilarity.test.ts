// Sprint F10-A — Harmonic Similarity Engine Tests
// Run with: npx tsx src/utils/music/tests/harmonicSimilarity.test.ts

import { analyzeProgression } from '../analysis/functionalAnalysis';
import { generateFingerprint } from '../analysis/narrative/narrativeFingerprint';
import { compareFingerprints } from '../analysis/similarity/similarityEngine';

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
// Caso 1 — Identidade & Transposição
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Identidade & Transposição');
{
  const resultC1 = analyzeProgression(['C', 'Am', 'Dm', 'G7', 'C']);
  const resultC2 = analyzeProgression(['C', 'Am', 'Dm', 'G7', 'C']);
  const resultG = analyzeProgression(['G', 'Em', 'Am', 'D7', 'G']);

  const fpC1 = generateFingerprint(resultC1, { density: 'STANDARD' });
  const fpC2 = generateFingerprint(resultC2, { density: 'STANDARD' });
  const fpG = generateFingerprint(resultG, { density: 'STANDARD' });

  // 1. Identidade absoluta
  const resIdent = compareFingerprints(fpC1, fpC2);
  assert(
    Math.abs(resIdent.overallScore - 1.0) < 0.001,
    'Absolute identity similarity is 1.00',
    `got: ${resIdent.overallScore}`
  );
  assert(resIdent.breakdown.structural === 1.0, 'Structural similarity is 1.0');
  assert(resIdent.breakdown.harmonic === 1.0, 'Harmonic similarity is 1.0');
  assert(resIdent.breakdown.formal === 1.0, 'Formal similarity is 1.0');
  assert(resIdent.breakdown.regional === 1.0, 'Regional similarity is 1.0');
  assert(resIdent.breakdown.functional === 1.0, 'Functional similarity is 1.0');
  assert(resIdent.breakdown.voiceLeading === 1.0, 'Voice leading similarity is 1.0');

  // 2. Invariância de Transposição
  const resTransp = compareFingerprints(fpC1, fpG);
  console.log('  -> resTransp breakdown:', resTransp.breakdown);
  console.log('  -> resTransp overallScore:', resTransp.overallScore);
  assert(
    resTransp.breakdown.structural === 1.0 &&
    resTransp.breakdown.harmonic === 1.0 &&
    resTransp.breakdown.formal === 1.0 &&
    resTransp.breakdown.regional === 1.0 &&
    resTransp.breakdown.functional === 1.0 &&
    resTransp.breakdown.voiceLeading !== undefined && resTransp.breakdown.voiceLeading > 0.95,
    'Transposition equivalence (C -> G) is valid'
  );
}

// ═══════════════════════════════════════════════════════════
// Caso 2 — Substituição Tritônica & Equivalência Funcional
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Substituição Tritônica & Equivalência Funcional');
{
  const resultDom = analyzeProgression(['C', 'G7', 'C']);
  const resultSub = analyzeProgression(['C', 'Db7', 'C']);

  const fpDom = generateFingerprint(resultDom, { density: 'STANDARD' });
  const fpSub = generateFingerprint(resultSub, { density: 'STANDARD' });

  const res = compareFingerprints(fpDom, fpSub);
  console.log('  -> Case 2 breakdown:', res.breakdown);
  console.log('  -> Case 2 overallScore:', res.overallScore);

  // similaridade funcional deve ser muito alta porque ambos fazem TONIC -> DOMINANT -> TONIC
  assert(
    res.breakdown.functional !== undefined && res.breakdown.functional > 0.95,
    `Functional equivalence similarity is high (>0.95), got: ${res.breakdown.functional}`
  );

  // similaridade harmônica deve ser menor devido ao uso de TRITONE_SUBSTITUTION vs DIATONIC
  assert(
    res.breakdown.harmonic !== undefined && res.breakdown.harmonic < 0.92,
    `Harmonic device similarity is lower (<0.92) due to tritone substitution, got: ${res.breakdown.harmonic}`
  );

  // similaridade geral intermediária
  assert(
    res.overallScore > 0.90 && res.overallScore < 0.99,
    `Overall similarity is within expected range (0.90 - 0.99), got: ${res.overallScore}`
  );
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Diferenças Formais & Regionais (Diatônica vs Modulante)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Diferenças Formais & Regionais');
{
  const resultDiatonic = analyzeProgression(['C', 'Am', 'Dm', 'G7', 'C']);
  // Progressão modulante longa que muda claramente de região
  const resultModulating = analyzeProgression(['C', 'F', 'G7', 'C', 'G7', 'C', 'A7', 'D', 'Em', 'A7', 'D']);

  const fpDiatonic = generateFingerprint(resultDiatonic, { density: 'STANDARD' });
  const fpModulating = generateFingerprint(resultModulating, { density: 'STANDARD' });

  const res = compareFingerprints(fpDiatonic, fpModulating);
  console.log('  -> Diatonic regionsVisited:', fpDiatonic.layers.regional?.regionsVisited);
  console.log('  -> Modulating regionsVisited:', fpModulating.layers.regional?.regionsVisited);
  console.log('  -> Case 3 breakdown:', res.breakdown);

  // Similaridade regional deve ser menor porque a modulante visita II (D maior)
  assert(
    res.breakdown.regional !== undefined && res.breakdown.regional < 0.85,
    `Regional similarity is lower (<0.85) due to different regional paths, got: ${res.breakdown.regional}`
  );

  // Similaridade funcional deve ser menor
  assert(
    res.breakdown.functional !== undefined && res.breakdown.functional < 0.75,
    `Functional similarity is lower (<0.75) due to different length and roles, got: ${res.breakdown.functional}`
  );

  // A similaridade estrutural de tensão ainda é calculada
  assert(
    res.breakdown.structural !== undefined && res.breakdown.structural > 0.20,
    `Structural similarity is present (>0.20), got: ${res.breakdown.structural}`
  );
}

// ═══════════════════════════════════════════════════════════
// Caso 4 — Redistribuição Dinâmica de Pesos
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 4 — Redistribuição Dinâmica de Pesos');
{
  const result1 = analyzeProgression(['C', 'Am', 'Dm', 'G7', 'C']);
  const result2 = analyzeProgression(['C', 'F', 'G', 'C']);

  // Gerados na densidade CORE (sem extendedLayers para Layer 5 ou Layer 6)
  const fpCore1 = generateFingerprint(result1, { density: 'CORE' });
  const fpCore2 = generateFingerprint(result2, { density: 'CORE' });

  const res = compareFingerprints(fpCore1, fpCore2);

  // Deve computar sem estourar exceção
  assert(
    res.overallScore !== undefined && res.overallScore >= 0.0 && res.overallScore <= 1.0,
    `Overall score calculated successfully for CORE density: ${res.overallScore}`
  );

  // Camadas estendidas não devem aparecer no breakdown
  assert(res.breakdown.functional === undefined, 'Functional similarity is undefined in CORE comparison');
  assert(res.breakdown.voiceLeading === undefined, 'Voice leading similarity is undefined in CORE comparison');

  // Os pesos das ativas devem somar exatamente 1.0
  const sumWeights = 
    res.activeWeights.structural + 
    res.activeWeights.harmonic + 
    res.activeWeights.formal + 
    res.activeWeights.regional + 
    res.activeWeights.functional + 
    res.activeWeights.voiceLeading;

  assert(
    Math.abs(sumWeights - 1.0) < 0.001,
    `Active weights sum up to exactly 1.00 (got: ${sumWeights})`
  );

  assert(
    res.activeWeights.functional === 0 && res.activeWeights.voiceLeading === 0,
    'Functional and Voice Leading weights are set to 0.0'
  );

  assert(
    res.activeWeights.structural > 0.25,
    `Structural weight was increased proportionally (from 0.25 to ${res.activeWeights.structural})`
  );
}

console.log(`\n==================================================`);
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`==================================================`);

if (failed > 0) {
  throw new Error(`harmonicSimilarity test suite failed with ${failed} failures.`);
}
