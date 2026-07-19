import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { analyzeProposalCurationForFile, proposalCurationMusicXmlFiles } from "./audit-proposal-curation";
import {
  summarizeAppliedHarmonicVocabulary,
  type AppliedHarmonicVocabularySummary
} from "./audit-applied-harmonic-vocabulary";

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
  melodyDerivedDenseIdeaCount: number;
  referenceDerivedDenseIdeaCount: number;
  maximumGeneratedDensity: number;
  maximumMelodyDerivedDensity: number;
  referenceVocabularyLabel: string;
  status: "sem-referencia" | "referencia-contida" | "referencia-densa-coberta" | "lacuna-de-densidade";
  melodyDensityStatus:
    | "sem-referencia"
    | "referencia-sem-densidade"
    | "densidade-gerada-pela-melodia"
    | "densidade-apenas-referencia"
    | "lacuna-de-densidade";
}

function density(chordCount: number, measureCount: number): number {
  return measureCount === 0 ? 0 : Number((chordCount / measureCount).toFixed(2));
}

function proposalDensity(proposal: { measures: { chords: string[] }[] }): number {
  const chordCount = proposal.measures.reduce((sum, measure) => sum + measure.chords.length, 0);
  return density(chordCount, proposal.measures.length);
}

function isReferenceDerivedDensity(proposal: { id: string }): boolean {
  return proposal.id === "controlled-reference-rhythm" || proposal.id === "controlled-reference-contour";
}

function hasInternalDensity(proposal: { measures: { chords: string[] }[] }): boolean {
  return proposal.measures.some(measure => measure.chords.length > 1);
}

function referenceVocabularyLabel(summary: AppliedHarmonicVocabularySummary): string {
  const labels: string[] = [];
  if (summary.iiVCells > 0) labels.push(`${summary.iiVCells} ii-V`);
  if (summary.appliedDominants > 0) labels.push(`${summary.appliedDominants} dom. apl.`);
  if (summary.primaryDominants > 0) labels.push(`${summary.primaryDominants} dom. prim.`);
  if (summary.tritoneSubstitutions > 0) labels.push(`${summary.tritoneSubstitutions} SubV`);
  if (summary.resolvedDiminished > 0) labels.push(`${summary.resolvedDiminished} dim. res.`);
  if (summary.modalBorrowingColors > 0) labels.push(`${summary.modalBorrowingColors} modal`);
  if (summary.minorPlagalCadences > 0) labels.push(`${summary.minorPlagalCadences} plagal m.`);
  if (summary.tonicMajorSixths > 0) labels.push(`${summary.tonicMajorSixths} tonica 6`);
  if (summary.slashChordDensity >= 0.25) labels.push(`slash ${summary.slashChordDensity}`);
  return labels.length > 0 ? labels.join(", ") : "funcional direto";
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
  const referenceVocabulary = summarizeAppliedHarmonicVocabulary(
    snapshot.harmonies,
    analysis.center,
    analysis.classificationMode === "minor-functional" ? "minor" : "major"
  );
  const generatedIdeas = analysis.visibleIdeas
    .filter(idea => idea.origin === "main" && idea.proposal.kind !== "reference")
    .flatMap(idea => [idea.proposal, ...(idea.proposal.colorVariants || [])]);
  const melodyDerivedIdeas = generatedIdeas.filter(proposal => !isReferenceDerivedDensity(proposal));
  const referenceDerivedIdeas = generatedIdeas.filter(isReferenceDerivedDensity);
  const generatedDensities = generatedIdeas.map(proposalDensity);
  const melodyDerivedDensities = melodyDerivedIdeas.map(proposalDensity);
  const generatedDenseIdeaCount = generatedIdeas.filter(hasInternalDensity).length;
  const melodyDerivedDenseIdeaCount = melodyDerivedIdeas.filter(hasInternalDensity).length;
  const referenceDerivedDenseIdeaCount = referenceDerivedIdeas.filter(hasInternalDensity).length;
  const maximumGeneratedDensity = generatedDensities.length > 0 ? Math.max(...generatedDensities) : 0;
  const maximumMelodyDerivedDensity = melodyDerivedDensities.length > 0 ? Math.max(...melodyDerivedDensities) : 0;
  const status = referenceMeasureCount === 0
    ? "sem-referencia"
    : referenceDenseMeasures === 0
      ? "referencia-contida"
      : generatedDenseIdeaCount > 0
        ? "referencia-densa-coberta"
        : "lacuna-de-densidade";
  const melodyDensityStatus = referenceMeasureCount === 0
    ? "sem-referencia"
    : referenceDenseMeasures === 0
      ? "referencia-sem-densidade"
      : melodyDerivedDenseIdeaCount > 0
        ? "densidade-gerada-pela-melodia"
        : referenceDerivedDenseIdeaCount > 0
          ? "densidade-apenas-referencia"
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
    melodyDerivedDenseIdeaCount,
    referenceDerivedDenseIdeaCount,
    maximumGeneratedDensity,
    maximumMelodyDerivedDensity,
    referenceVocabularyLabel: referenceVocabularyLabel(referenceVocabulary),
    status,
    melodyDensityStatus
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
    "melodyDerivedDenseIdeaCount", "referenceDerivedDenseIdeaCount", "maximumGeneratedDensity",
    "maximumMelodyDerivedDensity", "referenceVocabularyLabel", "status", "melodyDensityStatus"
  ];
  return [
    headers.map(csvEscape).join(","),
    ...rows.map(row => headers.map(header => csvEscape(row[header])).join(","))
  ].join("\n") + "\n";
}

