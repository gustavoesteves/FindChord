import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { annotateProposalPresentationRoles } from "../src/utils/music/analysis/strategies/ProposalPresentationPlanner";
import { compareProposalToReferenceHarmony } from "../src/utils/music/analysis/strategies/ReferenceHarmonyComparator";
import { rankReharmonizationProposalsByVoiceLeading } from "../src/utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import { evaluateVoiceLeadingTransition } from "../src/utils/music/analysis/strategies/VoiceLeadingTransitionEvaluator";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";
import { findHarmonizableWindow } from "./real-music-audit";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

const cases = [
  "c-034-Crazeology.musicxml",
  "d-017-Detour ahead.musicxml",
  "e-002-E.S.P..musicxml"
];

interface ChromaticRow {
  file: string;
  title: string;
  center: string;
  rank: number;
  measures: string;
  role: string;
  layer: string;
  name: string;
  route: string;
  unresolved: number;
  guideTones: number;
  chromaticBass: number;
  slashDensity: number;
  legibilityPenalty: number;
  rankingRootAgreement: number;
  referenceStatus: string;
  functionAgreement: number;
  rootAgreement: number;
  chords: string;
  evidence: string;
}

function loadSnapshot(file: string): any {
  const fullPath = path.join(process.cwd(), "docs/musics/imported-real-book", file);
  return parseMusicXML(fs.readFileSync(fullPath, "utf8"));
}

function chordSummary(proposal: ReharmonizationProposal): string {
  return proposal.measures.map(measure => measure.chords.join(" / ")).join(" | ");
}

function flatChords(proposal: ReharmonizationProposal): string[] {
  return proposal.measures.flatMap(measure => measure.chords);
}

function chromaticProfile(proposal: ReharmonizationProposal, center: string) {
  const chords = flatChords(proposal);
  const reports = chords.slice(0, -1).map((chord, index) => evaluateVoiceLeadingTransition({
    previousChord: chord,
    nextChord: chords[index + 1],
    center
  }));
  const unresolved = reports.reduce((total, report) => total + report.unresolvedTendencyCount, 0);
  const guideTones = reports.reduce((total, report) => total + report.guideToneResolutionCount, 0);
  const basses = proposal.bassLine;
  let chromaticBass = 0;
  for (let i = 1; i < basses.length; i++) {
    const previous = basses[i - 1];
    const current = basses[i];
    if (!previous || !current) continue;
    const report = evaluateVoiceLeadingTransition({
      previousChord: previous,
      nextChord: current,
      center
    });
    if (report.evidence.some(item => item.includes("crom"))) chromaticBass++;
  }
  const slashCount = chords.filter(chord => chord.includes("/")).length;
  return {
    unresolved,
    guideTones,
    chromaticBass,
    slashDensity: Number((slashCount / Math.max(1, chords.length)).toFixed(2))
  };
}

function evidenceSummary(proposal: ReharmonizationProposal): string {
  return proposal.explanation
    .filter(item => (
      item.startsWith("Condução de vozes:")
      || item.startsWith("Rota harmônica:")
      || item.startsWith("Referência:")
      || item.startsWith("Ranking:")
    ))
    .slice(0, 5)
    .join("; ");
}

