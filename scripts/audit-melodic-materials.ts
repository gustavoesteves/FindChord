import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import { applyReferenceCenterToPhraseContext } from "../src/utils/music/analysis/strategies/ReferenceAwarePhraseContext";
import { annotateProposalPresentationRoles } from "../src/utils/music/analysis/strategies/ProposalPresentationPlanner";
import { rankReharmonizationProposalsByVoiceLeading } from "../src/utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import {
  buildControlledReharmonizationProposals,
  buildProposalMaterialSuggestions,
  buildSectionMaterialSuggestions
} from "../src/domains/harmonizer/services/harmonizerService";
import type { ContextualMelodicMaterial } from "../src/utils/music/theory/contextualMaterialCandidates";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";
import { realMusicDir, findHarmonizableWindow, toAnchors } from "./real-music-audit";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

export const melodicMaterialsAuditReportPath = path.resolve(process.cwd(), "docs/reports/f184-melodic-materials-audit.md");
export const melodicMaterialsAuditCsvPath = path.resolve(process.cwd(), "docs/reports/f184-melodic-materials-audit.csv");

export type MelodicMaterialAuditSource = "reference" | "generated-primary";
export type MelodicMaterialAuditStatus = "primary-material" | "available-nonprimary" | "no-material" | "no-candidate";

export interface MelodicMaterialAuditRow {
  file: string;
  source: MelodicMaterialAuditSource;
  proposal?: string;
  measure: number;
  chord: string;
  primarySource?: string;
  primaryOrigin?: string;
  primaryFunction?: string;
  primaryFit?: string;
  primaryMaterials: string[];
  availableMaterials: string[];
  cells: string[];
  status: MelodicMaterialAuditStatus;
  availableOrigins: string[];
}

export interface MelodicMaterialAuditReport {
  files: number;
  rows: MelodicMaterialAuditRow[];
  referenceRows: number;
  generatedRows: number;
  primaryMaterialRows: number;
  availableNonPrimaryRows: number;
  noMaterialRows: number;
  noCandidateRows: number;
  materialCounts: Array<{ label: string; primaryCount: number; availableCount: number; examples: string[] }>;
}

function musicXmlFiles(directory: string, relative = ""): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryRelative = path.join(relative, entry.name);
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return musicXmlFiles(fullPath, entryRelative);
    return entry.name.endsWith(".musicxml") ? [entryRelative] : [];
  }).sort();
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function materialCells(materials: ContextualMelodicMaterial[]): string[] {
  return unique(materials.flatMap(material => material.cells));
}

function rowStatus(
  hasCandidates: boolean,
  primaryMaterials: ContextualMelodicMaterial[],
  availableMaterials: ContextualMelodicMaterial[]
): MelodicMaterialAuditStatus {
  if (!hasCandidates) return "no-candidate";
  if (primaryMaterials.length > 0) return "primary-material";
  if (availableMaterials.length > 0) return "available-nonprimary";
  return "no-material";
}

function rowsFromSuggestions(
  file: string,
  source: MelodicMaterialAuditSource,
  suggestions: ReturnType<typeof buildSectionMaterialSuggestions>,
  proposal?: string
): MelodicMaterialAuditRow[] {
  return suggestions.map(suggestion => {
    const primary = suggestion.candidates[0];
    const primaryMaterials = primary?.melodicMaterials || [];
    const availableMaterials = suggestion.candidates.flatMap(candidate => candidate.melodicMaterials);

    return {
      file,
      source,
      proposal,
      measure: suggestion.measure,
      chord: suggestion.chord,
      primarySource: primary?.name,
      primaryOrigin: primary?.materialOrigin,
      primaryFunction: primary?.harmonicFunction,
      primaryFit: primary?.melodicFit,
      primaryMaterials: unique(primaryMaterials.map(material => material.label)),
      availableMaterials: unique(availableMaterials.map(material => material.label)),
      availableOrigins: unique(suggestion.candidates.map(candidate => candidate.materialOrigin)),
      cells: materialCells(primaryMaterials.length > 0 ? primaryMaterials : availableMaterials),
      status: rowStatus(suggestion.candidates.length > 0, primaryMaterials, availableMaterials)
    };
  });
}

function referenceHarmoniesForAnchors(
  harmonies: ScoreHarmonyEvent[],
  anchors: MelodicAnchor[]
): ScoreHarmonyEvent[] {
  const measures = new Set(anchors.map(anchor => anchor.measureIndex));
  return harmonies.filter(harmony => measures.has(harmony.measure));
}

