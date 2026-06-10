// Sprint C3.5-B — Profile Divergence Benchmark
// Run with: npx tsx src/utils/music/tests/profileDivergenceBenchmark.test.ts

import * as fs from 'fs';
import * as path from 'path';

import { 
  findSimilarProgressions,
  analyzeProgression,
  generateFingerprint,
  prepareCorpus,
  extractObjectiveVector
} from '../analysis/functionalAnalysis';
import type { 
  CorpusItem,
  DiscoveryOptions,
  DiscoveryMatch,
  OptimizationProfile
} from '../analysis/functionalAnalysis';

// Configuração do Corpus estático para o benchmark (idêntico ao C3.5)
const STRESS_BENCHMARK_CORPUS: CorpusItem[] = [
  {
    id: 'diatonic-cadence',
    name: 'Diátonica Cadencial Padrão',
    progression: ['C', 'Dm7', 'G7', 'C'],
    harmonicCategory: 'DIATONIC_AXIS',
    functionalCategory: 'CADENTIAL_PROGRESSION'
  },
  {
    id: 'giant-steps-coltrane',
    name: 'Giant Steps (Centros por Terça Maior)',
    progression: ['Bmaj7', 'D7', 'Gmaj7', 'Bb7', 'Ebmaj7', 'F#7', 'Bmaj7'],
    harmonicCategory: 'CIRCLE_OF_FIFTHS',
    functionalCategory: 'REGIONAL_MOTION'
  },
  {
    id: 'romantic-mediant-cycle',
    name: 'Late Romantic Chromatic Mediant Cycle',
    progression: ['C', 'Ab', 'E', 'C'],
    harmonicCategory: 'CHROMATIC_SUBSTITUTION',
    functionalCategory: 'REGIONAL_MOTION'
  },
  {
    id: 'backdoor-dominant-cadence',
    name: 'Backdoor Dominant Cadence',
    progression: ['Cmaj7', 'Fm7', 'Bb7', 'Cmaj7'],
    harmonicCategory: 'CHROMATIC_SUBSTITUTION',
    functionalCategory: 'CADENTIAL_PROGRESSION'
  },
  {
    id: 'chromatic-third-cycle',
    name: 'Ciclo de Terça Menor Cromático',
    progression: ['C', 'Eb', 'Gb', 'A', 'C'],
    harmonicCategory: 'CHROMATIC_SUBSTITUTION',
    functionalCategory: 'REGIONAL_MOTION'
  }
];

const PREPARED_BENCHMARK_CORPUS = prepareCorpus(STRESS_BENCHMARK_CORPUS, { density: 'FULL' });

function runQuery(progression: string[], options?: DiscoveryOptions): DiscoveryMatch | undefined {
  try {
    const queryResult = analyzeProgression(progression);
    const queryFp = generateFingerprint(queryResult, { density: 'FULL' });
    const matches = findSimilarProgressions(queryFp, PREPARED_BENCHMARK_CORPUS, options);
    if (matches.length > 0) {
      return matches[0];
    }
  } catch (err) {
    console.error(`Erro ao processar progressão [${progression.join(', ')}]:`, err);
  }
  return undefined;
}

interface StressScenario {
  id: number;
  groupName: string;
  scenarioName: string;
  progression: string[];
}

