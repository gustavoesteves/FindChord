// Sprint F12 — Apparent Functions & Retrospective Resolution Tests
// Run with: npx tsx src/utils/music/tests/apparentFunctions.test.ts

import { 
  analyzeProgression, 
  generateFingerprint
} from '../analysis/functionalAnalysis';
import type { 
  ApparentFunctionLayerData
} from '../analysis/functionalAnalysis';

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
// Caso 1 — Resolução Imediata (RESOLVED / STRONG)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Resolução Imediata (RESOLVED / STRONG)');
{
  const result = analyzeProgression(['Cmaj7', 'G7', 'Cmaj7']);
  const fp = generateFingerprint(result, { density: 'FULL' });
  const apparentLayer = fp.layers.extendedLayers?.apparentFunction as ApparentFunctionLayerData;

  assert(apparentLayer !== undefined, 'Apparent Function layer generated under FULL density');
  
  if (apparentLayer) {
    assert(apparentLayer.events.length === 3, `Expected 3 events, got ${apparentLayer.events.length}`);
    
    const dominantEvent = apparentLayer.events[1]; // G7
    assert(dominantEvent.originalRoman === 'V7', `G7 original roman is V7, got ${dominantEvent.originalRoman}`);
    assert(dominantEvent.apparentRole === 'DOMINANT', `G7 apparent role is DOMINANT, got ${dominantEvent.apparentRole}`);
    assert(dominantEvent.resolution.status === 'RESOLVED', `G7 status is RESOLVED, got ${dominantEvent.resolution.status}`);
    assert(dominantEvent.resolution.distance === 1, `G7 resolution distance is 1, got ${dominantEvent.resolution.distance}`);
    assert(dominantEvent.resolution.targetChordIndex === 2, `G7 resolves to index 2, got ${dominantEvent.resolution.targetChordIndex}`);
    assert(
      dominantEvent.resolution.strength === 'STRONG' || dominantEvent.resolution.strength === 'MODERATE',
      `G7 resolution strength is STRONG/MODERATE, got ${dominantEvent.resolution.strength}`
    );
    assert(
      apparentLayer.apparentSignature.includes('DOMINANT:R1'),
      `Signature contains DOMINANT:R1, got: "${apparentLayer.apparentSignature}"`
    );
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 2 — Resolução Deceptiva (INTERRUPTED)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Resolução Deceptiva (INTERRUPTED)');
{
  const result = analyzeProgression(['Cmaj7', 'G7', 'Am7']);
  const fp = generateFingerprint(result, { density: 'FULL' });
  const apparentLayer = fp.layers.extendedLayers?.apparentFunction as ApparentFunctionLayerData;

  if (apparentLayer) {
    const dominantEvent = apparentLayer.events[1]; // G7
    assert(dominantEvent.resolution.status === 'INTERRUPTED', `G7 status is INTERRUPTED, got ${dominantEvent.resolution.status}`);
    assert(dominantEvent.apparentSubtype === 'DECEPTIVE_RESOLUTION', `G7 subtype is DECEPTIVE_RESOLUTION`);
    assert(
      apparentLayer.apparentSignature.includes('DOMINANT:I'),
      `Signature contains DOMINANT:I, got: "${apparentLayer.apparentSignature}"`
    );
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Resolução Diferida (DEFERRED)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Resolução Diferida (DEFERRED)');
{
  // G7 (1) -> Dm7 (2) -> G7 (3) -> C (4)
  const result = analyzeProgression(['C', 'G7', 'Dm7', 'G7', 'C']);
  const fp = generateFingerprint(result, { density: 'FULL' });
  const apparentLayer = fp.layers.extendedLayers?.apparentFunction as ApparentFunctionLayerData;

  if (apparentLayer) {
    const firstDominant = apparentLayer.events[1]; // First G7
    assert(firstDominant.resolution.status === 'DEFERRED', `First G7 status is DEFERRED, got ${firstDominant.resolution.status}`);
    assert(firstDominant.resolution.distance === 3, `First G7 resolution distance is 3, got ${firstDominant.resolution.distance}`);
    assert(
      apparentLayer.apparentSignature.includes('DOMINANT:D3'),
      `Signature contains DOMINANT:D3, got: "${apparentLayer.apparentSignature}"`
    );
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 4 — Sexta Aumentada Alemã
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 4 — Sexta Aumentada Alemã');
{
  const result = analyzeProgression(['C', 'Ab7', 'G']);
  const fp = generateFingerprint(result, { density: 'FULL' });
  const apparentLayer = fp.layers.extendedLayers?.apparentFunction as ApparentFunctionLayerData;

  if (apparentLayer) {
    const augmentedEvent = apparentLayer.events[1]; // Ab7
    assert(
      augmentedEvent.apparentRole === 'PREDOMINANT',
      `Ab7 role is PREDOMINANT, got ${augmentedEvent.apparentRole}`
    );
    assert(
      augmentedEvent.apparentSubtype === 'GERMAN_AUGMENTED_SIXTH',
      `Ab7 subtype is GERMAN_AUGMENTED_SIXTH, got ${augmentedEvent.apparentSubtype}`
    );
    assert(augmentedEvent.resolution.status === 'RESOLVED', `Ab7 status is RESOLVED`);
    assert(augmentedEvent.resolution.strength === 'STRONG', `Ab7 strength is STRONG`);
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 5 — Cadencial 6/4
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 5 — Cadencial 6/4');
{
  const result = analyzeProgression(['C', 'C/G', 'G7', 'C']);
  const fp = generateFingerprint(result, { density: 'FULL' });
  const apparentLayer = fp.layers.extendedLayers?.apparentFunction as ApparentFunctionLayerData;

  if (apparentLayer) {
    const cadentialEvent = apparentLayer.events[1]; // C/G
    assert(
      cadentialEvent.apparentRole === 'DOMINANT_PROLONGATION',
      `C/G role is DOMINANT_PROLONGATION, got ${cadentialEvent.apparentRole}`
    );
    assert(
      cadentialEvent.apparentSubtype === 'CADENTIAL_64',
      `C/G subtype is CADENTIAL_64, got ${cadentialEvent.apparentSubtype}`
    );
    assert(cadentialEvent.resolution.status === 'RESOLVED', `C/G status is RESOLVED`);
  }
}

console.log(`\n==================================================`);
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`==================================================`);

if (failed > 0) {
  throw new Error(`apparentFunctions test suite failed with ${failed} failures.`);
}
