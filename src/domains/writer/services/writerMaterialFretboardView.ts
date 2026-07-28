import {
  buildLocalMaterialFretboardGeometry,
  localMaterialStringGeometry
} from "../../../utils/music/theory/localMaterialFretboardGeometry";
import type { ChordQuality } from "../../../utils/music/constants/chordRegistry";
import {
  buildLocalMaterialFretboardNote,
  type LocalMaterialFretboardLabelMode
} from "../../../utils/music/theory/localMaterialFretboardNotes";
import type { LocalMaterialNoteCategory } from "../../../utils/music/theory/localMaterialNoteRoles";
import type {
  FretboardRenderedNote,
  FretboardRenderedString
} from "../components/fretboard/FretboardRenderer";
import { getNoteAt } from "../../../utils/music/core/notes";
import { getPitchClass } from "../../../utils/music/core/pitch";
import {
  fretWindowForWriterMaterialShape,
  type WriterMaterialFretWindow
} from "./writerMaterialFretWindow";
import type { WriterMaterialGestureRole } from "./writerMaterialCellRealization";

export interface WriterMaterialFretboardChordContext {
  root: string;
  notes: string[];
  quality?: ChordQuality;
}

export interface WriterMaterialFretboardSourceContext {
  type: string;
  notes: string[];
}

export interface WriterMaterialFretboardViewInput {
  tuning: string[];
  source: WriterMaterialFretboardSourceContext;
  activeChord: WriterMaterialFretboardChordContext;
  selectedFrets?: (number | null)[];
  sequenceSteps?: ReadonlyArray<{
    position?: { stringIndex: number; fret: number };
    phraseRole?: WriterMaterialGestureRole;
    displayNote?: string;
  }>;
  activeStepIndex?: number | null;
  visibleCategories: Record<LocalMaterialNoteCategory, boolean>;
  labelMode: LocalMaterialFretboardLabelMode;
}

export type WriterMaterialFretboardWindow = WriterMaterialFretWindow;

interface WriterMaterialSequenceVisit {
  stepIndex: number;
  phraseRole?: WriterMaterialGestureRole;
  displayNote?: string;
}

const PHRASE_ROLE_LABEL: Partial<Record<WriterMaterialGestureRole, string>> = {
  anchor: "partida",
  cell: "célula",
  color: "cor",
  outside: "fora",
  return: "chegada"
};

export interface WriterMaterialFretboardView {
  geometry: ReturnType<typeof buildLocalMaterialFretboardGeometry>;
  fretWindow: WriterMaterialFretboardWindow;
  strings: FretboardRenderedString[];
  notes: FretboardRenderedNote[];
}

function isFretVisibleInWindow(fret: number, window: WriterMaterialFretboardWindow): boolean {
  if (!window.hasShape) return true;
  if (fret === 0) return window.startFret === 0;
  return fret >= window.startFret && fret <= window.endFret;
}

function isSelectedShapeFret(selectedFrets: (number | null)[] | undefined, stringIndex: number, fret: number): boolean {
  return selectedFrets?.[stringIndex] === fret;
}

function sourceNotesWithShapeNote(sourceNotes: string[], baseNote: string, fret: number, includeShapeNote: boolean): string[] {
  if (!includeShapeNote) return sourceNotes;
  const noteName = getNoteAt(baseNote, fret);
  const notePitchClass = getPitchClass(noteName);
  return sourceNotes.some(note => getPitchClass(note) === notePitchClass) ? sourceNotes : [...sourceNotes, noteName];
}

export function buildWriterMaterialFretboardView(input: WriterMaterialFretboardViewInput): WriterMaterialFretboardView {
  const geometry = buildLocalMaterialFretboardGeometry(input.tuning.length);
  const fretWindow = fretWindowForWriterMaterialShape(input.selectedFrets, geometry.fretCount);
  const strings = input.tuning.map((_, idx) => localMaterialStringGeometry(idx));
  const sequenceVisits = new Map<string, WriterMaterialSequenceVisit[]>();
  input.sequenceSteps?.forEach((step, stepIndex) => {
    if (!step.position) return;
    const key = `${step.position.stringIndex}:${step.position.fret}`;
    sequenceVisits.set(key, [
      ...(sequenceVisits.get(key) || []),
      {
        stepIndex,
        phraseRole: step.phraseRole,
        displayNote: step.displayNote
      }
    ]);
  });
  const allCategoriesVisible: Record<LocalMaterialNoteCategory, boolean> = {
    root: true,
    chordTone: true,
    characteristic: true,
    tension: true,
    avoid: true
  };
  const notes = input.tuning.flatMap((baseNote, stringIndex) => {
    return Array.from({ length: geometry.fretCount + 1 }).flatMap((_, fret) => {
      if (!isFretVisibleInWindow(fret, fretWindow)) return [];
      const visits = sequenceVisits.get(`${stringIndex}:${fret}`) || [];
      const stepIndexes = visits.map(visit => visit.stepIndex);
      const isSequencePosition = visits.length > 0;
      const isChordShapeTone = isSelectedShapeFret(input.selectedFrets, stringIndex, fret);
      const fretboardNote = buildLocalMaterialFretboardNote({
        baseNote,
        fret,
        sourceNotes: sourceNotesWithShapeNote(
          input.source.notes,
          baseNote,
          fret,
          isChordShapeTone || isSequencePosition
        ),
        chordRoot: input.activeChord.root,
        chordNotes: input.activeChord.notes,
        chordQuality: input.activeChord.quality,
        sourceType: input.source.type,
        visibleCategories: isSequencePosition ? allCategoriesVisible : input.visibleCategories,
        labelMode: input.labelMode
      });
      if (!fretboardNote) return [];

      const activeVisit = visits.find(visit => visit.stepIndex === input.activeStepIndex);
      const sequenceDisplayNote = visits.find(visit => visit.displayNote)?.displayNote;
      const visitDescriptions = visits.map(visit => {
        const role = visit.phraseRole ? PHRASE_ROLE_LABEL[visit.phraseRole] : undefined;
        return `passo ${visit.stepIndex + 1}${role ? `, ${role}` : ""}`;
      });
      return [{
        stringIndex,
        fret,
        noteName: fretboardNote.noteName,
        displayLabel: input.labelMode === "note" && sequenceDisplayNote
          ? sequenceDisplayNote
          : fretboardNote.displayLabel,
        color: fretboardNote.role.color,
        tooltip: fretboardNote.tooltip,
        isChordShapeTone,
        stepNumbers: stepIndexes.map(stepIndex => stepIndex + 1),
        activeStepNumber: activeVisit === undefined ? undefined : activeVisit.stepIndex + 1,
        isCurrentStep: activeVisit !== undefined,
        ariaLabel: visits.length > 0
          ? `${sequenceDisplayNote || fretboardNote.noteName}, corda ${stringIndex + 1}, casa ${fret}, ${visitDescriptions.join("; ")}${activeVisit ? ", passo ativo" : ""}`
          : fretboardNote.tooltip,
        strokeClassName: activeVisit !== undefined
          ? "stroke-white"
          : isSequencePosition
            ? "stroke-sky-300"
            : isChordShapeTone
          ? "stroke-white"
          : fretboardNote.role.category === "characteristic" ? "stroke-amber-300" : "stroke-zinc-950",
        glowRadius: activeVisit !== undefined
          ? 12
          : isSequencePosition
            ? 9
            : isChordShapeTone
          ? 9
          : fretboardNote.role.category === "characteristic" ? 7 : 4
      }];
    });
  });

  return {
    geometry,
    fretWindow,
    strings,
    notes
  };
}
