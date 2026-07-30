import {
  baseMelodicCellFromNotation,
  stableMelodicCellToken,
  type BaseMelodicCell,
  type MelodicCellIntent
} from "../models/MelodicCell";
import type {
  ContextualMaterialIntent,
  ContextualMelodicMaterial
} from "./contextualMaterialTypes";
import type { MaterialChordIdentity } from "./materialChordIdentity";

export function contextualMelodicMaterialId(material: ContextualMelodicMaterial): string {
  if (material.id) return stableMelodicCellToken(material.id);
  return stableMelodicCellToken([
    material.source,
    material.sourceScale,
    material.label
  ].filter(Boolean).join(":"));
}

function melodicCellIntentFromContextualIntent(
  intent?: ContextualMaterialIntent
): MelodicCellIntent {
  return intent || "inside";
}

export function structuredCellsForContextualMaterial(input: {
  material: ContextualMelodicMaterial;
  intent?: ContextualMaterialIntent;
  materialIdentity?: MaterialChordIdentity;
}): BaseMelodicCell[] {
  if (input.material.cellsStructured?.length) {
    return input.material.cellsStructured.map(cell => ({
      ...cell,
      events: cell.events.map(event => ({ ...event })),
      localReturnDegrees: [...cell.localReturnDegrees]
    }));
  }

  const materialId = contextualMelodicMaterialId(input.material);
  return input.material.cells.map(notation => baseMelodicCellFromNotation({
    materialId,
    notation,
    intent: melodicCellIntentFromContextualIntent(input.intent),
    materialIdentity: input.materialIdentity,
    resolutionTargets: input.material.resolutionTargets,
    preferredRhythmArchetype: input.material.preferredRhythmArchetype
  }));
}

export function preferredStructuredCellIdForMaterial(
  material: ContextualMelodicMaterial,
  structuredCells: BaseMelodicCell[]
): string | null {
  if (material.preferredCellId && structuredCells.some(cell => cell.id === material.preferredCellId)) {
    return material.preferredCellId;
  }
  if (
    material.preferredCellIndex !== undefined
    && material.preferredCellIndex >= 0
    && material.preferredCellIndex < structuredCells.length
  ) {
    return structuredCells[material.preferredCellIndex].id;
  }
  return null;
}