function auditCase(file: string): ChromaticRow[] {
  const snapshot = loadSnapshot(file);
  const harmonizable = findHarmonizableWindow(snapshot.notes, { snapshot }, snapshot.harmonies);
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
    const profile = chromaticProfile(proposal, harmonizable.phraseContext.selectedCenter.tonic);
    return {
      file,
      title: snapshot.metadata.title || file.replace(/\.musicxml$/i, ""),
      center: `${harmonizable.phraseContext.selectedCenter.tonic} ${harmonizable.phraseContext.selectedCenter.mode}`,
      rank: index + 1,
      measures: proposal.measures.map(measure => String(measure.measureIndex)).join(" "),
      role: proposal.presentationRole || "unassigned",
      layer: proposal.presentationLayer || "basic",
      name: proposal.name,
      route: proposal.routeProfile || "n/a",
      unresolved: profile.unresolved,
      guideTones: profile.guideTones,
      chromaticBass: profile.chromaticBass,
      slashDensity: profile.slashDensity,
      legibilityPenalty: proposal.chromaticLegibilityPenalty || 0,
      rankingRootAgreement: proposal.referenceRootAgreement || 0,
      referenceStatus: comparison.status,
      functionAgreement: comparison.functionAgreement,
      rootAgreement: comparison.rootAgreement,
      chords: chordSummary(proposal),
      evidence: evidenceSummary(proposal)
    };
  });
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, "\\|");
}

function csvEscape(value: string | number): string {
  const text = String(value);
  return `"${text.replace(/"/g, "\"\"")}"`;
}

function renderMarkdown(rows: ChromaticRow[]): string {
  const lines = [
    "# F77 - Auditoria de cromatismo linear",
    "",
    "Esta auditoria olha os casos `Cromatico linear` da F71. O objetivo e separar cromatismo que conduz a frase de cromatismo que apenas aumenta a complexidade da cifra.",
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
    lines.push(`- Primaria: ${primary.name}`);
    lines.push(`- Cifras: ${primary.chords}`);
    lines.push(`- Comparacao: ${primary.referenceStatus}; funcao ${Math.round(primary.functionAgreement * 100)}%; raiz ${Math.round(primary.rootAgreement * 100)}%`);
    lines.push(`- Cromatismo: ${primary.guideTones} resolucoes de guide tone; ${primary.unresolved} tendencias sem resolucao; densidade slash ${primary.slashDensity.toFixed(2)}`);
    lines.push("");
    lines.push("| Rank | Papel | Camada | Proposta | Rota | Guide tones | Tend. sem resol. | Slash | Penal. legib. | Raiz rank | Ref. | Cifras | Evidencias |");
    lines.push("| ---: | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |");
    for (const row of fileRows) {
      lines.push([
        row.rank,
        row.role,
        row.layer,
        `${row.name} [c. ${row.measures}]`,
        row.route,
        row.guideTones,
        row.unresolved,
        row.slashDensity.toFixed(2),
        row.legibilityPenalty.toFixed(2),
        row.rankingRootAgreement.toFixed(2),
        `${row.referenceStatus} ${Math.round(row.functionAgreement * 100)}%/${Math.round(row.rootAgreement * 100)}%`,
        escapeTable(row.chords),
        escapeTable(row.evidence || "-")
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
    lines.push("");
  }

  lines.push("## Proxima decisao");
  lines.push("");
  lines.push("Se a proposta cromatica tiver tendencia sem resolucao ou slash denso demais sem confirmacao da referencia, a proxima sprint deve simplificar a exibicao ou rebaixar a proposta para alternativa.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function renderCsv(rows: ChromaticRow[]): string {
  const headers: (keyof ChromaticRow)[] = [
    "file",
    "title",
    "center",
    "rank",
    "measures",
    "role",
    "layer",
    "name",
    "route",
    "unresolved",
    "guideTones",
    "chromaticBass",
    "slashDensity",
    "legibilityPenalty",
    "rankingRootAgreement",
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

export function auditChromaticCalibration(): ChromaticRow[] {
  return cases.flatMap(auditCase);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rows = auditChromaticCalibration();
  const reportPath = path.join(process.cwd(), "docs/reports/f77-chromatic-calibration-audit.md");
  const csvPath = path.join(process.cwd(), "docs/reports/f77-chromatic-calibration-audit.csv");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderMarkdown(rows));
  fs.writeFileSync(csvPath, renderCsv(rows));
  console.log(`Chromatic calibration audit complete: ${cases.length} files.`);
  console.log(`Report: ${reportPath}`);
  console.log(`CSV: ${csvPath}`);
}