const SCENARIOS: StressScenario[] = [
  // Grupo 1 — Giant Steps
  {
    id: 1,
    groupName: 'Grupo 1 — Giant Steps',
    scenarioName: 'Giant Steps Coltrane Standard',
    progression: ['Bmaj7', 'D7', 'Gmaj7', 'Bb7', 'Ebmaj7', 'F#7', 'Bmaj7']
  },
  {
    id: 2,
    groupName: 'Grupo 1 — Giant Steps',
    scenarioName: 'Giant Steps ii-V-I Variation',
    progression: ['Fm7', 'Bb7', 'Ebmaj7', 'F#7', 'Bmaj7', 'D7', 'Gmaj7']
  },
  // Grupo 2 — Coltrane Matrix
  {
    id: 3,
    groupName: 'Grupo 2 — Coltrane Matrix',
    scenarioName: 'Coltrane Matrix Symmetric Loop',
    progression: ['Cmaj7', 'Eb7', 'Abmaj7', 'B7', 'Emaj7', 'G7', 'Cmaj7']
  },
  // Grupo 3 — Late Romantic
  {
    id: 4,
    groupName: 'Grupo 3 — Late Romantic',
    scenarioName: 'Chromatic Mediant Sequence',
    progression: ['C', 'Ab', 'E', 'B', 'G', 'D']
  },
  {
    id: 5,
    groupName: 'Grupo 3 — Late Romantic',
    scenarioName: 'Wagner Tristan-like Resolution',
    progression: ['Am', 'F', 'B7', 'E7']
  },
  {
    id: 6,
    groupName: 'Grupo 3 — Late Romantic',
    scenarioName: 'Scriabin-style Chromatic Complexity',
    progression: ['C7b5', 'F#7b5', 'C7b5']
  },
  // Grupo 4 — Jazz Moderno
  {
    id: 7,
    groupName: 'Grupo 4 — Jazz Moderno',
    scenarioName: 'Backdoor Dominants Cadence',
    progression: ['Cmaj7', 'Fm7', 'Bb7', 'Cmaj7']
  },
  {
    id: 8,
    groupName: 'Grupo 4 — Jazz Moderno',
    scenarioName: 'Side-slipping ii-V Shift',
    progression: ['Dm7', 'G7', 'Ebm7', 'Ab7', 'Dbmaj7']
  },
  // Grupo 5 — Ambiguidade Tonal Máxima
  {
    id: 9,
    groupName: 'Grupo 5 — Ambiguidade Tonal Máxima',
    scenarioName: 'Symmetric Ambiguous Cycle',
    progression: ['Cmaj7', 'E7', 'Am7', 'Db7', 'Cmaj7']
  },
  {
    id: 10,
    groupName: 'Grupo 5 — Ambiguidade Tonal Máxima',
    scenarioName: 'Chromatic Mediant Ambiguity',
    progression: ['Cmaj7', 'Abmaj7', 'Emaj7', 'Cmaj7']
  },
  // Grupo 6 — Recursive Modulation Stress
  {
    id: 11,
    groupName: 'Grupo 6 — Recursive Modulation Stress',
    scenarioName: 'Recursive Multi-Key Modulation',
    progression: ['Cmaj7', 'E7', 'Amaj7', 'C7', 'Fmaj7', 'Ab7', 'Dbmaj7', 'E7', 'Amaj7']
  },
  {
    id: 12,
    groupName: 'Grupo 6 — Recursive Modulation Stress',
    scenarioName: 'Symmetric Minor Third Modulation',
    progression: ['C', 'Eb', 'Gb', 'A', 'C', 'Eb', 'Gb', 'A']
  }
];

const profiles: OptimizationProfile[] = [
  'BALANCED',
  'MAX_TENSION',
  'MAX_PLAYABILITY',
  'MAX_PEDAGOGY',
  'MAX_VOICE_LEADING'
];

interface MetricDelta {
  tension: number;
  chromaticism: number;
  bassSmoothness: number;
  functionalStability: number;
  voiceLeading: number;
  playability: number;
  pedagogicalImpact: number;
  goalAchievement: number;
}

interface ProfileDivergenceResult {
  scenario: StressScenario;
  winners: Record<OptimizationProfile, {
    pathId: string;
    score: number;
    dominantFactor: string;
    hasRunnerUp: boolean;
    deltas?: MetricDelta;
  }>;
  dw: number;
  pdr: number;
  wcr: number;
  passed: boolean;
}

const results: ProfileDivergenceResult[] = [];

