import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";
import { analyzeDominantResolution } from "../src/utils/music/analysis/strategies/DominantResolutionAnalysis";
import { analyzeDominantTension } from "../src/utils/music/analysis/strategies/DominantTensionAnalysis";
import { analyzeReferenceHarmony } from "../src/utils/music/analysis/strategies/ReferenceHarmonyAnalysis";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

type AuditStatus = "ok" | "no-reference-harmony" | "parse-error";
export interface DominantTensionSummary {
  simple: number;
  color: number;
  altered: number;
  highAltered: number;
  resolvedAltered: number;
  contextualAltered: number;
  unresolvedAltered: number;
  resolvedColor: number;
  unresolvedColor: number;
  subVResolutions: number;
  delayedResolutions: number;
  prolongedResolutions: number;
  deceptiveResolutions: number;
}

export interface DominantTensionAuditRow {
  file: string;
  title: string;
  status: AuditStatus;
  referenceCenter: string;
  referenceIdiom: string;
  harmonyCount: number;
  dominantCount: number;
  alteredResolutionRatio: number;
  unresolvedAlteredRatio: number;
  summary: DominantTensionSummary;
  examples: string[];
  notes: string;
}

function allMusicXmlFiles(dir = path.join(process.cwd(), "docs/musics")): string[] {
  return fs.readdirSync(dir, { withFileTypes: true })
    .flatMap(entry => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return allMusicXmlFiles(fullPath);
      return entry.isFile() && entry.name.endsWith(".musicxml") ? [fullPath] : [];
    })
    .sort((a, b) => a.localeCompare(b));
}

function relativeMusicPath(file: string): string {
  return path.relative(path.join(process.cwd(), "docs/musics"), file);
}

function orderedChords(harmonies: ScoreHarmonyEvent[]): string[] {
  return [...harmonies]
    .sort((a, b) => a.tickStart - b.tickStart)
    .map(harmony => harmony.harmony);
}

export function summarizeDominantTensionUsage(harmonies: ScoreHarmonyEvent[]): DominantTensionSummary {
  const chords = orderedChords(harmonies);
  const summary: DominantTensionSummary = {
    simple: 0,
    color: 0,
    altered: 0,
    highAltered: 0,
    resolvedAltered: 0,
    contextualAltered: 0,
    unresolvedAltered: 0,
    resolvedColor: 0,
    unresolvedColor: 0,
    subVResolutions: 0,
    delayedResolutions: 0,
    prolongedResolutions: 0,
    deceptiveResolutions: 0
  };

  for (let index = 0; index < chords.length; index++) {
    const chord = chords[index];
    const analysis = analyzeDominantTension(chord);
    if (!analysis.isDominant) continue;

    const resolution = analyzeDominantResolution(chords, index);
    if (resolution.kind === "subv-immediate" || resolution.kind === "subv-delayed") summary.subVResolutions++;
    if (resolution.kind === "delayed" || resolution.kind === "subv-delayed") summary.delayedResolutions++;
    if (resolution.kind === "prolonged") summary.prolongedResolutions++;
    if (resolution.kind === "deceptive") summary.deceptiveResolutions++;

    if (analysis.level === "diatonic") summary.simple++;
    if (analysis.level === "color") {
      summary.color++;
      if (resolution.kind === "unresolved") summary.unresolvedColor++;
      else summary.resolvedColor++;
    }
    if (analysis.level === "altered") {
      summary.altered++;
      countAlteredResolution(summary, resolution.kind);
    }
    if (analysis.level === "high-altered") {
      summary.highAltered++;
      countAlteredResolution(summary, resolution.kind);
    }
  }

  return summary;
}

function countAlteredResolution(summary: DominantTensionSummary, kind: string): void {
  if (kind === "immediate" || kind === "subv-immediate") {
    summary.resolvedAltered++;
    return;
  }
  if (
    kind === "delayed"
    || kind === "subv-delayed"
    || kind === "prolonged"
    || kind === "same-root-color-release"
    || kind === "dominant-reentry"
    || kind === "terminal-dominant"
    || kind === "deceptive"
  ) {
    summary.contextualAltered++;
    return;
  }
  summary.unresolvedAltered++;
}

function dominantExamples(harmonies: ScoreHarmonyEvent[]): string[] {
  const chords = orderedChords(harmonies);
  return chords
    .map((chord, index) => {
      const analysis = analyzeDominantTension(chord);
      if (!analysis.isDominant || analysis.level === "diatonic") return null;
      const next = chords[index + 1] || "fim";
      return `${chord} -> ${next} (${analysis.level})`;
    })
    .filter((item): item is string => !!item)
    .slice(0, 8);
}

function emptySummary(): DominantTensionSummary {
  return {
    simple: 0,
    color: 0,
    altered: 0,
    highAltered: 0,
    resolvedAltered: 0,
    contextualAltered: 0,
    unresolvedAltered: 0,
    resolvedColor: 0,
    unresolvedColor: 0,
    subVResolutions: 0,
    delayedResolutions: 0,
    prolongedResolutions: 0,
    deceptiveResolutions: 0
  };
}

