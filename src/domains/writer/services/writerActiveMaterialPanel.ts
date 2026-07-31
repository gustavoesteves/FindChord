import type {
  ContextualMaterialIntent,
  ContextualMelodicMaterial
} from "../../../utils/music/theory/contextualMaterialTypes";
import { getNoteAt } from "../../../utils/music/core/notes";
import { getPitchClass } from "../../../utils/music/core/pitch";
import {
  describeLocalMaterialSource,
  notesForLocalMaterialLine,
  suggestedLineForLocalMaterial,
  type LocalMaterialSourceDescription,
  type LocalMaterialSuggestedLine
} from "../../../utils/music/theory/localMaterialPresentation";
import {
  realizeWriterMaterialCellNearShape,
  type WriterMaterialCellSelection,
  type WriterMaterialGestureEvent,
  type WriterRealizedMaterialCell
} from "./writerMaterialCellRealization";
import { structuredCellsForContextualMaterial } from "../../../utils/music/theory/melodicCellMaterialAdapter";
import type { MaterialChordIdentity } from "../../../utils/music/theory/materialChordIdentity";

export interface WriterActiveMaterialLine extends LocalMaterialSuggestedLine {
  notes: string[];
  displayNotes: string[];
  positions?: Array<{ stringIndex: number; fret: number }>;
  events?: WriterMaterialGestureEvent[];
  realizedCell?: WriterRealizedMaterialCell;
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
  chordNotes?: string[];
  sourceNotes?: string[];
  tuning?: string[];
  selectedFrets?: (number | null)[];
  candidate?: {
    melodicMaterials: ContextualMelodicMaterial[];
    intent?: ContextualMaterialIntent;
    materialIdentity?: MaterialChordIdentity;
  };
  preferredCellSelection?: WriterMaterialCellSelection;
}

function displayNote(noteName: string): string {
  return noteName.replace(/\d/, "");
}

function midiValue(noteName: string): number {
  const octaveMatch = noteName.match(/-?\d+$/);
  const octave = octaveMatch ? Number(octaveMatch[0]) : 4;
  return octave * 12 + getPitchClass(noteName);
}

function characteristicPitchClasses(sourceType: string, chordRoot: string): number[] {
  const rootPitchClass = getPitchClass(chordRoot);
  if (rootPitchClass < 0) return [];
  const offsets = [
    sourceType.includes("lydian") ? 6 : null,
    sourceType.includes("dorian") ? 9 : null,
    sourceType.includes("phrygian") ? 1 : null,
    sourceType.includes("locrian") ? 6 : null,
    sourceType.includes("altered") ? 1 : null,
    sourceType.includes("altered") ? 3 : null,
    sourceType.includes("altered") ? 6 : null,
    sourceType.includes("altered") ? 8 : null
  ].filter((offset): offset is number => offset !== null);
  return offsets.map(offset => (rootPitchClass + offset) % 12);
}

