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
  visibleCategories: Record<LocalMaterialNoteCategory, boolean>;
  labelMode: LocalMaterialFretboardLabelMode;
}

export interface WriterMaterialFretboardWindow {
  startFret: number;
  endFret: number;
  hasShape: boolean;
}

export interface WriterMaterialFretboardView {
  geometry: ReturnType<typeof buildLocalMaterialFretboardGeometry>;
  fretWindow: WriterMaterialFretboardWindow;
  strings: FretboardRenderedString[];
  notes: FretboardRenderedNote[];
}

function fretWindowForShape(selectedFrets: (number | null)[] | undefined, fretCount: number): WriterMaterialFretboardWindow {
  const fretted = (selectedFrets || [])
    .filter((fret): fret is number => typeof fret === "number" && fret > 0 && fret <= fretCount);
  if (fretted.length === 0) return { startFret: 0, endFret: fretCount, hasShape: false };

  const minFret = Math.min(...fretted);
  const maxFret = Math.max(...fretted);
  let startFret = Math.max(0, minFret - 1);
  let endFret = Math.min(fretCount, maxFret + 2);

  while (endFret - startFret < 5 && endFret < fretCount) endFret += 1;
  while (endFret - startFret < 5 && startFret > 0) startFret -= 1;

  return { startFret, endFret, hasShape: true };
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
  const fretWindow = fretWindowForShape(input.selectedFrets, geometry.fretCount);
  const strings = input.tuning.map((_, idx) => localMaterialStringGeometry(idx));
  const notes = input.tuning.flatMap((baseNote, stringIndex) => {
    return Array.from({ length: geometry.fretCount + 1 }).flatMap((_, fret) => {
      if (!isFretVisibleInWindow(fret, fretWindow)) return [];
      const isChordShapeTone = isSelectedShapeFret(input.selectedFrets, stringIndex, fret);
      const fretboardNote = buildLocalMaterialFretboardNote({
        baseNote,
        fret,
        sourceNotes: sourceNotesWithShapeNote(input.source.notes, baseNote, fret, isChordShapeTone),
        chordRoot: input.activeChord.root,
        chordNotes: input.activeChord.notes,
        chordQuality: input.activeChord.quality,
        sourceType: input.source.type,
        visibleCategories: input.visibleCategories,
        labelMode: input.labelMode
      });
      if (!fretboardNote) return [];

      return [{
        stringIndex,
        fret,
        noteName: fretboardNote.noteName,
        displayLabel: fretboardNote.displayLabel,
        color: fretboardNote.role.color,
        tooltip: fretboardNote.tooltip,
        isChordShapeTone,
        strokeClassName: isChordShapeTone
          ? "stroke-white"
          : fretboardNote.role.category === "characteristic" ? "stroke-amber-300" : "stroke-zinc-950",
        glowRadius: isChordShapeTone
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
