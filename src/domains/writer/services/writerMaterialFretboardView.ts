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
  visibleCategories: Record<LocalMaterialNoteCategory, boolean>;
  labelMode: LocalMaterialFretboardLabelMode;
}

export interface WriterMaterialFretboardView {
  geometry: ReturnType<typeof buildLocalMaterialFretboardGeometry>;
  strings: FretboardRenderedString[];
  notes: FretboardRenderedNote[];
}

export function buildWriterMaterialFretboardView(input: WriterMaterialFretboardViewInput): WriterMaterialFretboardView {
  const geometry = buildLocalMaterialFretboardGeometry(input.tuning.length);
  const strings = input.tuning.map((_, idx) => localMaterialStringGeometry(idx));
  const notes = input.tuning.flatMap((baseNote, stringIndex) => {
    return Array.from({ length: geometry.fretCount + 1 }).flatMap((_, fret) => {
      const fretboardNote = buildLocalMaterialFretboardNote({
        baseNote,
        fret,
        sourceNotes: input.source.notes,
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
        strokeClassName: fretboardNote.role.category === "characteristic" ? "stroke-amber-300" : "stroke-zinc-950",
        glowRadius: fretboardNote.role.category === "characteristic" ? 7 : 4
      }];
    });
  });

  return {
    geometry,
    strings,
    notes
  };
}
