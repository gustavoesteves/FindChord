// Sprint C3.5 — Advanced Harmonic Stress Benchmark
// Run with: npx tsx src/utils/music/tests/harmonicStressBenchmark.test.ts

import * as fs from 'fs';
import * as path from 'path';

import { 
  findSimilarProgressions,
  analyzeProgression,
  generateFingerprint,
  prepareCorpus
} from '../analysis/functionalAnalysis';
import type { 
  CorpusItem,
  DiscoveryOptions,
  DiscoveryMatch,
  OptimizationProfile
} from '../analysis/functionalAnalysis';

// Configuração do Corpus estático para o benchmark de estresse
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
  critical: boolean;
}

const SCENARIOS: StressScenario[] = [
  // Grupo 1 — Giant Steps
  {
    id: 1,
    groupName: 'Grupo 1 — Giant Steps',
    scenarioName: 'Giant Steps Coltrane Standard',
    progression: ['Bmaj7', 'D7', 'Gmaj7', 'Bb7', 'Ebmaj7', 'F#7', 'Bmaj7'],
    critical: true
  },
  {
    id: 2,
    groupName: 'Grupo 1 — Giant Steps',
    scenarioName: 'Giant Steps ii-V-I Variation',
    progression: ['Fm7', 'Bb7', 'Ebmaj7', 'F#7', 'Bmaj7', 'D7', 'Gmaj7'],
    critical: false
  },
  // Grupo 2 — Coltrane Matrix
  {
    id: 3,
    groupName: 'Grupo 2 — Coltrane Matrix',
    scenarioName: 'Coltrane Matrix Symmetric Loop',
    progression: ['Cmaj7', 'Eb7', 'Abmaj7', 'B7', 'Emaj7', 'G7', 'Cmaj7'],
    critical: true
  },
  // Grupo 3 — Late Romantic
  {
    id: 4,
    groupName: 'Grupo 3 — Late Romantic',
    scenarioName: 'Chromatic Mediant Sequence',
    progression: ['C', 'Ab', 'E', 'B', 'G', 'D'],
    critical: false
  },
  {
    id: 5,
    groupName: 'Grupo 3 — Late Romantic',
    scenarioName: 'Wagner Tristan-like Resolution',
    progression: ['Am', 'F', 'B7', 'E7'],
    critical: true
  },
  {
    id: 6,
    groupName: 'Grupo 3 — Late Romantic',
    scenarioName: 'Scriabin-style Chromatic Complexity',
    progression: ['C7b5', 'F#7b5', 'C7b5'],
    critical: false
  },
  // Grupo 4 — Jazz Moderno
  {
    id: 7,
    groupName: 'Grupo 4 — Jazz Moderno',
    scenarioName: 'Backdoor Dominants Cadence',
    progression: ['Cmaj7', 'Fm7', 'Bb7', 'Cmaj7'],
    critical: true
  },
  {
    id: 8,
    groupName: 'Grupo 4 — Jazz Moderno',
    scenarioName: 'Side-slipping ii-V Shift',
    progression: ['Dm7', 'G7', 'Ebm7', 'Ab7', 'Dbmaj7'],
    critical: false
  },
  // Grupo 5 — Ambiguidade Tonal Máxima
  {
    id: 9,
    groupName: 'Grupo 5 — Ambiguidade Tonal Máxima',
    scenarioName: 'Symmetric Ambiguous Cycle',
    progression: ['Cmaj7', 'E7', 'Am7', 'Db7', 'Cmaj7'],
    critical: true
  },
  {
    id: 10,
    groupName: 'Grupo 5 — Ambiguidade Tonal Máxima',
    scenarioName: 'Chromatic Mediant Ambiguity',
    progression: ['Cmaj7', 'Abmaj7', 'Emaj7', 'Cmaj7'],
    critical: false
  },
  // Grupo 6 — Recursive Modulation Stress
  {
    id: 11,
    groupName: 'Grupo 6 — Recursive Modulation Stress',
    scenarioName: 'Recursive Multi-Key Modulation',
    progression: ['Cmaj7', 'E7', 'Amaj7', 'C7', 'Fmaj7', 'Ab7', 'Dbmaj7', 'E7', 'Amaj7'],
    critical: true
  },
  {
    id: 12,
    groupName: 'Grupo 6 — Recursive Modulation Stress',
    scenarioName: 'Symmetric Minor Third Modulation',
    progression: ['C', 'Eb', 'Gb', 'A', 'C', 'Eb', 'Gb', 'A'],
    critical: false
  }
];

