import type { MaterialSourceMap } from "../../../utils/music/theory/musicTheory";
import { buildLocalChordMaterialReadings } from "../../../utils/music/theory/localChordMaterials";
import type { ChordCandidate } from "../../../utils/music/models/ChordCandidate";
import { buildWriterActiveMaterialPanel } from "./writerActiveMaterialPanel";
import { buildWriterMaterialAction } from "./writerMaterialAction";
import {
  buildWriterMaterialImprovisationMoves,
  resolveWriterMaterialImprovisationMove
} from "./writerMaterialImprovisationMoves";
import { buildWriterMaterialPalette } from "./writerMaterialPalette";
import { resolveWriterMaterialFocus } from "./writerMaterialFocus";
import {
  DEFAULT_WRITER_MATERIAL_ROUTE_ID,
  buildWriterMaterialRoutes,
  itemsForWriterMaterialRoute,
  presentWriterMaterialRoute,
  resolveWriterMaterialRoute,
  routeForWriterMaterialItem,
  type WriterMaterialRouteId
} from "./writerMaterialRoutes";

export type WriterNotationStyle = "International" | "Brazilian" | "Academic";

export interface WriterMaterialScreenModelInput {
  activeChord: ChordCandidate;
  notationStyle: WriterNotationStyle;
  preferredRouteId?: WriterMaterialRouteId | null;
  preferredMoveId?: string | null;
  selectedMaterialSource: MaterialSourceMap | null;
  tuning?: string[];
  selectedFrets?: (number | null)[];
}

export function chordNameForWriterMaterialScreen(
  chord: ChordCandidate,
  notationStyle: WriterNotationStyle
): string {
  if (notationStyle === "Brazilian") return chord.notationBrazilian;
  if (notationStyle === "Academic") return chord.notationAcademic;
  return chord.notationInternational;
}

export function buildWriterMaterialScreenModel(input: WriterMaterialScreenModelInput) {
  const materialReadings = buildLocalChordMaterialReadings(input.activeChord);
  const materialCandidateByType = new Map(materialReadings.map(reading => [reading.source.type, reading.candidate]));
  const materialPalette = buildWriterMaterialPalette(materialReadings);
  const materialRoutes = buildWriterMaterialRoutes(materialPalette);
  const globallyPrioritizedItem = materialPalette[0];
  const globallyPrioritizedRouteId = globallyPrioritizedItem
    ? routeForWriterMaterialItem(globallyPrioritizedItem)
    : DEFAULT_WRITER_MATERIAL_ROUTE_ID;
  const requestedRoute = input.preferredRouteId
    ? materialRoutes.find(route => route.id === input.preferredRouteId)
    : undefined;
  const preferredRouteId = requestedRoute?.items.length
    ? requestedRoute.id
    : globallyPrioritizedRouteId;
  const effectiveRouteId = resolveWriterMaterialRoute(preferredRouteId, materialRoutes);
  const effectiveRoute = materialRoutes.find(route => route.id === effectiveRouteId);
  const routedMaterialPalette = itemsForWriterMaterialRoute(materialPalette, effectiveRouteId);
  const routePresentation = presentWriterMaterialRoute(routedMaterialPalette);
  const focusedMaterialSource = resolveWriterMaterialFocus(input.selectedMaterialSource, routedMaterialPalette);
  const focusedPaletteItem =
    routedMaterialPalette.find(item => item.source.name === focusedMaterialSource?.name) || null;
  const focusedMaterialCandidate = focusedMaterialSource
    ? materialCandidateByType.get(focusedMaterialSource.type)
    : undefined;
  const improvisationMoves = focusedMaterialCandidate
    ? buildWriterMaterialImprovisationMoves({
        melodicMaterials: focusedMaterialCandidate.melodicMaterials,
        chordNotes: input.activeChord.notes,
        materialIdentity: focusedMaterialCandidate.materialIdentity,
        intent: focusedMaterialCandidate.intent
      })
    : [];
  const focusedImprovisationMove = resolveWriterMaterialImprovisationMove(
    improvisationMoves,
    input.preferredMoveId
  );
  const activeMaterialPanel = focusedMaterialSource
    ? buildWriterActiveMaterialPanel({
        sourceType: focusedMaterialSource.type,
        chordRoot: input.activeChord.root,
        chordNotes: input.activeChord.notes,
        sourceNotes: focusedMaterialSource.notes,
        tuning: input.tuning,
        selectedFrets: input.selectedFrets,
        candidate: focusedMaterialCandidate,
        preferredCellSelection: focusedImprovisationMove
          ? {
              materialIndex: focusedImprovisationMove.materialIndex,
              cellIndex: focusedImprovisationMove.cellIndex,
              cellId: focusedImprovisationMove.cellId
            }
          : undefined
      })
    : null;
  const activeMaterialAction = buildWriterMaterialAction({
    activePanel: activeMaterialPanel,
    focusedSource: focusedMaterialSource,
    focusedPaletteItem
  });

  return {
    chordName: chordNameForWriterMaterialScreen(input.activeChord, input.notationStyle),
    hasMaterials: materialReadings.length > 0,
    materialRoutes,
    effectiveRouteId,
    effectiveRoute,
    routedMaterialPalette,
    routePresentation,
    focusedMaterialSource,
    focusedPaletteItem,
    improvisationMoves,
    focusedImprovisationMove,
    activeMaterialPanel,
    activeMaterialAction
  };
}