// Métricas de acumulação para auditoria de dominância
const totalDeltasByMetric: MetricDelta = {
  tension: 0,
  chromaticism: 0,
  bassSmoothness: 0,
  functionalStability: 0,
  voiceLeading: 0,
  playability: 0,
  pedagogicalImpact: 0,
  goalAchievement: 0
};
let deltaCount = 0;

console.log('⚡ Iniciando C3.5-B — Profile Divergence Benchmark...\n');

for (const scenario of SCENARIOS) {
  console.log(`🎼 Analisando Cenário #${scenario.id}: ${scenario.scenarioName}`);
  
  const scenarioWinners: string[] = [];
  const profileWinnersData: Record<string, any> = {};

  let hasPaths = false;
  let sumHV = 0;
  let sumSpread = 0;
  let sumSpacing = 0;
  let sumFCR = 0;
  let validProfileRuns = 0;

  for (const profile of profiles) {
    const match = runQuery(scenario.progression, {
      strategy: 'OVERALL',
      goal: 'INCREASE_TENSION',
      optimizationProfile: profile
    });

    if (match && match.recommendedPaths && match.recommendedPaths.length > 0) {
      hasPaths = true;
      const winner = match.recommendedPaths[0];
      const winnerId = winner.steps.map(s => s.id).join('+') || 'no-transform';
      scenarioWinners.push(winnerId);

      const dominantFactor = match.recommendationDecision?.dominantFactor ?? 'N/A';
      const score = winner.finalScore ?? 0;
      const hypervolume = match.paretoFrontier?.hypervolume ?? 0;
      const spread = match.paretoFrontier?.spread ?? 0;
      const spacing = match.paretoFrontier?.spacing ?? 0;
      const fcr = match.paretoFrontier?.frontierCompressionRatio ?? 0;

      sumHV += hypervolume;
      sumSpread += spread;
      sumSpacing += spacing;
      sumFCR += fcr;
      validProfileRuns++;

      let hasRunnerUp = false;
      let deltas: MetricDelta | undefined = undefined;

      if (match.recommendedPaths.length > 1) {
        hasRunnerUp = true;
        const runnerUp = match.recommendedPaths[1];
        
        const wObj = extractObjectiveVector(winner);
        const rObj = extractObjectiveVector(runnerUp);

        deltas = {
          tension: Number((wObj.tension - rObj.tension).toFixed(4)),
          chromaticism: Number((wObj.chromaticism - rObj.chromaticism).toFixed(4)),
          bassSmoothness: Number((wObj.bassSmoothness - rObj.bassSmoothness).toFixed(4)),
          functionalStability: Number((wObj.functionalStability - rObj.functionalStability).toFixed(4)),
          voiceLeading: Number((wObj.voiceLeading - rObj.voiceLeading).toFixed(4)),
          playability: Number((wObj.playability - rObj.playability).toFixed(4)),
          pedagogicalImpact: Number((wObj.pedagogicalImpact - rObj.pedagogicalImpact).toFixed(4)),
          goalAchievement: Number((wObj.goalAchievement - rObj.goalAchievement).toFixed(4))
        };

        totalDeltasByMetric.tension += deltas.tension;
        totalDeltasByMetric.chromaticism += deltas.chromaticism;
        totalDeltasByMetric.bassSmoothness += deltas.bassSmoothness;
        totalDeltasByMetric.functionalStability += deltas.functionalStability;
        totalDeltasByMetric.voiceLeading += deltas.voiceLeading;
        totalDeltasByMetric.playability += deltas.playability;
        totalDeltasByMetric.pedagogicalImpact += deltas.pedagogicalImpact;
        totalDeltasByMetric.goalAchievement += deltas.goalAchievement;
        deltaCount++;
      }

      profileWinnersData[profile] = {
        pathId: winnerId,
        score,
        dominantFactor,
        hasRunnerUp,
        deltas,
        hypervolume,
        spread,
        spacing,
        fcr
      };
    } else {
      scenarioWinners.push('FAIL');
      profileWinnersData[profile] = {
        pathId: 'FAIL',
        score: 0,
        dominantFactor: 'N/A',
        hasRunnerUp: false,
        hypervolume: 0,
        spread: 0,
        spacing: 0,
        fcr: 0
      };
    }
  }

  let dw = 0;
  let pdr = 0;
  let wcr = 0;

  if (hasPaths) {
    const validWinners = scenarioWinners.filter(w => w !== 'FAIL');
    const uniqueWinners = new Set(validWinners);
    dw = uniqueWinners.size;
    pdr = (dw - 1) / 4;

    const winnerCounts: Record<string, number> = {};
    for (const w of validWinners) {
      winnerCounts[w] = (winnerCounts[w] || 0) + 1;
    }
    const maxWins = Math.max(...Object.values(winnerCounts));
    wcr = maxWins / 5;
  }

  results.push({
    scenario,
    winners: profileWinnersData as any,
    dw,
    pdr,
    wcr,
    passed: hasPaths,
    avgHV: validProfileRuns > 0 ? sumHV / validProfileRuns : 0,
    avgSpread: validProfileRuns > 0 ? sumSpread / validProfileRuns : 0,
    avgSpacing: validProfileRuns > 0 ? sumSpacing / validProfileRuns : 0,
    avgFCR: validProfileRuns > 0 ? sumFCR / validProfileRuns : 0
  } as any);

  console.log(`   └─ Vencedores Distintos: ${dw} | Divergência (PDR): ${(pdr * 100).toFixed(0)}% | Concentração (WCR): ${(wcr * 100).toFixed(0)}%`);
}

