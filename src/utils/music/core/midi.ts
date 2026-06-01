import { Note as TonalNote } from "tonal";
import { getPitchClass } from "./pitch";
import { getNoteAt, getOctave } from "./notes";

export function noteToMidi(noteName: string): number {
  const note = TonalNote.get(noteName);
  if (!note.empty && note.midi !== undefined && note.midi !== null) {
    return note.midi;
  }
  // Fallback manual parser caso o Tonal retorne vazio
  const match = noteName.match(/^([A-G][b#]?)(-?\d+)$/);
  if (!match) return 60; // Dó central (C4) como padrão
  const pcStr = match[1];
  const octVal = parseInt(match[2], 10);
  const pcMap: Record<string, number> = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5,
    "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
  };
  const chroma = pcMap[pcStr] ?? 0;
  return chroma + (octVal + 1) * 12;
}

export function getAbsolutePitch(fret: number | null, baseNote: string): number | null {
  if (fret === null) return null;
  const noteName = getNoteAt(baseNote, fret);
  const pc = getPitchClass(noteName);
  const oct = getOctave(noteName);
  return oct * 12 + pc;
}
