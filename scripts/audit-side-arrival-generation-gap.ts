import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";
import { chordRoot } from "../src/utils/music/theory/ChordSymbolResolver";
import {
  collectUnresolvedDominantMelodyCases,
  type UnresolvedDominantMelodyCase
} from "./audit-unresolved-dominant-melody";
import { findHarmonizableWindow } from "./real-music-audit";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

export interface SideArrivalGenerationGapRow {
  file: string;
  measure: number;
  chord: string;
  expectedTarget: string;
  sideArrivalRoot: string;
  sideArrivalRelation: string;
  melodyClass: string;
  windowStatus: "covered-by-window" | "outside-window" | "no-window";
  proposalCount: number;
  matchingProposalCount: number;
  matchingExamples: string[];
  diagnosis: string;
}

function fullMusicPath(relativeFile: string): string {
  return path.join(process.cwd(), "docs/musics", relativeFile);
}

export function proposalHasSideArrivalNearMeasure(
  proposal: ReharmonizationProposal,
  measure: number,
  sideArrivalRoot: string
): boolean {
  const targetRoot = chordRoot(sideArrivalRoot);
  if (!targetRoot) return false;

  return proposal.measures.some(item => (
    (item.measureIndex === measure || item.measureIndex === measure + 1)
    && item.chords.some(chord => chordRoot(chord) === targetRoot)
  ));
}

export function proposalSummary(proposal: ReharmonizationProposal): string {
  return `${proposal.name}: ${proposal.measures
    .map(measure => `${measure.measureIndex}:${measure.chords.join("/")}`)
    .join(" | ")}`;
}

export function analyzeSideArrivalGenerationGap(
  item: UnresolvedDominantMelodyCase,
  proposals: ReharmonizationProposal[],
  windowMeasures: number[]
): SideArrivalGenerationGapRow {
  const covered = windowMeasures.includes(item.measure);
  const matching = proposals.filter(proposal => (
    proposalHasSideArrivalNearMeasure(proposal, item.measure, item.sideArrivalRoot)
  ));
  const windowStatus = covered ? "covered-by-window" : "outside-window";

  return {
    file: item.file,
    measure: item.measure,
    chord: item.chord,
    expectedTarget: item.expectedTarget,
    sideArrivalRoot: item.sideArrivalRoot,
    sideArrivalRelation: item.sideArrivalRelation,
    melodyClass: item.reviewClass,
    windowStatus,
    proposalCount: proposals.length,
    matchingProposalCount: matching.length,
    matchingExamples: matching.slice(0, 3).map(proposalSummary),
    diagnosis: !covered
      ? "O caso da referencia nao cai na janela harmonizavel escolhida."
      : matching.length === 0
        ? "A janela cobre o caso, mas o gerador nao produziu a chegada lateral."
        : "O gerador ja produziu candidato com a chegada lateral."
  };
}

export function collectSideArrivalGenerationGapRows(
  cases = collectUnresolvedDominantMelodyCases()
): SideArrivalGenerationGapRow[] {
  return cases.map(item => {
    const file = fullMusicPath(item.file);
    const snapshot = parseMusicXML(fs.readFileSync(file, "utf8"));
    const harmonizable = findHarmonizableWindow(
      snapshot.notes || [],
      snapshot.metadata.keySignature,
      snapshot.harmonies || []
    );
    if (!harmonizable) {
      return {
        file: item.file,
        measure: item.measure,
        chord: item.chord,
        expectedTarget: item.expectedTarget,
        sideArrivalRoot: item.sideArrivalRoot,
        sideArrivalRelation: item.sideArrivalRelation,
        melodyClass: item.reviewClass,
        windowStatus: "no-window",
        proposalCount: 0,
        matchingProposalCount: 0,
        matchingExamples: [],
        diagnosis: "Nao foi encontrada janela harmonizavel para esta musica."
      };
    }

    const windowMeasures = Array.from(new Set(harmonizable.anchors.map(anchor => anchor.measureIndex)));
    return analyzeSideArrivalGenerationGap(
      item,
      harmonizable.generation.proposals,
      windowMeasures
    );
  });
}

function csvEscape(value: string | number): string {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function renderCsv(rows: SideArrivalGenerationGapRow[]): string {
  const headers: (keyof SideArrivalGenerationGapRow)[] = [
    "file",
    "measure",
    "chord",
    "expectedTarget",
    "sideArrivalRoot",
    "sideArrivalRelation",
    "melodyClass",
    "windowStatus",
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

function renderMarkdown(rows: SideArrivalGenerationGapRow[]): string {
  const covered = rows.filter(row => row.windowStatus === "covered-by-window").length;
  const matched = rows.filter(row => row.matchingProposalCount > 0).length;
  const lines = [
    "# F102 - Lacuna de geracao para chegadas laterais",
    "",
    "Esta auditoria cruza os casos F98 da referencia com as propostas que o gerador produz na janela harmonizavel escolhida.",
    "",
    "## Resumo",
    "",
    `- Casos analisados: ${rows.length}`,
    `- Casos dentro da janela harmonizavel: ${covered}`,
    `- Casos com candidato lateral gerado: ${matched}`,
    "",
    "## Casos",
    "",
    "| # | Arquivo | Comp. | Acorde ref. | Alvo | Chegada | Relação | Melodia | Janela | Propostas | Matches | Diagnóstico | Exemplos |",
    "| ---: | --- | ---: | --- | --- | --- | --- | --- | --- | ---: | ---: | --- | --- |"
  ];

  for (const [index, row] of rows.entries()) {
    lines.push([
      index + 1,
      row.file,
      row.measure,
      row.chord,
      row.expectedTarget,
      row.sideArrivalRoot,
      row.sideArrivalRelation,
      row.melodyClass,
      row.windowStatus,
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
    lines.push("Nenhum caso F98 aparece como candidato lateral nas propostas atuais. O gargalo esta na geracao ou na selecao de janela, nao no ranking F100.");
  } else {
    lines.push("Alguns casos ja aparecem como candidatos. O proximo passo e comparar ranking e apresentacao desses candidatos.");
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

export function writeSideArrivalGenerationGapAudit(rows = collectSideArrivalGenerationGapRows()): void {
  const reportPath = path.join(process.cwd(), "docs/reports/f102-side-arrival-generation-gap.md");
  const csvPath = path.join(process.cwd(), "docs/reports/f102-side-arrival-generation-gap.csv");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderMarkdown(rows));
  fs.writeFileSync(csvPath, renderCsv(rows));
  console.log(`Side-arrival generation gap audit complete: ${rows.length} cases.`);
  console.log(`Report: ${reportPath}`);
  console.log(`CSV: ${csvPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeSideArrivalGenerationGapAudit();
}
