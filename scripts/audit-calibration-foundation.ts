import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { annotateProposalPresentationRoles } from "../src/utils/music/analysis/strategies/ProposalPresentationPlanner";
import { compareProposalToReferenceHarmony, type ReferenceHarmonyComparison } from "../src/utils/music/analysis/strategies/ReferenceHarmonyComparator";
import { rankReharmonizationProposalsByVoiceLeading } from "../src/utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import { promotedImportDir } from "./audit-promoted-import-corpus";
import { findHarmonizableWindow } from "./real-music-audit";
import { readCalibrationSet, type CalibrationWorkplanCase } from "./generate-calibration-workplan";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

export const calibrationFoundationReportPath = path.resolve(process.cwd(), "docs/reports/f72-calibration-foundation-audit.md");
export const calibrationFoundationCsvPath = path.resolve(process.cwd(), "docs/reports/f72-calibration-foundation-audit.csv");

export type CalibrationFoundationStatus =
  | "base-ok"
  | "review"
  | "needs-engine-work"
  | "no-proposal"
  | "parse-error";

export interface CalibrationFoundationAuditResult {
  file: string;
  title: string;
  decisionType: string;
  selectedCenter: string;
  proposalName: string;
  proposalChords: string;
  comparedMeasures: number;
  functionAgreement: number;
  rootAgreement: number;
  referenceStatus: ReferenceHarmonyComparison["status"] | "unavailable";
  causes: string[];
  status: CalibrationFoundationStatus;
  action: string;
  evidence: string[];
  parseError?: string;
}

export function foundationCases(cases: CalibrationWorkplanCase[]): CalibrationWorkplanCase[] {
  return cases.filter((item) => (
    item.decisionType === "Centro de referencia"
    || item.decisionType === "Harmonia basica"
  ));
}

