import type { LocalMaterialNoteCategory } from "../../../utils/music/theory/localMaterialNoteRoles";
import type { WriterMaterialRouteId } from "./writerMaterialRoutes";

export function defaultWriterMaterialCategoryVisibility(): Record<LocalMaterialNoteCategory, boolean> {
  return {
    root: true,
    chordTone: true,
    characteristic: true,
    tension: false,
    avoid: false
  };
}

export function effectiveWriterMaterialCategoryVisibility(
  routeId: WriterMaterialRouteId,
  visibility: Record<LocalMaterialNoteCategory, boolean>
): Record<LocalMaterialNoteCategory, boolean> {
  if (routeId === "outside") {
    return {
      ...visibility,
      tension: true,
      avoid: true
    };
  }
  if (routeId === "tension") {
    return {
      ...visibility,
      tension: true
    };
  }
  return visibility;
}
