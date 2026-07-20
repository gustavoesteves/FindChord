import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import { GravityFieldManager } from "../src/utils/music/analysis/engines/GravityFieldManager";
import { annotateProposalPresentationRoles } from "../src/utils/music/analysis/strategies/ProposalPresentationPlanner";
import { compareProposalToReferenceHarmony } from "../src/utils/music/analysis/strategies/ReferenceHarmonyComparator";
import { applyReferenceCenterToPhraseContext } from "../src/utils/music/analysis/strategies/ReferenceAwarePhraseContext";
import {
  selectPresentableHarmonizationWindows,
  type PresentableWindowReason
} from "../src/utils/music/analysis/strategies/PresentableWindowSelector";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";
import {
  collectUnresolvedDominantMelodyCases,
  type UnresolvedDominantMelodyCase
} from "./audit-unresolved-dominant-melody";
import { toAnchors, findHarmonizableWindow } from "./real-music-audit";
import {
  measureTicksForMetricContext,
  timelineContextForAnchors
} from "../src/utils/music/analysis/scoreTimelineContext";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

export interface PresentableWindowRow {
  file: string;
  title: string;
  windowMeasures: string;
  reasons: string;
  eventMeasures: string;
  selectedCenter: string;
  proposalCount: number;
  primaryName: string;
  primaryChords: string;
  referenceStatus: string;
  functionAgreement: number;
  rootAgreement: number;
}

function fullMusicPath(relativeFile: string): string {
  return path.join(process.cwd(), "docs/musics", relativeFile);
}

