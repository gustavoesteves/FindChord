import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { annotateProposalPresentationRoles } from "../src/utils/music/analysis/strategies/ProposalPresentationPlanner";
import { compareProposalToReferenceHarmony } from "../src/utils/music/analysis/strategies/ReferenceHarmonyComparator";
import { rankReharmonizationProposalsByVoiceLeading } from "../src/utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";
import { findHarmonizableWindow } from "./real-music-audit";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

const cases = [
  "d-025-Donna Lee.musicxml",
  "f-015-Firm roots.musicxml",
  "a-052-Ask me now.musicxml"
];

interface RankingRow {
  file: string;
  title: string;
  center: string;
  proposalCount: number;
  rank: number;
  measures: string;
  role: string;
  layer: string;
  name: string;
  route: string;
  voiceLeading: number;
  routeCost: number;
  referenceBonus: number;
  temporalCoverage: number;
  temporalPenalty: number;
  chromaticPenalty: number;
  referenceStatus: string;
  functionAgreement: number;
  rootAgreement: number;
  chords: string;
  evidence: string;
}

function chordSummary(proposal: ReharmonizationProposal): string {
  return proposal.measures
    .map(measure => measure.chords.join(" / "))
    .join(" | ");
}

function evidenceSummary(proposal: ReharmonizationProposal): string {
  return proposal.explanation
    .filter(item => (
      item.startsWith("Referência:")
      || item.startsWith("Condução de vozes:")
      || item.startsWith("Rota harmônica:")
      || item.startsWith("Função aparente:")
    ))
    .slice(0, 4)
    .join("; ");
}

function csvEscape(value: string | number): string {
  const text = String(value);
  return `"${text.replace(/"/g, "\"\"")}"`;
}

function loadSnapshot(file: string): any {
  const fullPath = path.join(process.cwd(), "docs/musics/imported-real-book", file);
  return parseMusicXML(fs.readFileSync(fullPath, "utf8"));
}

function auditCase(file: string): RankingRow[] {
  const snapshot = loadSnapshot(file);
  const harmonizable = findHarmonizableWindow(
    snapshot.notes,
    snapshot.metadata.keySignature,
    snapshot.harmonies
  );
  if (!harmonizable) return [];

  const ranked = rankReharmonizationProposalsByVoiceLeading(
    harmonizable.generation.proposals,
    harmonizable.phraseContext,
    harmonizable.anchors,
    { referenceHarmonies: snapshot.harmonies }
  );
  const presented = annotateProposalPresentationRoles(ranked, "balanced", harmonizable.phraseContext);

  return presented.slice(0, 6).map((proposal, index) => {
    const comparison = compareProposalToReferenceHarmony(
      proposal,
      snapshot.harmonies,
      harmonizable.phraseContext.selectedCenter.tonic
    );
    return {
      file,
      title: snapshot.metadata.title || file.replace(/\.musicxml$/i, ""),
      center: `${harmonizable.phraseContext.selectedCenter.tonic} ${harmonizable.phraseContext.selectedCenter.mode}`,
      proposalCount: presented.length,
      rank: index + 1,
      measures: proposal.measures.map(measure => String(measure.measureIndex)).join(" "),
      role: proposal.presentationRole || "unassigned",
      layer: proposal.presentationLayer || "basic",
      name: proposal.name,
      route: proposal.routeProfile || "n/a",
      voiceLeading: proposal.voiceLeadingScore || 0,
      routeCost: proposal.routeDistanceCost || 0,
      referenceBonus: proposal.apparentFunctionReferenceBonus || 0,
      temporalCoverage: proposal.temporalCoverageRatio ?? 1,
      temporalPenalty: proposal.temporalCoveragePenalty || 0,
      chromaticPenalty: proposal.unsupportedChromaticPenalty || 0,
      referenceStatus: comparison.status,
      functionAgreement: comparison.functionAgreement,
      rootAgreement: comparison.rootAgreement,
      chords: chordSummary(proposal),
      evidence: evidenceSummary(proposal)
    };
  });
}

