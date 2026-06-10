// Sprint C3.2-B — Harmonic State Evaluation Engine Tests
// Run with: npx tsx src/utils/music/tests/harmonicStateEvaluator.test.ts

import { 
  analyzeProgression,
  generateFingerprint,
  prepareCorpus,
  findSimilarProgressions,
  evaluateTransition 
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
// 1. Caso 1 — C G7 C ➔ C Db7 C (Aumento cromatismo/tensão/suavidade)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — Transição C G7 C ➔ C Db7 C');
{
  const beforeProg = ['C', 'G7', 'C'];
  const afterProg = ['C', 'Db7', 'C'];

  const transition = evaluateTransition(beforeProg, afterProg);
  
  console.log(`  Antes  - Tensão: ${transition.before.tension}, Cromatismo: ${transition.before.chromaticism}, Baixo: ${transition.before.bassSmoothness}`);
  console.log(`  Depois - Tensão: ${transition.after.tension}, Cromatismo: ${transition.after.chromaticism}, Baixo: ${transition.after.bassSmoothness}`);
  console.log(`  Delta  - Tensão: ${transition.tensionDelta}, Cromatismo: ${transition.chromaticismDelta}, Baixo: ${transition.bassSmoothnessDelta}`);

  assert(transition.chromaticismDelta > 0, 'Cromatismo aumentou (Db7 é não-diatônico e tem substituição tritônica)');
  assert(transition.tensionDelta > 0, 'Tensão aumentou (Db7 adiciona tensão de tritono e cromatismo)');
  assert(transition.bassSmoothnessDelta > 0, 'Suavidade do baixo aumentou (movimento por semitom)');
}

// ═══════════════════════════════════════════════════════════
// 2. Caso 2 — C Dm G7 C ➔ C G7 C (Queda estabilidade funcional)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Transição C Dm G7 C ➔ C G7 C');
{
  const beforeProg = ['C', 'Dm', 'G7', 'C'];
  const afterProg = ['C', 'G7', 'C'];

  const transition = evaluateTransition(beforeProg, afterProg);

  console.log(`  Antes  - Tensão: ${transition.before.tension}, Estabilidade: ${transition.before.functionalStability}`);
  console.log(`  Depois - Tensão: ${transition.after.tension}, Estabilidade: ${transition.after.functionalStability}`);
  console.log(`  Delta  - Tensão: ${transition.tensionDelta}, Estabilidade: ${transition.functionalStabilityDelta}`);

  assert(transition.tensionDelta > 0, 'Tensão média aumentou (devido à maior proporção do V7 na progressão menor)');
  assert(transition.functionalStabilityDelta < 0, 'Estabilidade funcional diminuiu (perda da jornada subdominante Dm)');
}

// ═══════════════════════════════════════════════════════════
// 2b. Caso 2b — C G7 C ➔ C C C (Queda real de tensão)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2b — Transição C G7 C ➔ C C C');
{
  const beforeProg = ['C', 'G7', 'C'];
  const afterProg = ['C', 'C', 'C'];

  const transition = evaluateTransition(beforeProg, afterProg);

  console.log(`  Antes  - Tensão: ${transition.before.tension}`);
  console.log(`  Depois - Tensão: ${transition.after.tension}`);
  console.log(`  Delta  - Tensão: ${transition.tensionDelta}`);

  assert(transition.tensionDelta < 0, 'Tensão diminuiu (remoção do acorde de dominante)');
}

// ═══════════════════════════════════════════════════════════
// 3. Caso 3 — C G7 C ➔ C Dm7 G7 C (Suavidade/Voice Leading aumentam)
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Transição C G7 C ➔ C Dm7 G7 C');
{
  const beforeProg = ['C', 'G7', 'C'];
  const afterProg = ['C', 'Dm7', 'G7', 'C'];

  const transition = evaluateTransition(beforeProg, afterProg);

  console.log(`  Antes  - Baixo: ${transition.before.bassSmoothness}, Voice Leading: ${transition.before.voiceLeadingQuality}`);
  console.log(`  Depois - Baixo: ${transition.after.bassSmoothness}, Voice Leading: ${transition.after.voiceLeadingQuality}`);
  console.log(`  Delta  - Baixo: ${transition.bassSmoothnessDelta}, Voice Leading: ${transition.voiceLeadingQualityDelta}`);

  assert(transition.bassSmoothnessDelta > 0, 'Suavidade do baixo aumentou (C->G/G->C era salto de 5a, C->Dm7->G7->C é mais suave/graus conjuntos)');
  assert(transition.after.voiceLeadingQuality > 0.9, 'Qualidade do Voice Leading resultante é muito alta (> 0.9)');
}

// ═══════════════════════════════════════════════════════════
// 4. Caso 4 — Validação da Narrativa em Português no Pipeline
// ═══════════════════════════════════════════════════════════
console.log('\n🔍 Integração do pipeline e Narrative Renderer (Closed-Loop)');
{
  const resultQ = analyzeProgression(['C', 'G7', 'C']);
  const fpQ = generateFingerprint(resultQ, { density: 'STANDARD' });

  const corpus = [
    {
      id: 'mock-1',
      name: 'Tonic Dominant Mock',
      progression: ['C', 'G7', 'C']
    }
  ];

  const prepared = prepareCorpus(corpus, { density: 'STANDARD' });
  const matches = findSimilarProgressions(fpQ, prepared, { goal: 'INCREASE_TENSION' });

  assert(matches.length > 0, 'Discovery match found');
  if (matches.length > 0) {
    const match = matches[0];
    const explanation = match.explanation;
    assert(explanation !== undefined, 'Explanation narrative generated');
    
    if (explanation) {
      assert(explanation.includes('**Resultado Medido:**'), 'Narrative includes Measured Result (Resultado Medido) header');
      assert(explanation.includes('**Meta Atingida:**'), 'Narrative includes Goal Achieved (Meta Atingida) header');
      assert(explanation.includes('- Tensão:'), 'Narrative includes measured tension line');
      assert(explanation.includes('- Alinhamento:'), 'Narrative includes goal alignment percentage');
      assert(explanation.includes('- Confiança:'), 'Narrative includes goal confidence percentage');

      console.log('  Narrativa Sugerida Completa (Excerto):\n', explanation.substring(explanation.indexOf('**Transformação Sugerida:')));
    }
  }
}

console.log(`\n==================================================`);
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`==================================================`);

if (failed > 0) {
  throw new Error(`Harmonic state evaluator tests failed with ${failed} failures.`);
}
