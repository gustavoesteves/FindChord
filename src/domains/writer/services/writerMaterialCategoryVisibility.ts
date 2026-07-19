import type { LocalMaterialNoteCategory } from "../../../utils/music/theory/localMaterialNoteRoles";

export function defaultWriterMaterialCategoryVisibility(): Record<LocalMaterialNoteCategory, boolean> {
  return {
    root: true,
    chordTone: true,
    characteristic: true,
    tension: false,
    avoid: false
  };
}
