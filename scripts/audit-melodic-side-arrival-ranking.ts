import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { annotateProposalPresentationRoles } from "../src/utils/music/analysis/strategies/ProposalPresentationPlanner";
import { rankReharmonizationProposalsByVoiceLeading } from "../src/utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";
import { findHarmonizableWindow } from "./real-music-audit";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

const SIDE_ARRIVAL_EVIDENCE = "chegada lateral sustentada pela melodia";

export interface MelodicSideArrivalRankingRow {
  file: string;
  title: string;
  center: string;
  rank: number;
  role: string;
  name: string;
  dominantPenalty: number;
  dominantBonus: number;
  chords: string;
  evidence: string;
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

function chordSummary(proposal: ReharmonizationProposal): string {
  return proposal.measures
    .map(measure => measure.chords.join(" / "))
    .join(" | ");
}

function hasSideArrivalEvidence(proposal: ReharmonizationProposal): boolean {
  return proposal.explanation.some(item => item.includes(SIDE_ARRIVAL_EVIDENCE));
}

function evidenceSummary(proposal: ReharmonizationProposal): string {
  return proposal.explanation
    .filter(item => item.includes(SIDE_ARRIVAL_EVIDENCE) || item.startsWith("Ranking:"))
    .join("; ");
}

export function collectMelodicSideArrivalRowsFromRanking(
  proposals: ReharmonizationProposal[],
  center: string,
  anchors: MelodicAnchor[],
  metadata: { file: string; title: string },
  referenceHarmonies: ScoreHarmonyEvent[] = []
): MelodicSideArrivalRankingRow[] {
  const ranked = rankReharmonizationProposalsByVoiceLeading(
    proposals,
    {
      selectedCenter: { tonic: center, mode: "major", confidence: 0.8 },
      tonalCenterCandidates: [{ tonic: center, mode: "major", confidence: 0.8 }],
      cadentialTarget: { targetPitch: center, cadenceType: "AUTHENTIC", confidence: 0.7 }
    },
    anchors,
    { referenceHarmonies }
  );
  const presented = annotateProposalPresentationRoles(ranked, "balanced", {
    selectedCenter: { tonic: center, mode: "major", confidence: 0.8 },
    tonalCenterCandidates: [{ tonic: center, mode: "major", confidence: 0.8 }],
    cadentialTarget: { targetPitch: center, cadenceType: "AUTHENTIC", confidence: 0.7 }
  });

  return presented
    .map((proposal, index) => ({ proposal, index }))
    .filter(({ proposal }) => hasSideArrivalEvidence(proposal))
    .map(({ proposal, index }) => ({
      file: metadata.file,
      title: metadata.title,
      center,
      rank: index + 1,
      role: proposal.presentationRole || "unassigned",
      name: proposal.name,
      dominantPenalty: proposal.unsupportedDominantTensionPenalty || 0,
      dominantBonus: proposal.dominantTensionRankBonus || 0,
      chords: chordSummary(proposal),
      evidence: evidenceSummary(proposal)
    }));
}

export function collectMelodicSideArrivalRankingRows(files = allMusicXmlFiles()): MelodicSideArrivalRankingRow[] {
  return files.flatMap(file => {
    const snapshot = parseMusicXML(fs.readFileSync(file, "utf8"));
    const harmonizable = findHarmonizableWindow(
      snapshot.notes || [],
      snapshot.metadata.keySignature,
      snapshot.harmonies || []
    );
    if (!harmonizable) return [];

    return collectMelodicSideArrivalRowsFromRanking(
      harmonizable.generation.proposals,
      harmonizable.phraseContext.selectedCenter.tonic,
      harmonizable.anchors,
      {
        file: relativeMusicPath(file),
        title: snapshot.metadata.title || path.basename(file, ".musicxml")
      },
      snapshot.harmonies || []
    );
  });
}

function csvEscape(value: string | number): string {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function renderCsv(rows: MelodicSideArrivalRankingRow[]): string {
  const headers: (keyof MelodicSideArrivalRankingRow)[] = [
    "file",
    "title",
    "center",
    "rank",
    "role",
    "name",
    "dominantPenalty",
    "dominantBonus",
    "chords",
    "evidence"
  ];
  return [
    headers.map(csvEscape).join(","),
    ...rows.map(row => headers.map(header => csvEscape(row[header])).join(","))
  ].join("\n") + "\n";
}

function renderMarkdown(rows: MelodicSideArrivalRankingRow[]): string {
  const primaryRows = rows.filter(row => row.role === "primary").length;
  const lines = [
    "# F101 - Impacto da chegada lateral melodica no ranking",
    "",
    "Esta auditoria lista propostas reais em que a F100 suavizou a penalidade de dominante alterada por chegada lateral sustentada pela melodia.",
    "",
    "## Resumo",
    "",
    `- Propostas impactadas: ${rows.length}`,
    `- Propostas primarias impactadas: ${primaryRows}`,
    "",
    "## Casos",
    "",
    "| # | Arquivo | Centro | Rank | Papel | Proposta | Penal. dom. | Bonus dom. | Cifras | Evidencia |",
    "| ---: | --- | --- | ---: | --- | --- | ---: | ---: | --- | --- |"
  ];

  for (const [index, row] of rows.entries()) {
    lines.push([
      index + 1,
      row.file,
      row.center,
      row.rank,
      row.role,
      row.name,
      row.dominantPenalty.toFixed(2),
      row.dominantBonus.toFixed(2),
      row.chords,
      row.evidence || "-"
    ].map(cell => String(cell).replace(/\|/g, "\\|")).join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  lines.push("");
  lines.push("## Leitura");
  lines.push("");
  if (rows.length === 0) {
    lines.push("A F100 esta pronta no ranking, mas nao apareceu nas janelas harmonizaveis atuais do corpus. O efeito permanece coberto por teste sintético e pode aparecer quando gerarmos rotas mais cromaticas ou analisarmos outras janelas.");
  } else {
    lines.push("A F100 apareceu em propostas reais. A proxima revisao deve ouvir esses casos antes de aumentar ou reduzir a suavizacao.");
  }
  lines.push("");

  return `${lines.join("\n")}\n`;
}

export function writeMelodicSideArrivalRankingAudit(rows = collectMelodicSideArrivalRankingRows()): void {
  const reportPath = path.join(process.cwd(), "docs/reports/f101-melodic-side-arrival-ranking-audit.md");
  const csvPath = path.join(process.cwd(), "docs/reports/f101-melodic-side-arrival-ranking-audit.csv");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderMarkdown(rows));
  fs.writeFileSync(csvPath, renderCsv(rows));
  console.log(`Melodic side-arrival ranking audit complete: ${rows.length} impacted proposals.`);
  console.log(`Report: ${reportPath}`);
  console.log(`CSV: ${csvPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeMelodicSideArrivalRankingAudit();
}
