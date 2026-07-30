import type { BaseMelodicCell, MelodicCellHarmonicRole } from "./MelodicCell";

export type ImprovisationPhraseSurface = "writer-vamp" | "harmonizer-context";
export type ImprovisationPhraseBeatUnit = "quarter-note";

export interface ImprovisationPhraseEvent {
  id: string;
  note: string;
  cellId: string;
  onsetBeats: number;
  durationBeats: number;
  harmonicRole: MelodicCellHarmonicRole;
}

export interface ImprovisationPhrase {
  id: string;
  surface: ImprovisationPhraseSurface;
  beatUnit: ImprovisationPhraseBeatUnit;
  sourceCellIds: string[];
  events: ImprovisationPhraseEvent[];
}

export function improvisationPhraseFromCell(input: {
  cell: BaseMelodicCell;
  surface: ImprovisationPhraseSurface;
  startBeat?: number;
  durationBeats?: number;
}): ImprovisationPhrase {
  const startBeat = input.startBeat ?? 0;
  const durationBeats = input.durationBeats ?? 1;

  return {
    id: `${input.surface}:${input.cell.id}`,
    surface: input.surface,
    beatUnit: "quarter-note",
    sourceCellIds: [input.cell.id],
    events: input.cell.events.map((event, index) => ({
      id: `${input.cell.id}:event-${index + 1}`,
      note: event.note,
      cellId: input.cell.id,
      onsetBeats: startBeat + index * durationBeats,
      durationBeats,
      harmonicRole: event.harmonicRole
    }))
  };
}
