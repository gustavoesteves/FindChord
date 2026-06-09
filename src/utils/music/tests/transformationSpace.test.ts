// Sprint F10-C.4 — Recommendation Readiness & Transformation Space Tests
// Run with: npx tsx src/utils/music/tests/transformationSpace.test.ts

import { 
  analyzeProgression, 
  generateFingerprint,
  prepareCorpus,
  findSimilarProgressions,
  TRANSFORMATION_TEMPLATES,
  detectOpportunities
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
// 1. Catálogo Formal de Modelos
// ═══════════════════════════════════════════════════════════
console.log('\n📦 Catálogo Formal de Modelos');
{
  assert(TRANSFORMATION_TEMPLATES.length === 5, 'Contains exactly 5 templates in catalog');
  
  const tritone = TRANSFORMATION_TEMPLATES.find(t => t.mechanism === 'TRITONE_SUBSTITUTION');
  const modal = TRANSFORMATION_TEMPLATES.find(t => t.mechanism === 'MODAL_BORROWING');
  const cadential = TRANSFORMATION_TEMPLATES.find(t => t.mechanism === 'CADENTIAL_REINTERPRETATION');
  const compression = TRANSFORMATION_TEMPLATES.find(t => t.mechanism === 'FUNCTIONAL_COMPRESSION');
  const expansion = TRANSFORMATION_TEMPLATES.find(t => t.mechanism === 'FUNCTIONAL_EXPANSION');

  assert(tritone !== undefined, 'Tritone template is cataloged');
  assert(modal !== undefined, 'Modal borrowing template is cataloged');
  assert(cadential !== undefined, 'Cadential reinterpretation template is cataloged');
  assert(compression !== undefined, 'Functional compression template is cataloged');
  assert(expansion !== undefined, 'Functional expansion template is cataloged');

  if (tritone && modal) {
    assert(tritone.id === 'template:tritone_substitution', 'Tritone has correct template ID');
    assert(tritone.preconditions.includes('DOMINANT_7TH'), 'Tritone contains expected precondition');
    assert(tritone.effects.includes('VOICE_LEADING_PRESERVATION'), 'Tritone contains voice leading preservation effect');
    assert(tritone.reversibility > 0 && tritone.reversibility <= 1.0, 'Reversibility is correctly bounded');
  }
}

// ═══════════════════════════════════════════════════════════
// 2. Oportunidades: Caso 1 (C -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Substituição Tritônica (C G7 C)');
{
  const progression = ['C', 'G7', 'C'];
  const opportunities = detectOpportunities(progression);
  
  const tritoneOpp = opportunities.find(o => o.mechanism === 'TRITONE_SUBSTITUTION');
  assert(tritoneOpp !== undefined, 'Tritone substitution opportunity detected');
  if (tritoneOpp) {
    assert(tritoneOpp.chordIndex === 1, 'Detected at chordIndex 1 (G7)');
    assert(tritoneOpp.confidence === 0.91, 'Confidence matches expectation');
  }
}

// ═══════════════════════════════════════════════════════════
// 3. Oportunidades: Caso 2 (C -> F -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Empréstimo Modal (C F C)');
{
  const progression = ['C', 'F', 'C'];
  const opportunities = detectOpportunities(progression);
  
  const modalOpp = opportunities.find(o => o.mechanism === 'MODAL_BORROWING');
  assert(modalOpp !== undefined, 'Modal borrowing opportunity detected');
  if (modalOpp) {
    assert(modalOpp.chordIndex === 1, 'Detected at chordIndex 1 (F)');
    assert(modalOpp.confidence === 0.88, 'Confidence matches expectation');
  }
}

// ═══════════════════════════════════════════════════════════
// 4. Oportunidades: Caso 3 (C -> Dm -> G7 -> C)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Compressão Funcional (C Dm G7 C)');
{
  const progression = ['C', 'Dm', 'G7', 'C'];
  const opportunities = detectOpportunities(progression);
  
  const compOpp = opportunities.find(o => o.mechanism === 'FUNCTIONAL_COMPRESSION');
  assert(compOpp !== undefined, 'Functional compression opportunity detected');
  if (compOpp) {
    assert(compOpp.chordIndex === 1, 'Detected at chordIndex 1 (Dm)');
    assert(compOpp.confidence === 0.82, 'Confidence matches expectation');
  }
}

// ═══════════════════════════════════════════════════════════
// 5. Integração com Motor de Busca e Narrative Renderer
// ═══════════════════════════════════════════════════════════
console.log('\n🔍 Integração do pipeline e Narrative Renderer');
{
  const resultQ = analyzeProgression(['C', 'G7', 'C']);
  const fpQ = generateFingerprint(resultQ, { density: 'STANDARD' });

  const corpus = [
    {
      id: 'mock-1',
      name: 'Standard Tonic Dominant Mock',
      progression: ['C', 'G7', 'C']
    }
  ];

  const prepared = prepareCorpus(corpus, { density: 'STANDARD' });
  const matches = findSimilarProgressions(fpQ, prepared);

  assert(matches.length > 0, 'Discovery match found');
  if (matches.length > 0) {
    const match = matches[0];
    assert(match.transformationOpportunities !== undefined, 'transformationOpportunities populated on DiscoveryMatch');
    if (match.transformationOpportunities) {
      assert(match.transformationOpportunities.length > 0, 'Contains opportunities');
      const tritoneOpp = match.transformationOpportunities.find(o => o.mechanism === 'TRITONE_SUBSTITUTION');
      assert(tritoneOpp !== undefined, 'Tritone opportunity populated in DiscoveryMatch');
    }

    // Test Portuguese explanation narrative suggestions
    const explanation = match.explanation;
    assert(explanation !== undefined, 'Natural language explanation is generated');
    if (explanation) {
      assert(explanation.includes('poderia admitir uma Substituição Tritônica'), 'Narrative includes suggested tritone opportunity');
      assert(explanation.includes('preservando aproximadamente 80%'), 'Narrative includes expected preservation impact');
      console.log('  Narrativa Sugerida:\n', explanation.substring(explanation.indexOf('**Oportunidades de Transformação')));
    }
  }
}

console.log(`\n==================================================`);
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`==================================================`);

if (failed > 0) {
  throw new Error(`Transformation space engine tests failed with ${failed} failures.`);
}
