import { Note as TonalNote, Interval as TonalInterval } from "tonal";
import { simplifyNote } from "./pitch";

export function getNoteAt(baseNote: string, fret: number): string {
  const transposed = TonalNote.transpose(baseNote, TonalInterval.fromSemitones(fret));
  return simplifyNote(transposed);
}

export function getOctave(noteName: string): number {
  const note = TonalNote.get(noteName);
  return note.empty ? 4 : note.oct ?? 4;
}
