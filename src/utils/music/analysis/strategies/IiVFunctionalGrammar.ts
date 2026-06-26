import { Chord, Note } from "tonal";
import type { ScoreHarmonyEvent } from "../models/ScoreSnapshot";

export type IiVPatternKind = "MAJOR_II_V_I" | "MINOR_IIØ_V_I";

export interface LocalTonalRegion {
  tonic: string;
  mode: "major" | "minor";
  scope: "cadential-cell";
}

export interface IiVFunctionalCell {
  kind: IiVPatternKind;
  region: LocalTonalRegion;
  startMeasure: number;
  endMeasure: number;
  chords: string[];
}

function normalizeChordRoot(chord: string): string {
  const [symbol] = chord.split("/");
  const data = Chord.get(symbol);
  return Note.pitchClass(data.tonic || Chord.tokenize(symbol)[0] || symbol.replace(/[^A-G#b]/g, ""));
}

function chordType(chord: string): string {
  return Chord.get(chord.split("/")[0]).type.toLowerCase();
}

function isMinorSeventh(chord: string): boolean {
  const type = chordType(chord);
  return type.includes("minor seventh") || /m7(?!\(?b5)/i.test(chord);
}

function isDominant(chord: string): boolean {
  const type = chordType(chord);
  const [, quality] = Chord.tokenize(chord.split("/")[0]);
  return type.includes("dominant") || /^7(\(|$)/i.test(quality) || /(^|[^a-z])7/i.test(chord);
}

function isMajorTonic(chord: string): boolean {
  const type = chordType(chord);
  return type.includes("major") || type === "major" || /maj|6/i.test(chord) || Chord.get(chord.split("/")[0]).quality === "Major";
}

function isMinorTonic(chord: string): boolean {
  const type = chordType(chord);
  return type.includes("minor") || /m(6|7)?/i.test(chord);
}

function isHalfDiminished(chord: string): boolean {
  const type = chordType(chord);
  const [, quality] = Chord.tokenize(chord.split("/")[0]);
  return type.includes("half-diminished") || /m7\(?b5\)?|ø/i.test(quality) || /m7\(?b5\)?|ø/i.test(chord);
}

function intervalSemitones(from: string, to: string): number | null {
  const fromChroma = Note.chroma(from);
  const toChroma = Note.chroma(to);
  if (fromChroma === undefined || toChroma === undefined) return null;
  return (toChroma - fromChroma + 12) % 12;
}

function movesByFourthUp(from: string, to: string): boolean {
  return intervalSemitones(from, to) === 5;
}

function isMajorIiVI(first: string, second: string, third: string): boolean {
  const firstRoot = normalizeChordRoot(first);
  const secondRoot = normalizeChordRoot(second);
  const thirdRoot = normalizeChordRoot(third);
  return isMinorSeventh(first)
    && isDominant(second)
    && isMajorTonic(third)
    && movesByFourthUp(firstRoot, secondRoot)
    && movesByFourthUp(secondRoot, thirdRoot);
}

function isMinorIiVI(first: string, second: string, third: string): boolean {
  const firstRoot = normalizeChordRoot(first);
  const secondRoot = normalizeChordRoot(second);
  const thirdRoot = normalizeChordRoot(third);
  return isHalfDiminished(first)
    && isDominant(second)
    && isMinorTonic(third)
    && movesByFourthUp(firstRoot, secondRoot)
    && movesByFourthUp(secondRoot, thirdRoot);
}

export function detectIiVFunctionalCells(harmonies: ScoreHarmonyEvent[]): IiVFunctionalCell[] {
  const cells: IiVFunctionalCell[] = [];
  const ordered = [...harmonies].sort((a, b) => a.tickStart - b.tickStart);

  for (let i = 0; i < ordered.length - 2; i++) {
    const first = ordered[i];
    const second = ordered[i + 1];
    const third = ordered[i + 2];
    const chords = [first.harmony, second.harmony, third.harmony];
    const targetRoot = normalizeChordRoot(third.harmony);

    if (isMajorIiVI(chords[0], chords[1], chords[2])) {
      cells.push({
        kind: "MAJOR_II_V_I",
        region: { tonic: targetRoot, mode: "major", scope: "cadential-cell" },
        startMeasure: first.measure,
        endMeasure: third.measure,
        chords
      });
      continue;
    }

    if (isMinorIiVI(chords[0], chords[1], chords[2])) {
      cells.push({
        kind: "MINOR_IIØ_V_I",
        region: { tonic: targetRoot, mode: "minor", scope: "cadential-cell" },
        startMeasure: first.measure,
        endMeasure: third.measure,
        chords
      });
    }
  }

  return cells;
}
