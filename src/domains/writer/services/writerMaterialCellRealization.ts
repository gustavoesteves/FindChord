import type {
  ContextualMaterialIntent,
  ContextualMelodicMaterial
} from "../../../utils/music/theory/contextualMaterialTypes";
import { getNoteAt } from "../../../utils/music/core/notes";
import { getPitchClass, simplifyNote } from "../../../utils/music/core/pitch";
import type {
  BaseMelodicCell,
  MelodicCellHarmonicRole
} from "../../../utils/music/models/MelodicCell";
import {
  preferredStructuredCellIdForMaterial,
  structuredCellsForContextualMaterial
} from "../../../utils/music/theory/melodicCellMaterialAdapter";
import type { MaterialChordIdentity } from "../../../utils/music/theory/materialChordIdentity";
import { fretWindowForWriterMaterialShape } from "./writerMaterialFretWindow";

export type WriterMaterialGestureRole = "anchor" | "cell" | "color" | "outside" | "return";

export interface WriterMaterialGestureEvent {
  note: string;
  displayNote: string;
  stringIndex: number;
  fret: number;
  role: WriterMaterialGestureRole;
  cellId?: string;
  cellIndex?: number;
}

export interface WriterRealizedMaterialCell {
  cellId: string;
  materialLabel: string;
  materialIndex: number;
  cellIndex: number;
  notation: string;
}

export interface WriterRealizedMaterialGesture {
  name: string;
  theoryDesc: string;
  realizedCell: WriterRealizedMaterialCell;
  events: WriterMaterialGestureEvent[];
}

export interface WriterMaterialCellRealizationInput {
  chordRoot: string;
  chordNotes: string[];
  tuning: string[];
  selectedFrets: (number | null)[];
  melodicMaterials: ContextualMelodicMaterial[];
  intent?: ContextualMaterialIntent;
  materialIdentity?: MaterialChordIdentity;
  preferredSelection?: WriterMaterialCellSelection;
}

export interface WriterMaterialCellSelection {
  materialIndex: number;
  cellIndex: number;
  cellId?: string;
}

interface PhysicalNotePosition {
  noteName: string;
  pitchClass: number;
  midi: number;
  stringIndex: number;
  fret: number;
}

interface PathState {
  cost: number;
  position: PhysicalNotePosition;
  previousIndex: number;
}

function midiValue(noteName: string): number {
  const octaveMatch = noteName.match(/-?\d+$/);
  const octave = octaveMatch ? Number(octaveMatch[0]) : 4;
  return octave * 12 + getPitchClass(noteName);
}

export function notesInWriterMaterialCell(cell: string): string[] {
  const separator = cell.includes("->") ? "->" : "-";
  return cell
    .split(separator)
    .map(note => simplifyNote(note.trim()))
    .filter(Boolean);
}

function physicalPositions(input: Pick<
  WriterMaterialCellRealizationInput,
  "tuning" | "selectedFrets"
>): PhysicalNotePosition[] {
  const fretWindow = fretWindowForWriterMaterialShape(input.selectedFrets);

  return input.tuning.flatMap((baseNote, stringIndex) => (
    Array.from(
      { length: fretWindow.endFret - fretWindow.startFret + 1 },
      (_, offset) => fretWindow.startFret + offset
    ).map(fret => {
      const noteName = getNoteAt(baseNote, fret);
      return {
        noteName,
        pitchClass: getPitchClass(noteName),
        midi: midiValue(noteName),
        stringIndex,
        fret
      };
    })
  ));
}

function transitionCost(
  from: PhysicalNotePosition,
  to: PhysicalNotePosition,
  desiredPitchMovement?: number
): number {
  if (from.stringIndex === to.stringIndex && from.fret === to.fret) return 1000;

  const pitchMovement = to.midi - from.midi;
  const directedMovementPenalty = desiredPitchMovement === undefined
    ? 0
    : Math.abs(pitchMovement - desiredPitchMovement) * 40;
  const descendingPenalty = desiredPitchMovement === undefined && pitchMovement <= 0
    ? 20 + Math.abs(pitchMovement) * 2
    : 0;
  const wideLeapPenalty = pitchMovement > 12 ? (pitchMovement - 12) * 3 : 0;

  return (
    Math.abs(to.fret - from.fret) * 5
    + Math.abs(to.stringIndex - from.stringIndex) * 2
    + Math.abs(pitchMovement)
    + directedMovementPenalty
    + descendingPenalty
    + wideLeapPenalty
  );
}

function startCost(
  position: PhysicalNotePosition,
  shapePositions: PhysicalNotePosition[]
): number {
  if (shapePositions.length === 0) return position.fret;

  return Math.min(...shapePositions.map(shape => (
    Math.abs(position.fret - shape.fret) * 5
    + Math.abs(position.stringIndex - shape.stringIndex) * 2
    + Math.abs(position.midi - shape.midi)
  )));
}

