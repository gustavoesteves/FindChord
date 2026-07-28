import type { MaterialSourceMap } from "../../../utils/music/theory/musicTheory";
import type { WriterActiveMaterialPanel } from "./writerActiveMaterialPanel";
import type { WriterMaterialPaletteItem } from "./writerMaterialPalette";

export interface WriterMaterialAction {
  name: string;
  eyebrowLabel: string;
  theoryDesc: string;
  notes: string[];
  displayNotes: string[];
  steps: WriterMaterialActionStep[];
  buttonLabel: string;
}

export interface WriterMaterialActionStep {
  note: string;
  displayNote: string;
  delayMs: number;
  accent?: boolean;
}

export interface WriterMaterialActionInput {
  activePanel: WriterActiveMaterialPanel | null;
  focusedSource: MaterialSourceMap | null;
  focusedPaletteItem: WriterMaterialPaletteItem | null;
}

export function playableWriterMaterialNote(note: string, fallbackOctave = 4): string {
  return /\d$/.test(note) ? note : `${note}${fallbackOctave}`;
}

function actionSteps(notes: string[], displayNotes: string[]): WriterMaterialActionStep[] {
  const lastIndex = notes.length - 1;
  return notes.map((note, index) => ({
    note,
    displayNote: displayNotes[index] || note.replace(/\d/, ""),
    delayMs: index === 0 ? 0 : 220 + (index - 1) * 180,
    accent: index === 0 || index === lastIndex
  }));
}

export function buildWriterMaterialAction(input: WriterMaterialActionInput): WriterMaterialAction | null {
  if (input.activePanel?.studyLine) {
    return {
      name: input.activePanel.studyLine.name,
      eyebrowLabel: "Tocar agora",
      theoryDesc: input.activePanel.studyLine.theoryDesc,
      notes: input.activePanel.studyLine.notes,
      displayNotes: input.activePanel.studyLine.displayNotes,
      steps: actionSteps(input.activePanel.studyLine.notes, input.activePanel.studyLine.displayNotes),
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
    steps: actionSteps(displayNotes.map(note => playableWriterMaterialNote(note)), displayNotes),
    buttonLabel: "Ouvir material"
  };
}
