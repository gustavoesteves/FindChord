import type { ContextualMelodicMaterial } from "../../../utils/music/theory/contextualMaterialTypes";
import { getNoteAt } from "../../../utils/music/core/notes";
import { getPitchClass } from "../../../utils/music/core/pitch";
import {
  describeLocalMaterialSource,
  notesForLocalMaterialLine,
  suggestedLineForLocalMaterial,
  type LocalMaterialSourceDescription,
  type LocalMaterialSuggestedLine
} from "../../../utils/music/theory/localMaterialPresentation";

export interface WriterActiveMaterialLine extends LocalMaterialSuggestedLine {
  notes: string[];
  displayNotes: string[];
  positions?: Array<{ stringIndex: number; fret: number }>;
}

export interface WriterActiveMaterialPanel {
  sourceType: string;
  melodicMaterials: ContextualMelodicMaterial[];
  studyLine?: WriterActiveMaterialLine;
  theory: LocalMaterialSourceDescription;
}

export interface WriterActiveMaterialPanelInput {
  sourceType: string;
  chordRoot: string;
  sourceNotes?: string[];
  tuning?: string[];
  selectedFrets?: (number | null)[];
  candidate?: { melodicMaterials: ContextualMelodicMaterial[] };
}

function displayNote(noteName: string): string {
  return noteName.replace(/\d/, "");
}

function playableShapeMaterialLine(input: WriterActiveMaterialPanelInput): WriterActiveMaterialLine | undefined {
  if (!input.tuning || !input.selectedFrets || !input.sourceNotes) return undefined;
  const fretted = input.selectedFrets
    .map((fret, stringIndex) => ({ fret, stringIndex }))
    .filter((item): item is { fret: number; stringIndex: number } => (
      typeof item.fret === "number" && item.fret >= 0
    ));
  if (fretted.length === 0) return undefined;

  const frettedOnly = fretted.filter(item => item.fret > 0);
  const minFret = frettedOnly.length > 0 ? Math.min(...frettedOnly.map(item => item.fret)) : 0;
  const maxFret = frettedOnly.length > 0 ? Math.max(...frettedOnly.map(item => item.fret)) : 5;
  const startFret = Math.max(0, minFret - 1);
  const endFret = Math.min(24, Math.max(maxFret + 2, startFret + 5));
  const sourcePitchClasses = input.sourceNotes.map(note => getPitchClass(note));
  const shapePitchClasses = fretted.map(item => getPitchClass(getNoteAt(input.tuning?.[item.stringIndex] || "C", item.fret)));
  const allowedPitchClasses = new Set([...sourcePitchClasses, ...shapePitchClasses]);

  const positions = input.tuning.flatMap((baseNote, stringIndex) => (
    Array.from({ length: endFret - startFret + 1 }, (_, offset) => {
      const fret = startFret + offset;
      const noteName = getNoteAt(baseNote, fret);
      return {
        stringIndex,
        fret,
        noteName,
        pitchClass: getPitchClass(noteName),
        isShapeTone: input.selectedFrets?.[stringIndex] === fret
      };
    }).filter(position => allowedPitchClasses.has(position.pitchClass))
  ));

  const rootPitchClass = getPitchClass(input.chordRoot);
  const shapeStarts = positions
    .filter(position => position.isShapeTone)
    .sort((a, b) => (b.stringIndex - a.stringIndex) || (a.fret - b.fret));
  const rootOrFirstShape = shapeStarts.find(position => position.pitchClass === rootPitchClass) || shapeStarts[0];
  if (!rootOrFirstShape) return undefined;

  const orderedNearLine = positions
    .filter(position => (
      position.fret >= rootOrFirstShape.fret - 1
      && position.fret <= rootOrFirstShape.fret + 3
      && position.stringIndex <= rootOrFirstShape.stringIndex
    ))
    .sort((a, b) => (
      Math.abs(a.fret - rootOrFirstShape.fret) - Math.abs(b.fret - rootOrFirstShape.fret)
      || b.stringIndex - a.stringIndex
      || a.fret - b.fret
    ));

  const line = [rootOrFirstShape, ...orderedNearLine]
    .filter((position, index, items) => (
      items.findIndex(other => other.stringIndex === position.stringIndex && other.fret === position.fret) === index
    ))
    .slice(0, 6)
    .sort((a, b) => a.fret - b.fret || b.stringIndex - a.stringIndex);

  if (line.length < 3) return undefined;

  return {
    name: "Linha perto da forma",
    theoryDesc: "Usa o shape desenhado como ponto de partida e percorre notas do material na mesma região da mão.",
    intervals: [],
    notes: line.map(position => position.noteName),
    displayNotes: line.map(position => displayNote(position.noteName)),
    positions: line.map(position => ({ stringIndex: position.stringIndex, fret: position.fret }))
  };
}

export function buildWriterActiveMaterialPanel(input: WriterActiveMaterialPanelInput): WriterActiveMaterialPanel {
  const shapeLine = playableShapeMaterialLine(input);
  const studyLine = suggestedLineForLocalMaterial(input.sourceType);
  const studyLineNotes = studyLine ? notesForLocalMaterialLine(input.chordRoot, studyLine.intervals) : [];

  return {
    sourceType: input.sourceType,
    melodicMaterials: input.candidate?.melodicMaterials || [],
    studyLine: shapeLine || (studyLine
      ? {
          ...studyLine,
          notes: studyLineNotes,
          displayNotes: studyLineNotes.map(note => note.replace(/\d/, ""))
        }
      : undefined),
    theory: describeLocalMaterialSource(input.sourceType)
  };
}