function notesFor(summary: DominantTensionSummary): string {
  const notes: string[] = [];
  if (summary.resolvedAltered > 0) notes.push("dominantes alteradas com resolução local");
  if (summary.contextualAltered > 0) notes.push("dominantes alteradas com resolução contextual");
  if (summary.unresolvedAltered > 0) notes.push("dominantes alteradas sem alvo imediato");
  if (summary.resolvedColor > 0 || summary.unresolvedColor > 0) notes.push("dominantes coloridas recorrentes");
  if (summary.subVResolutions > 0) notes.push("resoluções cromáticas tipo SubV");
  return notes.length > 0 ? notes.join("; ") : "Predomínio de dominantes simples ou poucas tensões explícitas.";
}

export function auditDominantTensionFile(file: string): DominantTensionAuditRow {
  try {
    const snapshot = parseMusicXML(fs.readFileSync(file, "utf8"));
    const harmonies = snapshot.harmonies as ScoreHarmonyEvent[];
    if (harmonies.length === 0) {
      return {
        file: relativeMusicPath(file),
        title: snapshot.metadata.title || path.basename(file, ".musicxml"),
        status: "no-reference-harmony",
        referenceCenter: "n/a",
        referenceIdiom: "n/a",
        harmonyCount: 0,
        dominantCount: 0,
        alteredResolutionRatio: 0,
        unresolvedAlteredRatio: 0,
        summary: emptySummary(),
        examples: [],
        notes: "Sem cifras de referencia."
      };
    }

    const analysis = analyzeReferenceHarmony(harmonies);
    const summary = summarizeDominantTensionUsage(harmonies);
    const alteredTotal = summary.altered + summary.highAltered;
    const dominantCount = summary.simple + summary.color + alteredTotal;
    return {
      file: relativeMusicPath(file),
      title: snapshot.metadata.title || path.basename(file, ".musicxml"),
      status: "ok",
      referenceCenter: analysis.referenceCenter ? `${analysis.referenceCenter.tonic} ${analysis.referenceCenter.mode}` : "n/a",
      referenceIdiom: analysis.idiom?.idiom || "n/a",
      harmonyCount: harmonies.length,
      dominantCount,
      alteredResolutionRatio: alteredTotal === 0 ? 0 : Number((summary.resolvedAltered / alteredTotal).toFixed(2)),
      unresolvedAlteredRatio: alteredTotal === 0 ? 0 : Number((summary.unresolvedAltered / alteredTotal).toFixed(2)),
      summary,
      examples: dominantExamples(harmonies),
      notes: notesFor(summary)
    };
  } catch (error) {
    return {
      file: relativeMusicPath(file),
      title: path.basename(file, ".musicxml"),
      status: "parse-error",
      referenceCenter: "n/a",
      referenceIdiom: "n/a",
      harmonyCount: 0,
      dominantCount: 0,
      alteredResolutionRatio: 0,
      unresolvedAlteredRatio: 0,
      summary: emptySummary(),
      examples: [],
      notes: error instanceof Error ? error.message : "Erro desconhecido."
    };
  }
}

export function auditDominantTensionCorpus(files = allMusicXmlFiles()): DominantTensionAuditRow[] {
  return files.map(auditDominantTensionFile);
}

