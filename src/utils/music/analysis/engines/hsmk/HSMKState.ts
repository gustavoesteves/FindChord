export type HarmonicFunction = "T" | "PD" | "D";

export interface HSMKState {
  center: string; // e.g. "C"
  activeFunction: HarmonicFunction;
  lastChord?: string; // e.g. "C", "F", "G"
  stability: number; // 0.0 to 1.0. 1.0 means fully stable, 0.0 means forced collapse.
}
