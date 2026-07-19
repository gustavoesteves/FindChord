import {
  actionLabelForWriterMaterialIntent,
  type WriterMaterialIntentLabel,
  type WriterMaterialPaletteItem
} from "../../src/domains/writer/services/writerMaterialPalette";
import type { MaterialSourceMap } from "../../src/utils/music/theory/musicTheory";

export function writerMaterialTestSource(name: string, overrides: Partial<MaterialSourceMap> = {}): MaterialSourceMap {
  return {
    name,
    type: name.toLowerCase(),
    intervals: ["1P"],
    notes: ["C"],
    ...overrides
  };
}

export function writerMaterialTestItem(
  intentLabel: WriterMaterialIntentLabel,
  name: string,
  overrides: Partial<WriterMaterialPaletteItem> = {}
): WriterMaterialPaletteItem {
  const source = overrides.source || writerMaterialTestSource(name);
  const resolvedIntentLabel = overrides.intentLabel || intentLabel;

  return {
    source,
    title: name,
    subtitle: "",
    cells: ["C"],
    extraMaterialCount: 0,
    intentLabel: resolvedIntentLabel,
    actionLabel: overrides.actionLabel || actionLabelForWriterMaterialIntent(resolvedIntentLabel),
    ...overrides
  };
}