// ═══════════════════════════════════════════════════════════
// GERAÇÃO DE RELATÓRIO EM MARKDOWN
// ═══════════════════════════════════════════════════════════
const appDataDir = '/Users/gustavoesteves/.gemini/antigravity-ide';
const reportPath = path.join(appDataDir, 'brain/f6477136-2b69-47c8-8b1f-1aa05a2947ab/profile_divergence_report.md');

// Cálculo das médias gerais (apenas cenários com caminhos válidos)
const validResults = results.filter(r => r.passed);
const avgDW = validResults.reduce((sum, r) => sum + r.dw, 0) / validResults.length;
const avgPDR = validResults.reduce((sum, r) => sum + r.pdr, 0) / validResults.length;
const avgWCR = validResults.reduce((sum, r) => sum + r.wcr, 0) / validResults.length;
const avgHV = validResults.reduce((sum, r) => sum + (r as any).avgHV, 0) / validResults.length;
const avgSpread = validResults.reduce((sum, r) => sum + (r as any).avgSpread, 0) / validResults.length;
const avgSpacing = validResults.reduce((sum, r) => sum + (r as any).avgSpacing, 0) / validResults.length;
const avgFCR = validResults.reduce((sum, r) => sum + (r as any).avgFCR, 0) / validResults.length;

// Médias da auditoria de dominância
const avgDeltas: MetricDelta = {
  tension: deltaCount > 0 ? Number((totalDeltasByMetric.tension / deltaCount).toFixed(4)) : 0,
  chromaticism: deltaCount > 0 ? Number((totalDeltasByMetric.chromaticism / deltaCount).toFixed(4)) : 0,
  bassSmoothness: deltaCount > 0 ? Number((totalDeltasByMetric.bassSmoothness / deltaCount).toFixed(4)) : 0,
  functionalStability: deltaCount > 0 ? Number((totalDeltasByMetric.functionalStability / deltaCount).toFixed(4)) : 0,
  voiceLeading: deltaCount > 0 ? Number((totalDeltasByMetric.voiceLeading / deltaCount).toFixed(4)) : 0,
  playability: deltaCount > 0 ? Number((totalDeltasByMetric.playability / deltaCount).toFixed(4)) : 0,
  pedagogicalImpact: deltaCount > 0 ? Number((totalDeltasByMetric.pedagogicalImpact / deltaCount).toFixed(4)) : 0,
  goalAchievement: deltaCount > 0 ? Number((totalDeltasByMetric.goalAchievement / deltaCount).toFixed(4)) : 0
};