const profiles: OptimizationProfile[] = [
  'BALANCED',
  'MAX_TENSION',
  'MAX_PLAYABILITY',
  'MAX_PEDAGOGY',
  'MAX_VOICE_LEADING'
];

interface ScenarioResult {
  scenario: StressScenario;
  profilesData: {
    [key: string]: {
      paretoSize: number;
      dominantFactor: string;
      confidence: number;
      winnerPath: string;
      hypervolume: number;
      spread: number;
      spacing: number;
      fcr: number;
    }
  };
  fsr: number;
  churn: number;
  dominantFactorConsistency: number;
  passed: boolean;
  avgHV: number;
  avgSpread: number;
  avgSpacing: number;
  avgFCR: number;
}

const scenarioResults: ScenarioResult[] = [];

console.log('⚡ Iniciando C3.5 — Advanced Harmonic Stress Benchmark...\n');

for (const scenario of SCENARIOS) {
  console.log(`🎼 Processando Cenário #${scenario.id}: ${scenario.scenarioName} [${scenario.progression.join(', ')}]`);
  
  const profilesData: { [key: string]: any } = {};
  const pathSets: Set<string>[] = [];
  const factors: string[] = [];

  let runsPassed = 0;

  for (const profile of profiles) {
    const match = runQuery(scenario.progression, {
      strategy: 'OVERALL',
      goal: 'INCREASE_TENSION',
      optimizationProfile: profile
    });

    if (match) {
      runsPassed++;
      const paretoSize = match.paretoFrontier ? match.paretoFrontier.frontierSize : 0;
      const dominantFactor = match.recommendationDecision?.dominantFactor ?? 'GOAL_ALIGNMENT';
      const confidence = match.recommendationDecision?.confidence ?? 0;
      const hypervolume = match.paretoFrontier?.hypervolume ?? 0;
      const spread = match.paretoFrontier?.spread ?? 0;
      const spacing = match.paretoFrontier?.spacing ?? 0;
      const fcr = match.paretoFrontier?.frontierCompressionRatio ?? 0;
      
      const winnerPath = match.recommendedPaths && match.recommendedPaths.length > 0
        ? match.recommendedPaths[0].steps.map(s => s.id).join(' + ')
        : 'Nenhum';
      
      profilesData[profile] = {
        paretoSize,
        dominantFactor,
        confidence,
        winnerPath,
        hypervolume,
        spread,
        spacing,
        fcr
      };

      if (match.paretoFrontier) {
        pathSets.push(new Set<string>(match.paretoFrontier.paths.map(p => p.pathId)));
      } else {
        pathSets.push(new Set<string>());
      }
      
      factors.push(dominantFactor);
    } else {
      profilesData[profile] = {
        paretoSize: 0,
        dominantFactor: 'N/A',
        confidence: 0,
        winnerPath: 'FAIL',
        hypervolume: 0,
        spread: 0,
        spacing: 0,
        fcr: 0
      };
      pathSets.push(new Set<string>());
      factors.push('N/A');
    }
  }

  const intersection = new Set<string>();
  if (pathSets.length > 0) {
    for (const pathId of pathSets[0]) {
      if (pathSets.every(set => set.has(pathId))) {
        intersection.add(pathId);
      }
    }
  }

  const union = new Set<string>();
  for (const set of pathSets) {
    for (const pathId of set) {
      union.add(pathId);
    }
  }

  const fsr = union.size > 0 ? intersection.size / union.size : 0;
  const churn = 1 - fsr;

  const factorCounts: { [key: string]: number } = {};
  for (const f of factors) {
    if (f !== 'N/A') {
      factorCounts[f] = (factorCounts[f] || 0) + 1;
    }
  }
  const maxCount = Object.keys(factorCounts).length > 0 ? Math.max(...Object.values(factorCounts)) : 0;
  const dominantFactorConsistency = maxCount / 5;

  const passed = runsPassed === 5;

  // Geometry aggregations for the scenario
  let sumHV = 0;
  let sumSpread = 0;
  let sumSpacing = 0;
  let sumFCR = 0;
  let validProfileRuns = 0;

  for (const profile of profiles) {
    const data = profilesData[profile];
    if (data.winnerPath !== 'FAIL') {
      sumHV += data.hypervolume;
      sumSpread += data.spread;
      sumSpacing += data.spacing;
      sumFCR += data.fcr;
      validProfileRuns++;
    }
  }

  const avgHV = validProfileRuns > 0 ? sumHV / validProfileRuns : 0;
  const avgSpread = validProfileRuns > 0 ? sumSpread / validProfileRuns : 0;
  const avgSpacing = validProfileRuns > 0 ? sumSpacing / validProfileRuns : 0;
  const avgFCR = validProfileRuns > 0 ? sumFCR / validProfileRuns : 0;

  scenarioResults.push({
    scenario,
    profilesData,
    fsr,
    churn,
    dominantFactorConsistency,
    passed,
    avgHV,
    avgSpread,
    avgSpacing,
    avgFCR
  } as any);

  console.log(`   └─ Estabilidade da Fronteira (FSR): ${(fsr * 100).toFixed(2)}% | Churn: ${(churn * 100).toFixed(2)}% | Consistência de Fator: ${(dominantFactorConsistency * 100).toFixed(0)}%`);
  console.log(`      Geometria: HV = ${avgHV.toFixed(4)} | Spread = ${avgSpread.toFixed(4)} | Spacing = ${avgSpacing.toFixed(4)} | FCR = ${avgFCR.toFixed(4)}`);
}

