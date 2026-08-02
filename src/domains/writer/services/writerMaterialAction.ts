import type { MaterialSourceMap } from "../../../utils/music/theory/musicTheory";
import type { WriterActiveMaterialPanel } from "./writerActiveMaterialPanel";
import type {
  WriterMaterialGestureRole,
  WriterRealizedMaterialCell
} from "./writerMaterialCellRealization";
import type { WriterMaterialPaletteItem } from "./writerMaterialPalette";
import {
  buildWriterMaterialRhythm,
  type WriterMaterialRhythmPlan
} from "./writerMaterialRhythm";

export interface WriterMaterialAction {
  name: string;
  eyebrowLabel: string;
  theoryDesc: string;
  notes: string[];
  displayNotes: string[];
  steps: WriterMaterialActionStep[];
  rhythm: WriterMaterialRhythmPlan;
  realizedCell?: WriterRealizedMaterialCell;
  buttonLabel: string;
}

export interface WriterMaterialActionStep {
  note: string;
  displayNote: string;
  onsetMs: number;
  durationMs: number;
  accent: boolean;
  position?: { stringIndex: number; fret: number };
  phraseRole?: WriterMaterialGestureRole;
  cellId?: string;
  cellIndex?: number;
}

export interface WriterMaterialActionInput {
  activePanel: WriterActiveMaterialPanel | null;
  focusedSource: MaterialSourceMap | null;
  focusedPaletteItem: WriterMaterialPaletteItem | null;
}

export function playableWriterMaterialNote(note: string, fallbackOctave = 4): string {
  return /\d$/.test(note) ? note : `${note}${fallbackOctave}`;
}

function actionSteps(
  notes: string[],
  displayNotes: string[],
  rhythm: WriterMaterialRhythmPlan,
  positions?: Array<{ stringIndex: number; fret: number }>,
  roles?: Array<WriterMaterialGestureRole | undefined>,
  cellIds?: Array<string | undefined>,
  cellIndexes?: Array<number | undefined>
): WriterMaterialActionStep[] {
  return notes.map((note, index) => {
    const timing = rhythm.timings[index];
    const step: WriterMaterialActionStep = {
      note,
      displayNote: displayNotes[index] || note.replace(/\d/, ""),
      onsetMs: timing?.onsetMs || 0,
      durationMs: timing?.durationMs || 320,
      accent: timing?.accent || false
    };
    if (positions?.[index]) step.position = positions[index];
    if (roles?.[index]) step.phraseRole = roles[index];
    if (cellIds?.[index]) step.cellId = cellIds[index];
    if (cellIndexes?.[index] !== undefined) step.cellIndex = cellIndexes[index];
    return step;
  });
}

export function buildWriterMaterialAction(input: WriterMaterialActionInput): WriterMaterialAction | null {
  if (input.activePanel?.studyLine) {
    const studyLine = input.activePanel.studyLine;
    const events = studyLine.events?.length ? studyLine.events : undefined;
    const notes = events?.map(event => event.note) || studyLine.notes;
    const displayNotes = events?.map(event => event.displayNote) || studyLine.displayNotes;
    const positions = events
      ? events.map(event => ({ stringIndex: event.stringIndex, fret: event.fret }))
      : studyLine.positions;
    const roles = events?.map(event => event.role);
    const cellIds = events?.map(event => event.cellId);
    const cellIndexes = events?.map(event => event.cellIndex);
    const realizedMaterial = studyLine.realizedCell
      ? input.activePanel.melodicMaterials[studyLine.realizedCell.materialIndex]
      : undefined;
    const rhythm = buildWriterMaterialRhythm({
      stepCount: notes.length,
      intent: input.focusedPaletteItem?.intent,
      preferredArchetype: realizedMaterial?.preferredRhythmArchetype,
      roles
    });
    return {
      name: studyLine.name,
      eyebrowLabel: "Tocar agora",
      theoryDesc: studyLine.theoryDesc,
      notes,
      displayNotes,
      steps: actionSteps(
        notes,
        displayNotes,
        rhythm,
        positions,
        roles,
        cellIds,
        cellIndexes
      ),
      rhythm,
      realizedCell: studyLine.realizedCell,
      buttonLabel: "Ouvir ideia"
    };
  }

  if (!input.focusedSource || !input.focusedPaletteItem) return null;
  return null;
}
