import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { resolveChordSymbol, type ChordResolverConfidence } from "../src/utils/music/theory/ChordSymbolResolver";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

export const splitCatalogDir = path.resolve(process.cwd(), "docs/imports/split");
export const importAuditReportPath = path.resolve(process.cwd(), "docs/reports/f66-import-split-audit-report.md");
export const importAuditCsvPath = path.resolve(process.cwd(), "docs/reports/f66-import-split-audit.csv");

export interface ImportSplitAuditResult {
  file: string;
  title: string;
  sourceId: string;
  measures: number;
  noteCount: number;
  harmonyCount: number;
  rawHarmonyCount: number;
  parsedHarmonyRatio: number;
  uniqueHarmonyCount: number;
  sectionCount: number;
  keySignature?: string;
  status: "candidate" | "needs-review" | "parse-error";
  parseError?: string;
  chordWarnings: string[];
  confidenceCounts: Record<ChordResolverConfidence, number>;
  sampleChords: string[];
  candidateScore: number;
}

export function splitCatalogFiles(dir = splitCatalogDir): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".musicxml"))
    .sort();
}

export function auditSplitCatalogFile(file: string, dir = splitCatalogDir): ImportSplitAuditResult {
  const fullPath = path.join(dir, file);
  const xml = fs.readFileSync(fullPath, "utf8");
  const sourceId = file.match(/^([a-z0-9]+)-/)?.[1] ?? "unknown";
  const rawHarmonyCount = countRawHarmonyTags(xml);

  try {
    const snapshot = parseMusicXML(xml);
    const harmonies = snapshot.harmonies.map((harmony: { harmony: string }) => harmony.harmony);
    const uniqueHarmonies = Array.from(new Set(harmonies)).sort();
    const resolved = uniqueHarmonies.map((harmony) => resolveChordSymbol(harmony, "br"));
    const confidenceCounts = emptyConfidenceCounts();
    const chordWarnings = new Set<string>();

    for (const chord of resolved) {
      confidenceCounts[chord.confidence] += 1;
      for (const warning of chord.warnings) {
        chordWarnings.add(`${chord.raw}: ${warning}`);
      }
    }

    const parsedHarmonyRatio = rawHarmonyCount > 0 ? harmonies.length / rawHarmonyCount : 1;
    const status = classifyAuditResult({
      noteCount: snapshot.notes.length,
      harmonyCount: harmonies.length,
      rawHarmonyCount,
      parsedHarmonyRatio,
      ambiguousChordCount: confidenceCounts.ambiguous,
      chordWarningCount: chordWarnings.size
    });

    return {
      file,
      title: snapshot.metadata.title || file.replace(/\.musicxml$/i, ""),
      sourceId,
      measures: snapshot.metadata.measures,
      noteCount: snapshot.notes.length,
      harmonyCount: harmonies.length,
      rawHarmonyCount,
      parsedHarmonyRatio,
      uniqueHarmonyCount: uniqueHarmonies.length,
      sectionCount: snapshot.sections.length,
      keySignature: snapshot.metadata.keySignature,
      status,
      chordWarnings: Array.from(chordWarnings).slice(0, 8),
      confidenceCounts,
      sampleChords: uniqueHarmonies.slice(0, 12),
      candidateScore: scoreCandidate(snapshot.notes.length, harmonies.length, confidenceCounts.ambiguous, parsedHarmonyRatio)
    };
  } catch (error) {
    return {
      file,
      title: file.replace(/\.musicxml$/i, ""),
      sourceId,
      measures: 0,
      noteCount: 0,
      harmonyCount: 0,
      rawHarmonyCount,
      parsedHarmonyRatio: 0,
      uniqueHarmonyCount: 0,
      sectionCount: 0,
      status: "parse-error",
      parseError: error instanceof Error ? error.message : String(error),
      chordWarnings: [],
      confidenceCounts: emptyConfidenceCounts(),
      sampleChords: [],
      candidateScore: 0
    };
  }
}

export function auditSplitCatalog(dir = splitCatalogDir): ImportSplitAuditResult[] {
  return splitCatalogFiles(dir).map((file) => auditSplitCatalogFile(file, dir));
}