// ═══════════════════════════════════════════════════════════
// GERAÇÃO DE RELATÓRIO EM MARKDOWN
// ═══════════════════════════════════════════════════════════
const appDataDir = '/Users/gustavoesteves/.gemini/antigravity-ide';
const stressReportPath = path.join(appDataDir, 'brain/f6477136-2b69-47c8-8b1f-1aa05a2947ab/harmonic_stress_benchmark_report.md');

let reportMd = `# Relatório de Estresse Harmônico Avançado (Sprint F12.3)

Este relatório compila a validação de robustez do recomendador harmônico sob condições de estresse estrutural extremo, modulações recursivas e terças coltraneanas simétricas. Ele documenta o comportamento do resolvedor multiobjetivo por meio de indicadores de estabilidade de Pareto e as novas métricas geométricas da fronteira.

---

## 📈 Resumo Estatístico de Estresse

| Métrica | Média Geral | Mínimo | Máximo |
| --- | :---: | :---: | :---: |
| **Frontier Stability Ratio (FSR)** | ${(scenarioResults.reduce((sum, r) => sum + r.fsr, 0) / scenarioResults.length * 100).toFixed(2)}% | ${(Math.min(...scenarioResults.map(r => r.fsr)) * 100).toFixed(2)}% | ${(Math.max(...scenarioResults.map(r => r.fsr)) * 100).toFixed(2)}% |
| **Pareto Churn** | ${(scenarioResults.reduce((sum, r) => sum + r.churn, 0) / scenarioResults.length * 100).toFixed(2)}% | ${(Math.min(...scenarioResults.map(r => r.churn)) * 100).toFixed(2)}% | ${(Math.max(...scenarioResults.map(r => r.churn)) * 100).toFixed(2)}% |
| **Dominant Factor Consistency** | ${(scenarioResults.reduce((sum, r) => sum + r.dominantFactorConsistency, 0) / scenarioResults.length * 100).toFixed(2)}% | ${(Math.min(...scenarioResults.map(r => r.dominantFactorConsistency)) * 100).toFixed(0)}% | ${(Math.max(...scenarioResults.map(r => r.dominantFactorConsistency)) * 100).toFixed(0)}% |
| **Hypervolume (HV)** | ${(scenarioResults.reduce((sum, r) => sum + r.avgHV, 0) / scenarioResults.length).toFixed(4)} | ${(Math.min(...scenarioResults.map(r => r.avgHV))).toFixed(4)} | ${(Math.max(...scenarioResults.map(r => r.avgHV))).toFixed(4)} |
| **Spread (Delta)** | ${(scenarioResults.reduce((sum, r) => sum + r.avgSpread, 0) / scenarioResults.length).toFixed(4)} | ${(Math.min(...scenarioResults.map(r => r.avgSpread))).toFixed(4)} | ${(Math.max(...scenarioResults.map(r => r.avgSpread))).toFixed(4)} |
| **Spacing (S)** | ${(scenarioResults.reduce((sum, r) => sum + r.avgSpacing, 0) / scenarioResults.length).toFixed(4)} | ${(Math.min(...scenarioResults.map(r => r.avgSpacing))).toFixed(4)} | ${(Math.max(...scenarioResults.map(r => r.avgSpacing))).toFixed(4)} |
| **Frontier Compression Ratio (FCR)** | ${(scenarioResults.reduce((sum, r) => sum + r.avgFCR, 0) / scenarioResults.length).toFixed(4)} | ${(Math.min(...scenarioResults.map(r => r.avgFCR))).toFixed(4)} | ${(Math.max(...scenarioResults.map(r => r.avgFCR))).toFixed(4)} |

---

## 📋 Resultados Granulares por Cenário de Estresse

`;