export function auditCalibrationFoundationCase(
  item: CalibrationWorkplanCase,
  dir = promotedImportDir
): CalibrationFoundationAuditResult {
  try {
    const snapshot = parseMusicXML(fs.readFileSync(path.join(dir, item.file), "utf8"));
    const harmonizable = findHarmonizableWindow(snapshot.notes, { snapshot }, snapshot.harmonies);

    if (!harmonizable) {
      return {
        file: item.file,
        title: item.title,
        decisionType: item.decisionType,
        selectedCenter: item.selectedCenter,
        proposalName: "",
        proposalChords: "",
        comparedMeasures: 0,
        functionAgreement: 0,
        rootAgreement: 0,
        referenceStatus: "unavailable",
        causes: [],
        status: "no-proposal",
        action: "Investigar janela melodica ou vocabulario antes da calibragem musical.",
        evidence: ["A musica entrou na pauta F71, mas a auditoria atual nao encontrou proposta harmonizavel."]
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
    const comparison = compareProposalToReferenceHarmony(
      primary,
      snapshot.harmonies,
      harmonizable.phraseContext.selectedCenter.tonic
    );

    return {
      file: item.file,
      title: item.title,
      decisionType: item.decisionType,
      selectedCenter: `${harmonizable.phraseContext.selectedCenter.tonic} ${harmonizable.phraseContext.selectedCenter.mode}`,
      proposalName: primary?.name ?? "",
      proposalChords: primary?.measures.map((measure) => measure.chords.join(" / ")).join(" | ") ?? "",
      comparedMeasures: comparison.comparedMeasures,
      functionAgreement: comparison.functionAgreement,
      rootAgreement: comparison.rootAgreement,
      referenceStatus: comparison.status,
      causes: comparison.causes,
      status: classifyFoundationStatus(item, comparison),
      action: actionFor(item, comparison),
      evidence: comparison.evidence.slice(0, 3)
    };
  } catch (error) {
    return {
      file: item.file,
      title: item.title,
      decisionType: item.decisionType,
      selectedCenter: item.selectedCenter,
      proposalName: item.primaryProposalName,
      proposalChords: item.primaryChords,
      comparedMeasures: 0,
      functionAgreement: 0,
      rootAgreement: 0,
      referenceStatus: "unavailable",
      causes: [],
      status: "parse-error",
      action: "Corrigir leitura do arquivo antes de avaliar a harmonia.",
      evidence: [],
      parseError: error instanceof Error ? error.message : String(error)
    };
  }
}

export function auditCalibrationFoundation(
  cases = foundationCases(readCalibrationSet()),
  dir = promotedImportDir
): CalibrationFoundationAuditResult[] {
  return cases.map((item) => auditCalibrationFoundationCase(item, dir));
}

export function renderCalibrationFoundationReport(results: CalibrationFoundationAuditResult[]): string {
  const counts = countBy(results, (item) => item.status);
  const lines = [
    "# F72 - Auditoria da base harmonica",
    "",
    "Esta auditoria pega apenas os casos de `Centro de referencia` e `Harmonia basica` da F71.",
    "O objetivo e confirmar se a primeira resposta do Harmonizar esta musicalmente estavel antes de refinarmos cromatismo, baixo e ranking.",
    "",
    "## Leitura geral",
    "",
    `- Casos auditados: ${results.length}`,
    `- Base aprovada: ${counts["base-ok"] ?? 0}`,
    `- Revisao musical: ${counts.review ?? 0}`,
    `- Trabalho de motor: ${counts["needs-engine-work"] ?? 0}`,
    `- Sem proposta: ${counts["no-proposal"] ?? 0}`,
    `- Erro de parse: ${counts["parse-error"] ?? 0}`,
    "",
    "## Resultado por musica",
    "",
    "| Arquivo | Tipo | Status | Funcao | Raiz | Proposta | Acao |",
    "| --- | --- | --- | ---: | ---: | --- | --- |"
  ];

  for (const result of results) {
    lines.push(
      `| \`${result.file}\` | ${result.decisionType} | ${statusLabel(result.status)} | ${percent(result.functionAgreement)} | ${percent(result.rootAgreement)} | ${escapeTable(result.proposalChords)} | ${escapeTable(result.action)} |`
    );
  }

  lines.push("", "## Evidencias", "");
  for (const result of results) {
    lines.push(`### ${result.title}`, "");
    lines.push(`- Arquivo: \`${result.file}\``);
    lines.push(`- Comparacao: ${comparisonLabel(result.referenceStatus)}; funcao ${percent(result.functionAgreement)}, raiz ${percent(result.rootAgreement)}`);
    if (result.causes.length > 0) lines.push(`- Causas: ${result.causes.join(", ")}`);
    for (const evidence of result.evidence) lines.push(`- ${evidence}`);
    if (result.parseError) lines.push(`- Erro: ${result.parseError}`);
    lines.push("");
  }

  lines.push("## Proxima acao", "");
  lines.push("Promover ajustes de motor apenas para casos marcados como `trabalho de motor`. Casos em `revisao musical` devem ser conferidos por escuta ou comparacao com a partitura antes de alterar regras.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

export function renderCalibrationFoundationCsv(results: CalibrationFoundationAuditResult[]): string {
  const header = [
    "file",
    "title",
    "decisionType",
    "status",
    "selectedCenter",
    "referenceStatus",
    "functionAgreement",
    "rootAgreement",
    "comparedMeasures",
    "proposalName",
    "action",
    "causes",
    "proposalChords",
    "parseError"
  ];
  const rows = results.map((item) => [
    item.file,
    item.title,
    item.decisionType,
    item.status,
    item.selectedCenter,
    item.referenceStatus,
    String(item.functionAgreement),
    String(item.rootAgreement),
    String(item.comparedMeasures),
    item.proposalName,
    item.action,
    item.causes.join(" "),
    item.proposalChords,
    item.parseError ?? ""
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

export function runCalibrationFoundationAudit(): CalibrationFoundationAuditResult[] {
  const results = auditCalibrationFoundation();
  fs.mkdirSync(path.dirname(calibrationFoundationReportPath), { recursive: true });
  fs.writeFileSync(calibrationFoundationReportPath, renderCalibrationFoundationReport(results), "utf8");
  fs.writeFileSync(calibrationFoundationCsvPath, renderCalibrationFoundationCsv(results), "utf8");
  return results;
}

function classifyFoundationStatus(
  item: CalibrationWorkplanCase,
  comparison: ReferenceHarmonyComparison
): CalibrationFoundationStatus {
  if (comparison.status === "aligned") return "base-ok";

  if (item.decisionType === "Harmonia basica") {
    if (comparison.functionAgreement >= 0.5) return "review";
    return "needs-engine-work";
  }

  if (comparison.status === "partially-aligned" && comparison.functionAgreement >= 0.5) return "review";
  return "needs-engine-work";
}

function actionFor(
  item: CalibrationWorkplanCase,
  comparison: ReferenceHarmonyComparison
): string {
  const status = classifyFoundationStatus(item, comparison);
  if (status === "base-ok") return "Usar como ancora positiva da calibragem.";
  if (status === "review") return "Conferir por escuta antes de mudar regra; a funcao ainda tem apoio parcial.";
  if (item.decisionType === "Harmonia basica") return "Revisar escolha de centro ou familia I-IV-V antes de permitir rearmonizacao.";
  return "Revisar centro de referencia e ranking da proposta primaria.";
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const item of items) {
    const value = key(item);
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

function statusLabel(status: CalibrationFoundationStatus): string {
  if (status === "base-ok") return "base aprovada";
  if (status === "review") return "revisao musical";
  if (status === "needs-engine-work") return "trabalho de motor";
  if (status === "no-proposal") return "sem proposta";
  return "erro de parse";
}

function comparisonLabel(status: CalibrationFoundationAuditResult["referenceStatus"]): string {
  if (status === "aligned") return "alinhada";
  if (status === "partially-aligned") return "parcial";
  if (status === "divergent") return "divergente";
  if (status === "no-reference") return "sem referencia";
  return "indisponivel";
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function escapeTable(value: string): string {
  return value.replaceAll("|", "\\|");
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, "\"\"")}"`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const results = runCalibrationFoundationAudit();
  const counts = countBy(results, (item) => item.status);
  console.log(`Audited: ${results.length}`);
  console.log(`Base ok: ${counts["base-ok"] ?? 0}`);
  console.log(`Review: ${counts.review ?? 0}`);
  console.log(`Engine work: ${counts["needs-engine-work"] ?? 0}`);
  console.log(`Report: ${calibrationFoundationReportPath}`);
}
