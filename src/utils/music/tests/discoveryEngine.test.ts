// Sprint F10-B — Discovery Engine Tests
// Run with: npx tsx src/utils/music/tests/discoveryEngine.test.ts

import { 
  analyzeProgression, 
  generateFingerprint, 
  DEFAULT_CORPUS, 
  prepareCorpus, 
  findSimilarProgressions
} from '../analysis/functionalAnalysis';
import type { CorpusItem } from '../analysis/functionalAnalysis';

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
// Caso 1 — Busca Geral com Cache
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Busca Geral com Cache');
{
  // 1. Prepara corpus com cache
  const preparedCorpus = prepareCorpus(DEFAULT_CORPUS, { density: 'STANDARD' });
  assert(
    preparedCorpus.every(item => item.cachedFingerprint !== undefined),
    'All corpus items have cachedFingerprint'
  );
  assert(
    preparedCorpus[0].cachedFingerprint?.density === 'STANDARD',
    'Cached density is STANDARD'
  );

  // 2. Faz busca para a progressão I-V-vi-IV
  const queryAnalysis = analyzeProgression(['C', 'G', 'Am', 'F']);
  const queryFp = generateFingerprint(queryAnalysis, { density: 'STANDARD' });

  const matches = findSimilarProgressions(queryFp, preparedCorpus, { strategy: 'OVERALL', limit: 5 });

  assert(matches.length > 0, 'Returned at least one match');
  if (matches.length > 0) {
    const first = matches[0];
    assert(first.item.id === 'axis_progression', `First match is 'axis_progression', got: ${first.item.id}`);
    assert(Math.abs(first.score - 1.0) < 0.001, `First match score is exactly 1.0, got: ${first.score}`);
    assert(first.fingerprint !== undefined, 'Match contains resolved fingerprint DTO');
    assert(first.explanation !== undefined, `Match contains basic explanation: "${first.explanation}"`);
    assert(first.explanationData?.dominantAxis === 'STRUCTURAL', 'explanationData maps correct dominant axis');
  }

  // Verifica ordenação descendente
  let isSorted = true;
  for (let i = 1; i < matches.length; i++) {
    if (matches[i].score > matches[i - 1].score) {
      isSorted = false;
    }
  }
  assert(isSorted, 'Matches are correctly sorted in descending order of strategy score');
}