function renderMarkdown(rows: HarmonizationDensityRow[]): string {
  const denseReference = rows.filter(row => row.referenceDenseMeasures > 0);
  const gaps = rows.filter(row => row.status === "lacuna-de-densidade");
  const melodyCovered = denseReference.filter(row => row.melodyDensityStatus === "densidade-gerada-pela-melodia");
  const referenceOnly = denseReference.filter(row => row.melodyDensityStatus === "densidade-apenas-referencia");
  const melodyGaps = denseReference.filter(row => row.melodyDensityStatus === "lacuna-de-densidade");
  const nextRefinements = [...melodyGaps, ...referenceOnly]
    .sort((a, b) => (
      b.referenceDenseMeasures - a.referenceDenseMeasures
      || b.referenceDensity - a.referenceDensity
      || a.file.localeCompare(b.file)
    ))
    .slice(0, 30);
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
    `- Densidade sugerida por propostas da melodia: ${melodyCovered.length}`,
    `- Densidade coberta apenas por contorno/ritmo da referencia: ${referenceOnly.length}`,
    `- Lacunas de densidade na leitura melodica: ${melodyGaps.length}`,
    `- Partituras sem referencia: ${rows.filter(row => row.status === "sem-referencia").length}`,
    "",
    "## Casos densos",
    "",
    "| Arquivo | Ref. | Densidade | Comp. densos | Ideias | Densas | Melodia | Ref. | Max. melodia | Leitura |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |"
  ];
  for (const row of denseReference) {
    lines.push(`| ${[
      row.file,
      row.referenceChordCount,
      row.referenceDensity,
      row.referenceDenseMeasures,
      row.generatedIdeaCount,
      row.generatedDenseIdeaCount,
      row.melodyDerivedDenseIdeaCount,
      row.referenceDerivedDenseIdeaCount,
      row.maximumMelodyDerivedDensity,
      row.melodyDensityStatus
    ].join(" | ")} |`);
  }
  lines.push(
    "",
    "## Fila de refinamento",
    "",
    "| Arquivo | Leitura | Comp. densos | Densidade ref. | Vocabulário da referência |",
    "| --- | --- | ---: | ---: | --- |"
  );
  for (const row of nextRefinements) {
    lines.push(`| ${[
      row.file,
      row.melodyDensityStatus,
      row.referenceDenseMeasures,
      row.referenceDensity,
      row.referenceVocabularyLabel
    ].join(" | ")} |`);
  }
  lines.push(
    "",
    "## Leitura",
    "",
    "A baixa densidade continua sendo a resposta correta para melodias simples como Asa Branca. Os casos densos devem receber uma alternativa controlada, validada pela cobertura melódica e pela condução de vozes, sem substituir a proposta básica.",
    "A coluna Melodia separa densidade realmente proposta pelo motor a partir da melodia; a coluna Ref. separa densidade preservada por contorno ou ritmo da harmonia escrita. Essa distincao evita confundir acompanhamento fiel da partitura com vocabulario interno do harmonizador.",
    "O CSV contém o catálogo completo para revisão dos casos que justificam a próxima camada de geração interna por compasso.",
    ""
  );
  return lines.join("\n");
}

export function writeHarmonizationDensityAudit(rows = collectHarmonizationDensityAudit()): void {
  const reportPath = path.join(process.cwd(), "docs/reports/f113-harmonization-density.md");
  const csvPath = path.join(process.cwd(), "docs/reports/f113-harmonization-density.csv");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderMarkdown(rows));
  fs.writeFileSync(csvPath, renderCsv(rows));
}
