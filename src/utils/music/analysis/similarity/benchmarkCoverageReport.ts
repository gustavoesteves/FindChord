import type { CombinedCoverageResult } from './coverageAnalyticsEngine';
import type { ParetoCoverageResult } from './paretoCoverageMap';

export interface CoverageDistribution {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  skewness: number;
}

/**
 * Calculates descriptive statistics for a distribution, including Pearson skewness.
 */
export function calculateDistributionStats(values: number[]): CoverageDistribution {
  const n = values.length;
  if (n === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0, skewness: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[n - 1];

  const sum = values.reduce((s, v) => s + v, 0);
  const mean = sum / n;

  let median = 0;
  if (n % 2 === 0) {
    median = (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  } else {
    median = sorted[Math.floor(n / 2)];
  }

  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);

  let skewness = 0.0;
  if (stdDev > 0.0001) {
    const sumCubicDev = values.reduce((s, v) => s + Math.pow(v - mean, 3), 0);
    skewness = (sumCubicDev / n) / Math.pow(stdDev, 3);
  }

  return {
    min: Number(min.toFixed(4)),
    max: Number(max.toFixed(4)),
    mean: Number(mean.toFixed(4)),
    median: Number(median.toFixed(4)),
    stdDev: Number(stdDev.toFixed(4)),
    skewness: Number(skewness.toFixed(4))
  };
}

/**
 * Generates the full benchmark_coverage_report.md content.
 */
export function generateCoverageReportMd(
  combined: CombinedCoverageResult,
  paretoGrid: ParetoCoverageResult,
  distributions: Record<string, CoverageDistribution>
): string {
  let md = `# 📊 Relatório de Cobertura de Corpus (Sprint F10-E)

Este relatório apresenta a cobertura estatística e a representatividade do corpus de validação do Find Chord. Ele avalia se os cenários de benchmark cobrem adequadamente todo o espaço harmônico e o espaço de objetivos de Pareto.

---

## 🎯 1. Resumo Executivo de Cobertura

| Métrica | Valor | Meta | Status |
| :--- | :---: | :---: | :---: |
| **Combined Coverage Score** | \`${(combined.combinedCoverageScore * 100).toFixed(2)}%\` | \`> 70.0%\` | ${combined.combinedCoverageScore > 0.70 ? '🟢 Aprovado' : '🔴 Reprovado'} |
| **Coverage Gap** | \`${(combined.coverageGap * 100).toFixed(2)}%\` | \`N/A\` | \`Info\` |
| **Benchmark Quality Score** | \`${combined.benchmarkQualityScore.toFixed(4)}\` | \`> 0.70\` | ${combined.benchmarkQualityScore > 0.70 ? '🟢 Excelente' : '🔴 Fraco'} |
| **Pareto Space Coverage** | \`${(paretoGrid.coverage * 100).toFixed(2)}%\` | \`> 70.0%\` | ${paretoGrid.coverage > 0.70 ? '🟢 Aprovado' : '🔴 Reprovado'} |
| **Average Diversity (Shannon)** | \`${combined.averageDiversity.toFixed(4)}\` | \`> 0.60\` | ${combined.averageDiversity > 0.60 ? '🟢 Aprovado' : '🔴 Reprovado'} |
| **Average Balance (Uniformity)** | \`${combined.averageBalance.toFixed(4)}\` | \`N/A\` | \`Info\` |

---

## 🗺️ 2. Pareto Coverage Map (Hypervolume vs Information Gain)

Eixo Vertical (Linhas): **Hypervolume**
Eixo Horizontal (Colunas): **Information Gain**

| Hypervolume \\ Information Gain | ${paretoGrid.colLabels[0]} | ${paretoGrid.colLabels[1]} | ${paretoGrid.colLabels[2]} |
| :--- | :---: | :---: | :---: |
| **${paretoGrid.rowLabels[0]}** | ${paretoGrid.grid[0][0]} | ${paretoGrid.grid[0][1]} | ${paretoGrid.grid[0][2]} |
| **${paretoGrid.rowLabels[1]}** | ${paretoGrid.grid[1][0]} | ${paretoGrid.grid[1][1]} | ${paretoGrid.grid[1][2]} |
| **${paretoGrid.rowLabels[2]}** | ${paretoGrid.grid[2][0]} | ${paretoGrid.grid[2][1]} | ${paretoGrid.grid[2][2]} |

*Células Ocupadas: **${paretoGrid.occupiedCount} / ${paretoGrid.totalCells}** (${(paretoGrid.coverage * 100).toFixed(1)}%)*

---

## 📈 3. Estatísticas Descritivas das Distribuições

| Dimensão | Mínimo | Máximo | Média | Mediana | Desvio Padrão | Skewness (Assimetria) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
`;

  for (const [name, stats] of Object.entries(distributions)) {
    md += `| **${name}** | ${stats.min} | ${stats.max} | ${stats.mean} | ${stats.median} | ${stats.stdDev} | ${stats.skewness} |\n`;
  }

  md += `
---

## 📊 4. Detalhes de Cobertura por Dimensão

`;

  for (const [dim, res] of Object.entries(combined.dimensionResults)) {
    md += `### 🔹 ${dim}\n\n`;
    md += `*   **Cobertura Local**: \`${(res.coverage * 100).toFixed(1)}%\` (${res.occupiedBins} / ${res.totalBins} bins ocupados)\n`;
    md += `*   **Distribuição de Bins**:\n`;
    res.binLabels.forEach((label, idx) => {
      const count = res.binCounts[idx];
      const pct = (res.binPercentages[idx] * 100).toFixed(1);
      md += `    - \`${label}\`: **${count}** cenários (${pct}%)\n`;
    });
    md += `\n`;
  }

  md += `---

## 🚨 5. Detecção de Outliers e Regiões Sub-representadas

`;

  if (combined.allWarnings.length === 0) {
    md += `🟢 **Nenhuma anomalia de cobertura detectada. Todas as regiões de teste possuem amostragem adequada.**\n`;
  } else {
    combined.allWarnings.forEach(warn => {
      md += `*   ${warn}\n`;
    });
  }

  md += `
---

## 🧠 6. Recomendações Automáticas para Cenários Adicionais

`;

  if (combined.topMissingRegions.length === 0) {
    md += `🟢 **Nenhuma região prioritária de vácuo amostral identificada. O benchmark está balanceado.**\n`;
  } else {
    md += `Para mitigar a lacuna de cobertura e ampliar a representatividade do benchmark, recomenda-se adicionar novos cenários de testes cobrindo as seguintes regiões:\n\n`;
    combined.topMissingRegions.forEach(region => {
      md += `-   ➕ **Adicionar cenários para a região**: \`${region}\`\n`;
    });
  }

  return md;
}
