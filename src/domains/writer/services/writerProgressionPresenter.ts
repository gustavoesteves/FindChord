import type { WriterProgressionChord } from "../../../store/useChordStore";

export function formatWriterProgressionPositionLabel(item: Pick<WriterProgressionChord, "measureIndex" | "beat">): string {
  return item.beat && item.beat > 1
    ? `Comp. ${item.measureIndex} · beat ${item.beat}`
    : `Comp. ${item.measureIndex}`;
}
