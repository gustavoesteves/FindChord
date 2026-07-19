import { getNoteAt } from "../../../utils/music/core/notes";
import { getPitchClass } from "../../../utils/music/core/pitch";

export interface WriterInputFretboardChordContext {
  root: string;
  notes: string[];
}

export interface WriterInputFretboardNote {
  stringIndex: number;
  fret: number;
  noteName: string;
  displayLabel: string;
  color: string;
}

export interface WriterInputFretboardNoteInput {
  tuning: string[];
  selectedFrets: (number | null)[];
  activeChord: WriterInputFretboardChordContext | null;
}

const DEFAULT_NOTE_COLOR = "#0165e7";

function displayNoteName(noteName: string): string {
  return noteName.replace(/\d/, "");
}

function colorForChordPitchClass(notePitchClass: number, rootPitchClass: number): string {
  if (notePitchClass === rootPitchClass) return "#0165e7";

  const intervalDistance = (notePitchClass - rootPitchClass + 12) % 12;
  switch (intervalDistance) {
    case 3:
    case 4:
      return "#ff4e8c";
    case 5:
    case 6:
    case 7:
    case 8:
      return "#00FF88";
    case 10:
    case 11:
      return "#BD00FF";
    default:
      return "#FF9900";
  }
}

export function buildWriterInputFretboardNotes(input: WriterInputFretboardNoteInput): WriterInputFretboardNote[] {
  const rootPitchClass = input.activeChord ? getPitchClass(input.activeChord.root) : -1;

  return input.selectedFrets.flatMap((fret, stringIndex) => {
    if (fret === null) return [];

    const noteName = getNoteAt(input.tuning[stringIndex], fret);
    const notePitchClass = getPitchClass(noteName);
    const displayLabel = input.activeChord
      ? input.activeChord.notes.find(note => getPitchClass(note) === notePitchClass) || displayNoteName(noteName)
      : displayNoteName(noteName);

    return [{
      stringIndex,
      fret,
      noteName,
      displayLabel,
      color: input.activeChord ? colorForChordPitchClass(notePitchClass, rootPitchClass) : DEFAULT_NOTE_COLOR
    }];
  });
}
