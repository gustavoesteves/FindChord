import { getPitchClass } from "../../../utils/music/core/pitch";
import type {
  ContextualMaterialIntent,
  ContextualMelodicMaterial
} from "../../../utils/music/theory/contextualMaterialTypes";
import {
  preferredStructuredCellIdForMaterial,
  structuredCellsForContextualMaterial
} from "../../../utils/music/theory/melodicCellMaterialAdapter";
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
  cellId: string;
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

const RETURN_ACTION_LABEL_BY_INTENT: Record<ContextualMaterialIntent, string> = {
  inside: "Apoiar e voltar",
  functional: "Colorir e voltar",
  tension: "Tensionar e voltar",
  outside: "Sair e voltar"
};

export function writerMaterialImprovisationMoveId(
  materialIndex: number,
  cellId: string
): string {
  return `${materialIndex}:${cellId}`;
}

function writerMaterialLegacyImprovisationMoveId(
  materialIndex: number,
  cellIndex: number
): string {
  return `${materialIndex}:${cellIndex}`;
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

function actionLabelForMove(
  kind: WriterMaterialImprovisationMoveKind,
  intent?: ContextualMaterialIntent
): string {
  if (kind === "return" && intent) return RETURN_ACTION_LABEL_BY_INTENT[intent];
  return ACTION_LABEL_BY_KIND[kind];
}

function preferredMoveId(
  melodicMaterials: ContextualMelodicMaterial[],
  chordPitchClasses: Set<number>,
  materialIdentity: MaterialChordIdentity | undefined,
  intent?: ContextualMaterialIntent
): string | null {
  for (let materialIndex = 0; materialIndex < melodicMaterials.length; materialIndex += 1) {
    const material = melodicMaterials[materialIndex];
    const structuredCells = structuredCellsForContextualMaterial({
      material,
      intent,
      materialIdentity
    });
    const validCells = structuredCells
      .map((cell, cellIndex) => ({
        cellIndex,
        cellId: cell.id,
        notes: cell.events.map(event => event.note)
      }))
      .filter(cell => cell.notes.length > 0);
    if (validCells.length === 0) continue;

    const preferredCellId = preferredStructuredCellIdForMaterial(material, structuredCells);
    const explicitCell = preferredCellId
      ? validCells.find(cell => cell.cellId === preferredCellId)
      : null;
    if (explicitCell) {
      return writerMaterialImprovisationMoveId(materialIndex, explicitCell.cellId);
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
    return writerMaterialImprovisationMoveId(materialIndex, mostCharacteristicCell.cellId);
  }

  return null;
}

export function buildWriterMaterialImprovisationMoves(
  input: WriterMaterialImprovisationMovesInput
): WriterMaterialImprovisationMove[] {
  const chordPitchClasses = new Set(input.chordNotes.map(note => getPitchClass(note)));
  const preferredId = preferredMoveId(
    input.melodicMaterials,
    chordPitchClasses,
    input.materialIdentity,
    input.intent
  );

  return input.melodicMaterials
    .flatMap((material, materialIndex) => {
      const structuredCells = structuredCellsForContextualMaterial({
        material,
        intent: input.intent,
        materialIdentity: input.materialIdentity
      });
      return structuredCells.map((cell, cellIndex) => {
        const notation = cell.notation;
        const notes = cell.events.map(event => event.note);
        const kind = moveKind(notation, notes, chordPitchClasses, input.materialIdentity, input.intent);
        const id = writerMaterialImprovisationMoveId(materialIndex, cell.id);

        return {
          id,
          cellId: cell.id,
          materialIndex,
          cellIndex,
          kind,
          actionLabel: actionLabelForMove(kind, input.intent),
          materialLabel: material.label,
          notation,
          notes,
          practiceHint: material.practiceHint,
          tensionProfile: [...material.tensionProfile],
          resolutionTargets: [...material.resolutionTargets],
          isPreferred: id === preferredId
        };
      });
    })
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
  return moves.find(move => (
    move.id === selectedMoveId
    || writerMaterialLegacyImprovisationMoveId(move.materialIndex, move.cellIndex) === selectedMoveId
  )) || moves[0] || null;
}