function csvEscape(value: string | number): string {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function renderCsv(rows: DominantTensionAuditRow[]): string {
  const headers = [
    "file",
    "title",
    "status",
    "referenceCenter",
    "referenceIdiom",
    "harmonyCount",
    "dominantCount",
    "simple",
    "color",
    "altered",
    "highAltered",
      "resolvedAltered",
      "contextualAltered",
      "unresolvedAltered",
    "resolvedColor",
    "unresolvedColor",
      "subVResolutions",
      "delayedResolutions",
      "prolongedResolutions",
      "deceptiveResolutions",
    "alteredResolutionRatio",
    "unresolvedAlteredRatio",
    "examples",
    "notes"
  ];

  return [
    headers.map(csvEscape).join(","),
    ...rows.map(row => [
      row.file,
      row.title,
      row.status,
      row.referenceCenter,
      row.referenceIdiom,
      row.harmonyCount,
      row.dominantCount,
      row.summary.simple,
      row.summary.color,
      row.summary.altered,
      row.summary.highAltered,
      row.summary.resolvedAltered,
      row.summary.contextualAltered,
      row.summary.unresolvedAltered,
      row.summary.resolvedColor,
      row.summary.unresolvedColor,
      row.summary.subVResolutions,
      row.summary.delayedResolutions,
      row.summary.prolongedResolutions,
      row.summary.deceptiveResolutions,
      row.alteredResolutionRatio,
      row.unresolvedAlteredRatio,
      row.examples.join(" / "),
      row.notes
    ].map(csvEscape).join(","))
  ].join("\n") + "\n";
}

function renderMarkdown(rows: DominantTensionAuditRow[]): string {
  const okRows = rows.filter(row => row.status === "ok");
  const totals = okRows.reduce((sum, row) => ({
    simple: sum.simple + row.summary.simple,
    color: sum.color + row.summary.color,
    altered: sum.altered + row.summary.altered,
    highAltered: sum.highAltered + row.summary.highAltered,
    resolvedAltered: sum.resolvedAltered + row.summary.resolvedAltered,
    contextualAltered: sum.contextualAltered + row.summary.contextualAltered,
    unresolvedAltered: sum.unresolvedAltered + row.summary.unresolvedAltered,
    resolvedColor: sum.resolvedColor + row.summary.resolvedColor,
    unresolvedColor: sum.unresolvedColor + row.summary.unresolvedColor,
    subVResolutions: sum.subVResolutions + row.summary.subVResolutions,
    delayedResolutions: sum.delayedResolutions + row.summary.delayedResolutions,
    prolongedResolutions: sum.prolongedResolutions + row.summary.prolongedResolutions,
    deceptiveResolutions: sum.deceptiveResolutions + row.summary.deceptiveResolutions
  }), emptySummary());
  const topRows = [...okRows]
    .sort((a, b) => (b.summary.altered + b.summary.highAltered + b.summary.color) - (a.summary.altered + a.summary.highAltered + a.summary.color))
    .slice(0, 25);

  const lines = [
    "# F91 - Auditoria de tensao dominante no catalogo",
    "",
    "Esta auditoria observa como as cifras de referencia usam dominantes simples, coloridas, alteradas e altamente alteradas.",
    "",
    "A leitura nao classifica genero. O foco e medir expectativa de resolucao: dominantes alteradas perto de alvo local, dominantes coloridas sem urgencia forte e possiveis casos deceptivos ou suspensos.",
    "",
    "## Resumo",
    "",
    `- Arquivos lidos: ${rows.length}`,
    `- Arquivos com cifras de referencia: ${okRows.length}`,
    `- Arquivos sem cifras: ${rows.filter(row => row.status === "no-reference-harmony").length}`,
    `- Arquivos com erro de parse: ${rows.filter(row => row.status === "parse-error").length}`,
    `- Dominantes simples: ${totals.simple}`,
    `- Dominantes coloridas: ${totals.color} (${totals.resolvedColor} resolvidas; ${totals.unresolvedColor} sem alvo imediato)`,
    `- Dominantes alteradas: ${totals.altered}`,
    `- Dominantes altamente alteradas: ${totals.highAltered}`,
    `- Alteradas resolvidas imediatamente: ${totals.resolvedAltered}`,
    `- Alteradas com resolução contextual: ${totals.contextualAltered}`,
    `- Alteradas sem alvo local: ${totals.unresolvedAltered}`,
    `- Resolucoes cromaticas tipo SubV: ${totals.subVResolutions}`,
    `- Resolucoes atrasadas: ${totals.delayedResolutions}`,
    `- Prolongamentos de dominante: ${totals.prolongedResolutions}`,
    `- Chegadas deceptivas: ${totals.deceptiveResolutions}`,
    "",
    "## Obras com maior vocabulário de tensão dominante",
    "",
    "| Rank | Arquivo | Centro | Idioma inferido | Dom. | Simples | Cor | Alt. | Alt. alta | Alt. imed. | Alt. ctx. | Alt. s/ alvo | SubV | Exemplos | Nota |",
    "| ---: | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |"
  ];

  for (const [index, row] of topRows.entries()) {
    lines.push([
      index + 1,
      row.file,
      row.referenceCenter,
      row.referenceIdiom,
      row.dominantCount,
      row.summary.simple,
      row.summary.color,
      row.summary.altered,
      row.summary.highAltered,
      row.summary.resolvedAltered,
      row.summary.contextualAltered,
      row.summary.unresolvedAltered,
      row.summary.subVResolutions,
      row.examples.join(" / ") || "-",
      row.notes
    ].map(cell => String(cell).replace(/\|/g, "\\|")).join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  lines.push("");
  lines.push("## Leitura para o motor");
  lines.push("");
  lines.push("- A F90 estava correta em separar alteracao resolvida de alteracao solta, mas a F92 refinou o meio do caminho.");
  lines.push("- Parte dos antigos casos `sem alvo imediato` agora aparece como resolucao contextual: atraso, prolongamento ou chegada deceptiva.");
  lines.push("- Os casos que continuam `sem alvo local` formam a melhor fila para escuta e calibragem da penalidade de tensao alterada.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

export function writeDominantTensionAudit(rows = auditDominantTensionCorpus()): void {
  const reportPath = path.join(process.cwd(), "docs/reports/f91-dominant-tension-audit.md");
  const csvPath = path.join(process.cwd(), "docs/reports/f91-dominant-tension-audit.csv");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderMarkdown(rows));
  fs.writeFileSync(csvPath, renderCsv(rows));
  console.log(`Dominant tension audit complete: ${rows.length} files.`);
  console.log(`Report: ${reportPath}`);
  console.log(`CSV: ${csvPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeDominantTensionAudit();
}
