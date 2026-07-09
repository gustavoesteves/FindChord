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
  "b-037-Blueberry hill.musicxml",
  "a-039-Another Time.musicxml",
  "e-008-Eighty one.musicxml"
];

interface BassRow {
  file: string;
  title: string;
  center: string;
  rank: number;
  measures: string;
  role: string;
  layer: string;
  name: string;
  route: string;
  bassProfile: string;
  bassBonus: number;
  slashDensity: number;
  referenceStatus: string;
  functionAgreement: number;
  rootAgreement: number;
  chords: string;
  bassLine: string;
  evidence: string;
}

function loadSnapshot(file: string): any {
  const fullPath = path.join(process.cwd(), "docs/musics/imported-real-book", file);
  return parseMusicXML(fs.readFileSync(fullPath, "utf8"));
}

function flatChords(proposal: ReharmonizationProposal): string[] {
  return proposal.measures.flatMap(measure => measure.chords);
}

function slashDensity(proposal: ReharmonizationProposal): number {
  const chords = flatChords(proposal);
  if (chords.length === 0) return 0;
  return Number((chords.filter(chord => chord.includes("/")).length / chords.length).toFixed(2));
}

function chordSummary(proposal: ReharmonizationProposal): string {
  return proposal.measures.map(measure => measure.chords.join(" / ")).join(" | ");
}

function evidenceSummary(proposal: ReharmonizationProposal): string {
  return proposal.explanation
    .filter(item => (
      item.startsWith("Linha de baixo:")
      || item.startsWith("Condução de vozes:")
      || item.startsWith("Rota harmônica:")
      || item.startsWith("Referência:")
      || item.startsWith("Ranking:")
    ))
    .slice(0, 5)
    .join("; ");
}

function auditCase(file: string): BassRow[] {
  const snapshot = loadSnapshot(file);
  const harmonizable = findHarmonizableWindow(snapshot.notes, snapshot.metadata.keySignature, snapshot.harmonies);
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
      rank: index + 1,
      measures: proposal.measures.map(measure => String(measure.measureIndex)).join(" "),
      role: proposal.presentationRole || "unassigned",
      layer: proposal.presentationLayer || "basic",
      name: proposal.name,
      route: proposal.routeProfile || "n/a",
      bassProfile: proposal.bassLineProfile || "n/a",
      bassBonus: proposal.bassLineRankBonus || 0,
      slashDensity: slashDensity(proposal),
      referenceStatus: comparison.status,
      functionAgreement: comparison.functionAgreement,
      rootAgreement: comparison.rootAgreement,
      chords: chordSummary(proposal),
      bassLine: proposal.bassLine.join(" -> "),
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

function renderMarkdown(rows: BassRow[]): string {
  const lines = [
    "# F78 - Auditoria de contraponto de baixo",
    "",
    "Esta auditoria olha os casos `Contraponto de baixo` da F71. O objetivo e conferir se as inversoes suavizam a progressao sem esconder a funcao harmonica.",
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
    lines.push(`- Baixo: ${primary.bassLine}`);
    lines.push(`- Perfil de baixo: ${primary.bassProfile}; bonus ${primary.bassBonus.toFixed(2)}; slash ${primary.slashDensity.toFixed(2)}`);
    lines.push(`- Comparacao: ${primary.referenceStatus}; funcao ${Math.round(primary.functionAgreement * 100)}%; raiz ${Math.round(primary.rootAgreement * 100)}%`);
    lines.push("");
    lines.push("| Rank | Papel | Camada | Proposta | Rota | Baixo | Bonus | Slash | Ref. | Cifras | Linha de baixo | Evidencias |");
    lines.push("| ---: | --- | --- | --- | --- | --- | ---: | ---: | --- | --- | --- | --- |");
    for (const row of fileRows) {
      lines.push([
        row.rank,
        row.role,
        row.layer,
        `${row.name} [c. ${row.measures}]`,
        row.route,
        row.bassProfile,
        row.bassBonus.toFixed(2),
        row.slashDensity.toFixed(2),
        `${row.referenceStatus} ${Math.round(row.functionAgreement * 100)}%/${Math.round(row.rootAgreement * 100)}%`,
        escapeTable(row.chords),
        row.bassLine,
        escapeTable(row.evidence || "-")
      ].join(" | ").replace(/^/, "| ").replace(/$/, " |"));
    }
    lines.push("");
  }

  lines.push("## Proxima decisao");
  lines.push("");
  lines.push("Se a inversao mantiver funcao, melhorar continuidade e nao elevar demais a densidade de slash, ela pode continuar primaria. Se o baixo esconder a funcao ou gerar saltos/sobreposicoes artificiais, deve virar alternativa.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

function renderCsv(rows: BassRow[]): string {
  const headers: (keyof BassRow)[] = [
    "file",
    "title",
    "center",
    "rank",
    "measures",
    "role",
    "layer",
    "name",
    "route",
    "bassProfile",
    "bassBonus",
    "slashDensity",
    "referenceStatus",
    "functionAgreement",
    "rootAgreement",
    "chords",
    "bassLine",
    "evidence"
  ];
  return [
    headers.map(csvEscape).join(","),
    ...rows.map(row => headers.map(header => csvEscape(row[header])).join(","))
  ].join("\n") + "\n";
}

export function auditBassCalibration(): BassRow[] {
  return cases.flatMap(auditCase);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rows = auditBassCalibration();
  const reportPath = path.join(process.cwd(), "docs/reports/f78-bass-calibration-audit.md");
  const csvPath = path.join(process.cwd(), "docs/reports/f78-bass-calibration-audit.csv");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderMarkdown(rows));
  fs.writeFileSync(csvPath, renderCsv(rows));
  console.log(`Bass calibration audit complete: ${cases.length} files.`);
  console.log(`Report: ${reportPath}`);
  console.log(`CSV: ${csvPath}`);
}
