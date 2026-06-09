// Sprint F10-C.2 — Evidence Attribution & Causal Ranking Tests
// Run with: npx tsx src/utils/music/tests/evidenceRanking.test.ts

import { 
  analyzeProgression, 
  generateFingerprint,
  generateExplainabilityReport,
  findSimilarProgressions,
  compareFingerprints,
  renderExplanation
} from '../analysis/functionalAnalysis';
import type { 
  CorpusItem
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
  const graph = expReport.evidenceGraph;
  const contributions = expReport.contributions;
  const explanation = expReport.causalExplanation;

  assert(graph !== undefined, 'Evidence Graph was generated');
  assert(contributions !== undefined && contributions.length > 0, 'Contributions array generated');

  if (contributions && explanation) {
    // 1. Identificação da causa principal (PRIMARY_CAUSE)
    const tritoneContrib = contributions.find(c => c.nodeId === 'transformation:tritone_substitution');
    assert(tritoneContrib !== undefined, 'Contains contribution for tritone substitution transformation');
    
    if (tritoneContrib) {
      assert(tritoneContrib.role === 'PRIMARY_CAUSE', `Tritone substitution role is PRIMARY_CAUSE, got ${tritoneContrib.role}`);
      assert(tritoneContrib.contribution >= 0.80, `Tritone contribution is high, got ${tritoneContrib.contribution}`);
    }

    // 2. Ranking causal hierárquico: Tritone Substitution (0.81) > Voice Leading Preservation (0.70 ou menos)
    const voiceLeadingContrib = contributions.find(c => c.nodeId === 'similarity:voice_leading');
    if (voiceLeadingContrib && tritoneContrib) {
      assert(
        tritoneContrib.contribution > voiceLeadingContrib.contribution,
        `Tritone contribution (${tritoneContrib.contribution}) is greater than voice leading contribution (${voiceLeadingContrib.contribution}) due to causal priority`
      );
    }

    // 3. Explicação estruturada por níveis e em português
    assert(explanation.primaryEvidence.nodeIds.includes('transformation:tritone_substitution'), 'Primary evidence node list includes tritone substitution');
    const textExplanation = renderExplanation(expReport.insights, expReport.transformations, expReport.interpretiveInsights, explanation);
    assert(textExplanation.includes('Substituição Tritônica'), 'Narrative explanation text includes "Substituição Tritônica"');
    assert(textExplanation.includes('%'), 'Narrative explanation text includes percentage attributes');
    console.log('  Narrativa gerada:\n', textExplanation.split('\n')[0]);
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
  const contributions = expReport.contributions;
  const explanation = expReport.causalExplanation;

  assert(contributions !== undefined && contributions.length > 0, 'Contributions array generated for Cadential 6/4');

  if (contributions && explanation) {
    const cadReinterpretContrib = contributions.find(c => c.nodeId === 'transformation:cadential_reinterpretation');
    assert(cadReinterpretContrib !== undefined, 'Contains cadential reinterpretation contribution');

    if (cadReinterpretContrib) {
      assert(cadReinterpretContrib.role === 'PRIMARY_CAUSE', `Cadential reinterpretation role is PRIMARY_CAUSE, got ${cadReinterpretContrib.role}`);
      assert(cadReinterpretContrib.contribution >= 0.80, `Cadential reinterpretation contribution score is high, got ${cadReinterpretContrib.contribution}`);
    }

    // Verificação dos grupos estruturados
    assert(explanation.primaryEvidence.nodeIds.includes('transformation:cadential_reinterpretation'), 'Primary evidence list includes cadential reinterpretation');
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Coincidência de Causa Primária (primaryReason coincide com a evidência de maior contribuição)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Coincidência de Causa Primária');
{
  const corpus: CorpusItem[] = [
    {
      id: 'prog_tritone',
      name: 'Sub Tritônica Item',
      progression: ['C', 'G7', 'C'],
      harmonicCategory: 'DIATONIC_AXIS',
      functionalCategory: 'CADENTIAL_PROGRESSION'
    }
  ];

  const queryResult = analyzeProgression(['C', 'Db7', 'C']);
  const queryFp = generateFingerprint(queryResult, { density: 'FULL' });

  const matches = findSimilarProgressions(queryFp, corpus, { strategy: 'OVERALL' });
  assert(matches.length > 0, 'Discovery Engine returned match');

  if (matches.length > 0) {
    const match = matches[0];
    assert(match.primaryReason !== undefined, 'Match contains primaryReason');
    if (match.primaryReason && match.contributions) {
      // O primaryReason.type deve coincidir com o mecanismo da principal causa
      assert(match.primaryReason.type === 'TRITONE_SUBSTITUTION', `Primary reason type is TRITONE_SUBSTITUTION, got ${match.primaryReason.type}`);
      assert(match.primaryReason.confidence === match.contributions[0].contribution, `Confidence matches top contribution score, got ${match.primaryReason.confidence} vs ${match.contributions[0].contribution}`);
    }
  }
}

console.log(`\n==================================================`);
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`==================================================`);

if (failed > 0) {
  throw new Error(`Evidence ranking and attribution tests failed with ${failed} failures.`);
}
