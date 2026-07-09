import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { Note } from "tonal";
import type { ScoreHarmonyEvent, ScoreNoteEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";
import { analyzeDominantResolution } from "../src/utils/music/analysis/strategies/DominantResolutionAnalysis";
import { analyzeDominantTension } from "../src/utils/music/analysis/strategies/DominantTensionAnalysis";
import { analyzeReferenceHarmony } from "../src/utils/music/analysis/strategies/ReferenceHarmonyAnalysis";
import { chordRoot, resolveChordSymbol } from "../src/utils/music/theory/ChordSymbolResolver";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

export type MelodyReviewClass =
  | "melody-supports-dominant"
  | "melody-supports-side-arrival"
  | "melody-ambiguous"
  | "melody-weak-evidence"
  | "no-melody-data";

export type SideArrivalRelation =
  | "no-side-arrival"
  | "target-lower-chromatic-neighbor"
  | "target-upper-chromatic-neighbor"
  | "target-lower-whole-neighbor"
  | "target-upper-whole-neighbor"
  | "target-plagal-region"
  | "target-dominant-region"
  | "target-tritone-region"
  | "remote-side-arrival";

export interface UnresolvedDominantMelodyCase {
  file: string;
  title: string;
  measure: number;
  chord: string;
  expectedTarget: string;
  sideArrivalRoot: string;
  sideArrivalRelation: SideArrivalRelation;
  nextChords: string[];
  melodyPitches: string[];
  dominantCoverage: number;
  sideArrivalCoverage: number;
  targetRootCoverage: number;
  reviewClass: MelodyReviewClass;
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

function orderedHarmonies(harmonies: ScoreHarmonyEvent[]): ScoreHarmonyEvent[] {
  return [...harmonies].sort((a, b) => a.tickStart - b.tickStart);
}

function noteName(note: ScoreNoteEvent): string {
  const accidental = note.alter === 1 ? "#" : note.alter === -1 ? "b" : "";
  return `${note.step}${accidental}`;
}

function pitchClass(note: string): string | null {
  return Note.pitchClass(note) || null;
}

function pitchSet(notes: string[]): Set<string> {
  return new Set(notes.map(pitchClass).filter((item): item is string => !!item));
}

function expectedDominantTarget(chord: string): string {
  const root = chordRoot(chord);
  return root ? Note.pitchClass(Note.transpose(`${root}4`, "4P")) || "n/a" : "n/a";
}

function pitchDistance(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const fromChroma = Note.chroma(from);
  const toChroma = Note.chroma(to);
  if (fromChroma === undefined || toChroma === undefined) return null;
  return (toChroma - fromChroma + 12) % 12;
}

function sideArrivalRelation(expectedTarget: string, sideArrivalRoot: string): SideArrivalRelation {
  const distance = pitchDistance(expectedTarget, sideArrivalRoot);
  if (distance === null) return "no-side-arrival";
  if (distance === 11) return "target-lower-chromatic-neighbor";
  if (distance === 1) return "target-upper-chromatic-neighbor";
  if (distance === 10) return "target-lower-whole-neighbor";
  if (distance === 2) return "target-upper-whole-neighbor";
  if (distance === 5) return "target-plagal-region";
  if (distance === 7) return "target-dominant-region";
  if (distance === 6) return "target-tritone-region";
  return "remote-side-arrival";
}

function overlappingNotes(notes: ScoreNoteEvent[], harmony: ScoreHarmonyEvent): ScoreNoteEvent[] {
  return notes.filter(note => note.tickStart < harmony.tickEnd && note.tickEnd > harmony.tickStart);
}

function coverage(melody: string[], supported: Set<string>): number {
  if (melody.length === 0 || supported.size === 0) return 0;
  const supportedCount = melody.filter(note => {
    const pc = pitchClass(note);
    return !!pc && supported.has(pc);
  }).length;
  return Number((supportedCount / melody.length).toFixed(2));
}

function classifyMelodySupport(
  melodyPitches: string[],
  dominantCoverage: number,
  sideArrivalCoverage: number,
  targetRootCoverage: number
): { reviewClass: MelodyReviewClass; notes: string } {
  if (melodyPitches.length === 0) {
    return {
      reviewClass: "no-melody-data",
      notes: "Sem notas melodicas importadas durante a dominante."
    };
  }

  if (dominantCoverage >= 0.6 && sideArrivalCoverage >= 0.6) {
    return {
      reviewClass: "melody-ambiguous",
      notes: "A melodia cabe tanto na dominante quanto na chegada lateral; exige escuta local."
    };
  }

  if (sideArrivalCoverage >= 0.6 && targetRootCoverage === 0) {
    return {
      reviewClass: "melody-supports-side-arrival",
      notes: "A melodia sustenta melhor a chegada lateral do que o alvo funcional esperado."
    };
  }

  if (dominantCoverage >= 0.6) {
    return {
      reviewClass: "melody-supports-dominant",
      notes: "A melodia sustenta a sonoridade da dominante alterada, mesmo sem alvo local claro."
    };
  }

  return {
    reviewClass: "melody-weak-evidence",
    notes: "A melodia nao oferece suporte forte para liberar a dominante automaticamente."
  };
}

export function collectUnresolvedDominantMelodyCasesFromScore(
  harmonies: ScoreHarmonyEvent[],
  notes: ScoreNoteEvent[],
  metadata: { file: string; title: string }
): UnresolvedDominantMelodyCase[] {
  const ordered = orderedHarmonies(harmonies);
  const chords = ordered.map(harmony => harmony.harmony);

  return ordered.flatMap((harmony, index) => {
    const tension = analyzeDominantTension(harmony.harmony);
    if (!tension.isDominant || tension.score < 3) return [];

    const resolution = analyzeDominantResolution(chords, index);
    if (resolution.kind !== "unresolved") return [];

    const melodyPitches = Array.from(new Set(overlappingNotes(notes, harmony).map(noteName)));
    const expectedTarget = expectedDominantTarget(harmony.harmony);
    const nextChords = chords.slice(index + 1, index + 5);
    const nextChord = nextChords[0];
    const sideArrivalRoot = nextChord ? (chordRoot(nextChord) || "n/a") : "n/a";

    const dominantCoverage = coverage(melodyPitches, pitchSet(resolveChordSymbol(harmony.harmony).notes));
    const sideArrivalCoverage = nextChord
      ? coverage(melodyPitches, pitchSet(resolveChordSymbol(nextChord).notes))
      : 0;
    const targetRootCoverage = coverage(melodyPitches, pitchSet([expectedTarget]));
    const review = classifyMelodySupport(
      melodyPitches,
      dominantCoverage,
      sideArrivalCoverage,
      targetRootCoverage
    );

    return [{
      file: metadata.file,
      title: metadata.title,
      measure: harmony.measure,
      chord: harmony.harmony,
      expectedTarget,
      sideArrivalRoot,
      sideArrivalRelation: sideArrivalRelation(expectedTarget, sideArrivalRoot),
      nextChords,
      melodyPitches,
      dominantCoverage,
      sideArrivalCoverage,
      targetRootCoverage,
      reviewClass: review.reviewClass,
      notes: review.notes
    }];
  });
}

export function collectUnresolvedDominantMelodyCases(files = allMusicXmlFiles()): UnresolvedDominantMelodyCase[] {
  return files.flatMap(file => {
    const snapshot = parseMusicXML(fs.readFileSync(file, "utf8"));
    const harmonies = snapshot.harmonies as ScoreHarmonyEvent[];
    const notes = (snapshot.notes || []) as ScoreNoteEvent[];
    if (harmonies.length === 0) return [];

    analyzeReferenceHarmony(harmonies);
    return collectUnresolvedDominantMelodyCasesFromScore(harmonies, notes, {
      file: relativeMusicPath(file),
      title: snapshot.metadata.title || path.basename(file, ".musicxml")
    });
  });
}

function csvEscape(value: string | number): string {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function renderCsv(cases: UnresolvedDominantMelodyCase[]): string {
  const headers = [
    "file",
    "title",
    "measure",
    "chord",
    "expectedTarget",
    "sideArrivalRoot",
    "sideArrivalRelation",
    "nextChords",
    "melodyPitches",
    "dominantCoverage",
    "sideArrivalCoverage",
    "targetRootCoverage",
    "reviewClass",
    "notes"
  ];

  return [
    headers.map(csvEscape).join(","),
    ...cases.map(item => [
      item.file,
      item.title,
      item.measure,
      item.chord,
      item.expectedTarget,
      item.sideArrivalRoot,
      item.sideArrivalRelation,
      item.nextChords.join(" / "),
      item.melodyPitches.join(" "),
      item.dominantCoverage,
      item.sideArrivalCoverage,
      item.targetRootCoverage,
      item.reviewClass,
      item.notes
    ].map(csvEscape).join(","))
  ].join("\n") + "\n";
}

function renderMarkdown(cases: UnresolvedDominantMelodyCase[]): string {
  const byClass = cases.reduce<Record<string, number>>((sum, item) => ({
    ...sum,
    [item.reviewClass]: (sum[item.reviewClass] || 0) + 1
  }), {});
  const byRelation = cases.reduce<Record<string, number>>((sum, item) => ({
    ...sum,
    [item.sideArrivalRelation]: (sum[item.sideArrivalRelation] || 0) + 1
  }), {});
  const classLines = Object.entries(byClass)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `- ${name}: ${count}`);
  const relationLines = Object.entries(byRelation)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `- ${name}: ${count}`);

  const lines = [
    "# F98 - Triagem melodica das dominantes alteradas sem alvo local",
    "",
    "Este relatorio observa apenas os casos que continuam `unresolved` apos F97.",
    "",
    "A leitura nao libera cromatismo automaticamente. Ela mede se a melodia, durante a dominante, apoia mais a propria dominante, a chegada lateral seguinte ou nenhum dos dois com forca suficiente.",
    "",
    "## Resumo",
    "",
    `- Casos analisados: ${cases.length}`,
    ...classLines,
    "",
    "## Relação da chegada lateral com o alvo esperado",
    "",
    ...relationLines,
    "",
    "## Casos",
    "",
    "| # | Arquivo | Comp. | Acorde | Alvo esp. | Chegada | Relação | Próximos acordes | Melodia | Cob. dom. | Cob. chegada | Cob. alvo | Classe | Nota |",
    "| ---: | --- | ---: | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | --- | --- |"
  ];

  for (const [index, item] of cases.entries()) {
    lines.push([
      index + 1,
      item.file,
      item.measure,
      item.chord,
      item.expectedTarget,
      item.sideArrivalRoot,
      item.sideArrivalRelation,
      item.nextChords.join(" / ") || "fim",
      item.melodyPitches.join(" ") || "sem notas",
      item.dominantCoverage,
      item.sideArrivalCoverage,
      item.targetRootCoverage,
      item.reviewClass,
      item.notes
    ].map(cell => String(cell).replace(/\|/g, "\\|")).join(" | ").replace(/^/, "| ").replace(/$/, " |"));
  }

  lines.push("");
  lines.push("## Leitura para o motor");
  lines.push("");
  lines.push("- `melody-supports-side-arrival` pode indicar encadeamento lateral real, mas ainda pede regra harmonica especifica.");
  lines.push("- `melody-supports-dominant` sugere tensao expressiva sustentada pela melodia, nao necessariamente erro.");
  lines.push("- `target-lower-chromatic-neighbor` e `target-plagal-region` sao candidatos a investigacao antes de virarem regra.");
  lines.push("- `melody-weak-evidence` deve manter penalidade forte ate que outra evidencia explique o acorde.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

export function writeUnresolvedDominantMelodyAudit(cases = collectUnresolvedDominantMelodyCases()): void {
  const reportPath = path.join(process.cwd(), "docs/reports/f98-unresolved-dominant-melody-audit.md");
  const csvPath = path.join(process.cwd(), "docs/reports/f98-unresolved-dominant-melody-audit.csv");
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, renderMarkdown(cases));
  fs.writeFileSync(csvPath, renderCsv(cases));
  console.log(`Unresolved dominant melody audit complete: ${cases.length} cases.`);
  console.log(`Report: ${reportPath}`);
  console.log(`CSV: ${csvPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  writeUnresolvedDominantMelodyAudit();
}
