import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  auditSplitCatalog,
  splitCatalogDir,
  type ImportSplitAuditResult
} from "./audit-import-split-catalog";

export const promotedMusicDir = path.resolve(process.cwd(), "docs/musics/imported-real-book");
export const reviewMusicDir = path.resolve(process.cwd(), "docs/imports/review");
export const promotionReportPath = path.resolve(process.cwd(), "docs/reports/f68-import-promotion-report.md");

export interface PromotionResult {
  promoted: ImportSplitAuditResult[];
  review: ImportSplitAuditResult[];
  promotedDir: string;
  reviewDir: string;
}

export function promoteImportCandidates(results = auditSplitCatalog()): PromotionResult {
  const promoted = results.filter((result) => result.status === "candidate");
  const review = results.filter((result) => result.status !== "candidate");

  resetGeneratedDir(promotedMusicDir);
  resetGeneratedDir(reviewMusicDir);

  for (const result of promoted) {
    copySplitFile(result.file, promotedMusicDir);
  }

  for (const result of review) {
    copySplitFile(result.file, reviewMusicDir);
  }

  fs.mkdirSync(path.dirname(promotionReportPath), { recursive: true });
  fs.writeFileSync(promotionReportPath, renderPromotionReport({ promoted, review, promotedDir: promotedMusicDir, reviewDir: reviewMusicDir }), "utf8");

  return { promoted, review, promotedDir: promotedMusicDir, reviewDir: reviewMusicDir };
}

export function renderPromotionReport(result: PromotionResult): string {
  const lines = [
    "# F68 - Promocao do staging importado",
    "",
    "Este relatorio registra a separacao operacional do staging gerado pelos livros importados.",
    "",
    "## Resultado",
    "",
    `- Candidatos promovidos: ${result.promoted.length}`,
    `- Arquivos para revisao manual: ${result.review.length}`,
    `- Destino dos candidatos: \`${path.relative(process.cwd(), result.promotedDir)}\``,
    `- Destino da revisao: \`${path.relative(process.cwd(), result.reviewDir)}\``,
    "",
    "## Decisao",
    "",
    "Os candidatos tecnicos foram copiados para uma pasta propria dentro de `docs/musics`, preservando o catalogo curado no topo de `docs/musics`.",
    "Os arquivos de revisao continuam separados para inspecao manual, porque podem conter cifras duplicadas na mesma posicao, marcacoes de partitura exportadas como cifra ou vocabulario raro ainda fora do contrato.",
    "",
    "## Arquivos promovidos por volume",
    "",
    "| Volume | Arquivos |",
    "| --- | ---: |"
  ];

  for (const [sourceId, items] of groupBySource(result.promoted).entries()) {
    lines.push(`| ${sourceId.toUpperCase()} | ${items.length} |`);
  }

  lines.push("", "## Revisao manual por volume", "");
  lines.push("| Volume | Arquivos |");
  lines.push("| --- | ---: |");
  for (const [sourceId, items] of groupBySource(result.review).entries()) {
    lines.push(`| ${sourceId.toUpperCase()} | ${items.length} |`);
  }

  lines.push("", "## Fila de revisao", "");
  lines.push("| Arquivo | Motivo |");
  lines.push("| --- | --- |");
  for (const item of result.review) {
    lines.push(`| \`${item.file}\` | ${escapeTable(reviewReason(item))} |`);
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function copySplitFile(fileName: string, destinationDir: string): void {
  const source = path.join(splitCatalogDir, fileName);
  const destination = path.join(destinationDir, fileName);
  fs.copyFileSync(source, destination);
}

function resetGeneratedDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
}

function groupBySource(results: ImportSplitAuditResult[]): Map<string, ImportSplitAuditResult[]> {
  const grouped = new Map<string, ImportSplitAuditResult[]>();
  for (const result of results) {
    grouped.set(result.sourceId, [...(grouped.get(result.sourceId) ?? []), result]);
  }
  return grouped;
}

function reviewReason(result: ImportSplitAuditResult): string {
  if (result.parseError) return result.parseError;
  if (result.chordWarnings.length > 0) return result.chordWarnings.join("; ");
  if (result.rawHarmonyCount > 0 && result.parsedHarmonyRatio < 0.95) {
    return `parser leu ${Math.round(result.parsedHarmonyRatio * 100)}% das cifras MusicXML`;
  }
  if (result.noteCount === 0) return "sem notas melodicas lidas";
  return "revisao manual";
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = promoteImportCandidates();
  console.log(`Promoted import candidates: ${result.promoted.length}`);
  console.log(`Manual review files: ${result.review.length}`);
  console.log(`Promoted dir: ${path.relative(process.cwd(), result.promotedDir)}`);
  console.log(`Review dir: ${path.relative(process.cwd(), result.reviewDir)}`);
  console.log(`Report: ${path.relative(process.cwd(), promotionReportPath)}`);
}
