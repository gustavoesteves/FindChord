import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { GravityFieldManager } from "../src/utils/music/analysis/engines/GravityFieldManager";
import { PhraseAnalysisEngine } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";
import { dedupeHarmonicallyEquivalentProposals } from "../src/utils/music/analysis/strategies/ProposalHarmonicIdentity";
import {
  groupNearEquivalentColorVariants,
  groupNearReferenceVariants
} from "../src/utils/music/analysis/strategies/ProposalConsequenceSimilarity";
import { annotateProposalPresentationRoles } from "../src/utils/music/analysis/strategies/ProposalPresentationPlanner";
import { applyReferenceCenterToPhraseContext } from "../src/utils/music/analysis/strategies/ReferenceAwarePhraseContext";
import { rankReharmonizationProposalsByVoiceLeading } from "../src/utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import type { FunctionalClassificationMode } from "../src/utils/music/analysis/strategies/HarmonicStrategyValidator";
import {
  buildControlledReharmonizationProposals,
  buildExistingHarmonyProposal,
  selectMelodicAnchors,
  selectSectionHarmonies
} from "../src/domains/harmonizer/services/harmonizerService";
import {
  buildLocalSegmentHarmonizations,
  removeRepeatedLocalSegmentIdeas
} from "../src/domains/harmonizer/services/localSegmentHarmonization";
import {
  proposalDisplayNameCounts,
  proposalVisibleSignature
} from "../src/domains/harmonizer/services/proposalDisplayContext";
import {
  measureTicksForMetricContext,
  timelineContextAtTick,
  timelineContextForAnchors
} from "../src/utils/music/analysis/scoreTimelineContext";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");
const MUSIC_DIR = path.join(process.cwd(), "docs/musics");

export type ProposalCurationStatus =
  | "sem-ideia"
  | "uma-ideia"
  | "repeticoes-removidas"
  | "conjunto-distinto";

export interface ProposalCurationAuditRow {
  file: string;
  title: string;
  harmonyCount: number;
  rawMainIdeas: number;
  uniqueMainIdeas: number;
  repeatedMainIdeas: number;
  exactRepeatedMainIdeas: number;
  groupedReferenceIdeas: number;
  groupedColorIdeas: number;
  rawLocalIdeas: number;
  uniqueLocalIdeas: number;
  repeatedLocalIdeas: number;
  totalVisibleCards: number;
  status: ProposalCurationStatus;
  visibleIdeaNames: string;
}

export interface CuratedProposalIdea {
  origin: "main" | "local";
  label: string;
  proposal: ReharmonizationProposal;
}

export interface ProposalCurationAnalysis {
  row: ProposalCurationAuditRow;
  center: string;
  classificationMode: FunctionalClassificationMode;
  visibleIdeas: CuratedProposalIdea[];
}

interface AnalyzeProposalCurationOptions {
  groupColorVariants?: boolean;
}

function uniqueMeasureIndexes(anchors: { measureIndex: number }[]): number[] {
  return Array.from(new Set(anchors.map(anchor => anchor.measureIndex))).sort((a, b) => a - b);
}

export function proposalCurationMusicXmlFiles(directory = MUSIC_DIR, prefix = ""): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const relativePath = path.join(prefix, entry.name);
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return proposalCurationMusicXmlFiles(absolutePath, relativePath);
    return entry.isFile() && entry.name.endsWith(".musicxml") ? [relativePath] : [];
  }).sort((a, b) => a.localeCompare(b));
}

function curationStatus(
  visibleCards: number,
  repeatedMainIdeas: number,
  repeatedLocalIdeas: number
): ProposalCurationStatus {
  if (visibleCards === 0) return "sem-ideia";
  if (visibleCards === 1) return "uma-ideia";
  if (repeatedMainIdeas + repeatedLocalIdeas > 0) return "repeticoes-removidas";
  return "conjunto-distinto";
}

