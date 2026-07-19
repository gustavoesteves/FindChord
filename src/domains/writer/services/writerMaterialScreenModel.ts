import type { MaterialSourceMap } from "../../../utils/music/theory/musicTheory";
import { buildLocalChordMaterialReadings } from "../../../utils/music/theory/localChordMaterials";
import type { ChordCandidate } from "../../../utils/music/models/ChordCandidate";
import { buildWriterActiveMaterialPanel } from "./writerActiveMaterialPanel";
import { buildWriterMaterialAction } from "./writerMaterialAction";
import { buildWriterMaterialPalette } from "./writerMaterialPalette";
import { resolveWriterMaterialFocus } from "./writerMaterialFocus";
import {
  buildWriterMaterialRoutes,
  itemsForWriterMaterialRoute,
  presentWriterMaterialRoute,
  resolveWriterMaterialRoute,
  type WriterMaterialRouteId
} from "./writerMaterialRoutes";

export type WriterNotationStyle = "International" | "Brazilian" | "Academic";

export interface WriterMaterialScreenModelInput {
  activeChord: ChordCandidate;
  notationStyle: WriterNotationStyle;
  preferredRouteId: WriterMaterialRouteId;
  selectedMaterialSource: MaterialSourceMap | null;
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
  const effectiveRouteId = resolveWriterMaterialRoute(input.preferredRouteId, materialRoutes);
  const effectiveRoute = materialRoutes.find(route => route.id === effectiveRouteId);
  const routedMaterialPalette = itemsForWriterMaterialRoute(materialPalette, effectiveRouteId);
  const routePresentation = presentWriterMaterialRoute(routedMaterialPalette);
  const focusedMaterialSource = resolveWriterMaterialFocus(input.selectedMaterialSource, routedMaterialPalette);
  const focusedPaletteItem =
    routedMaterialPalette.find(item => item.source.name === focusedMaterialSource?.name) || null;
  const activeMaterialPanel = focusedMaterialSource
    ? buildWriterActiveMaterialPanel({
        sourceType: focusedMaterialSource.type,
        chordRoot: input.activeChord.root,
        candidate: materialCandidateByType.get(focusedMaterialSource.type)
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
    activeMaterialPanel,
    activeMaterialAction
  };
}
