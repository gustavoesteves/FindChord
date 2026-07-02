import { Note } from "tonal";
import type { ScoreHarmonyEvent } from "../models/ScoreSnapshot";
import { chordRoot, resolveChordSymbol, type ChordQuality } from "../../theory/ChordSymbolResolver";

type IiVPatternKind = "MAJOR_II_V_I" | "MINOR_IIØ_V_I";

interface LocalTonalRegion {
  tonic: string;
  mode: "major" | "minor";
  scope: "cadential-cell";
}

interface IiVFunctionalCell {
  kind: IiVPatternKind;
  region: LocalTonalRegion;
  startMeasure: number;
  endMeasure: number;
  chords: string[];
}

function normalizeChordRoot(chord: string): string {
  return Note.pitchClass(chordRoot(chord) || "") || "";
}

function chordQuality(chord: string): ChordQuality {
  return resolveChordSymbol(chord).quality;
}

function isMinorSeventh(chord: string): boolean {
  return ["m7", "m9", "m11"].includes(chordQuality(chord));
}

function isDominant(chord: string): boolean {
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
  ].includes(chordQuality(chord));
}

function isMajorTonic(chord: string): boolean {
  return ["maj", "maj7", "6", "6_9", "add9", "maj7_sharp11"].includes(chordQuality(chord));
}

function isMinorTonic(chord: string): boolean {
  return ["m", "m6", "m6_9", "m7", "m9", "m11", "mMaj7"].includes(chordQuality(chord));
}

function isHalfDiminished(chord: string): boolean {
  return chordQuality(chord) === "m7b5";
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