function primaryGeneratedProposal(
  harmonies: ScoreHarmonyEvent[],
  anchors: MelodicAnchor[],
  keySignature?: string
): { proposal: ReharmonizationProposal; anchors: MelodicAnchor[]; phraseContext: NonNullable<ReturnType<typeof PhraseAnalysisEngine.analyzePhrase>> } | null {
  const harmonizable = findHarmonizableWindow(anchors.map(anchor => ({
    measure: anchor.measureIndex,
    step: anchor.pitch[0],
    alter: anchor.pitch.includes("#") ? 1 : anchor.pitch.includes("b") ? -1 : 0,
    durationTicks: anchor.duration,
    tickStart: anchor.startTick,
    tickEnd: anchor.endTick
  })), keySignature, harmonies);

  if (!harmonizable) return null;

  const scopedReference = referenceHarmoniesForAnchors(harmonies, harmonizable.anchors);
  const ranked = rankReharmonizationProposalsByVoiceLeading(
    [
      ...buildControlledReharmonizationProposals(scopedReference, harmonizable.anchors, harmonizable.phraseContext),
      ...harmonizable.generation.proposals
    ],
    harmonizable.phraseContext,
    harmonizable.anchors,
    { referenceHarmonies: harmonies }
  );
  const presented = annotateProposalPresentationRoles(ranked, "balanced", harmonizable.phraseContext);
  const proposal = presented.find(item => item.presentationRole === "primary") || presented[0];
  return proposal ? { proposal, anchors: harmonizable.anchors, phraseContext: harmonizable.phraseContext } : null;
}

function auditFile(file: string): MelodicMaterialAuditRow[] {
  const snapshot = parseMusicXML(fs.readFileSync(path.join(realMusicDir, file), "utf8"));
  const anchors = toAnchors(snapshot.notes);
  const phraseContext = applyReferenceCenterToPhraseContext(
    PhraseAnalysisEngine.analyzePhrase(anchors, snapshot.metadata.keySignature),
    snapshot.harmonies
  );
  const referenceRows = rowsFromSuggestions(
    file,
    "reference",
    buildSectionMaterialSuggestions(snapshot.harmonies, anchors, phraseContext)
  );
  const generated = primaryGeneratedProposal(snapshot.harmonies, anchors, snapshot.metadata.keySignature);
  const generatedRows = generated
    ? rowsFromSuggestions(
      file,
      "generated-primary",
      buildProposalMaterialSuggestions(generated.proposal, generated.anchors, generated.phraseContext),
      generated.proposal.name
    )
    : [];

  return [...referenceRows, ...generatedRows];
}

function materialCounts(rows: MelodicMaterialAuditRow[]): MelodicMaterialAuditReport["materialCounts"] {
  const counts = new Map<string, { label: string; primaryCount: number; availableCount: number; examples: string[] }>();
  for (const row of rows) {
    for (const label of row.availableMaterials) {
      const item = counts.get(label) || { label, primaryCount: 0, availableCount: 0, examples: [] };
      item.availableCount += 1;
      if (row.primaryMaterials.includes(label)) item.primaryCount += 1;
      if (item.examples.length < 5) item.examples.push(`${row.file} c.${row.measure} ${row.chord}`);
      counts.set(label, item);
    }
  }
  return Array.from(counts.values())
    .sort((a, b) => b.availableCount - a.availableCount || b.primaryCount - a.primaryCount || a.label.localeCompare(b.label));
}

export function auditMelodicMaterialsLibrary(files = musicXmlFiles(realMusicDir)): MelodicMaterialAuditReport {
  const rows = files.flatMap(auditFile);
  return {
    files: files.length,
    rows,
    referenceRows: rows.filter(row => row.source === "reference").length,
    generatedRows: rows.filter(row => row.source === "generated-primary").length,
    primaryMaterialRows: rows.filter(row => row.status === "primary-material").length,
    availableNonPrimaryRows: rows.filter(row => row.status === "available-nonprimary").length,
    noMaterialRows: rows.filter(row => row.status === "no-material").length,
    noCandidateRows: rows.filter(row => row.status === "no-candidate").length,
  materialCounts: materialCounts(rows)
  };
}

function pct(part: number, total: number): string {
  return total === 0 ? "0%" : `${Math.round((part / total) * 100)}%`;
}

