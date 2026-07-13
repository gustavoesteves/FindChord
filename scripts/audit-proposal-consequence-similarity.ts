import fs from "node:fs";
import path from "node:path";
import {
  compareProposalConsequences,
  type ProposalConsequenceSimilarityReport
} from "../src/utils/music/analysis/strategies/ProposalConsequenceSimilarity";
import {
  analyzeProposalCurationForFile,
  proposalCurationMusicXmlFiles,
  type CuratedProposalIdea,
  type ProposalCurationAnalysis
} from "./audit-proposal-curation";

export interface ProposalConsequenceAuditRow {
  file: string;
  title: string;
  center: string;
  firstOrigin: CuratedProposalIdea["origin"];
  firstName: string;
  firstChords: string;
  secondOrigin: CuratedProposalIdea["origin"];
  secondName: string;
  secondChords: string;
  comparableSlots: number;
  functionAgreement: number;
  rootAgreement: number;
  bassAgreement: number;
  sonorityAgreement: number;
}

function chordSummary(idea: CuratedProposalIdea): string {
  return idea.proposal.measures
    .map(measure => measure.chords.join(" / "))
    .join(" | ");
}

function rowForPair(
  analysis: ProposalCurationAnalysis,
  first: CuratedProposalIdea,
  second: CuratedProposalIdea,
  report: ProposalConsequenceSimilarityReport
): ProposalConsequenceAuditRow {
  return {
    file: analysis.row.file,
    title: analysis.row.title,
    center: analysis.center,
    firstOrigin: first.origin,
    firstName: first.label,
    firstChords: chordSummary(first),
    secondOrigin: second.origin,
    secondName: second.label,
    secondChords: chordSummary(second),
    comparableSlots: report.comparableSlots,
    functionAgreement: report.functionAgreement,
    rootAgreement: report.rootAgreement,
    bassAgreement: report.bassAgreement,
    sonorityAgreement: report.sonorityAgreement
  };
}

export function collectNearEquivalentPairsForAnalysis(
  analysis: ProposalCurationAnalysis
): ProposalConsequenceAuditRow[] {
  const rows: ProposalConsequenceAuditRow[] = [];
  for (let firstIndex = 0; firstIndex < analysis.visibleIdeas.length; firstIndex++) {
    for (let secondIndex = firstIndex + 1; secondIndex < analysis.visibleIdeas.length; secondIndex++) {
      const first = analysis.visibleIdeas[firstIndex];
      const second = analysis.visibleIdeas[secondIndex];
      const report = compareProposalConsequences(first.proposal, second.proposal, {
        center: analysis.center,
        classificationMode: analysis.classificationMode
      });
      if (report.relationship === "near-equivalent-color") {
        rows.push(rowForPair(analysis, first, second, report));
      }
    }
  }
  return rows;
}

export function collectNearEquivalentPairsForFile(relativeFile: string): ProposalConsequenceAuditRow[] {
  return collectNearEquivalentPairsForAnalysis(analyzeProposalCurationForFile(relativeFile, {
    groupColorVariants: false
  }));
}

export function collectProposalConsequenceAudit(): ProposalConsequenceAuditRow[] {
  return proposalCurationMusicXmlFiles().flatMap(collectNearEquivalentPairsForFile);
}

function csvEscape(value: string | number): string {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function renderCsv(rows: ProposalConsequenceAuditRow[]): string {
  const headers: (keyof ProposalConsequenceAuditRow)[] = [
    "file",
    "title",
    "center",
    "firstOrigin",
    "firstName",
    "firstChords",
    "secondOrigin",
    "secondName",
    "secondChords",
    "comparableSlots",
    "functionAgreement",
    "rootAgreement",
    "bassAgreement",
    "sonorityAgreement"
  ];
  return [
    headers.map(csvEscape).join(","),
    ...rows.map(row => headers.map(header => csvEscape(row[header])).join(","))
  ].join("\n") + "\n";
}

function markdownCell(value: string | number): string {
  return String(value).replace(/\|/g, "\\|");
}

function renderMarkdown(rows: ProposalConsequenceAuditRow[]): string {
  const files = new Set(rows.map(row => row.file));
  const affectedIdeas = new Set(rows.flatMap(row => [
    `${row.file}:${row.firstOrigin}:${row.firstName}`,
    `${row.file}:${row.secondOrigin}:${row.secondName}`
  ]));
  const mainPairs = rows.filter(row => row.firstOrigin === "main" && row.secondOrigin === "main").length;
  const mixedPairs = rows.filter(row => row.firstOrigin !== row.secondOrigin).length;
  const localPairs = rows.filter(row => row.firstOrigin === "local" && row.secondOrigin === "local").length;
  const highlighted = [...rows]
    .sort((a, b) => b.sonorityAgreement - a.sonorityAgreement || a.file.localeCompare(b.file))
    .slice(0, 50);
  const lines = [
    "# F109 - Similaridade de consequencia harmonica",
    "",
    "A auditoria procura propostas nao identicas que preservam tempo, percurso funcional, raizes e baixo, variando principalmente a cor dos acordes.",
    "",
    "## Resumo",
    "",
    "- Partituras analisadas: 199",
    `- Partituras com pares quase equivalentes: ${files.size}`,
    `- Pares quase equivalentes: ${rows.length}`,
    `- Ideias envolvidas: ${affectedIdeas.size}`,
    `- Pares entre ideias principais: ${mainPairs}`,
    `- Pares entre ideia principal e trecho local: ${mixedPairs}`,
    `- Pares entre trechos locais: ${localPairs}`,
    "",
    "## Pares mais proximos",
    "",
    "| Arquivo | Primeira ideia | Segunda ideia | Pontos | Sonoridade |",
    "| --- | --- | --- | ---: | ---: |"
  ];

  for (const row of highlighted) {
    lines.push(`| ${[
      row.file,
      `${row.firstOrigin}: ${row.firstName}`,
      `${row.secondOrigin}: ${row.secondName}`,
      row.comparableSlots,
      `${Math.round(row.sonorityAgreement * 100)}%`
    ].map(markdownCell).join(" | ")} |`);
  }

  lines.push("");
  lines.push("## Leitura");
  lines.push("");
  lines.push("Esta e uma auditoria conservadora: qualquer mudanca de raiz, baixo, densidade temporal ou funcao contextual impede a classificacao como quase equivalente.");
  lines.push("No fluxo atual da UI, esses pares podem ser agrupados como variacoes de cor do mesmo card quando preservam tempo, funcao, raiz e baixo.");
  lines.push("A auditoria continua registrando os pares completos para revisao musical: se a extensao alterar a conducao de vozes de forma relevante, a regra deve ser refinada antes de agrupar.");
  lines.push("O CSV registra as duas progressoes completas para revisao musical.");
  lines.push("");
  return lines.join("\n");
}

export function writeProposalConsequenceAudit(rows = collectProposalConsequenceAudit()): void {
  const reportPath = path.join(process.cwd(), "docs/reports/f109-proposal-consequence-similarity.md");
  const csvPath = path.join(process.cwd(), "docs/reports/f109-proposal-consequence-similarity.csv");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderMarkdown(rows));
  fs.writeFileSync(csvPath, renderCsv(rows));
  console.log(`Proposal consequence audit complete: ${rows.length} near-equivalent pairs.`);
}
