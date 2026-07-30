import { getPitchClass, simplifyNote } from "../../../utils/music/core/pitch";
import type {
  ContextualMaterialIntent,
  ContextualMelodicMaterial
} from "../../../utils/music/theory/contextualMaterialTypes";
import {
  materialNoteRoleFor,
  type MaterialChordIdentity
} from "../../../utils/music/theory/materialChordIdentity";

export type WriterMaterialImprovisationMoveKind =
  | "support"
  | "color"
  | "tension"
  | "outside"
  | "return";

export interface WriterMaterialImprovisationMove {
  id: string;
  materialIndex: number;
  cellIndex: number;
  kind: WriterMaterialImprovisationMoveKind;
  actionLabel: string;
  materialLabel: string;
  notation: string;
  notes: string[];
  practiceHint: string;
  tensionProfile: string[];
  resolutionTargets: string[];
  isPreferred: boolean;
}

export interface WriterMaterialImprovisationMovesInput {
  melodicMaterials: ContextualMelodicMaterial[];
  chordNotes: string[];
  materialIdentity?: MaterialChordIdentity;
  intent?: ContextualMaterialIntent;
}

const ACTION_LABEL_BY_KIND: Record<WriterMaterialImprovisationMoveKind, string> = {
  support: "Apoiar o acorde",
  color: "Abrir uma cor",
  tension: "Criar tensão",
  outside: "Sair e voltar",
  return: "Voltar ao acorde"
};

export function writerMaterialImprovisationMoveId(
  materialIndex: number,
  cellIndex: number
): string {
  return `${materialIndex}:${cellIndex}`;
}

function notesInCell(notation: string): string[] {
  const separator = notation.includes("->") ? "->" : "-";
  return notation
    .split(separator)
    .map(note => simplifyNote(note.trim()))
    .filter(Boolean);
}

function moveKind(
  notation: string,
  notes: string[],
  chordPitchClasses: Set<number>,
  materialIdentity: MaterialChordIdentity | undefined,
  intent?: ContextualMaterialIntent
): WriterMaterialImprovisationMoveKind {
  const returnsToChord = notation.includes("->")
    && notes.length > 1
    && chordPitchClasses.has(getPitchClass(notes.at(-1) || ""));
  if (returnsToChord) return "return";

  const semanticRoles = materialIdentity
    ? notes.map(note => materialNoteRoleFor(materialIdentity, note))
    : [];
  if (semanticRoles.some(role => role.role === "written-tension" || role.role === "voicing-alteration")) {
    return "tension";
  }

  const onlyUsesChordTones = notes.length > 0
    && notes.every(note => chordPitchClasses.has(getPitchClass(note)));
  if (onlyUsesChordTones) return "support";
  if (intent === "outside") return "outside";
  if (intent === "tension") return "tension";
  return "color";
}

function preferredMoveId(
  melodicMaterials: ContextualMelodicMaterial[],
  chordPitchClasses: Set<number>
): string | null {
  for (let materialIndex = 0; materialIndex < melodicMaterials.length; materialIndex += 1) {
    const material = melodicMaterials[materialIndex];
    const validCells = material.cells
      .map((notation, cellIndex) => ({
        cellIndex,
        notes: notesInCell(notation)
      }))
      .filter(cell => cell.notes.length > 0);
    if (validCells.length === 0) continue;

    const explicitCell = validCells.find(cell => cell.cellIndex === material.preferredCellIndex);
    if (explicitCell) {
      return writerMaterialImprovisationMoveId(materialIndex, explicitCell.cellIndex);
    }

    const mostCharacteristicCell = [...validCells].sort((left, right) => {
      const leftColorCount = left.notes.filter(note => (
        !chordPitchClasses.has(getPitchClass(note))
      )).length;
      const rightColorCount = right.notes.filter(note => (
        !chordPitchClasses.has(getPitchClass(note))
      )).length;
      return rightColorCount - leftColorCount || left.cellIndex - right.cellIndex;
    })[0];
    return writerMaterialImprovisationMoveId(materialIndex, mostCharacteristicCell.cellIndex);
  }

  return null;
}

export function buildWriterMaterialImprovisationMoves(
  input: WriterMaterialImprovisationMovesInput
): WriterMaterialImprovisationMove[] {
  const chordPitchClasses = new Set(input.chordNotes.map(note => getPitchClass(note)));
  const preferredId = preferredMoveId(input.melodicMaterials, chordPitchClasses);

  return input.melodicMaterials
    .flatMap((material, materialIndex) => (
      material.cells.map((notation, cellIndex) => {
        const notes = notesInCell(notation);
        const kind = moveKind(notation, notes, chordPitchClasses, input.materialIdentity, input.intent);

        return {
          id: writerMaterialImprovisationMoveId(materialIndex, cellIndex),
          materialIndex,
          cellIndex,
          kind,
          actionLabel: ACTION_LABEL_BY_KIND[kind],
          materialLabel: material.label,
          notation,
          notes,
          practiceHint: material.practiceHint,
          tensionProfile: [...material.tensionProfile],
          resolutionTargets: [...material.resolutionTargets],
          isPreferred: writerMaterialImprovisationMoveId(materialIndex, cellIndex) === preferredId
        };
      })
    ))
    .sort((left, right) => (
      Number(right.isPreferred) - Number(left.isPreferred)
      || left.materialIndex - right.materialIndex
      || left.cellIndex - right.cellIndex
    ));
}

export function resolveWriterMaterialImprovisationMove(
  moves: WriterMaterialImprovisationMove[],
  selectedMoveId?: string | null
): WriterMaterialImprovisationMove | null {
  return moves.find(move => move.id === selectedMoveId) || moves[0] || null;
}