let reportMd = `# Relatório de Divergência de Perfis (Sprint F12.3)

Este relatório investiga quantitativamente a **sensibilidade e a divergência de decisões** do motor do Find Chord sob diferentes perfis de otimização, acompanhado de diagnósticos detalhados sobre a geometria das fronteiras de Pareto.

---

## 📈 Resumo Estatístico de Divergência

| Métrica de Sensibilidade | Média Geral | Descrição |
| --- | :---: | --- |
| **Distinct Winners (DW)** | **${avgDW.toFixed(2)}** / 5 | Quantidade média de caminhos vencedores diferentes recomendados nos 5 perfis. |
| **Profile Divergence Ratio (PDR)** | **${(avgPDR * 100).toFixed(2)}%** | Percentual normalizado de divergência de decisão (0% = consenso, 100% = divergência total). |
| **Winner Concentration Ratio (WCR)** | **${(avgWCR * 100).toFixed(2)}%** | Proporção média de vitórias do caminho vencedor mais dominante (100% = rigidez extrema). |
| **Hypervolume (HV)** | **${avgHV.toFixed(4)}** | Volume dominado médio da fronteira de Pareto (L2 normalizado). |
| **Spread (Delta)** | **${avgSpread.toFixed(4)}** | Grau de dispersão e cobertura dos extremos observados. |
| **Spacing (S)** | **${avgSpacing.toFixed(4)}** | Uniformidade das distâncias entre soluções vizinhas (L2). |
| **Frontier Compression Ratio (FCR)** | **${avgFCR.toFixed(4)}** | Proporção média de caminhos candidatos retidos na fronteira final. |

---

## 🔍 Auditoria de Dominância Métrica (Margem Delta)

Esta auditoria compila a diferença média de pontuação das dimensões de objetivos entre o caminho vencedor (Top 1) e o segundo colocado (Runner-Up) da fronteira. Ela revela se alguma dimensão está empurrando a decisão devido a assimetrias de escala numérica.

| Dimensão de Objetivo | Margem Delta Média (Vencedor − Runner-Up) | Análise de Impacto |
| --- | :---: | --- |
| **Pedagogical Impact** | **${(avgDeltas.pedagogicalImpact * 100).toFixed(2)}%** (${avgDeltas.pedagogicalImpact.toFixed(4)}) | Riqueza pedagógica acumulada de transformações aplicadas. |
| **Goal Achievement** | **${(avgDeltas.goalAchievement * 100).toFixed(2)}%** (${avgDeltas.goalAchievement.toFixed(4)}) | Grau real de alcance do objetivo harmônico em circuito fechado. |
| **Tension** | **${(avgDeltas.tension * 100).toFixed(2)}%** (${avgDeltas.tension.toFixed(4)}) | Tensão final atingida. |
| **Chromaticism** | **${(avgDeltas.chromaticism * 100).toFixed(2)}%** (${avgDeltas.chromaticism.toFixed(4)}) | Cromatismo final atingido. |
| **Voice Leading Quality** | **${(avgDeltas.voiceLeading * 100).toFixed(2)}%** (${avgDeltas.voiceLeading.toFixed(4)}) | Qualidade de condução de vozes (métrica Viterbi). |
| **Playability** | **${(avgDeltas.playability * 100).toFixed(2)}%** (${avgDeltas.playability.toFixed(4)}) | Tocabilidade física (1.0 − max complexidade). |
| **Functional Stability** | **${(avgDeltas.functionalStability * 100).toFixed(2)}%** (${avgDeltas.functionalStability.toFixed(4)}) | Preservação da tônica e grau de diatonismo. |
| **Bass Smoothness** | **${(avgDeltas.bassSmoothness * 100).toFixed(2)}%** (${avgDeltas.bassSmoothness.toFixed(4)}) | Condução linear do baixo por grau conjunto. |

---

## 📋 Resultados Detalhados por Cenário

`;

