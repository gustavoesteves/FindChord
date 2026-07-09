import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { Note } from "tonal";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";
import { analyzeReferenceHarmony } from "../src/utils/music/analysis/strategies/ReferenceHarmonyAnalysis";
import { analyzeModalBorrowingColors } from "../src/utils/music/analysis/strategies/ModalBorrowingAnalysis";
import { detectIiVFunctionalCells } from "../src/utils/music/analysis/strategies/IiVFunctionalGrammar";
import {
  chordPitchClasses,
  chordRoot,
  resolveChordSymbol,
  type ChordQuality
} from "../src/utils/music/theory/ChordSymbolResolver";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

type AuditStatus = "ok" | "no-reference-harmony" | "parse-error";

export interface AppliedHarmonicVocabularySummary {
  iiVCells: number;
  appliedDominants: number;
  primaryDominants: number;
  tritoneSubstitutions: number;
  diminishedChords: number;
  resolvedDiminished: number;
  modalBorrowingColors: number;
  minorPlagalCadences: number;
  tonicMajorSixths: number;
  slashChordDensity: number;
}

export interface AppliedHarmonicVocabularyAuditRow {
  file: string;
  title: string;
  status: AuditStatus;
  referenceCenter: string;
  referenceIdiom: string;
  harmonyCount: number;
  signalScore: number;
  formulas: AppliedHarmonicVocabularySummary;
  examples: string[];
  notes: string;
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

function normalizedRoot(chord: string): string | null {
  const root = chordRoot(chord);
  return root ? Note.pitchClass(root) || root : null;
}

function chromaticDistance(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const fromChroma = Note.chroma(from);
  const toChroma = Note.chroma(to);
  if (fromChroma === undefined || toChroma === undefined) return null;
  return (toChroma - fromChroma + 12) % 12;
}

function isDominantQuality(quality: ChordQuality): boolean {
  return [
    "7",
    "9",
    "11",
    "13",
    "7sus4",
    "9sus4",
    "13sus4",
    "7alt",
    "7_sharp5",
    "7_b5",
    "7_b9",
    "7_sharp9",
    "7_sharp11",
    "7_b13",
    "7_sharp9_b13"
  ].includes(quality);
}

function isMinorQuality(quality: ChordQuality): boolean {
  return ["m", "m6", "m6_9", "m7", "m9", "m11", "mMaj7"].includes(quality);
}

function isMajorQuality(quality: ChordQuality): boolean {
  return ["maj", "maj7", "6", "6_9", "add9", "maj7_sharp11"].includes(quality);
}

function isDiminishedQuality(quality: ChordQuality): boolean {
  return quality === "dim" || quality === "dim7";
}

function orderedChords(harmonies: ScoreHarmonyEvent[]): string[] {
  return [...harmonies]
    .sort((a, b) => a.tickStart - b.tickStart)
    .map(harmony => harmony.harmony);
}

function resolvedDiminishedCount(chords: string[]): number {
  return chords.filter((chord, index) => {
    const nextRoot = normalizedRoot(chords[index + 1] || "");
    if (!nextRoot || !isDiminishedQuality(resolveChordSymbol(chord).quality)) return false;

    const nextChroma = Note.chroma(nextRoot);
    if (nextChroma === undefined) return false;
    return chordPitchClasses(chord).some(note => {
      const chroma = Note.chroma(note);
      return chroma !== undefined && (nextChroma - chroma + 12) % 12 === 1;
    });
  }).length;
}

function appliedDominantCounts(chords: string[], center: string | null): { applied: number; primary: number } {
  let applied = 0;
  let primary = 0;

  for (let index = 0; index < chords.length - 1; index++) {
    const current = resolveChordSymbol(chords[index]);
    if (!isDominantQuality(current.quality)) continue;

    const root = normalizedRoot(chords[index]);
    const targetRoot = normalizedRoot(chords[index + 1]);
    if (chromaticDistance(root, targetRoot) !== 5) continue;

    if (center && targetRoot === Note.pitchClass(center)) primary++;
    else applied++;
  }

  return { applied, primary };
}

function tritoneSubstitutionCount(chords: string[]): number {
  return chords.filter((chord, index) => {
    const nextRoot = normalizedRoot(chords[index + 1] || "");
    if (!nextRoot || !isDominantQuality(resolveChordSymbol(chord).quality)) return false;
    const root = normalizedRoot(chord);
    return chromaticDistance(nextRoot, root) === 1;
  }).length;
}

function minorPlagalCount(chords: string[], center: string | null): number {
  if (!center) return 0;
  const centerPitch = Note.pitchClass(center);
  const fourth = Note.pitchClass(Note.transpose(`${centerPitch}4`, "4P"));

  return chords.filter((chord, index) => {
    const next = chords[index + 1];
    if (!next) return false;
    const current = resolveChordSymbol(chord);
    const nextResolved = resolveChordSymbol(next);
    return normalizedRoot(chord) === fourth
      && isMinorQuality(current.quality)
      && normalizedRoot(next) === centerPitch
      && isMajorQuality(nextResolved.quality);
  }).length;
}

function tonicMajorSixthCount(chords: string[], center: string | null): number {
  if (!center) return 0;
  const centerPitch = Note.pitchClass(center);
  return chords.filter(chord => {
    const resolved = resolveChordSymbol(chord);
    return normalizedRoot(chord) === centerPitch && (resolved.quality === "6" || resolved.quality === "6_9");
  }).length;
}

export function summarizeAppliedHarmonicVocabulary(
  harmonies: ScoreHarmonyEvent[],
  center: string | null,
  mode: "major" | "minor" | null
): AppliedHarmonicVocabularySummary {
  const chords = orderedChords(harmonies);
  const dominants = appliedDominantCounts(chords, center);
  const modalColors = center && mode === "major"
    ? analyzeModalBorrowingColors(chords, { center, mode: "major", idiom: "major-functional" })
    : [];

  return {
    iiVCells: detectIiVFunctionalCells(harmonies).length,
    appliedDominants: dominants.applied,
    primaryDominants: dominants.primary,
    tritoneSubstitutions: tritoneSubstitutionCount(chords),
    diminishedChords: chords.filter(chord => isDiminishedQuality(resolveChordSymbol(chord).quality)).length,
    resolvedDiminished: resolvedDiminishedCount(chords),
    modalBorrowingColors: modalColors.length,
    minorPlagalCadences: mode === "major" ? minorPlagalCount(chords, center) : 0,
    tonicMajorSixths: mode === "major" ? tonicMajorSixthCount(chords, center) : 0,
    slashChordDensity: chords.length === 0 ? 0 : Number((chords.filter(chord => chord.includes("/")).length / chords.length).toFixed(2))
  };
}

function signalScore(formulas: AppliedHarmonicVocabularySummary): number {
  return Number((
    formulas.iiVCells * 1.2
    + formulas.appliedDominants * 1.1
    + formulas.primaryDominants * 0.6
    + formulas.tritoneSubstitutions * 1.3
    + formulas.resolvedDiminished * 1.2
    + formulas.modalBorrowingColors * 1.1
    + formulas.minorPlagalCadences * 1.4
    + formulas.tonicMajorSixths * 0.4
    + formulas.slashChordDensity * 2
  ).toFixed(2));
}

function examplesFor(chords: string[]): string[] {
  return chords
    .filter((chord, index) => index < 24 && (
      chord.includes("/")
      || isDominantQuality(resolveChordSymbol(chord).quality)
      || isDiminishedQuality(resolveChordSymbol(chord).quality)
      || ["6", "6_9", "m6"].includes(resolveChordSymbol(chord).quality)
    ))
    .slice(0, 8);
}

function notesFor(row: Pick<AppliedHarmonicVocabularyAuditRow, "formulas" | "referenceIdiom" | "harmonyCount">): string {
  if (row.harmonyCount === 0) return "Sem cifras de referencia.";
  const notes: string[] = [];
  if (row.formulas.iiVCells > 0) notes.push("cadencias ii-V detectadas");
  if (row.formulas.appliedDominants > 0) notes.push("dominantes aplicadas recorrentes");
  if (row.formulas.resolvedDiminished > 0) notes.push("diminutos com resolucao local");
  if (row.formulas.modalBorrowingColors > 0 || row.formulas.minorPlagalCadences > 0) notes.push("mistura modal funcional");
  if (row.formulas.tonicMajorSixths > 0) notes.push("cor de tonica 6/6-9");
  if (row.referenceIdiom !== "major-functional") notes.push(`leitura harmonica inferida: ${row.referenceIdiom}`);
  return notes.length > 0 ? notes.join("; ") : "Vocabulário funcional direto, sem cromatismo aplicado forte nesta leitura.";
}

export function auditAppliedHarmonicVocabularyFile(file: string): AppliedHarmonicVocabularyAuditRow {
  try {
    const snapshot = parseMusicXML(fs.readFileSync(file, "utf8"));
    const harmonies = snapshot.harmonies as ScoreHarmonyEvent[];
    if (harmonies.length === 0) {
      return {
        file: relativeMusicPath(file),
        title: snapshot.metadata.title || path.basename(file, ".musicxml"),
        status: "no-reference-harmony",
        referenceCenter: "n/a",
        referenceIdiom: "n/a",
        harmonyCount: 0,
        signalScore: 0,
        formulas: emptyFormulaSummary(),
        examples: [],
        notes: "Sem cifras de referencia."
      };
    }

    const analysis = analyzeReferenceHarmony(harmonies);
    const center = analysis.referenceCenter?.tonic || snapshot.metadata.keySignature || null;
    const mode = analysis.referenceCenter?.mode || "major";
    const formulas = summarizeAppliedHarmonicVocabulary(harmonies, center, mode);
    const row = {
      file: relativeMusicPath(file),
      title: snapshot.metadata.title || path.basename(file, ".musicxml"),
      status: "ok" as const,
      referenceCenter: center ? `${center} ${mode}` : "n/a",
      referenceIdiom: analysis.idiom?.idiom || "n/a",
      harmonyCount: harmonies.length,
      signalScore: signalScore(formulas),
      formulas,
      examples: examplesFor(orderedChords(harmonies)),
      notes: ""
    };
    return { ...row, notes: notesFor(row) };
  } catch (error) {
    return {
      file: relativeMusicPath(file),
      title: path.basename(file, ".musicxml"),
      status: "parse-error",
      referenceCenter: "n/a",
      referenceIdiom: "n/a",
      harmonyCount: 0,
      signalScore: 0,
      formulas: emptyFormulaSummary(),
      examples: [],
      notes: error instanceof Error ? error.message : "Erro desconhecido."
    };
  }
}

function emptyFormulaSummary(): AppliedHarmonicVocabularySummary {
  return {
    iiVCells: 0,
    appliedDominants: 0,
    primaryDominants: 0,
    tritoneSubstitutions: 0,
    diminishedChords: 0,
    resolvedDiminished: 0,
    modalBorrowingColors: 0,
    minorPlagalCadences: 0,
    tonicMajorSixths: 0,
    slashChordDensity: 0
  };
}

export function auditAppliedHarmonicVocabularyCorpus(files = allMusicXmlFiles()): AppliedHarmonicVocabularyAuditRow[] {
  return files.map(auditAppliedHarmonicVocabularyFile);
}

function csvEscape(value: string | number): string {
  const text = String(value);
  return `"${text.replace(/"/g, "\"\"")}"`;
}

function renderCsv(rows: AppliedHarmonicVocabularyAuditRow[]): string {
  const headers = [
    "file",
    "title",
    "status",
    "referenceCenter",
    "referenceIdiom",
    "harmonyCount",
    "signalScore",
    "iiVCells",
    "appliedDominants",
    "primaryDominants",
    "tritoneSubstitutions",
    "diminishedChords",
    "resolvedDiminished",
    "modalBorrowingColors",
    "minorPlagalCadences",
    "tonicMajorSixths",
    "slashChordDensity",
    "examples",
    "notes"
  ];

  return [
    headers.map(csvEscape).join(","),
    ...rows.map(row => [
      row.file,
      row.title,
      row.status,
      row.referenceCenter,
      row.referenceIdiom,
      row.harmonyCount,
      row.signalScore,
      row.formulas.iiVCells,
      row.formulas.appliedDominants,
      row.formulas.primaryDominants,
      row.formulas.tritoneSubstitutions,
      row.formulas.diminishedChords,
      row.formulas.resolvedDiminished,
      row.formulas.modalBorrowingColors,
      row.formulas.minorPlagalCadences,
      row.formulas.tonicMajorSixths,
      row.formulas.slashChordDensity,
      row.examples.join(" / "),
      row.notes
    ].map(csvEscape).join(","))
  ].join("\n") + "\n";
}

function renderMarkdown(rows: AppliedHarmonicVocabularyAuditRow[]): string {
  const okRows = rows.filter(row => row.status === "ok");
  const topRows = [...okRows].sort((a, b) => b.signalScore - a.signalScore).slice(0, 20);
  const totals = okRows.reduce((sum, row) => ({
    iiVCells: sum.iiVCells + row.formulas.iiVCells,
    appliedDominants: sum.appliedDominants + row.formulas.appliedDominants,
    primaryDominants: sum.primaryDominants + row.formulas.primaryDominants,
    tritoneSubstitutions: sum.tritoneSubstitutions + row.formulas.tritoneSubstitutions,
    diminishedChords: sum.diminishedChords + row.formulas.diminishedChords,
    resolvedDiminished: sum.resolvedDiminished + row.formulas.resolvedDiminished,
    modalBorrowingColors: sum.modalBorrowingColors + row.formulas.modalBorrowingColors,
    minorPlagalCadences: sum.minorPlagalCadences + row.formulas.minorPlagalCadences,
    tonicMajorSixths: sum.tonicMajorSixths + row.formulas.tonicMajorSixths
  }), {
    iiVCells: 0,
    appliedDominants: 0,
    primaryDominants: 0,
    tritoneSubstitutions: 0,
    diminishedChords: 0,
    resolvedDiminished: 0,
    modalBorrowingColors: 0,
    minorPlagalCadences: 0,
    tonicMajorSixths: 0
  });

  const lines = [
    "# F86 - Auditoria de vocabulario harmonico aplicado",
    "",
    "Esta auditoria usa a parte aplicada do Almada como lente teorica, sem classificar genero ou estilo musical.",
    "",
    "O objetivo e separar obras que contem formulas harmonicas relevantes para investigar depois: ii-V, dominantes aplicadas, SubV, diminutos resolvidos, emprestimos modais, cadencia plagal menor, tonicas 6/6-9 e baixos indicados.",
    "",
    "## Resumo",
    "",
    `- Arquivos lidos: ${rows.length}`,
    `- Arquivos com cifras de referencia: ${okRows.length}`,
    `- Arquivos sem cifras: ${rows.filter(row => row.status === "no-reference-harmony").length}`,
    `- Arquivos com erro de parse: ${rows.filter(row => row.status === "parse-error").length}`,
    `- Celulas ii-V detectadas: ${totals.iiVCells}`,
    `- Dominantes aplicadas: ${totals.appliedDominants}`,
    `- Dominantes primarias: ${totals.primaryDominants}`,
    `- SubV/resolucoes por semitom: ${totals.tritoneSubstitutions}`,
    `- Diminutos: ${totals.diminishedChords} (${totals.resolvedDiminished} resolvidos localmente)`,
    `- Cores bVI/bVII: ${totals.modalBorrowingColors}`,
    `- Cadencias plagais menores: ${totals.minorPlagalCadences}`,
    `- Tonicas 6/6-9: ${totals.tonicMajorSixths}`,
    "",
    "## Obras mais promissoras para investigacao harmonica",
    "",
    "| Rank | Arquivo | Centro | Leitura harm. | Score | ii-V | Dom. apl. | SubV | Dim. res. | Modal | Plagal m. | 6/6-9 | Slash | Exemplos | Nota |",
    "| ---: | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |"
  ];

  for (const [index, row] of topRows.entries()) {
    lines.push([
      index + 1,
      row.file,
      row.referenceCenter,
      row.referenceIdiom,
      row.signalScore,
      row.formulas.iiVCells,
      row.formulas.appliedDominants,
      row.formulas.tritoneSubstitutions,
      row.formulas.resolvedDiminished,
      row.formulas.modalBorrowingColors,
      row.formulas.minorPlagalCadences,
      row.formulas.tonicMajorSixths,
      row.formulas.slashChordDensity.toFixed(2),
      row.examples.join(" / ") || "-",
      row.notes
    ].map(cell => String(cell).replace(/\|/g, "\\|")).join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  lines.push("");
  lines.push("## Decisao de uso");
  lines.push("");
  lines.push("Este relatorio nao deve virar regra de geracao direta. Ele serve para escolher obras e trechos para escuta/auditoria quando quisermos enriquecer o motor com vocabulario harmonico real sem depender de etiquetas de genero.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

export function writeAppliedHarmonicVocabularyAudit(rows = auditAppliedHarmonicVocabularyCorpus()): void {
  const reportPath = path.join(process.cwd(), "docs/reports/f86-applied-harmonic-vocabulary-audit.md");
  const csvPath = path.join(process.cwd(), "docs/reports/f86-applied-harmonic-vocabulary-audit.csv");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderMarkdown(rows));
  fs.writeFileSync(csvPath, renderCsv(rows));
  console.log(`Applied harmonic vocabulary audit complete: ${rows.length} files.`);
  console.log(`Report: ${reportPath}`);
  console.log(`CSV: ${csvPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeAppliedHarmonicVocabularyAudit();
}