function realizeOrderedNotes(
  displayNotes: string[],
  positions: PhysicalNotePosition[],
  shapePositions: PhysicalNotePosition[],
  desiredPitchMovements: Array<number | undefined> = []
): PhysicalNotePosition[] | undefined {
  const candidatesByNote = displayNotes.map(note => (
    positions.filter(position => position.pitchClass === getPitchClass(note))
  ));
  if (candidatesByNote.some(candidates => candidates.length === 0)) return undefined;

  const layers: PathState[][] = [];
  layers.push(candidatesByNote[0].map(position => ({
    cost: startCost(position, shapePositions),
    position,
    previousIndex: -1
  })));

  for (let noteIndex = 1; noteIndex < candidatesByNote.length; noteIndex += 1) {
    const previousLayer = layers[noteIndex - 1];
    const layer = candidatesByNote[noteIndex].map(position => {
      let bestPreviousIndex = 0;
      let bestCost = Number.POSITIVE_INFINITY;

      previousLayer.forEach((previous, previousIndex) => {
        const cost = previous.cost + transitionCost(
          previous.position,
          position,
          desiredPitchMovements[noteIndex - 1]
        );
        if (cost < bestCost) {
          bestCost = cost;
          bestPreviousIndex = previousIndex;
        }
      });

      return {
        cost: bestCost,
        position,
        previousIndex: bestPreviousIndex
      };
    });
    layers.push(layer);
  }

  const lastLayer = layers.at(-1);
  if (!lastLayer?.length) return undefined;
  let stateIndex = lastLayer.reduce(
    (bestIndex, state, index, states) => state.cost < states[bestIndex].cost ? index : bestIndex,
    0
  );
  const path = new Array<PhysicalNotePosition>(layers.length);

  for (let layerIndex = layers.length - 1; layerIndex >= 0; layerIndex -= 1) {
    const state = layers[layerIndex][stateIndex];
    path[layerIndex] = state.position;
    stateIndex = state.previousIndex;
  }

  return path;
}

function selectMaterialAndCell(
  materials: ContextualMelodicMaterial[],
  chordPitchClasses: Set<number>,
  intent?: ContextualMaterialIntent,
  materialIdentity?: MaterialChordIdentity,
  preferredSelection?: WriterMaterialCellSelection
): {
  material: ContextualMelodicMaterial;
  materialIndex: number;
  cellIndex: number;
  cellId: string;
  cell: BaseMelodicCell;
  notes: string[];
  desiredPitchMovements: Array<number | undefined>;
} | undefined {
  if (preferredSelection) {
    const material = materials[preferredSelection.materialIndex];
    const structuredCells = material ? structuredCellsForContextualMaterial({
      material,
      intent,
      materialIdentity
    }) : [];
    const selectedCell = preferredSelection.cellId
      ? structuredCells.find(cell => cell.id === preferredSelection.cellId) || structuredCells[preferredSelection.cellIndex]
      : structuredCells[preferredSelection.cellIndex];
    const cellIndex = selectedCell
      ? structuredCells.findIndex(cell => cell.id === selectedCell.id)
      : -1;
    const notes = selectedCell?.events.map(event => event.note) || [];
    if (material && selectedCell && cellIndex >= 0 && notes.length > 0) {
      return {
        material,
        materialIndex: preferredSelection.materialIndex,
        cellIndex,
        cellId: selectedCell.id,
        cell: selectedCell,
        notes,
        desiredPitchMovements: desiredPitchMovementsForCell(selectedCell.notation, notes)
      };
    }
  }

  for (let materialIndex = 0; materialIndex < materials.length; materialIndex += 1) {
    const material = materials[materialIndex];
    const structuredCells = structuredCellsForContextualMaterial({
      material,
      intent,
      materialIdentity
    });
    const preferredCellId = preferredStructuredCellIdForMaterial(material, structuredCells);
    if (preferredCellId) {
      const preferredCellIndex = structuredCells.findIndex(cell => cell.id === preferredCellId);
      const preferredCell = structuredCells[preferredCellIndex];
      const notes = preferredCell?.events.map(event => event.note) || [];
      if (notes.length > 0) {
        return {
          material,
          materialIndex,
          cellIndex: preferredCellIndex,
          cellId: preferredCell.id,
          cell: preferredCell,
          notes,
          desiredPitchMovements: desiredPitchMovementsForCell(preferredCell.notation, notes)
        };
      }
    }

    const rankedCells = structuredCells
      .map((cell, cellIndex) => {
        const notes = cell.events.map(event => event.note);
        const colorCount = notes.filter(note => !chordPitchClasses.has(getPitchClass(note))).length;
        return { cellIndex, cellId: cell.id, cell, notes, colorCount };
      })
      .filter(cell => cell.notes.length > 0)
      .sort((left, right) => right.colorCount - left.colorCount || left.cellIndex - right.cellIndex);
    const selected = rankedCells[0];
    if (selected) {
      return {
        material,
        materialIndex,
        cellIndex: selected.cellIndex,
        cellId: selected.cellId,
        cell: selected.cell,
        notes: selected.notes,
        desiredPitchMovements: desiredPitchMovementsForCell(
          selected.cell.notation,
          selected.notes
        )
      };
    }
  }

  return undefined;
}

