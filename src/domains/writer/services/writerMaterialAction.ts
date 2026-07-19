import type { ScaleInfo } from "../../../utils/music/theory/musicTheory";
import type { WriterActiveMaterialPanel } from "./writerActiveMaterialPanel";
import type { WriterMaterialPaletteItem } from "./writerMaterialPalette";

export interface WriterMaterialAction {
  name: string;
  eyebrowLabel: string;
  theoryDesc: string;
  notes: string[];
  displayNotes: string[];
  buttonLabel: string;
}

export interface WriterMaterialActionInput {
  activePanel: WriterActiveMaterialPanel | null;
  focusedSource: ScaleInfo | null;
  focusedPaletteItem: WriterMaterialPaletteItem | null;
}

export function playableWriterMaterialNote(note: string, fallbackOctave = 4): string {
  return /\d$/.test(note) ? note : `${note}${fallbackOctave}`;
}

export function buildWriterMaterialAction(input: WriterMaterialActionInput): WriterMaterialAction | null {
  if (input.activePanel?.studyLine) {
    return {
      name: input.activePanel.studyLine.name,
      eyebrowLabel: "Tocar agora",
      theoryDesc: input.activePanel.studyLine.theoryDesc,
      notes: input.activePanel.studyLine.notes,
      displayNotes: input.activePanel.studyLine.displayNotes,
      buttonLabel: "Ouvir ideia"
    };
  }

  if (!input.focusedSource || !input.focusedPaletteItem) return null;

  const displayNotes = input.focusedSource.notes.slice(0, 7);

  return {
    name: input.focusedPaletteItem.title,
    eyebrowLabel: "Ouvir material",
    theoryDesc: input.focusedPaletteItem.subtitle,
    notes: displayNotes.map(note => playableWriterMaterialNote(note)),
    displayNotes,
    buttonLabel: "Ouvir material"
  };
}
