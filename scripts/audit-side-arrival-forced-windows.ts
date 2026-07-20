import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import { GravityFieldManager } from "../src/utils/music/analysis/engines/GravityFieldManager";
import { applyReferenceCenterToPhraseContext } from "../src/utils/music/analysis/strategies/ReferenceAwarePhraseContext";
import {
  collectUnresolvedDominantMelodyCases,
  type UnresolvedDominantMelodyCase
} from "./audit-unresolved-dominant-melody";
import {
  proposalHasSideArrivalNearMeasure,
  proposalSummary
} from "./audit-side-arrival-generation-gap";
import { toAnchors } from "./real-music-audit";
import {
  measureTicksForMetricContext,
  timelineContextForAnchors
} from "../src/utils/music/analysis/scoreTimelineContext";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

export interface ForcedSideArrivalWindowRow {
  file: string;
  measure: number;
  chord: string;
  sideArrivalRoot: string;
  sideArrivalRelation: string;
  melodyClass: string;
  windowMeasures: string;
  proposalCount: number;
  matchingProposalCount: number;
  matchingExamples: string[];
  diagnosis: string;
}

function fullMusicPath(relativeFile: string): string {
  return path.join(process.cwd(), "docs/musics", relativeFile);
}

function melodicMeasureIndexes(notes: any[]): number[] {
  return Array.from(new Set(
    notes
      .filter(note => note.durationTicks > 0)
      .map(note => note.measure)
  )).sort((a, b) => a - b);
}

function notesForForcedWindow(notes: any[], targetMeasure: number, size = 8): any[] {
  const measures = melodicMeasureIndexes(notes);
  const targetPosition = measures.indexOf(targetMeasure);
  if (targetPosition < 0) return [];

  const start = Math.min(
    Math.max(0, targetPosition),
    Math.max(0, measures.length - size)
  );
  const selected = new Set(measures.slice(start, start + size));
  return notes.filter(note => selected.has(note.measure));
}

export function analyzeForcedSideArrivalWindow(
  item: UnresolvedDominantMelodyCase,
  snapshot: any
): ForcedSideArrivalWindowRow {
  const windowNotes = notesForForcedWindow(snapshot.notes || [], item.measure);
  if (windowNotes.length === 0) {
    return {
      file: item.file,
      measure: item.measure,
      chord: item.chord,
      sideArrivalRoot: item.sideArrivalRoot,
      sideArrivalRelation: item.sideArrivalRelation,
      melodyClass: item.reviewClass,
      windowMeasures: "",
      proposalCount: 0,
      matchingProposalCount: 0,
      matchingExamples: [],
      diagnosis: "Nao ha janela melodica contendo este compasso."
    };
  }

  const anchors = toAnchors(windowNotes);
  const referenceHarmonies = (snapshot.harmonies || []).filter((harmony: any) => (
    anchors.some(anchor => anchor.measureIndex === harmony.measure)
  ));
  const phraseContext = applyReferenceCenterToPhraseContext(
    PhraseAnalysisEngine.analyzePhrase(
      anchors,
      timelineContextForAnchors(snapshot, anchors).keySignature
    ),
    referenceHarmonies
  );
  const generation = GravityFieldManager.generateProposalsWithDiagnostics(
    anchors,
    phraseContext,
    { measureTicks: measureTicksForMetricContext(snapshot) }
  );
  const matching = generation.proposals.filter(proposal => (
    proposalHasSideArrivalNearMeasure(proposal, item.measure, item.sideArrivalRoot)
  ));

  return {
    file: item.file,
    measure: item.measure,
    chord: item.chord,
    sideArrivalRoot: item.sideArrivalRoot,
    sideArrivalRelation: item.sideArrivalRelation,
    melodyClass: item.reviewClass,
    windowMeasures: Array.from(new Set(anchors.map(anchor => anchor.measureIndex))).join(" "),
    proposalCount: generation.proposals.length,
    matchingProposalCount: matching.length,
    matchingExamples: matching.slice(0, 3).map(proposalSummary),
    diagnosis: matching.length > 0
      ? "A janela forcada gera candidato com chegada lateral."
      : "Mesmo com janela forcada, o gerador nao produziu chegada lateral."
  };
}