function proposalNames(
  main: ReharmonizationProposal[],
  local: ReturnType<typeof buildLocalSegmentHarmonizations>
): string {
  const allProposals = [
    ...main,
    ...local.map(segment => segment.primaryProposal)
  ];
  const nameCounts = proposalDisplayNameCounts(allProposals);

  return [
    ...main.map(proposal => proposalVisibleSignature(proposal, nameCounts)),
    ...local.map(segment => `${segment.title}: ${proposalVisibleSignature(segment.primaryProposal, nameCounts)}`)
  ].join(" | ");
}

export function analyzeProposalCurationForFile(
  relativeFile: string,
  options: AnalyzeProposalCurationOptions = {}
): ProposalCurationAnalysis {
  const snapshot = parseMusicXML(fs.readFileSync(path.join(MUSIC_DIR, relativeFile), "utf8"));
  const melody = selectMelodicAnchors(snapshot.notes, undefined);
  const harmonies = selectSectionHarmonies(snapshot.harmonies, undefined);

  if (melody.anchors.length === 0) {
    return {
      row: {
        file: relativeFile,
        title: snapshot.metadata.title || path.basename(relativeFile, ".musicxml"),
        harmonyCount: harmonies.length,
        rawMainIdeas: 0,
        uniqueMainIdeas: 0,
        repeatedMainIdeas: 0,
        exactRepeatedMainIdeas: 0,
        groupedReferenceIdeas: 0,
        groupedColorIdeas: 0,
        rawLocalIdeas: 0,
        uniqueLocalIdeas: 0,
        repeatedLocalIdeas: 0,
        totalVisibleCards: 0,
        status: "sem-ideia",
        visibleIdeaNames: ""
      },
      center: timelineContextAtTick(snapshot).keySignature || "C",
      classificationMode: "major-functional",
      visibleIdeas: []
    };
  }

  const timelineContext = timelineContextForAnchors(snapshot, melody.anchors);
  const phraseContext = applyReferenceCenterToPhraseContext(
    PhraseAnalysisEngine.analyzePhrase(melody.anchors, timelineContext.keySignature),
    harmonies
  );
  const generation = GravityFieldManager.generateProposalsWithDiagnostics(
    melody.anchors,
    phraseContext,
    { measureTicks: measureTicksForMetricContext(snapshot) }
  );
  const controlled = buildControlledReharmonizationProposals(harmonies, melody.anchors, phraseContext);
  const ranked = rankReharmonizationProposalsByVoiceLeading(
    [...controlled, ...generation.proposals],
    phraseContext,
    melody.anchors,
    { referenceHarmonies: harmonies }
  );
  const reference = buildExistingHarmonyProposal(harmonies);
  const rawMain = reference ? [reference, ...ranked] : ranked;
  const exactMain = dedupeHarmonicallyEquivalentProposals(rawMain);
  const referenceGroupedMain = options.groupColorVariants === false
    ? exactMain
    : groupNearReferenceVariants(exactMain, {
      center: phraseContext.selectedCenter.tonic,
      classificationMode: phraseContext.selectedCenter.mode === "minor"
        ? "minor-functional"
        : "major-functional"
    });
  const groupedMain = options.groupColorVariants === false
    ? exactMain
    : groupNearEquivalentColorVariants(referenceGroupedMain, {
      center: phraseContext.selectedCenter.tonic,
      classificationMode: phraseContext.selectedCenter.mode === "minor"
        ? "minor-functional"
        : "major-functional"
    });
  const uniqueMain = annotateProposalPresentationRoles(
    groupedMain,
    "balanced",
    phraseContext
  );
  const rawLocal = buildLocalSegmentHarmonizations({
    anchors: melody.allAnchors,
    keySignature: timelineContext.keySignature,
    referenceHarmonies: harmonies,
    primaryMeasures: uniqueMeasureIndexes(melody.anchors),
    boldnessMode: "balanced",
    measureTicks: measureTicksForMetricContext(snapshot)
  });
  const uniqueLocal = removeRepeatedLocalSegmentIdeas(rawLocal, uniqueMain);
  const exactRepeatedMainIdeas = rawMain.length - exactMain.length;
  const groupedReferenceIdeas = exactMain.length - referenceGroupedMain.length;
  const groupedColorIdeas = referenceGroupedMain.length - groupedMain.length;
  const repeatedMainIdeas = rawMain.length - uniqueMain.length;
  const repeatedLocalIdeas = rawLocal.length - uniqueLocal.length;
  const totalVisibleCards = uniqueMain.length + uniqueLocal.length;

  return {
    row: {
      file: relativeFile,
      title: snapshot.metadata.title || path.basename(relativeFile, ".musicxml"),
      harmonyCount: harmonies.length,
      rawMainIdeas: rawMain.length,
      uniqueMainIdeas: uniqueMain.length,
      repeatedMainIdeas,
      exactRepeatedMainIdeas,
      groupedReferenceIdeas,
      groupedColorIdeas,
      rawLocalIdeas: rawLocal.length,
      uniqueLocalIdeas: uniqueLocal.length,
      repeatedLocalIdeas,
      totalVisibleCards,
      status: curationStatus(totalVisibleCards, repeatedMainIdeas, repeatedLocalIdeas),
      visibleIdeaNames: proposalNames(uniqueMain, uniqueLocal)
    },
    center: phraseContext.selectedCenter.tonic,
    classificationMode: phraseContext.selectedCenter.mode === "minor"
      ? "minor-functional"
      : "major-functional",
    visibleIdeas: [
      ...uniqueMain.map(proposal => ({
        origin: "main" as const,
        label: proposal.name,
        proposal
      })),
      ...uniqueLocal.map(segment => ({
        origin: "local" as const,
        label: `${segment.title}: ${segment.primaryProposal.name}`,
        proposal: segment.primaryProposal
      }))
    ]
  };
}