function renderMarkdown(rows: RankingRow[]): string {
  const lines = [
    "# F76 - Auditoria de ranking de propostas",
    "",
    "Esta auditoria olha os casos `Muitas propostas` da F71. O objetivo e conferir se a proposta primaria e musicalmente clara quando o motor gera muitas alternativas plausiveis.",
    "",
    "## Leitura geral",
    "",
    `- Musicas auditadas: ${cases.length}`,
    `- Propostas listadas: ${rows.length}`,
    "",
    "## Resultado por musica",
    ""
  ];

  for (const file of cases) {
    const fileRows = rows.filter(row => row.file === file);
    const primary = fileRows.find(row => row.role === "primary") || fileRows[0];
    lines.push(`### ${file}`);
    lines.push("");
    if (!primary) {
      lines.push("- Sem proposta harmonizavel.");
      lines.push("");
      continue;
    }
    lines.push(`- Centro: ${primary.center}`);
    lines.push(`- Propostas geradas: ${primary.proposalCount}`);
    lines.push(`- Primaria: ${primary.name}`);
    lines.push(`- Cifras: ${primary.chords}`);
    lines.push(`- Comparacao: ${primary.referenceStatus}; funcao ${Math.round(primary.functionAgreement * 100)}%; raiz ${Math.round(primary.rootAgreement * 100)}%`);
    lines.push("");
    lines.push("| Rank | Papel | Camada | Proposta | Rota | Conducao | Custo | Bonus ref. | Cobertura | Penal. temp. | Penal. crom. | Ref. | Cifras | Evidencias |");
    lines.push("| ---: | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |");
    for (const row of fileRows) {
      lines.push([
        row.rank,
        row.role,
        row.layer,
        `${row.name} [c. ${row.measures}]`,
        row.route,
        row.voiceLeading.toFixed(2),
        row.routeCost.toFixed(2),
        row.referenceBonus.toFixed(2),
        row.temporalCoverage.toFixed(2),
        row.temporalPenalty.toFixed(2),
        row.chromaticPenalty.toFixed(2),
        `${row.referenceStatus} ${Math.round(row.functionAgreement * 100)}%/${Math.round(row.rootAgreement * 100)}%`,
        row.chords,
        row.evidence || "-"
      ].map(cell => String(cell).replace(/\|/g, "\\|")).join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
    lines.push("");
  }

  lines.push("## Proxima decisao");
  lines.push("");
  lines.push("Se a primaria estiver clara e a referencia estiver alinhada, o caso vira ancora positiva de ranking. Se uma alternativa soar mais cantavel, a proxima sprint deve ajustar o criterio responsavel antes de avancar para cromatismo.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function renderCsv(rows: RankingRow[]): string {
  const headers: (keyof RankingRow)[] = [
    "file",
    "title",
    "center",
    "proposalCount",
    "rank",
    "measures",
    "role",
    "layer",
    "name",
    "route",
    "voiceLeading",
    "routeCost",
    "referenceBonus",
    "temporalCoverage",
    "temporalPenalty",
    "chromaticPenalty",
    "referenceStatus",
    "functionAgreement",
    "rootAgreement",
    "chords",
    "evidence"
  ];
  return [
    headers.map(csvEscape).join(","),
    ...rows.map(row => headers.map(header => csvEscape(row[header])).join(","))
  ].join("\n") + "\n";
}

export function auditRankingCalibration(): RankingRow[] {
  return cases.flatMap(auditCase);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rows = auditRankingCalibration();
  const reportPath = path.join(process.cwd(), "docs/reports/f76-ranking-calibration-audit.md");
  const csvPath = path.join(process.cwd(), "docs/reports/f76-ranking-calibration-audit.csv");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderMarkdown(rows));
  fs.writeFileSync(csvPath, renderCsv(rows));
  console.log(`Ranking calibration audit complete: ${cases.length} files.`);
  console.log(`Report: ${reportPath}`);
  console.log(`CSV: ${csvPath}`);
}
