export interface FormalSection {
  id: string;
  label: string;
  source: "score" | "inferred-phrase-window";
  startMeasure: number;
  endMeasure: number;
  startTick?: number;
  endTick?: number;
  startChordIndex?: number;
  endChordIndex?: number;
}