function desiredPitchMovementsForCell(
  cell: string,
  notes: string[]
): Array<number | undefined> {
  if (!cell.includes("->")) return [];

  return notes.slice(1).map((note, index) => {
    const fromPitchClass = getPitchClass(notes[index]);
    const toPitchClass = getPitchClass(note);
    const ascendingDistance = (toPitchClass - fromPitchClass + 12) % 12;
    return ascendingDistance > 6 ? ascendingDistance - 12 : ascendingDistance;
  });
}

function returnPosition(
  lastPosition: PhysicalNotePosition,
  positions: PhysicalNotePosition[],
  chordPitchClasses: Set<number>,
  forceReturn: boolean
): PhysicalNotePosition | undefined {
  if (!forceReturn && chordPitchClasses.has(lastPosition.pitchClass)) return undefined;

  return positions
    .filter(position => (
      chordPitchClasses.has(position.pitchClass)
      && (position.stringIndex !== lastPosition.stringIndex || position.fret !== lastPosition.fret)
    ))
    .map(position => ({ position, cost: transitionCost(lastPosition, position) }))
    .sort((left, right) => left.cost - right.cost)[0]?.position;
}

function roleForCellEvent(input: {
  eventRole: MelodicCellHarmonicRole;
  isFirst: boolean;
  isChordTone: boolean;
  intent?: ContextualMaterialIntent;
}): WriterMaterialGestureRole {
  if (input.intent === "outside" || input.eventRole === "outside") return "outside";
  if (input.eventRole === "tension" || input.eventRole === "color") return "color";
  return input.isChordTone
    ? input.isFirst ? "anchor" : "cell"
    : "color";
}

export function realizeWriterMaterialCellNearShape(
  input: WriterMaterialCellRealizationInput
): WriterRealizedMaterialGesture | undefined {
  const fretWindow = fretWindowForWriterMaterialShape(input.selectedFrets);
  if (!fretWindow.hasShape || input.tuning.length !== input.selectedFrets.length) return undefined;

  const chordPitchClasses = new Set(input.chordNotes.map(note => getPitchClass(note)));
  const selected = selectMaterialAndCell(
    input.melodicMaterials,
    chordPitchClasses,
    input.intent,
    input.materialIdentity,
    input.preferredSelection
  );
  if (!selected) return undefined;

  const positions = physicalPositions(input);
  const shapePositions = positions.filter(position => (
    input.selectedFrets[position.stringIndex] === position.fret
  ));
  const realizedPositions = realizeOrderedNotes(
    selected.notes,
    positions,
    shapePositions,
    selected.desiredPitchMovements
  );
  if (!realizedPositions) return undefined;

  const events: WriterMaterialGestureEvent[] = selected.notes.map((displayNote, index) => {
    const position = realizedPositions[index];
    const isChordTone = chordPitchClasses.has(position.pitchClass);
    const cellEvent = selected.cell.events[index];
    return {
      note: position.noteName,
      displayNote,
      stringIndex: position.stringIndex,
      fret: position.fret,
      role: cellEvent?.gestureRole === "return"
        ? "return"
        : roleForCellEvent({
            eventRole: cellEvent?.harmonicRole || "color",
            isFirst: index === 0,
            isChordTone,
            intent: input.intent
          }),
      cellId: selected.cellId,
      cellIndex: selected.cellIndex
    };
  });

  const landing = returnPosition(
    realizedPositions.at(-1) as PhysicalNotePosition,
    positions,
    chordPitchClasses,
    input.intent === "outside"
  );
  if (landing) {
    events.push({
      note: landing.noteName,
      displayNote: simplifyNote(landing.noteName).replace(/-?\d+$/, ""),
      stringIndex: landing.stringIndex,
      fret: landing.fret,
      role: "return",
      cellId: selected.cellId
    });
  } else if (events.length > 0 && chordPitchClasses.has(realizedPositions.at(-1)?.pitchClass ?? -1)) {
    events[events.length - 1] = {
      ...events[events.length - 1],
      role: "return"
    };
  }

  return {
    name: selected.material.label,
    theoryDesc: selected.material.practiceHint,
    realizedCell: {
      cellId: selected.cellId,
      materialLabel: selected.material.label,
      materialIndex: selected.materialIndex,
      cellIndex: selected.cellIndex,
      notation: selected.cell.notation
    },
    events
  };
}
