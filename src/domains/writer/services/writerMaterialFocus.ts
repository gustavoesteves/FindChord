import type { MaterialSourceMap } from "../../../utils/music/theory/musicTheory";
import type { WriterMaterialPaletteItem } from "./writerMaterialPalette";

export function resolveWriterMaterialFocus(
  selectedSource: MaterialSourceMap | null,
  palette: WriterMaterialPaletteItem[]
): MaterialSourceMap | null {
  const selectedItem = palette.find(item => item.source.name === selectedSource?.name);
  return selectedItem?.source || palette[0]?.source || null;
}
