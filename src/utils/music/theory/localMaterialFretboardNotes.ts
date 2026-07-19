import { getNoteAt } from "../core/notes";
import { getPitchClass } from "../core/pitch";
import {
  classifyLocalMaterialNote,
  type LocalMaterialNoteCategory,
  type LocalMaterialNoteRole
} from "./localMaterialNoteRoles";

export type LocalMaterialFretboardLabelMode = "position" | "note";

export interface LocalMaterialFretboardNoteInput {
  baseNote: string;
  fret: number;
  sourceNotes: string[];
  chordRoot: string;
  chordNotes: string[];
  sourceType: string;
  visibleCategories: Record<LocalMaterialNoteCategory, boolean>;
  labelMode: LocalMaterialFretboardLabelMode;
}

export interface LocalMaterialFretboardNote {
  noteName: string;
  displayLabel: string;
  tooltip: string;
  role: LocalMaterialNoteRole;
}

function displayNoteName(noteName: string): string {
  return noteName.replace(/\d/, "");
}

export function buildLocalMaterialFretboardNote(input: LocalMaterialFretboardNoteInput): LocalMaterialFretboardNote | null {
  const noteName = getNoteAt(input.baseNote, input.fret);
  const notePitchClass = getPitchClass(noteName);
  const sourcePitchClasses = input.sourceNotes.map(note => getPitchClass(note));
  if (!sourcePitchClasses.includes(notePitchClass)) return null;

  const role = classifyLocalMaterialNote(
    noteName,
    input.chordRoot,
    input.chordNotes,
    input.sourceType
  );
  if (!input.visibleCategories[role.category]) return null;

  const displayName = displayNoteName(noteName);
  return {
    noteName,
    displayLabel: input.labelMode === "note" ? displayName : role.label.split(" ")[0],
    tooltip: `${displayName} - ${role.label}\n\n${role.tooltip}`,
    role
  };
}
