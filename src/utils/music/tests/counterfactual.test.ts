// Sprint F10-C.3 — Counterfactual Explainability & Sensitivity Analysis Tests
// Run with: npx tsx src/utils/music/tests/counterfactual.test.ts

import { 
  analyzeProgression, 
  generateFingerprint,
  generateExplainabilityReport,
  compareFingerprints,
  renderExplanation
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
// Caso 1 — Substituição Tritônica (C -> Db7 -> C vs C -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Substituição Tritônica');
{
  const resultQ = analyzeProgression(['C', 'Db7', 'C']);
  const fpQ = generateFingerprint(resultQ, { density: 'FULL' });

  const resultI = analyzeProgression(['C', 'G7', 'C']);
  const fpI = generateFingerprint(resultI, { density: 'FULL' });

  const report = compareFingerprints(fpQ, fpI);
  const expReport = generateExplainabilityReport(fpQ, fpI, report);
  const sens = expReport.sensitivityAnalysis;

  assert(sens !== undefined, 'Sensitivity analysis was generated');
  if (sens) {
    assert(sens.results.length > 0, 'Contains counterfactual results');
    
    const tritoneRes = sens.results.find(r => r.nodeId === 'transformation:tritone_substitution');
    assert(tritoneRes !== undefined, 'Contains result for tritone substitution node');
    
    if (tritoneRes) {
      assert(tritoneRes.scoreImpact >= 0.20, `Tritone ablation impact is significant, got ${tritoneRes.scoreImpact}`);
      assert(tritoneRes.tier === 'CRITICAL' || tritoneRes.tier === 'HIGH', `Tritone tier is CRITICAL or HIGH, got ${tritoneRes.tier}`);
    }

    // Test narrative output
    const explanation = renderExplanation(
      expReport.insights,
      expReport.transformations,
      expReport.interpretiveInsights,
      expReport.causalExplanation,
      sens
    );
    assert(explanation.includes('Substituição Tritônica'), 'Narrative includes friendly name');
    assert(explanation.includes('Crítico') || explanation.includes('Alto'), 'Narrative includes tier level');
    console.log('  Narrativa Contrafactual:\n', explanation.substring(explanation.indexOf('**Análise de Sensibilidade')));
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 2 — Cadencial 6/4 (C -> C/G -> G7 -> C vs C -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Cadencial 6/4');
{
  const resultQ = analyzeProgression(['C', 'C/G', 'G7', 'C']);
  const fpQ = generateFingerprint(resultQ, { density: 'FULL' });

  const resultI = analyzeProgression(['C', 'G7', 'C']);
  const fpI = generateFingerprint(resultI, { density: 'FULL' });

  const report = compareFingerprints(fpQ, fpI);
  const expReport = generateExplainabilityReport(fpQ, fpI, report);
  const sens = expReport.sensitivityAnalysis;

  assert(sens !== undefined, 'Sensitivity analysis was generated for Cadential 6/4');
  if (sens) {
    assert(sens.dominantFactor !== undefined, `Dominant factor identified: ${sens.dominantFactor}`);
    
    // Cadencial reinterpretation deve ser um fator importante
    const cadRes = sens.results.find(r => r.nodeId === 'transformation:cadential_reinterpretation');
    assert(cadRes !== undefined, 'Contains cadential reinterpretation result');
    if (cadRes) {
      assert(cadRes.scoreImpact > 0, `Cadential reinterpretation impact is positive, got ${cadRes.scoreImpact}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Eixo de Voice-Leading vs Tensão Estrutural
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Eixo de Voice-Leading vs Tensão Estrutural');
{
  // Para testar a sensibilidade dos eixos, criamos uma comparação onde as progressões diferem
  // na condução física de vozes mas podem ter eixos de tensão parecidos.
  const resultQ = analyzeProgression(['C', 'F', 'G7', 'C']);
  const fpQ = generateFingerprint(resultQ, { density: 'FULL' });

  // Outra progressão com saltos de vozes maiores
  const resultI = analyzeProgression(['C', 'Bb', 'F', 'C']);
  const fpI = generateFingerprint(resultI, { density: 'FULL' });

  const report = compareFingerprints(fpQ, fpI);
  const expReport = generateExplainabilityReport(fpQ, fpI, report);
  const sens = expReport.sensitivityAnalysis;

  assert(sens !== undefined, 'Sensitivity analysis was generated for Caso 3');
  if (sens) {
    const vlRes = sens.results.find(r => r.nodeId === 'similarity:voice_leading');
    const structRes = sens.results.find(r => r.nodeId === 'similarity:structural');
    
    assert(vlRes !== undefined, 'Voice leading axis results present');
    assert(structRes !== undefined, 'Structural axis results present');
    
    if (vlRes && structRes) {
      console.log(`  Voice Leading Impact = ${vlRes.scoreImpact}, Structural Impact = ${structRes.scoreImpact}`);
      assert(vlRes.scoreImpact >= 0, 'Voice leading impact is valid');
      assert(structRes.scoreImpact >= 0, 'Structural impact is valid');
    }
  }
}

console.log(`\n==================================================`);
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`==================================================`);

if (failed > 0) {
  throw new Error(`Counterfactual explainability tests failed with ${failed} failures.`);
}
