import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { annotateProposalPresentationRoles } from "../src/utils/music/analysis/strategies/ProposalPresentationPlanner";
import { rankReharmonizationProposalsByVoiceLeading } from "../src/utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import {
  findHarmonizableWindow,
  firstMelodicWindow,
  toAnchors
} from "./real-music-audit";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

export const promotedImportDir = path.resolve(process.cwd(), "docs/musics/imported-real-book");
export const promotedImportAuditReportPath = path.resolve(process.cwd(), "docs/reports/f69-promoted-import-corpus-audit-report.md");
export const promotedImportAuditCsvPath = path.resolve(process.cwd(), "docs/reports/f69-promoted-import-corpus-audit.csv");

export interface PromotedImportAuditResult {
  file: string;
  title: string;
  sourceId: string;
  measures: number;
  noteCount: number;
  harmonyCount: number;
  sectionCount: number;
  keySignature?: string;
  status: "harmonized" | "no-melody" | "no-proposal" | "parse-error";
  parseError?: string;
  windowMeasures: number[];
  proposalCount: number;
  referenceOverlapCount: number;
  selectedCenter?: string;
  selectedCenterSource?: string;
  primaryProposalName?: string;
  primaryChords?: string;
}

export function promotedImportFiles(dir = promotedImportDir): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".musicxml"))
    .sort();
}

export function auditPromotedImportFile(file: string, dir = promotedImportDir): PromotedImportAuditResult {
  const sourceId = file.match(/^([a-z0-9]+)-/)?.[1] ?? "unknown";

  try {
    const snapshot = parseMusicXML(fs.readFileSync(path.join(dir, file), "utf8"));
    const base = {
      file,
      title: snapshot.metadata.title || file.replace(/\.musicxml$/i, ""),
      sourceId,
      measures: snapshot.metadata.measures,
      noteCount: snapshot.notes.length,
      harmonyCount: snapshot.harmonies.length,
      sectionCount: snapshot.sections.length,
      keySignature: snapshot.metadata.keySignature
    };
    const firstWindowAnchors = toAnchors(firstMelodicWindow(snapshot.notes));

    if (firstWindowAnchors.length === 0) {
      return {
        ...base,
        status: "no-melody",
        windowMeasures: [],
        proposalCount: 0,
        referenceOverlapCount: 0
      };
    }

    const harmonizable = findHarmonizableWindow(snapshot.notes, snapshot.metadata.keySignature, snapshot.harmonies);
    if (!harmonizable) {
      return {
        ...base,
        status: "no-proposal",
        windowMeasures: uniqueMeasures(firstWindowAnchors.map((anchor) => anchor.measureIndex)),
        proposalCount: 0,
        referenceOverlapCount: 0
      };
    }

    const ranked = rankReharmonizationProposalsByVoiceLeading(
      harmonizable.generation.proposals,
      harmonizable.phraseContext,
      harmonizable.anchors,
      { referenceHarmonies: snapshot.harmonies }
    );
    const presented = annotateProposalPresentationRoles(ranked, "balanced", harmonizable.phraseContext);
    const primary = presented.find((proposal) => proposal.presentationRole === "primary") ?? presented[0];

    return {
      ...base,
      status: "harmonized",
      windowMeasures: uniqueMeasures(harmonizable.anchors.map((anchor) => anchor.measureIndex)),
      proposalCount: presented.length,
      referenceOverlapCount: harmonizable.referenceOverlapCount,
      selectedCenter: `${harmonizable.phraseContext.selectedCenter.tonic} ${harmonizable.phraseContext.selectedCenter.mode}`,
      selectedCenterSource: harmonizable.phraseContext.selectedCenterSource,
      primaryProposalName: primary?.name,
      primaryChords: primary?.measures.map((measure) => measure.chords.join(" / ")).join(" | ")
    };
  } catch (error) {
    return {
      file,
      title: file.replace(/\.musicxml$/i, ""),
      sourceId,
      measures: 0,
      noteCount: 0,
      harmonyCount: 0,
      sectionCount: 0,
      status: "parse-error",
      parseError: error instanceof Error ? error.message : String(error),
      windowMeasures: [],
      proposalCount: 0,
      referenceOverlapCount: 0
    };
  }
}

export function auditPromotedImportCorpus(dir = promotedImportDir): PromotedImportAuditResult[] {
  return promotedImportFiles(dir).map((file) => auditPromotedImportFile(file, dir));
}