export function renderImportSplitAuditReport(results: ImportSplitAuditResult[]): string {
  const bySource = groupBySource(results);
  const statusCounts = countBy(results, (result) => result.status);
  const topCandidates = [...results]
    .filter((result) => result.status === "candidate")
    .sort((a, b) => b.candidateScore - a.candidateScore || b.harmonyCount - a.harmonyCount)
    .slice(0, 30);
  const reviewItems = [...results]
    .filter((result) => result.status !== "candidate" || result.chordWarnings.length > 0)
    .sort((a, b) => statusWeight(a.status) - statusWeight(b.status) || a.file.localeCompare(b.file))
    .slice(0, 40);
  const warningPatterns = warningPatternSummary(results).slice(0, 30);

  const lines = [
    "# F66 - Auditoria do staging importado",
    "",
    "Este relatorio avalia os arquivos desmembrados em `docs/imports/split` antes de qualquer promocao para `docs/musics`.",
    "",
    "## Leitura geral",
    "",
    `- Arquivos auditados: ${results.length}`,
    `- Candidatos tecnicos: ${statusCounts.candidate ?? 0}`,
    `- Precisam revisao: ${statusCounts["needs-review"] ?? 0}`,
    `- Erro de parse: ${statusCounts["parse-error"] ?? 0}`,
    `- Cifras MusicXML brutas: ${sum(results, (result) => result.rawHarmonyCount)}`,
    `- Cifras lidas pelo parser: ${sum(results, (result) => result.harmonyCount)}`,
    `- Notas lidas: ${sum(results, (result) => result.noteCount)}`,
    "",
    "## Por volume",
    "",
    "| Volume | Arquivos | Candidatos | Revisao | Parse erro | Notas | Cifras |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const [sourceId, sourceResults] of bySource.entries()) {
    const sourceStatusCounts = countBy(sourceResults, (result) => result.status);
    lines.push(
      `| ${sourceId.toUpperCase()} | ${sourceResults.length} | ${sourceStatusCounts.candidate ?? 0} | ${sourceStatusCounts["needs-review"] ?? 0} | ${sourceStatusCounts["parse-error"] ?? 0} | ${sum(sourceResults, (result) => result.noteCount)} | ${sum(sourceResults, (result) => result.harmonyCount)} |`
    );
  }

  lines.push("", "## Melhores candidatos tecnicos", "");
  lines.push("| Arquivo | Compassos | Notas | Cifras | Cifras unicas | Score | Amostra |");
  lines.push("| --- | ---: | ---: | ---: | ---: | ---: | --- |");
  for (const result of topCandidates) {
    lines.push(
      `| \`${result.file}\` | ${result.measures} | ${result.noteCount} | ${result.harmonyCount} | ${result.uniqueHarmonyCount} | ${result.candidateScore} | ${escapeTable(result.sampleChords.slice(0, 6).join(", "))} |`
    );
  }

  lines.push("", "## Itens para revisao", "");
  lines.push(`Total de itens com revisao: ${results.filter((result) => result.status !== "candidate" || result.chordWarnings.length > 0).length}. A tabela abaixo mostra os primeiros 40 por prioridade tecnica.`);
  lines.push("");
  if (reviewItems.length === 0) {
    lines.push("Nenhum item de revisao encontrado neste passe.");
  } else {
    lines.push("| Arquivo | Status | Motivo |");
    lines.push("| --- | --- | --- |");
    for (const result of reviewItems) {
      lines.push(`| \`${result.file}\` | ${statusLabel(result.status)} | ${escapeTable(reviewReason(result))} |`);
    }
  }

  lines.push("", "## Padroes de cifra fora do contrato", "");
  if (warningPatterns.length === 0) {
    lines.push("Nenhum padrao fora do contrato apareceu neste passe.");
  } else {
    lines.push("| Padrao | Ocorrencias | Exemplos |");
    lines.push("| --- | ---: | --- |");
    for (const pattern of warningPatterns) {
      lines.push(`| ${escapeTable(pattern.pattern)} | ${pattern.count} | ${escapeTable(pattern.examples.join(", "))} |`);
    }
  }

  lines.push("", "## Proxima acao", "");
  lines.push("Usar os melhores candidatos tecnicos como fila de escuta/curadoria. Depois disso, promover apenas um subconjunto para `docs/musics`, mantendo o restante em staging.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function warningPatternSummary(results: ImportSplitAuditResult[]): Array<{ pattern: string; count: number; examples: string[] }> {
  const summary = new Map<string, { count: number; examples: Set<string> }>();

  for (const result of results) {
    for (const warning of result.chordWarnings) {
      const pattern = warning.match(/contrato Find Chord: (.+)$/)?.[1] ?? warning;
      const chord = warning.split(":")[0];
      const item = summary.get(pattern) ?? { count: 0, examples: new Set<string>() };
      item.count += 1;
      item.examples.add(chord);
      summary.set(pattern, item);
    }
  }

  return [...summary.entries()]
    .map(([pattern, item]) => ({
      pattern,
      count: item.count,
      examples: [...item.examples].slice(0, 6)
    }))
    .sort((a, b) => b.count - a.count || a.pattern.localeCompare(b.pattern));
}

export function renderImportSplitAuditCsv(results: ImportSplitAuditResult[]): string {
  const header = [
    "file",
    "sourceId",
    "title",
    "status",
    "measures",
    "noteCount",
    "harmonyCount",
    "rawHarmonyCount",
    "parsedHarmonyRatio",
    "uniqueHarmonyCount",
    "sectionCount",
    "keySignature",
    "candidateScore",
    "warnings"
  ];
  const rows = results.map((result) => [
    result.file,
    result.sourceId,
    result.title,
    result.status,
    String(result.measures),
    String(result.noteCount),
    String(result.harmonyCount),
    String(result.rawHarmonyCount),
    result.parsedHarmonyRatio.toFixed(3),
    String(result.uniqueHarmonyCount),
    String(result.sectionCount),
    result.keySignature ?? "",
    String(result.candidateScore),
    result.chordWarnings.join(" | ") || result.parseError || ""
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

export function runImportSplitAudit(): ImportSplitAuditResult[] {
  const results = auditSplitCatalog();
  fs.mkdirSync(path.dirname(importAuditReportPath), { recursive: true });
  fs.writeFileSync(importAuditReportPath, renderImportSplitAuditReport(results), "utf8");
  fs.writeFileSync(importAuditCsvPath, renderImportSplitAuditCsv(results), "utf8");
  return results;
}

function classifyAuditResult(args: {
  noteCount: number;
  harmonyCount: number;
  rawHarmonyCount: number;
  parsedHarmonyRatio: number;
  ambiguousChordCount: number;
  chordWarningCount: number;
}): ImportSplitAuditResult["status"] {
  if (args.noteCount === 0) return "needs-review";
  if (args.harmonyCount === 0 && args.rawHarmonyCount > 0) return "needs-review";
  if (args.parsedHarmonyRatio < 0.95) return "needs-review";
  if (args.ambiguousChordCount > 0 || args.chordWarningCount > 0) return "needs-review";
  return "candidate";
}

function scoreCandidate(noteCount: number, harmonyCount: number, ambiguousChordCount: number, parsedHarmonyRatio: number): number {
  const noteScore = Math.min(40, Math.floor(noteCount / 8));
  const harmonyScore = Math.min(40, harmonyCount * 2);
  const parseScore = Math.round(parsedHarmonyRatio * 20);
  return Math.max(0, noteScore + harmonyScore + parseScore - ambiguousChordCount * 10);
}

function countRawHarmonyTags(xml: string): number {
  return (xml.match(/<harmony\b/g) ?? []).length;
}

function emptyConfidenceCounts(): Record<ChordResolverConfidence, number> {
  return {
    exact: 0,
    profile: 0,
    legacy: 0,
    ambiguous: 0
  };
}

function groupBySource(results: ImportSplitAuditResult[]): Map<string, ImportSplitAuditResult[]> {
  const grouped = new Map<string, ImportSplitAuditResult[]>();
  for (const result of results) {
    grouped.set(result.sourceId, [...(grouped.get(result.sourceId) ?? []), result]);
  }
  return grouped;
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const value = key(item);
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function sum(items: ImportSplitAuditResult[], value: (item: ImportSplitAuditResult) => number): number {
  return items.reduce((total, item) => total + value(item), 0);
}

function statusWeight(status: ImportSplitAuditResult["status"]): number {
  if (status === "parse-error") return 0;
  if (status === "needs-review") return 1;
  return 2;
}

function statusLabel(status: ImportSplitAuditResult["status"]): string {
  if (status === "candidate") return "candidato";
  if (status === "needs-review") return "revisao";
  return "erro de parse";
}

function reviewReason(result: ImportSplitAuditResult): string {
  if (result.parseError) return result.parseError;
  if (result.noteCount === 0) return "sem notas melodicas lidas";
  if (result.harmonyCount === 0 && result.rawHarmonyCount > 0) return "ha blocos de cifra no XML, mas o parser nao leu cifras";
  if (result.parsedHarmonyRatio < 0.95) return `parser leu ${Math.round(result.parsedHarmonyRatio * 100)}% das cifras MusicXML`;
  if (result.confidenceCounts.ambiguous > 0) return `${result.confidenceCounts.ambiguous} cifras ambiguas no resolvedor`;
  if (result.chordWarnings.length > 0) return result.chordWarnings.join("; ");
  return "revisao musical/manual";
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = runImportSplitAudit();
  const counts = countBy(results, (result) => result.status);
  console.log(`Import split audit complete: ${results.length} files.`);
  console.log(`Candidates: ${counts.candidate ?? 0}`);
  console.log(`Needs review: ${counts["needs-review"] ?? 0}`);
  console.log(`Parse errors: ${counts["parse-error"] ?? 0}`);
  console.log(`Report: ${path.relative(process.cwd(), importAuditReportPath)}`);
  console.log(`CSV: ${path.relative(process.cwd(), importAuditCsvPath)}`);
}