function csvEscape(value: string | number | undefined): string {
  const text = value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export function renderMelodicMaterialsAuditCsv(report: MelodicMaterialAuditReport): string {
  const header = [
    "file", "source", "proposal", "measure", "chord", "primarySource", "primaryOrigin", "primaryFunction",
    "primaryFit", "primaryMaterials", "availableMaterials", "availableOrigins", "cells", "status"
  ];
  const rows = report.rows.map(row => [
    row.file,
    row.source,
    row.proposal,
    row.measure,
    row.chord,
    row.primarySource,
    row.primaryOrigin,
    row.primaryFunction,
    row.primaryFit,
    row.primaryMaterials.join(" | "),
    row.availableMaterials.join(" | "),
    row.availableOrigins.join(" | "),
    row.cells.join(" | "),
    row.status
  ].map(csvEscape).join(","));
  return `${header.join(",")}\n${rows.join("\n")}\n`;
}

export function renderMelodicMaterialsAuditMarkdown(report: MelodicMaterialAuditReport): string {
  const rowsWithMaterial = report.rows.filter(row => row.availableMaterials.length > 0);
  const nonPrimary = report.rows.filter(row => row.status === "available-nonprimary");
  const noMaterialExamples = report.rows.filter(row => row.status === "no-material").slice(0, 40);
  const primaryCuratedRows = report.rows.filter(row => row.primaryOrigin === "curated-catalog").length;
  const availableCuratedRows = report.rows.filter(row => row.availableOrigins.includes("curated-catalog")).length;
  const lines = [
    "# F184 - Auditoria de materiais melodicos no catalogo real",
    "",
    "Esta auditoria mede os materiais melodicos que aparecem nas cifras da referencia e na proposta primaria gerada pelo harmonizador. Ela nao cria regras por musica; serve para enxergar cobertura, repeticao e lacunas de vocabulario.",
    "",
    "## Resumo",
    "",
    `- Arquivos analisados: ${report.files}`,
    `- Leituras analisadas: ${report.rows.length}`,
    `- Leituras da referencia: ${report.referenceRows}`,
    `- Leituras da proposta primaria gerada: ${report.generatedRows}`,
    `- Material no candidato principal: ${report.primaryMaterialRows} (${pct(report.primaryMaterialRows, report.rows.length)})`,
    `- Material disponivel apenas em candidato secundario: ${report.availableNonPrimaryRows} (${pct(report.availableNonPrimaryRows, report.rows.length)})`,
    `- Principal vindo do catalogo curado: ${primaryCuratedRows} (${pct(primaryCuratedRows, report.rows.length)})`,
    `- Catalogo curado disponivel: ${availableCuratedRows} (${pct(availableCuratedRows, report.rows.length)})`,
    `- Sem material melodico: ${report.noMaterialRows} (${pct(report.noMaterialRows, report.rows.length)})`,
    `- Sem candidato de material: ${report.noCandidateRows}`,
    "",
    "## Materiais encontrados",
    "",
    report.materialCounts.length === 0
      ? "Nenhum material foi encontrado."
      : "| Material | Principal | Disponivel | Exemplos |\n| --- | ---: | ---: | --- |\n"
        + report.materialCounts.map(item => `| ${item.label} | ${item.primaryCount} | ${item.availableCount} | ${item.examples.join("; ")} |`).join("\n"),
    "",
    "## Exemplos com material",
    "",
    rowsWithMaterial.length === 0
      ? "Nenhum exemplo com material."
      : "| Fonte | Arquivo | Comp. | Cifra | Fonte principal | Materiais | Celulas |\n| --- | --- | ---: | --- | --- | --- | --- |\n"
        + rowsWithMaterial.slice(0, 60).map(row => `| ${row.source} | ${row.file} | ${row.measure} | ${row.chord} | ${row.primarySource || "-"} | ${row.availableMaterials.join(", ")} | ${row.cells.slice(0, 6).join(", ")} |`).join("\n"),
    "",
    "## Materiais secundarios",
    "",
    nonPrimary.length === 0
      ? "Nenhum caso em que o material apareceu apenas em candidato secundario."
      : "| Fonte | Arquivo | Comp. | Cifra | Principal | Material secundario |\n| --- | --- | ---: | --- | --- | --- |\n"
        + nonPrimary.slice(0, 50).map(row => `| ${row.source} | ${row.file} | ${row.measure} | ${row.chord} | ${row.primarySource || "-"} | ${row.availableMaterials.join(", ")} |`).join("\n"),
    "",
    "## Amostras sem material",
    "",
    noMaterialExamples.length === 0
      ? "Nenhuma amostra sem material."
      : "| Fonte | Arquivo | Comp. | Cifra | Fonte principal | Funcao |\n| --- | --- | ---: | --- | --- | --- |\n"
        + noMaterialExamples.map(row => `| ${row.source} | ${row.file} | ${row.measure} | ${row.chord} | ${row.primarySource || "-"} | ${row.primaryFunction || "-"} |`).join("\n"),
    "",
    "## Leitura",
    "",
    "- Alta presenca de material secundario sugere problema de apresentacao/ranking, nao necessariamente falta teorica.",
    "- Alta presenca de `no-material` em acordes simples aponta proximos vocabularios a implementar.",
    "- A comparacao entre referencia e proposta primaria ajuda a ver se o harmonizador esta gerando acordes para os quais ja temos vocabulario melodico explicavel."
  ];
  return `${lines.join("\n")}\n`;
}

export function writeMelodicMaterialsAudit(report = auditMelodicMaterialsLibrary()): void {
  fs.mkdirSync(path.dirname(melodicMaterialsAuditReportPath), { recursive: true });
  fs.writeFileSync(melodicMaterialsAuditReportPath, renderMelodicMaterialsAuditMarkdown(report), "utf8");
  fs.writeFileSync(melodicMaterialsAuditCsvPath, renderMelodicMaterialsAuditCsv(report), "utf8");
}