function uniqueSorted(values: number[]): number[] {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

function chordSummary(proposal: ReharmonizationProposal | undefined): string {
  if (!proposal) return "";
  return proposal.measures
    .map(measure => measure.chords.join(" / "))
    .join(" | ");
}

function selectPrimaryProposal(proposals: ReharmonizationProposal[]): ReharmonizationProposal | undefined {
  return proposals.find(proposal => proposal.presentationRole === "primary") || proposals[0];
}

function eventCasesForFile(cases: UnresolvedDominantMelodyCase[], file: string): UnresolvedDominantMelodyCase[] {
  return cases.filter(item => item.file === file);
}

function reasonLabels(reasons: Set<PresentableWindowReason>): string {
  return Array.from(reasons).join(" ");
}

function primaryWindowMeasures(snapshot: any): number[] {
  const primary = findHarmonizableWindow(
    snapshot.notes || [],
    { snapshot },
    snapshot.harmonies || []
  );
  return primary ? uniqueSorted(primary.anchors.map(anchor => anchor.measureIndex)) : [];
}

export function collectPresentableWindowsForFile(
  relativeFile: string,
  cases: UnresolvedDominantMelodyCase[] = collectUnresolvedDominantMelodyCases()
): PresentableWindowRow[] {
  const snapshot = parseMusicXML(fs.readFileSync(fullMusicPath(relativeFile), "utf8"));
  const fileCases = eventCasesForFile(cases, relativeFile);
  const primaryMeasures = primaryWindowMeasures(snapshot);
  const anchors = toAnchors(snapshot.notes || []);
  const candidates = selectPresentableHarmonizationWindows(anchors, {
    referenceHarmonies: snapshot.harmonies || [],
    interestingMeasures: fileCases.map(item => item.measure),
    primaryMeasures
  });

  return candidates.flatMap(candidate => {
    const referenceHarmonies = (snapshot.harmonies || []).filter((harmony: ScoreHarmonyEvent) => (
      candidate.measureIndexes.includes(harmony.measure)
    ));
    const phraseContext = applyReferenceCenterToPhraseContext(
      PhraseAnalysisEngine.analyzePhrase(
        candidate.anchors,
        timelineContextForAnchors(snapshot, candidate.anchors).keySignature
      ),
      referenceHarmonies
    );
    const generation = GravityFieldManager.generateProposalsWithDiagnostics(
      candidate.anchors,
      phraseContext,
      { measureTicks: measureTicksForMetricContext(snapshot) }
    );
    if (generation.proposals.length === 0) return [];

    const presented = annotateProposalPresentationRoles(generation.proposals, "balanced", phraseContext);
    const primary = selectPrimaryProposal(presented);
    const comparison = compareProposalToReferenceHarmony(
      primary,
      snapshot.harmonies || [],
      phraseContext.selectedCenter.tonic
    );
    const eventMeasures = fileCases
      .filter(item => candidate.measureIndexes.includes(item.measure))
      .map(item => item.measure);

    return [{
      file: relativeFile,
      title: snapshot.metadata.title || path.basename(relativeFile, ".musicxml"),
      windowMeasures: candidate.measureIndexes.join(" "),
      reasons: reasonLabels(new Set(candidate.reasons)),
      eventMeasures: uniqueSorted(eventMeasures).join(" "),
      selectedCenter: `${phraseContext.selectedCenter.tonic} ${phraseContext.selectedCenter.mode}`,
      proposalCount: presented.length,
      primaryName: primary?.name || "n/a",
      primaryChords: chordSummary(primary),
      referenceStatus: comparison.status,
      functionAgreement: comparison.functionAgreement,
      rootAgreement: comparison.rootAgreement
    }];
  });
}

export function collectPresentableWindowRows(
  cases = collectUnresolvedDominantMelodyCases()
): PresentableWindowRow[] {
  const files = Array.from(new Set(cases.map(item => item.file))).sort((a, b) => a.localeCompare(b));
  return files.flatMap(file => collectPresentableWindowsForFile(file, cases));
}

function csvEscape(value: string | number): string {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function renderCsv(rows: PresentableWindowRow[]): string {
  const headers: (keyof PresentableWindowRow)[] = [
    "file",
    "title",
    "windowMeasures",
    "reasons",
    "eventMeasures",
    "selectedCenter",
    "proposalCount",
    "primaryName",
    "primaryChords",
    "referenceStatus",
    "functionAgreement",
    "rootAgreement"
  ];
  return [
    headers.map(csvEscape).join(","),
    ...rows.map(row => headers.map(header => csvEscape(row[header])).join(","))
  ].join("\n") + "\n";
}

function renderMarkdown(rows: PresentableWindowRow[]): string {
  const interesting = rows.filter(row => row.reasons.includes("interesting-event")).length;
  const primary = rows.filter(row => row.reasons.includes("primary-window")).length;
  const files = Array.from(new Set(rows.map(row => row.file)));
  const highlightedRows = highlightRows(rows);
  const lines = [
    "# F104 - Janelas apresentaveis por musica",
    "",
    "Esta auditoria lista janelas que poderiam ser apresentadas alem da janela primaria: janelas com boa cobertura de referencia ou que cobrem eventos harmonicamente interessantes da F98.",
    "",
    "## Resumo",
    "",
    `- Musicas analisadas: ${files.length}`,
    `- Janelas apresentaveis: ${rows.length}`,
    `- Janelas destacadas: ${highlightedRows.length}`,
    `- Janelas primarias: ${primary}`,
    `- Janelas com evento F98: ${interesting}`,
    "",
    "## Janelas destacadas",
    "",
    "| # | Arquivo | Compassos | Razoes | Eventos | Centro | Propostas | Primaria local | Ref. | Cifras |",
    "| ---: | --- | --- | --- | --- | --- | ---: | --- | --- | --- |"
  ];

  for (const [index, row] of highlightedRows.entries()) {
    lines.push([
      index + 1,
      row.file,
      row.windowMeasures,
      row.reasons,
      row.eventMeasures || "-",
      row.selectedCenter,
      row.proposalCount,
      row.primaryName,
      `${row.referenceStatus} ${Math.round(row.functionAgreement * 100)}%/${Math.round(row.rootAgreement * 100)}%`,
      row.primaryChords || "-"
    ].map(cell => String(cell).replace(/\|/g, "\\|")).join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  lines.push("");
  lines.push("## Leitura");
  lines.push("");
  lines.push("O CSV contem todas as janelas apresentaveis. O Markdown destaca janelas primarias, janelas com eventos F98 e as melhores janelas de referencia por musica.");
  lines.push("As janelas com `interesting-event` mostram onde a interface ou o pipeline poderiam oferecer uma harmonizacao por trecho sem substituir a janela primaria global.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function highlightRows(rows: PresentableWindowRow[]): PresentableWindowRow[] {
  const selected = new Map<string, PresentableWindowRow>();
  const add = (row: PresentableWindowRow) => selected.set(`${row.file}:${row.windowMeasures}`, row);

  for (const row of rows) {
    if (row.reasons.includes("primary-window") || row.reasons.includes("interesting-event")) {
      add(row);
    }
  }

  const files = Array.from(new Set(rows.map(row => row.file)));
  for (const file of files) {
    rows
      .filter(row => row.file === file && row.reasons.includes("reference-coverage"))
      .sort((a, b) => (
        b.functionAgreement - a.functionAgreement
        || b.rootAgreement - a.rootAgreement
        || b.proposalCount - a.proposalCount
      ))
      .slice(0, 2)
      .forEach(add);
  }

  return Array.from(selected.values())
    .sort((a, b) => a.file.localeCompare(b.file) || firstMeasure(a.windowMeasures) - firstMeasure(b.windowMeasures));
}

function firstMeasure(windowMeasures: string): number {
  return Number(windowMeasures.split(" ")[0] || 0);
}

export function writePresentableWindowsAudit(rows = collectPresentableWindowRows()): void {
  const reportPath = path.join(process.cwd(), "docs/reports/f104-presentable-windows.md");
  const csvPath = path.join(process.cwd(), "docs/reports/f104-presentable-windows.csv");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderMarkdown(rows));
  fs.writeFileSync(csvPath, renderCsv(rows));
  console.log(`Presentable windows audit complete: ${rows.length} windows.`);
  console.log(`Report: ${reportPath}`);
  console.log(`CSV: ${csvPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writePresentableWindowsAudit();
}