// ═══════════════════════════════════════════════════════════
// Caso 2 — Filtros de Categorias e Tamanho
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Filtros de Categorias e Tamanho');
{
  const preparedCorpus = prepareCorpus(DEFAULT_CORPUS, { density: 'STANDARD' });
  const queryAnalysis = analyzeProgression(['C', 'G', 'Am', 'F']);
  const queryFp = generateFingerprint(queryAnalysis, { density: 'STANDARD' });

  // Filtrar apenas por substituição cromática
  const matches = findSimilarProgressions(queryFp, preparedCorpus, {
    filters: {
      harmonicCategory: 'CHROMATIC_SUBSTITUTION'
    }
  });

  assert(matches.length > 0, 'Matches found with category filter');
  const allSub = matches.every(m => m.item.harmonicCategory === 'CHROMATIC_SUBSTITUTION');
  assert(allSub, 'All returned items are CHROMATIC_SUBSTITUTION');

  // Filtrar por tamanho de acordes
  const matchesSize = findSimilarProgressions(queryFp, preparedCorpus, {
    filters: {
      minChordsCount: 7,
      maxChordsCount: 8
    }
  });
  const validSizes = matchesSize.every(m => m.item.progression.length >= 7 && m.item.progression.length <= 8);
  assert(validSizes, 'All returned items satisfy min/max chords count constraints');
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Divergência de Estratégias (FUNCTIONAL vs HARMONIC)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Divergência de Estratégias (FUNCTIONAL vs HARMONIC)');
{
  const preparedCorpus = prepareCorpus(DEFAULT_CORPUS, { density: 'STANDARD' });
  
  // Consulta de ii - subV7 - I
  const queryAnalysis = analyzeProgression(['Cmaj7', 'Dm7', 'Db7', 'Cmaj7']);
  const queryFp = generateFingerprint(queryAnalysis, { density: 'STANDARD' });

  console.log('  -> Query roleSequence:', queryFp.layers.extendedLayers?.functionalEquivalence?.roleSequence);
  
  preparedCorpus.forEach(item => {
    if (item.id === 'major_ii_v_i' || item.id === 'tritone_substitution_chain') {
      console.log(`  -> Item ${item.id} roleSequence:`, item.cachedFingerprint?.fingerprint.layers.extendedLayers?.functionalEquivalence?.roleSequence);
    }
  });

  // 1. Busca sob a estratégia FUNCTIONAL
  const matchesFunc = findSimilarProgressions(queryFp, preparedCorpus, {
    strategy: 'FUNCTIONAL',
    limit: 5
  });

  console.log('  -> Case 3 Functional matches:', matchesFunc.map(m => ({ id: m.item.id, score: m.score })));

  // Ambas 'tritone_substitution_chain' e 'major_ii_v_i' compartilham a mesma assinatura funcional: PREDOMINANT > DOMINANT > TONIC
  const majorIIVI = matchesFunc.find(m => m.item.id === 'major_ii_v_i');
  const tritoneChain = matchesFunc.find(m => m.item.id === 'tritone_substitution_chain');

  assert(majorIIVI !== undefined, "Found 'major_ii_v_i' in functional matches");
  assert(tritoneChain !== undefined, "Found 'tritone_substitution_chain' in functional matches");

  if (majorIIVI && tritoneChain) {
    assert(Math.abs(majorIIVI.score - 1.0) < 0.001, `Functional score for 'major_ii_v_i' is 1.0, got: ${majorIIVI.score}`);
    assert(Math.abs(tritoneChain.score - 1.0) < 0.001, `Functional score for 'tritone_substitution_chain' is 1.0, got: ${tritoneChain.score}`);
  }

  // 2. Busca sob a estratégia HARMONIC
  const matchesHarm = findSimilarProgressions(queryFp, preparedCorpus, {
    strategy: 'HARMONIC',
    limit: 5
  });

  console.log('  -> Case 3 Harmonic matches:', matchesHarm.map(m => ({ id: m.item.id, score: m.score })));

  const majorIIVI_Harm = matchesHarm.find(m => m.item.id === 'major_ii_v_i');
  const tritoneChain_Harm = matchesHarm.find(m => m.item.id === 'tritone_substitution_chain');

  if (majorIIVI_Harm && tritoneChain_Harm) {
    assert(Math.abs(tritoneChain_Harm.score - 1.0) < 0.001, 'Harmonic score for tritone substitution chain is 1.0 (exact match of devices)');
    assert(majorIIVI_Harm.score < 0.96, `Harmonic score for major ii-V-I is lower due to chromatic substitution difference, got: ${majorIIVI_Harm.score}`);
  }
}

// ═══════════════════════════════════════════════════════════
// Caso 4 — Tratamento de Exclusão de Camadas Ausentes
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 4 — Tratamento de Exclusão de Camadas Ausentes');
{
  const preparedCorpus = prepareCorpus(DEFAULT_CORPUS, { density: 'STANDARD' });

  // 1. Consulta gerada na densidade CORE (sem equivalência funcional ou voice leading)
  const queryAnalysis = analyzeProgression(['Dm7', 'G7', 'Cmaj7']);
  const queryFpCore = generateFingerprint(queryAnalysis, { density: 'CORE' });

  // Rodar busca com FUNCTIONAL (deve excluir todos por falta da camada funcional na query)
  const matchesFunc = findSimilarProgressions(queryFpCore, preparedCorpus, {
    strategy: 'FUNCTIONAL'
  });

  assert(matchesFunc.length === 0, 'Query in CORE density excludes all items under FUNCTIONAL strategy');

  // 2. Exclusão no nível do item do corpus: se a query tem FUNCTIONAL mas um item do corpus é CORE, ele deve ser excluído
  const queryFpStandard = generateFingerprint(queryAnalysis, { density: 'STANDARD' });
  const rawCorpusItem: CorpusItem = {
    id: 'core_item_test',
    name: 'Core Item Test',
    progression: [], // Vazio para impedir reanálise/upgrade automático
    cachedFingerprint: {
      density: 'CORE',
      fingerprint: queryFpCore
    }
  };

  const matchesItemExclude = findSimilarProgressions(queryFpStandard, [rawCorpusItem], {
    strategy: 'FUNCTIONAL'
  });

  assert(matchesItemExclude.length === 0, 'Corpus item in CORE density is excluded under FUNCTIONAL strategy');
}

console.log(`\n==================================================`);
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`==================================================`);

if (failed > 0) {
  throw new Error(`discoveryEngine test suite failed with ${failed} failures.`);
}