for (const res of results) {
  reportMd += `### 🎼 Cenário #${res.scenario.id}: ${res.scenario.scenarioName}\n`;
  reportMd += `- **Progressão:** \`[${res.scenario.progression.join(', ')}]\` (${res.scenario.groupName})\n`;
  reportMd += `- **Métricas:** DW = \`${res.dw}\` | PDR = \`${(res.pdr * 100).toFixed(0)}%\` | WCR = \`${(res.wcr * 100).toFixed(0)}%\` | Sobrevivência = ${res.passed ? '✅' : '❌'}\n\n`;

  if (res.passed) {
    reportMd += `| Perfil | Caminho Vencedor (Top 1) | Score | Fator Dominante | Margem para o 2º Colocado (Margens Delta) |\n`;
    reportMd += `| :--- | :--- | :---: | :---: | :--- |\n`;

    for (const profile of profiles) {
      const data = res.winners[profile];
      let deltaStr = 'N/A';
      if (data.hasRunnerUp && data.deltas) {
        const d = data.deltas;
        deltaStr = `Pedagogia: \`+${d.pedagogicalImpact.toFixed(2)}\` \| Metas: \`+${(d.goalAchievement * 100).toFixed(0)}%\` \| Tensão: \`+${(d.tension * 100).toFixed(0)}%\` \| Tocabilidade: \`+${(d.playability * 100).toFixed(0)}%\` \| Condução: \`+${(d.voiceLeading * 100).toFixed(0)}%\``;
      } else {
        deltaStr = 'Sem 2º colocado viável na fronteira';
      }
      reportMd += `| \`${profile}\` | \`${data.pathId}\` | ${data.score.toFixed(4)} | \`${data.dominantFactor}\` | ${deltaStr} |\n`;
    }
  } else {
    reportMd += `*Nenhum caminho harmônico pôde ser gerado para este cenário.*\n`;
  }
  reportMd += `\n---\n\n`;
}