for (const res of scenarioResults) {
  reportMd += `### 🎼 Cenário #${res.scenario.id}: ${res.scenario.scenarioName}\n`;
  reportMd += `- **Progressão de Estresse:** \`[${res.scenario.progression.join(', ')}]\`\n`;
  reportMd += `- **Grupo Harmônico:** ${res.scenario.groupName}\n`;
  reportMd += `- **FSR (Frontier Stability Ratio):** \`${(res.fsr * 100).toFixed(2)}%\` (medida de interseção de Pareto)\n`;
  reportMd += `- **Pareto Churn:** \`${(res.churn * 100).toFixed(2)}%\` (grau de variabilidade da fronteira)\n`;
  reportMd += `- **Consistência do Fator Dominante:** \`${(res.dominantFactorConsistency * 100).toFixed(0)}%\` (motivação de escolha estável)\n`;
  reportMd += `- **Geometria Pareto Média:** HV=\`${res.avgHV.toFixed(4)}\` | Spread=\`${res.avgSpread.toFixed(4)}\` | Spacing=\`${res.avgSpacing.toFixed(4)}\` | FCR=\`${res.avgFCR.toFixed(4)}\`\n`;
  reportMd += `- **Sobrevivência de Geração:** ${res.passed ? '✅ Aprovado (Sobreviveu aos 5 Perfis)' : '❌ Regressão (Falhou em pelo menos 1 Perfil)'}\n\n`;
  
  reportMd += `| Perfil de Otimização | Tamanho da Fronteira | Fator Dominante Selecionado | Confiança | HV | Spread | Spacing | FCR | Caminho Vencedor Recomendado |\n`;
  reportMd += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |\n`;
  
  for (const profile of profiles) {
    const data = res.profilesData[profile];
    reportMd += `| \`${profile}\` | ${data.paretoSize} | \`${data.dominantFactor}\` | ${(data.confidence * 100).toFixed(0)}% | ${data.hypervolume?.toFixed(4) ?? '0.0000'} | ${data.spread?.toFixed(4) ?? '0.0000'} | ${data.spacing?.toFixed(4) ?? '0.0000'} | ${data.fcr?.toFixed(4) ?? '0.0000'} | \`${data.winnerPath}\` |\n`;
  }
  reportMd += `\n---\n\n`;
}

try {
  fs.writeFileSync(stressReportPath, reportMd);
  console.log(`📝 Relatório de estresse harmônico gerado em: [harmonic_stress_benchmark_report.md](file://${stressReportPath})`);
} catch (err) {
  console.error('Erro ao escrever o relatório de estresse:', err);
}

// Asserções Estritas de Validação de Estresse
console.log('\n⚖️ Validando critérios de aceitação da Sprint F12.3...');

const totalPassedScenarios = scenarioResults.filter(r => r.passed).length;
if (totalPassedScenarios < SCENARIOS.length) {
  throw new Error(`Benchmark falhou: ${SCENARIOS.length - totalPassedScenarios} cenários harmônicos falharam em concluir a geração nos 5 perfis estéticos.`);
}
console.log(`  ✅ Sobrevivência Total (12/12 cenários gerados com sucesso nos 5 perfis)`);

const averageFSR = scenarioResults.reduce((sum, r) => sum + r.fsr, 0) / scenarioResults.length;
if (averageFSR < 0.05) {
  console.warn(`  ⚠️ Alerta de Pesquisa: Estabilidade de Fronteira média muito baixa (${(averageFSR * 100).toFixed(2)}%). As soluções mudam radicalmente por perfil.`);
} else {
  console.log(`  ✅ Estabilidade de Fronteira média aceitável (${(averageFSR * 100).toFixed(2)}%)`);
}

const averageConsistency = scenarioResults.reduce((sum, r) => sum + r.dominantFactorConsistency, 0) / scenarioResults.length;
if (averageConsistency < 0.40) {
  throw new Error(`Benchmark falhou: Consistência do fator dominante média (${(averageConsistency * 100).toFixed(2)}%) é inferior ao limite tolerado de 40%.`);
}
console.log(`  ✅ Consistência de Fator Dominante adequada (${(averageConsistency * 100).toFixed(2)}%)`);

console.log('\n🎉 SPRINT F12.3 APROVADA COM SUCESSO!');
