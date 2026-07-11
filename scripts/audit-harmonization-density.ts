import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { analyzeProposalCurationForFile, proposalCurationMusicXmlFiles } from "./audit-proposal-curation";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");
const MUSIC_DIR = path.join(process.cwd(), "docs/musics");

export interface HarmonizationDensityRow {
  file: string;
  title: string;
  referenceChordCount: number;
  referenceMeasureCount: number;
  referenceDensity: number;
  referenceDenseMeasures: number;
  generatedIdeaCount: number;
  generatedDenseIdeaCount: number;
  maximumGeneratedDensity: number;
  status: "sem-referencia" | "referencia-contida" | "referencia-densa-coberta" | "lacuna-de-densidade";
}

function density(chordCount: number, measureCount: number): number {
  return measureCount === 0 ? 0 : Number((chordCount / measureCount).toFixed(2));
}

function proposalDensity(proposal: { measures: { chords: string[] }[] }): number {
  const chordCount = proposal.measures.reduce((sum, measure) => sum + measure.chords.length, 0);
  return density(chordCount, proposal.measures.length);
}

export function auditHarmonizationDensityForFile(file: string): HarmonizationDensityRow {
  const snapshot = parseMusicXML(fs.readFileSync(path.join(MUSIC_DIR, file), "utf8"));
  const referenceByMeasure = new Map<number, number>();
  for (const harmony of snapshot.harmonies) {
    referenceByMeasure.set(harmony.measure, (referenceByMeasure.get(harmony.measure) || 0) + 1);
  }
  const referenceChordCount = snapshot.harmonies.length;
  const referenceMeasureCount = referenceByMeasure.size;
  const referenceDenseMeasures = Array.from(referenceByMeasure.values()).filter(count => count > 1).length;
  const referenceDensity = density(referenceChordCount, referenceMeasureCount);
  const analysis = analyzeProposalCurationForFile(file);
  const generatedIdeas = analysis.visibleIdeas
    .filter(idea => idea.origin === "main" && idea.proposal.kind !== "reference")
    .flatMap(idea => [idea.proposal, ...(idea.proposal.colorVariants || [])]);
  const generatedDensities = generatedIdeas.map(proposalDensity);
  const generatedDenseIdeaCount = generatedIdeas.filter(candidate => (
    candidate.measures.some(measure => measure.chords.length > 1)
  )).length;
  const maximumGeneratedDensity = generatedDensities.length > 0 ? Math.max(...generatedDensities) : 0;
  const status = referenceMeasureCount === 0
    ? "sem-referencia"
    : referenceDenseMeasures === 0
      ? "referencia-contida"
      : generatedDenseIdeaCount > 0
        ? "referencia-densa-coberta"
        : "lacuna-de-densidade";

  return {
    file,
    title: snapshot.metadata.title || path.basename(file, ".musicxml"),
    referenceChordCount,
    referenceMeasureCount,
    referenceDensity,
    referenceDenseMeasures,
    generatedIdeaCount: generatedIdeas.length,
    generatedDenseIdeaCount,
    maximumGeneratedDensity,
    status
  };
}

export function collectHarmonizationDensityAudit(): HarmonizationDensityRow[] {
  return proposalCurationMusicXmlFiles().map(auditHarmonizationDensityForFile);
}

function csvEscape(value: string | number): string {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function renderCsv(rows: HarmonizationDensityRow[]): string {
  const headers: (keyof HarmonizationDensityRow)[] = [
    "file", "title", "referenceChordCount", "referenceMeasureCount", "referenceDensity",
    "referenceDenseMeasures", "generatedIdeaCount", "generatedDenseIdeaCount",
    "maximumGeneratedDensity", "status"
  ];
  return [
    headers.map(csvEscape).join(","),
    ...rows.map(row => headers.map(header => csvEscape(row[header])).join(","))
  ].join("\n") + "\n";
}

function renderMarkdown(rows: HarmonizationDensityRow[]): string {
  const denseReference = rows.filter(row => row.referenceDenseMeasures > 0);
  const gaps = rows.filter(row => row.status === "lacuna-de-densidade");
  const lines = [
    "# F113 - Auditoria de densidade harmonica",
    "",
    "A auditoria compara a densidade da referencia escrita com a capacidade das propostas geradas de usar mais de uma cifra no mesmo compasso.",
    "",
    "## Resumo",
    "",
    `- Partituras analisadas: ${rows.length}`,
    `- Referencias com mais de uma cifra em algum compasso: ${denseReference.length}`,
    `- Lacunas de densidade detectadas: ${gaps.length}`,
    `- Partituras sem referencia: ${rows.filter(row => row.status === "sem-referencia").length}`,
    "",
    "## Casos densos",
    "",
    "| Arquivo | Ref. | Densidade | Comp. densos | Ideias | Ideias densas | Max. gerada | Estado |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];
  for (const row of denseReference) {
    lines.push(`| ${[
      row.file,
      row.referenceChordCount,
      row.referenceDensity,
      row.referenceDenseMeasures,
      row.generatedIdeaCount,
      row.generatedDenseIdeaCount,
      row.maximumGeneratedDensity,
      row.status
    ].join(" | ")} |`);
  }
  lines.push("", "## Leitura", "", "A baixa densidade continua sendo a resposta correta para melodias simples como Asa Branca. Os casos densos devem receber uma alternativa controlada, validada pela cobertura melódica e pela condução de vozes, sem substituir a proposta básica.", "O CSV contém o catálogo completo para revisão dos casos que justificam a próxima camada de geração interna por compasso.", "");
  return lines.join("\n");
}

export function writeHarmonizationDensityAudit(rows = collectHarmonizationDensityAudit()): void {
  const reportPath = path.join(process.cwd(), "docs/reports/f113-harmonization-density.md");
  const csvPath = path.join(process.cwd(), "docs/reports/f113-harmonization-density.csv");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderMarkdown(rows));
  fs.writeFileSync(csvPath, renderCsv(rows));
}
