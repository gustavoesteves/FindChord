import { Note as TonalNote } from "tonal";

export const PREFERRED_SPELLINGS: Record<string, string> = {
  "E#": "F",
  "B#": "C",
  "Cb": "B",
  "Fb": "E",
  "Fx": "G",
  "Cx": "D"
};

export function getPitchClass(noteName: string): number {
  const note = TonalNote.get(noteName);
  return note.empty ? -1 : note.chroma ?? -1;
}

export function simplifyNote(noteName: string): string {
  const scientific = TonalNote.get(noteName);
  if (scientific.empty) return noteName;
  
  const pitchClass = scientific.pc;
  const octave = scientific.oct !== undefined ? scientific.oct : "";
  
  if (PREFERRED_SPELLINGS[pitchClass]) {
    return PREFERRED_SPELLINGS[pitchClass] + octave;
  }
  
  return TonalNote.simplify(noteName);
}