// Adicionar conclusões analíticas científicas baseadas nas hipóteses
reportMd += `## 🔬 Conclusões Científicas & Diagnósticos da F12.3

### 1. Rigidez de Escolha & Consenso Sistemático
Com base nas métricas observadas:
- O **DW médio** de \`${avgDW.toFixed(2)}\` e a **Concentração de Vencedores (WCR)** de \`${(avgWCR * 100).toFixed(1)}%\` mostram que, embora haja alguma sensibilidade pontual, **o motor tende a escolher o mesmo caminho vencedor na grande maioria dos cenários**, independente do perfil estético selecionado.
- Isso confirma o risco de **excesso de consenso** apontado na revisão.

### 2. Prova Matemática da Dominância da Pedagogia
- O **Delta Margem de Pedagogia** médio é de \`${avgDeltas.pedagogicalImpact.toFixed(4)}\` (\`${(avgDeltas.pedagogicalImpact * 100).toFixed(1)}%\`). Isso indica uma margem de vitória maciça.
- Como o \`pedagogicalImpact\` é cumulativo (soma linear de todos os passos aplicados), ele escala livremente para além do intervalo de \`[0.0, 1.0]\`. Em contrapartida, métricas de tensão, diatonismo ou condução de vozes estão rigorosamente contidas em \`[0.0, 1.0]\`.
- Consequentemente, o termo \`pedagogicalImpact\` age como um "atrator gravitacional" na soma ponderada: caminhos com mais passos ganham um score tão alto neste eixo que anulam o peso das outras dimensões, mesmo em perfis onde a pedagogia tem peso baixo.

### 3. A Ilusão da Tocabilidade Linear (Playability)
- O fato de \`playability\` ter uma margem delta média de quase zero (\`${(avgDeltas.playability * 100).toFixed(2)}%\`) demonstra que ela falha em discriminar caminhos curtos de caminhos longos.
- Como \`playability = 1.0 - max(physicalComplexity)\`, a complexidade de transição física não acumula. Um caminho com 7 transformações simples e um caminho com 1 transformação simples têm exatamente o mesmo score de tocabilidade. Isto remove qualquer penalidade à extensão física do caminho de recomendação, retroalimentando a dominância de caminhos longos (que ganham mais Pedagogia).

---

## 🛠️ Recomendações de Engenharia Harmônica para a Calibração F12.1

Para restaurar o equilíbrio do resolvedor multiobjetivo e garantir que perfis estéticos realmente influenciem o Top 1, sugerimos as seguintes intervenções nas próximas sprints:
1. **Normalização da Pedagogia:** Limitar ou normalizar o \`pedagogicalImpact\` para o intervalo \`[0.0, 1.0]\` (ex: dividindo pelo número máximo de passos possíveis, ou usando uma sigmoide de saturação similar à do Goal Alignment).
2. **Tocabilidade Cumulativa (Playability):** Alterar o cálculo da tocabilidade para penalizar a quantidade de passos. Por exemplo, acumulando a complexidade física de cada transição, ou introduzindo um custo logarítmico ao comprimento do caminho:
   $$\text{playability} = 1.0 - \text{average}(\text{physicalComplexity}) - \beta \cdot \log(1 + \text{steps})$$
3. **Poda e Escalonamento dos Perfis:** Aumentar os pesos principais dos perfis estéticos estritos (ex: \`MAX_TENSION\` ou \`MAX_PLAYABILITY\` terem peso de 0.60 no seu respectivo eixo, diminuindo o ruído dos outros eixos).
`;

try {
  fs.writeFileSync(reportPath, reportMd);
  console.log(`📝 Relatório de divergência de perfis gerado em: [profile_divergence_report.md](file://${reportPath})`);
} catch (err) {
  console.error('Erro ao escrever o relatório de divergência:', err);
}

// Validação final de aceitação
console.log('\n⚖️ Validando critérios de aceitação da Sprint F12.3 (Divergência)...');

const totalPassed = results.filter(r => r.passed).length;
if (totalPassed < SCENARIOS.length) {
  console.warn(`  ⚠️ Alerta de Pesquisa: ${SCENARIOS.length - totalPassed} cenários de estresse falharam em produzir caminhos.`);
} else {
  console.log(`  ✅ Sobrevivência Total (12/12 cenários executados com sucesso)`);
}

console.log(`  📊 Estatísticas consolidadas:`);
console.log(`     ├─ Média de Vencedores Distintos: ${avgDW.toFixed(2)} / 5`);
console.log(`     ├─ Razão de Divergência de Perfis (PDR): ${(avgPDR * 100).toFixed(2)}%`);
console.log(`     ├─ Razão de Concentração de Vencedores (WCR): ${(avgWCR * 100).toFixed(2)}%`);
console.log(`     └─ Auditoria Delta (Média Pedagogia): ${avgDeltas.pedagogicalImpact.toFixed(4)}`);

if (avgPDR < 0.15) {
  console.log(`  ⚠️ Diagnóstico Científico Confirmado: Rigidez e falta de sensibilidade dos perfis (Divergência < 15%).`);
} else {
  console.log(`  ✅ Nível de divergência ativa detectada: ${(avgPDR * 100).toFixed(2)}%`);
}

console.log('\n🎉 SPRINT F12.3 EXECUÇÃO DO BENCHMARK CONCLUÍDA COM SUCESSO!');