export function renderPromotedImportAuditReport(results: PromotedImportAuditResult[]): string {
  const statusCounts = countBy(results, (result) => result.status);
  const bySource = groupBySource(results);
  const harmonized = results.filter((result) => result.status === "harmonized");
  const bestReferenceOverlap = [...harmonized]
    .sort((a, b) => b.referenceOverlapCount - a.referenceOverlapCount || b.proposalCount - a.proposalCount)
    .slice(0, 30);
  const review = results.filter((result) => result.status !== "harmonized");

  const lines = [
    "# F69 - Auditoria musical do corpus importado",
    "",
    "Este relatorio roda uma auditoria leve de harmonizacao sobre `docs/musics/imported-real-book`.",
    "Ele nao substitui a curadoria musical; serve para indicar quais arquivos ja alimentam bem o harmonizador.",
    "",
    "## Leitura geral",
    "",
    `- Arquivos auditados: ${results.length}`,
    `- Harmonizados: ${statusCounts.harmonized ?? 0}`,
    `- Sem proposta: ${statusCounts["no-proposal"] ?? 0}`,
    `- Sem melodia: ${statusCounts["no-melody"] ?? 0}`,
    `- Erro de parse: ${statusCounts["parse-error"] ?? 0}`,
    `- Notas lidas: ${sum(results, (result) => result.noteCount)}`,
    `- Cifras lidas: ${sum(results, (result) => result.harmonyCount)}`,
    "",
    "## Por volume",
    "",
    "| Volume | Arquivos | Harmonizados | Sem proposta | Sem melodia | Parse erro |",
    "| --- | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const [sourceId, sourceResults] of bySource.entries()) {
    const sourceStatusCounts = countBy(sourceResults, (result) => result.status);
    lines.push(
      `| ${sourceId.toUpperCase()} | ${sourceResults.length} | ${sourceStatusCounts.harmonized ?? 0} | ${sourceStatusCounts["no-proposal"] ?? 0} | ${sourceStatusCounts["no-melody"] ?? 0} | ${sourceStatusCounts["parse-error"] ?? 0} |`
    );
  }

  lines.push("", "## Bons casos de comparacao com referencia", "");
  lines.push("| Arquivo | Centro | Propostas | Sobreposicao ref. | Cifras geradas |");
  lines.push("| --- | --- | ---: | ---: | --- |");
  for (const result of bestReferenceOverlap) {
    lines.push(
      `| \`${result.file}\` | ${result.selectedCenter ?? ""} | ${result.proposalCount} | ${result.referenceOverlapCount} | ${escapeTable(result.primaryChords ?? "")} |`
    );
  }

  lines.push("", "## Itens que ainda precisam investigacao", "");
  if (review.length === 0) {
    lines.push("Nenhum item tecnico pendente neste passe.");
  } else {
    lines.push("| Arquivo | Status | Motivo |");
    lines.push("| --- | --- | --- |");
    for (const result of review) {
      lines.push(`| \`${result.file}\` | ${statusLabel(result.status)} | ${escapeTable(reviewReason(result))} |`);
    }
  }

  lines.push("", "## Proxima acao", "");
  lines.push("Usar os casos harmonizados com boa sobreposicao de referencia como lote de calibragem do Harmonizar. Os itens sem proposta devem virar investigacao de janela melodica, centro ou vocabulario melodico.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

export function renderPromotedImportAuditCsv(results: PromotedImportAuditResult[]): string {
  const header = [
    "file",
    "sourceId",
    "title",
    "status",
    "measures",
    "noteCount",
    "harmonyCount",
    "sectionCount",
    "keySignature",
    "windowMeasures",
    "proposalCount",
    "referenceOverlapCount",
    "selectedCenter",
    "selectedCenterSource",
    "primaryProposalName",
    "primaryChords",
    "parseError"
  ];
  const rows = results.map((result) => [
    result.file,
    result.sourceId,
    result.title,
    result.status,
    String(result.measures),
    String(result.noteCount),
    String(result.harmonyCount),
    String(result.sectionCount),
    result.keySignature ?? "",
    result.windowMeasures.join(" "),
    String(result.proposalCount),
    String(result.referenceOverlapCount),
    result.selectedCenter ?? "",
    result.selectedCenterSource ?? "",
    result.primaryProposalName ?? "",
    result.primaryChords ?? "",
    result.parseError ?? ""
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

export function runPromotedImportAudit(): PromotedImportAuditResult[] {
  const results = auditPromotedImportCorpus();
  fs.mkdirSync(path.dirname(promotedImportAuditReportPath), { recursive: true });
  fs.writeFileSync(promotedImportAuditReportPath, renderPromotedImportAuditReport(results), "utf8");
  fs.writeFileSync(promotedImportAuditCsvPath, renderPromotedImportAuditCsv(results), "utf8");
  return results;
}

function uniqueMeasures(measures: number[]): number[] {
  return Array.from(new Set(measures)).sort((a, b) => a - b);
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const value = key(item);
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function groupBySource(results: PromotedImportAuditResult[]): Map<string, PromotedImportAuditResult[]> {
  const grouped = new Map<string, PromotedImportAuditResult[]>();
  for (const result of results) {
    grouped.set(result.sourceId, [...(grouped.get(result.sourceId) ?? []), result]);
  }
  return grouped;
}

function sum(items: PromotedImportAuditResult[], value: (item: PromotedImportAuditResult) => number): number {
  return items.reduce((total, item) => total + value(item), 0);
}

function statusLabel(status: PromotedImportAuditResult["status"]): string {
  if (status === "harmonized") return "harmonizado";
  if (status === "no-melody") return "sem melodia";
  if (status === "no-proposal") return "sem proposta";
  return "erro de parse";
}

function reviewReason(result: PromotedImportAuditResult): string {
  if (result.parseError) return result.parseError;
  if (result.status === "no-melody") return "parser nao encontrou notas melodicas";
  if (result.status === "no-proposal") return "nenhuma janela melodica gerou proposta";
  return "revisao tecnica";
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = runPromotedImportAudit();
  const counts = countBy(results, (result) => result.status);
  console.log(`Promoted import audit complete: ${results.length} files.`);
  console.log(`Harmonized: ${counts.harmonized ?? 0}`);
  console.log(`No proposal: ${counts["no-proposal"] ?? 0}`);
  console.log(`No melody: ${counts["no-melody"] ?? 0}`);
  console.log(`Parse errors: ${counts["parse-error"] ?? 0}`);
  console.log(`Report: ${path.relative(process.cwd(), promotedImportAuditReportPath)}`);
  console.log(`CSV: ${path.relative(process.cwd(), promotedImportAuditCsvPath)}`);
}
