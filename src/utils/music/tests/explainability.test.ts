// Sprint F10-C — Explainability Engine & Pedagogical Recommendations Tests
// Run with: npx tsx src/utils/music/tests/explainability.test.ts

import { 
  analyzeProgression, 
  generateFingerprint,
  generateSimilarityInsights,
  generateInterpretiveInsights,
  detectPedagogicalTransformations,
  renderExplanation,
  findSimilarProgressions,
  compareFingerprints
} from '../analysis/functionalAnalysis';
import type { 
  ApparentFunctionLayerData,
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
// Caso 1 — Versionamento e Confiança (Layer 7 / F12)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Versionamento e Confiança');
{
  const result = analyzeProgression(['C', 'C/G', 'G7', 'C']);
  const fp = generateFingerprint(result, { density: 'FULL' });
  const apparentLayer = fp.layers.extendedLayers?.apparentFunction as ApparentFunctionLayerData;

  assert(apparentLayer !== undefined, 'Apparent Function layer generated under FULL density');
  
  if (apparentLayer) {
    const cadentialEvent = apparentLayer.events[1]; // C/G
    assert(
      cadentialEvent.apparentSubtype === 'CADENTIAL_64',
      `C/G subtype is CADENTIAL_64, got ${cadentialEvent.apparentSubtype}`
    );
    
    // Test continuous confidence value
    assert(
      cadentialEvent.resolution.confidence === 0.96,
      `C/G confidence is 0.96, got ${cadentialEvent.resolution.confidence}`
    );

    // Test confidenceFactors
    const factors = cadentialEvent.resolution.confidenceFactors;
    assert(factors !== undefined, 'confidenceFactors is defined');
    if (factors) {
      assert(factors.voiceLeading === 1.0, `voiceLeading factor is 1.0, got ${factors.voiceLeading}`);
      assert(factors.distance === 1.0, `distance factor is 1.0, got ${factors.distance}`);
      assert(factors.expectationStrength === 0.8, `expectationStrength factor is 0.8, got ${factors.expectationStrength}`);
    }

    // Test confidenceFormulaVersion
    assert(
      cadentialEvent.resolution.confidenceFormulaVersion === 'F12C-v1',
      `confidenceFormulaVersion is "F12C-v1", got ${cadentialEvent.resolution.confidenceFormulaVersion}`
    );
  }

  // Deceptive Cadence classic resolution
  const resultDec = analyzeProgression(['C', 'G7', 'Am']);
  const fpDec = generateFingerprint(resultDec, { density: 'FULL' });
  const apparentLayerDec = fpDec.layers.extendedLayers?.apparentFunction as ApparentFunctionLayerData;
  if (apparentLayerDec) {
    const event = apparentLayerDec.events[1]; // G7
    assert(event.resolution.confidence === 0.90, `Deceptive classic resolution confidence is 0.90, got ${event.resolution.confidence}`);
    assert(event.resolution.confidenceFormulaVersion === 'F12C-v1', 'Deceptive formula version is F12C-v1');
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 2 — Interpretação vs Similaridade
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Interpretação vs Similaridade');
{
  const resultQ = analyzeProgression(['C', 'C/G', 'G7', 'C']);
  const fpQ = generateFingerprint(resultQ, { density: 'FULL' });

  const resultI = analyzeProgression(['C', 'G7', 'C']);
  const fpI = generateFingerprint(resultI, { density: 'FULL' });

  const report = compareFingerprints(fpQ, fpI);
  const similarityInsights = generateSimilarityInsights(fpQ, fpI, report);
  const interpretiveInsights = generateInterpretiveInsights(fpQ);

  // Similaridade
  assert(similarityInsights.length > 0, 'Similarity insights list generated');
  const hasApparentAxis = similarityInsights.some(ins => ins.axis === 'APPARENT_FUNCTION');
  assert(hasApparentAxis, 'Similarity insights include APPARENT_FUNCTION axis');

  // Interpretação
  assert(interpretiveInsights.length > 0, 'Interpretive insights list generated');
  const hasCadentialInsight = interpretiveInsights.some(
    ins => ins.source === 'APPARENT_FUNCTION' && ins.evidence?.some(e => e.includes('CADENTIAL_64'))
  );
  assert(hasCadentialInsight, 'Interpretive insights identified Cadential 6/4');

  // Verificar separação estrutural
  assert(
    (similarityInsights as unknown) !== (interpretiveInsights as unknown),
    'Similarity insights and interpretive insights arrays are distinct'
  );
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Compressão e Expansão Funcional
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Compressão e Expansão Funcional');
{
  // Query curta, Item longo (compressão quando olhado da Query para o Item)
  const resultQ = analyzeProgression(['C', 'G7', 'C']);
  const fpQ = generateFingerprint(resultQ, { density: 'FULL' });

  const resultI = analyzeProgression(['C', 'Dm7', 'G7', 'C']);
  const fpI = generateFingerprint(resultI, { density: 'FULL' });

  const transformationsQtoI = detectPedagogicalTransformations(fpQ, fpI);
  assert(
    transformationsQtoI.some(t => t.mechanism === 'FUNCTIONAL_COMPRESSION'),
    'Detected FUNCTIONAL_COMPRESSION when query has fewer predominant preparation chords than item'
  );

  // Query longa, Item curto (expansão)
  const transformationsItoQ = detectPedagogicalTransformations(fpI, fpQ);
  assert(
    transformationsItoQ.some(t => t.mechanism === 'FUNCTIONAL_EXPANSION'),
    'Detected FUNCTIONAL_EXPANSION when query has more predominant preparation chords than item'
  );
}

// ═══════════════════════════════════════════════════════════
// Caso 4 — Descrições em Dois Níveis & Português
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 4 — Descrições em Dois Níveis e Português');
{
  const resultQ = analyzeProgression(['C', 'C/G', 'G7', 'C']);
  const fpQ = generateFingerprint(resultQ, { density: 'FULL' });

  const resultI = analyzeProgression(['C', 'G7', 'C']);
  const fpI = generateFingerprint(resultI, { density: 'FULL' });

  const report = compareFingerprints(fpQ, fpI);
  const similarityInsights = generateSimilarityInsights(fpQ, fpI, report);
  const interpretiveInsights = generateInterpretiveInsights(fpQ);
  const transformations = detectPedagogicalTransformations(fpQ, fpI);

  // Verificar estrutura de dois níveis em insights de similaridade
  const insight = similarityInsights[0];
  assert(insight.explanation.technical !== undefined, 'Similarity insight contains technical description');
  assert(insight.explanation.pedagogical !== undefined, 'Similarity insight contains pedagogical description');

  // Verificar português e ausência de placeholders
  assert(
    !insight.explanation.pedagogical.includes('[') && !insight.explanation.pedagogical.includes('todo'),
    'No placeholders in pedagogical explanation'
  );
  
  // Renderizar explicação consolidated
  const explanation = renderExplanation(similarityInsights, transformations, interpretiveInsights);
  console.log('\n--- RENDERED EXPLANATION EXAMPLE ---');
  console.log(explanation);
  console.log('-------------------------------------\n');

  assert(explanation.length > 0, 'Rendered explanation is a non-empty string');
  assert(explanation.includes('similaridade'), 'Explanation contains similarity details');
  assert(explanation.includes('Cadencial 6/4') || explanation.includes('tônica em segunda inversão'), 'Explanation mentions cadential reinterpretation');
  assert(explanation.includes('alta convicção analítica'), 'Explanation uses the continuous confidence qualifier (>= 0.90)');
}

// ═══════════════════════════════════════════════════════════
// Caso 5 — Integração com a Busca (Discovery Engine)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 5 — Integração com a Busca (Discovery Engine)');
{
  const corpus: CorpusItem[] = [
    {
      id: 'prog1',
      name: 'Simples Cadencial',
      progression: ['C', 'G7', 'C'],
      harmonicCategory: 'DIATONIC_AXIS',
      functionalCategory: 'CADENTIAL_PROGRESSION'
    },
    {
      id: 'prog2',
      name: 'Preparação Estendida',
      progression: ['C', 'Dm7', 'G7', 'C'],
      harmonicCategory: 'DIATONIC_AXIS',
      functionalCategory: 'CADENTIAL_PROGRESSION'
    }
  ];

  const queryResult = analyzeProgression(['C', 'C/G', 'G7', 'C']);
  const queryFp = generateFingerprint(queryResult, { density: 'FULL' });

  const matches = findSimilarProgressions(queryFp, corpus, { strategy: 'OVERALL' });
  
  assert(matches.length > 0, 'Discovery Engine matches returned results');
  
  const bestMatch = matches[0];
  assert(bestMatch.explanation !== undefined, 'Best match contains natural language explanation');
  assert(bestMatch.topInsights !== undefined, 'Best match contains topInsights array');
  assert(bestMatch.interpretiveInsights !== undefined, 'Best match contains interpretiveInsights array');
  assert(bestMatch.transformations !== undefined, 'Best match contains transformations array');
  
  assert(bestMatch.primaryReason !== undefined, 'Best match contains primaryReason');
  if (bestMatch.primaryReason) {
    assert(typeof bestMatch.primaryReason.type === 'string' && bestMatch.primaryReason.type.length > 0, 'primaryReason type is a non-empty string');
    assert(bestMatch.primaryReason.confidence >= 0.0 && bestMatch.primaryReason.confidence <= 1.0, 'primaryReason confidence is valid');
    console.log(`Primary Reason: Type = ${bestMatch.primaryReason.type}, Confidence = ${bestMatch.primaryReason.confidence}`);
  }

  console.log(`\nBest Match Name: ${bestMatch.item.name}`);
  console.log(`Explanation:\n${bestMatch.explanation}`);
}

console.log(`\n==================================================`);
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`==================================================`);

if (failed > 0) {
  throw new Error(`Explainability integration tests failed with ${failed} failures.`);
}
