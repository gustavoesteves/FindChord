export interface ScoreHarmonyEvent {
  measure: number;    // Compasso onde o acorde foi escrito (1-indexed)
  beat: number;       // Tempo do compasso (ex: 1, 2, 3...)
  harmony: string;    // Cifra textual extraída (ex: "Cmaj7")
}

export interface ScoreSection {
  id: string;
  label: string; // "Intro", "A", "Chorus"
  startMeasure: number;
  endMeasure: number;
  startChordIndex?: number;
  endChordIndex?: number;
}

export interface ScoreSnapshot {
  timestamp: number;
  harmonies: ScoreHarmonyEvent[];
  sections?: ScoreSection[];
  metadata: {
    title?: string;
    composer?: string;
    measures?: number;
    keySignature?: string;
    timeSignature?: string;
    tempo?: number;
  };
}