function playableShapeMaterialLine(input: WriterActiveMaterialPanelInput): WriterActiveMaterialLine | undefined {
  if (!input.tuning || !input.selectedFrets || !input.sourceNotes) return undefined;
  const realizedCell = realizeWriterMaterialCellNearShape({
    chordRoot: input.chordRoot,
    chordNotes: input.chordNotes || [input.chordRoot],
    tuning: input.tuning,
    selectedFrets: input.selectedFrets,
    melodicMaterials: input.candidate?.melodicMaterials || [],
    intent: input.candidate?.intent,
    materialIdentity: input.candidate?.materialIdentity,
    preferredSelection: input.preferredCellSelection
  });
  if (realizedCell) {
    return {
      name: realizedCell.name,
      theoryDesc: realizedCell.theoryDesc,
      intervals: [],
      notes: realizedCell.events.map(event => event.note),
      displayNotes: realizedCell.events.map(event => event.displayNote),
      positions: realizedCell.events.map(event => ({
        stringIndex: event.stringIndex,
        fret: event.fret
      })),
      events: realizedCell.events,
      realizedCell: realizedCell.realizedCell
    };
  }

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
  const chordPitchClasses = (input.chordNotes || [input.chordRoot]).map(note => getPitchClass(note));
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
        midi: midiValue(noteName),
        isChordTone: chordPitchClasses.includes(getPitchClass(noteName)),
        isShapeTone: input.selectedFrets?.[stringIndex] === fret
      };
    }).filter(position => allowedPitchClasses.has(position.pitchClass))
  ));

  const rootPitchClass = getPitchClass(input.chordRoot);
  const characteristicPitchClassSet = new Set(characteristicPitchClasses(input.sourceType, input.chordRoot));
  const shapeStarts = positions
    .filter(position => position.isShapeTone)
    .sort((a, b) => a.midi - b.midi || b.stringIndex - a.stringIndex || a.fret - b.fret);
  const rootOrFirstShape = shapeStarts.find(position => position.pitchClass === rootPitchClass) || shapeStarts[0];
  if (!rootOrFirstShape) return undefined;

  const orderedNearLine = positions
    .filter(position => (
      position.fret >= rootOrFirstShape.fret - 1
      && position.fret <= rootOrFirstShape.fret + 3
      && position.midi >= rootOrFirstShape.midi
    ))
    .sort((a, b) => (
      a.midi - b.midi
      || Math.abs(a.fret - rootOrFirstShape.fret) - Math.abs(b.fret - rootOrFirstShape.fret)
      || b.stringIndex - a.stringIndex
    ));

  const colorCandidates = [
    ...orderedNearLine,
    ...positions.filter(position => !orderedNearLine.some(near => near.stringIndex === position.stringIndex && near.fret === position.fret))
  ].filter(position => !position.isChordTone && !position.isShapeTone);
  const colorTone = colorCandidates
    .sort((a, b) => (
      Number(characteristicPitchClassSet.has(b.pitchClass)) - Number(characteristicPitchClassSet.has(a.pitchClass))
      || Math.abs(a.fret - rootOrFirstShape.fret) - Math.abs(b.fret - rootOrFirstShape.fret)
      || Math.abs(a.midi - rootOrFirstShape.midi) - Math.abs(b.midi - rootOrFirstShape.midi)
    ))[0];
  const returnTone = colorTone
    ? orderedNearLine.find(position => (
        position.isChordTone
        && position.midi > colorTone.midi
        && position.midi - colorTone.midi <= 7
      )) || orderedNearLine.find(position => (
        position.isChordTone
        && position.midi < colorTone.midi
        && colorTone.midi - position.midi <= 7
      ))
    : undefined;
  const firstSupport = orderedNearLine.find(position => (
    position.isChordTone
    && position.midi > rootOrFirstShape.midi
    && (!colorTone || position.midi < colorTone.midi)
  ));
  const filler = orderedNearLine
    .filter(position => (
      position.midi > rootOrFirstShape.midi
      && (!returnTone || position.midi < returnTone.midi)
    ))
    .slice(0, 2);

  const lineSeeds = [
    rootOrFirstShape,
    firstSupport,
    colorTone,
    ...filler,
    returnTone
  ].filter((position): position is NonNullable<typeof position> => Boolean(position));

  const line = lineSeeds
    .filter((position, index, items) => (
      items.findIndex(other => other.stringIndex === position.stringIndex && other.fret === position.fret) === index
    ))
    .slice(0, 6);

  if (line.length < 3) return undefined;

  return {
    name: "Linha perto da forma",
    theoryDesc: "Parte do shape, abre uma cor do material na mesma região da mão e volta para um apoio do acorde.",
    intervals: [],
    notes: line.map(position => position.noteName),
    displayNotes: line.map(position => displayNote(position.noteName)),
    positions: line.map(position => ({ stringIndex: position.stringIndex, fret: position.fret }))
  };
}

function playableLocalCellLine(input: WriterActiveMaterialPanelInput): WriterActiveMaterialLine | undefined {
  const materials = input.candidate?.melodicMaterials || [];
  if (materials.length === 0) return undefined;
  const preferredMaterialIndex = input.preferredCellSelection?.materialIndex ?? 0;
  const material = materials[preferredMaterialIndex] || materials[0];
  const materialIndex = materials.indexOf(material);
  const structuredCells = structuredCellsForContextualMaterial({
    material,
    intent: input.candidate?.intent,
    materialIdentity: input.candidate?.materialIdentity
  });
  const preferredCellIndex = input.preferredCellSelection?.cellIndex
    ?? material.preferredCellIndex
    ?? 0;
  const cell = structuredCells[preferredCellIndex] || structuredCells[0];
  if (!cell?.events.length) return undefined;

  const displayNotes = cell.events.map(event => event.note);

  return {
    name: material.label,
    theoryDesc: material.practiceHint,
    intervals: [],
    notes: displayNotes.map(note => `${note}4`),
    displayNotes,
    realizedCell: {
      cellId: cell.id,
      materialLabel: material.label,
      materialIndex: materialIndex < 0 ? 0 : materialIndex,
      cellIndex: preferredCellIndex,
      notation: cell.notation
    }
  };
}

export function buildWriterActiveMaterialPanel(input: WriterActiveMaterialPanelInput): WriterActiveMaterialPanel {
  const shapeLine = playableShapeMaterialLine(input);
  const cellLine = playableLocalCellLine(input);
  const studyLine = suggestedLineForLocalMaterial(input.sourceType);
  const studyLineNotes = studyLine ? notesForLocalMaterialLine(input.chordRoot, studyLine.intervals) : [];

  return {
    sourceType: input.sourceType,
    melodicMaterials: input.candidate?.melodicMaterials || [],
    studyLine: shapeLine || cellLine || (studyLine
      ? {
          ...studyLine,
          notes: studyLineNotes,
          displayNotes: studyLineNotes.map(note => note.replace(/\d/, ""))
        }
      : undefined),
    theory: describeLocalMaterialSource(input.sourceType)
  };
}