export function auditProposalCurationForFile(relativeFile: string): ProposalCurationAuditRow {
  return analyzeProposalCurationForFile(relativeFile).row;
}

export function collectProposalCurationAudit(): ProposalCurationAuditRow[] {
  return proposalCurationMusicXmlFiles().map(auditProposalCurationForFile);
}

function csvEscape(value: string | number): string {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function renderCsv(rows: ProposalCurationAuditRow[]): string {
  const headers: (keyof ProposalCurationAuditRow)[] = [
    "file",
    "title",
    "harmonyCount",
    "rawMainIdeas",
    "uniqueMainIdeas",
    "repeatedMainIdeas",
    "exactRepeatedMainIdeas",
    "groupedReferenceIdeas",
    "groupedColorIdeas",
    "rawLocalIdeas",
    "uniqueLocalIdeas",
    "repeatedLocalIdeas",
    "totalVisibleCards",
    "status",
    "visibleIdeaNames"
  ];
  return [
    headers.map(csvEscape).join(","),
    ...rows.map(row => headers.map(header => csvEscape(row[header])).join(","))
  ].join("\n") + "\n";
}

function markdownCell(value: string | number): string {
  return String(value).replace(/\|/g, "\\|");
}

function renderTable(rows: ProposalCurationAuditRow[]): string[] {
  const lines = [
    "| Arquivo | Brutas | Unicas | Exatas | Referencia | Cores | Locais | Cards | Estado |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];
  for (const row of rows) {
    lines.push(`| ${[
      row.file,
      row.rawMainIdeas,
      row.uniqueMainIdeas,
      row.exactRepeatedMainIdeas,
      row.groupedReferenceIdeas,
      row.groupedColorIdeas,
      `${row.uniqueLocalIdeas}/${row.rawLocalIdeas}`,
      row.totalVisibleCards,
      row.status
    ].map(markdownCell).join(" | ")} |`);
  }
  return lines;
}

function renderMarkdown(rows: ProposalCurationAuditRow[]): string {
  const rawMainIdeas = rows.reduce((sum, row) => sum + row.rawMainIdeas, 0);
  const uniqueMainIdeas = rows.reduce((sum, row) => sum + row.uniqueMainIdeas, 0);
  const repeatedMainIdeas = rows.reduce((sum, row) => sum + row.repeatedMainIdeas, 0);
  const exactRepeatedMainIdeas = rows.reduce((sum, row) => sum + row.exactRepeatedMainIdeas, 0);
  const groupedReferenceIdeas = rows.reduce((sum, row) => sum + row.groupedReferenceIdeas, 0);
  const groupedColorIdeas = rows.reduce((sum, row) => sum + row.groupedColorIdeas, 0);
  const rawLocalIdeas = rows.reduce((sum, row) => sum + row.rawLocalIdeas, 0);
  const uniqueLocalIdeas = rows.reduce((sum, row) => sum + row.uniqueLocalIdeas, 0);
  const repeatedLocalIdeas = rows.reduce((sum, row) => sum + row.repeatedLocalIdeas, 0);
  const withRemovedRepetitions = rows.filter(row => row.repeatedMainIdeas + row.repeatedLocalIdeas > 0);
  const sparse = rows.filter(row => row.totalVisibleCards <= 1);
  const mostRepeated = [...rows]
    .filter(row => row.repeatedMainIdeas + row.repeatedLocalIdeas > 0)
    .sort((a, b) => (
      (b.repeatedMainIdeas + b.repeatedLocalIdeas) - (a.repeatedMainIdeas + a.repeatedLocalIdeas)
      || a.file.localeCompare(b.file)
    ))
    .slice(0, 25);

  return [
    "# F108 - Curadoria de ideias harmonicas no catalogo",
    "",
    "A auditoria reproduz o percurso da tela Harmonizar e mede quantos cards representam ideias harmonicamente distintas.",
    "",
    "## Resumo",
    "",
    `- Partituras analisadas: ${rows.length}`,
    `- Ideias principais antes da curadoria: ${rawMainIdeas}`,
    `- Ideias principais unicas: ${uniqueMainIdeas}`,
    `- Repeticoes exatas principais removidas: ${exactRepeatedMainIdeas}`,
    `- Leituras proximas da referencia agrupadas: ${groupedReferenceIdeas}`,
    `- Variacoes de cor agrupadas: ${groupedColorIdeas}`,
    `- Reducao total de cards principais: ${repeatedMainIdeas}`,
    `- Trechos locais antes da curadoria: ${rawLocalIdeas}`,
    `- Trechos locais unicos: ${uniqueLocalIdeas}`,
    `- Repeticoes locais removidas: ${repeatedLocalIdeas}`,
    `- Partituras em que houve remocao: ${withRemovedRepetitions.length}`,
    `- Partituras com zero ou uma ideia visivel: ${sparse.length}`,
    "",
    "## Maiores reducoes",
    "",
    ...renderTable(mostRepeated),
    "",
    "## Casos com pouca variedade",
    "",
    ...(sparse.length > 0 ? renderTable(sparse.slice(0, 25)) : ["Nenhum caso com zero ou uma ideia visivel."]),
    "",
    "## Leitura",
    "",
    "A curadoria separa repeticoes exatas, leituras proximas da referencia e variacoes de cor. Nenhuma dessas camadas combina inversoes, densidades ou posicoes temporais distintas.",
    "Os casos com pouca variedade devem ser lidos como fila de investigacao: podem representar uma melodia realmente restritiva ou uma lacuna de vocabulario do motor.",
    "O CSV preserva todas as partituras e os nomes das ideias que permaneceram visiveis.",
    ""
  ].join("\n");
}

export function writeProposalCurationAudit(rows = collectProposalCurationAudit()): void {
  const reportPath = path.join(process.cwd(), "docs/reports/f108-proposal-curation.md");
  const csvPath = path.join(process.cwd(), "docs/reports/f108-proposal-curation.csv");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderMarkdown(rows));
  fs.writeFileSync(csvPath, renderCsv(rows));
  console.log(`Proposal curation audit complete: ${rows.length} scores.`);
  console.log(`Report: ${reportPath}`);
  console.log(`CSV: ${csvPath}`);
}
