// Sprint Infra-3 — Harmonic Narrative Fingerprint Engine Tests
// Run with: npx tsx src/utils/music/tests/narrativeFingerprint.test.ts

import { analyzeProgression } from '../analysis/functionalAnalysis';
import { generateFingerprint } from '../analysis/narrative/narrativeFingerprint';

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
// Caso 1 — Independência de Tom (Transposição C vs G)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Independência de Tom (Transposição)');
{
  const resultC = analyzeProgression(['C', 'Am', 'Dm', 'G7', 'C']);
  const resultG = analyzeProgression(['G', 'Em', 'Am', 'D7', 'G']);

  assert(resultC.fingerprint !== undefined, 'Fingerprint exists for progression in C');
  assert(resultG.fingerprint !== undefined, 'Fingerprint exists for progression in G');

  if (resultC.fingerprint && resultG.fingerprint) {
    const fpC = resultC.fingerprint;
    const fpG = resultG.fingerprint;

    // A versão e as chaves originais devem ser mapeadas
    assert(fpC.version === '1.0.0', 'C fingerprint version is 1.0.0');
    assert(fpC.metadata.sourceKey === 'C MAJOR', `C fingerprint sourceKey is C MAJOR, got: ${fpC.metadata.sourceKey}`);
    assert(fpG.metadata.sourceKey === 'G MAJOR', `G fingerprint sourceKey is G MAJOR, got: ${fpG.metadata.sourceKey}`);
    assert(fpC.metadata.transpositionInvariant === true, 'C fingerprint transpositionInvariant flag is true');
    assert(fpC.metadata.chordsCount === 5, 'C fingerprint chord count is 5');
    assert(fpG.metadata.chordsCount === 5, 'G fingerprint chord count is 5');

    // Layer 1 (Structural): Devem ter as mesmas tensões e estados de tensão/resolução
    if (fpC.layers.structural && fpG.layers.structural) {
      const structuralC = fpC.layers.structural.events;
      const structuralG = fpG.layers.structural.events;

      assert(structuralC.length === structuralG.length, 'Structural layers have identical length');
      
      let allMatch = true;
      for (let i = 0; i < structuralC.length; i++) {
        if (structuralC[i].state !== structuralG[i].state || 
            Math.abs(structuralC[i].relativeTension - structuralG[i].relativeTension) > 0.01) {
          allMatch = false;
        }
      }
      assert(allMatch, 'Structural events (states & tensions) match exactly between C and G progressions');
    } else {
      assert(false, 'Structural layers are defined');
    }

    // Layer 4 (Regional): Ambas devem ter apenas a região inicial (grau I/i), visto que são diatônicas
    if (fpC.layers.regional && fpG.layers.regional) {
      assert(fpC.layers.regional.regionsVisited[0] === 'I', 'C regional pathway starts with relative home key: I');
      assert(fpG.layers.regional.regionsVisited[0] === 'I', 'G regional pathway starts with relative home key: I');
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 2 — Dispositivos Harmônicos (Dominante Secundária e Modulação)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Dominantes Secundárias e Modulações');
{
  const result = analyzeProgression(['C', 'A7', 'Dm', 'G7', 'C']);

  if (result.fingerprint) {
    const fp = result.fingerprint;

    // Layer 2 (Harmonic): Deve conter a dominante secundária
    if (fp.layers.harmonic) {
      const harmonic = fp.layers.harmonic;
      assert(harmonic.devices.length > 0, 'Harmonic layer has devices');
      
      const secDom = harmonic.devices.find(d => d.deviceType === 'SECONDARY_DOMINANT');
      assert(secDom !== undefined, 'Found SECONDARY_DOMINANT in harmonic devices');
      if (secDom) {
        assert(secDom.chordIndex === 1, 'SECONDARY_DOMINANT device is at chord index 1 (A7)');
      }
      assert(harmonic.deviceFrequency['SECONDARY_DOMINANT'] === 1, 'Secondary dominant frequency is 1');
    } else {
      assert(false, 'Harmonic layer is defined');
    }

    // Layer 3 (Formal): Deve capturar frases estruturais
    if (fp.layers.formal) {
      const formal = fp.layers.formal;
      assert(formal.totalPhrases > 0, 'Formal layer captured phrase structure');
      assert(formal.phrases[0].startChordIndex === 0, 'First formal phrase starts at chord 0');
    } else {
      assert(false, 'Formal layer is defined');
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Resolução Deceptiva e Empréstimo Modal
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Resolução Deceptiva e Empréstimo Modal');
{
  const resultDeceptive = analyzeProgression(['C', 'G7', 'Am']);
  const resultBorrowing = analyzeProgression(['C', 'Fm', 'C']);

  if (resultDeceptive.fingerprint && resultBorrowing.fingerprint) {
    const fpDeceptive = resultDeceptive.fingerprint;
    const fpBorrowing = resultBorrowing.fingerprint;

    // Deceptive cadence check
    if (fpDeceptive.layers.harmonic) {
      const harmonic = fpDeceptive.layers.harmonic;
      const deceptive = harmonic.devices.find(d => d.deviceType === 'DECEPTIVE_CADENCE');
      assert(deceptive !== undefined, 'Found DECEPTIVE_CADENCE device in C - G7 - Am');
    }

    // Modal borrowing check
    if (fpBorrowing.layers.harmonic) {
      const harmonic = fpBorrowing.layers.harmonic;
      const borrow = harmonic.devices.find(d => d.deviceType === 'MODAL_BORROWING');
      assert(borrow !== undefined, 'Found MODAL_BORROWING device in C - Fm - C');
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 4 — Opções de Densidade (density CORE vs STANDARD vs FULL)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 4 — Opções de Densidade');
{
  const result = analyzeProgression(['C', 'Am', 'Dm', 'G7', 'C']);
  
  const fpCore = generateFingerprint(result, { density: 'CORE' });
  const fpStandard = generateFingerprint(result, { density: 'STANDARD' });
  const fpFull = generateFingerprint(result, { density: 'FULL' });
  const fpCustom = generateFingerprint(result, { layers: ['STRUCTURAL', 'REGIONAL'] });
  const fpUnion = generateFingerprint(result, { density: 'CORE', layers: ['VOICE_LEADING'] });

  // CORE deve calcular apenas layers 1-4
  assert(fpCore.layers.structural !== undefined, 'CORE density has structural layer');
  assert(fpCore.layers.harmonic !== undefined, 'CORE density has harmonic layer');
  assert(fpCore.layers.formal !== undefined, 'CORE density has formal layer');
  assert(fpCore.layers.regional !== undefined, 'CORE density has regional layer');
  assert(fpCore.layers.extendedLayers === undefined, 'CORE density does NOT have extendedLayers');

  // STANDARD deve calcular layers 1-6 (incluindo voice leading placeholder em extendedLayers)
  assert(fpStandard.layers.structural !== undefined, 'STANDARD density has structural layer');
  assert(fpStandard.layers.extendedLayers !== undefined, 'STANDARD density has extendedLayers');
  assert(fpStandard.layers.extendedLayers?.voiceLeading !== undefined, 'STANDARD density has voiceLeading layer placeholder');
  assert(fpStandard.layers.extendedLayers?.apparentFunction === undefined, 'STANDARD density does NOT have apparentFunction layer');

  // FULL deve calcular todos os placeholders em extendedLayers
  assert(fpFull.layers.extendedLayers?.apparentFunction !== undefined, 'FULL density has apparentFunction layer placeholder');

  // CUSTOM deve calcular apenas as camadas solicitadas
  assert(fpCustom.layers.structural !== undefined, 'CUSTOM options has structural layer');
  assert(fpCustom.layers.regional !== undefined, 'CUSTOM options has regional layer');
  assert(fpCustom.layers.harmonic === undefined, 'CUSTOM options does NOT have harmonic layer');

  // UNION deve calcular CORE (1-4) + a camada voice leading solicitada
  assert(fpUnion.layers.structural !== undefined, 'UNION options has structural layer');
  assert(fpUnion.layers.extendedLayers !== undefined, 'UNION options has extendedLayers');
  assert(fpUnion.layers.extendedLayers?.voiceLeading !== undefined, 'UNION options has voiceLeading layer placeholder via layers extension');
  assert(fpUnion.layers.extendedLayers?.apparentFunction === undefined, 'UNION options does NOT have apparentFunction layer');
}

console.log(`\n=== RESULTADOS: ${passed} passados, ${failed} falhos ===`);
if (failed > 0) {
  throw new Error(`narrativeFingerprint test suite failed with ${failed} failures.`);
}
