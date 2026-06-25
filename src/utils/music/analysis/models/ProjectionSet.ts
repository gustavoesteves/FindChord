export interface MelodicAnchor {
  measureIndex: number;
  pitch: string;
  duration?: number; // in ticks
  startTick?: number;
  endTick?: number;
}