export function collectForcedSideArrivalWindowRows(
  cases = collectUnresolvedDominantMelodyCases()
): ForcedSideArrivalWindowRow[] {
  return cases.map(item => {
    const snapshot = parseMusicXML(fs.readFileSync(fullMusicPath(item.file), "utf8"));
    return analyzeForcedSideArrivalWindow(item, snapshot);
  });
}

function csvEscape(value: string | number): string {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function renderCsv(rows: ForcedSideArrivalWindowRow[]): string {
  const headers: (keyof ForcedSideArrivalWindowRow)[] = [
    "file",
    "measure",
    "chord",
    "sideArrivalRoot",
    "sideArrivalRelation",
    "melodyClass",
    "windowMeasures",
    "proposalCount",
    "matchingProposalCount",
    "matchingExamples",
    "diagnosis"
  ];
  return [
    headers.map(csvEscape).join(","),
    ...rows.map(row => headers.map(header => {
      const value = row[header];
      return csvEscape(Array.isArray(value) ? value.join(" / ") : value);
    }).join(","))
  ].join("\n") + "\n";
}

function renderMarkdown(rows: ForcedSideArrivalWindowRow[]): string {
  const withWindow = rows.filter(row => row.windowMeasures.length > 0).length;
  const matched = rows.filter(row => row.matchingProposalCount > 0).length;
  const lines = [
    "# F103 - Janelas forcadas para chegadas laterais",
    "",
    "Esta auditoria força uma janela melodica que contem cada caso F98 e observa se o gerador passa a produzir a chegada lateral da referencia.",
    "",
    "## Resumo",
    "",
    `- Casos analisados: ${rows.length}`,
    `- Casos com janela forcada: ${withWindow}`,
    `- Casos com candidato lateral gerado: ${matched}`,
    "",
    "## Casos",
    "",
    "| # | Arquivo | Comp. | Acorde ref. | Chegada | Relação | Melodia | Janela | Propostas | Matches | Diagnóstico | Exemplos |",
    "| ---: | --- | ---: | --- | --- | --- | --- | --- | ---: | ---: | --- | --- |"
  ];

  for (const [index, row] of rows.entries()) {
    lines.push([
      index + 1,
      row.file,
      row.measure,
      row.chord,
      row.sideArrivalRoot,
      row.sideArrivalRelation,
      row.melodyClass,
      row.windowMeasures || "-",
      row.proposalCount,
      row.matchingProposalCount,
      row.diagnosis,
      row.matchingExamples.join(" / ") || "-"
    ].map(cell => String(cell).replace(/\|/g, "\\|")).join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  lines.push("");
  lines.push("## Leitura");
  lines.push("");
  if (matched === 0) {
    lines.push("Mesmo quando a janela contem o compasso problematico, o gerador ainda nao produz essas chegadas laterais.");
  } else {
    lines.push("Forcar a janela revela alguns candidatos laterais. A selecao de janela e a cobertura de multiplas janelas passam a ser parte do problema.");
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

export function writeForcedSideArrivalWindowAudit(rows = collectForcedSideArrivalWindowRows()): void {
  const reportPath = path.join(process.cwd(), "docs/reports/f103-side-arrival-forced-windows.md");
  const csvPath = path.join(process.cwd(), "docs/reports/f103-side-arrival-forced-windows.csv");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderMarkdown(rows));
  fs.writeFileSync(csvPath, renderCsv(rows));
  console.log(`Forced side-arrival window audit complete: ${rows.length} cases.`);
  console.log(`Report: ${reportPath}`);
  console.log(`CSV: ${csvPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeForcedSideArrivalWindowAudit();
}
