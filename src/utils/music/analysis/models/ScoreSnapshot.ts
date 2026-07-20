export interface ScoreHarmonyEvent {
  measure: number;    // Compasso onde o acorde foi escrito (1-indexed)
  beat: number;       // Tempo do compasso (ex: 1, 2, 3...)
  harmony: string;    // Cifra textual extraída (ex: "Cmaj7")
  tickStart: number;
  tickEnd: number;
  durationTicks: number;
}

export interface ScoreSection {
  id: string;
  label: string; // "Intro", "A", "Chorus"
  type?: string;
  startMeasure: number;
  endMeasure: number;
  startTick: number;
  endTick: number;
  startChordIndex?: number;
  endChordIndex?: number;
}

export interface ScoreMeasureTickRange {
  measure: number;
  startTick: number;
  endTick: number;
  timeSignature?: string;
}

export interface ScoreKeyTimelineEntry {
  measure: number;
  tick: number;
  fifths: number;
  mode?: "major" | "minor" | string;
  keySignature?: string;
}

export interface ScoreTimeTimelineEntry {
  measure: number;
  tick: number;
  beats: number;
  beatType: number;
  timeSignature: string;
}

export interface ScoreNoteEvent {
  id: string;
  step: string;
  alter: number;
  octave: number;
  voice: number;
  staff: number;
  measure: number;
  tickStart: number;
  tickEnd: number;
  durationTicks: number;
}

export interface ScoreSnapshot {
  timestamp: number;
  harmonies: ScoreHarmonyEvent[];
  sections?: ScoreSection[];
  notes?: ScoreNoteEvent[];
  metadata: {
    title?: string;
    composer?: string;
    measures?: number;
    keySignature?: string;
    timeSignature?: string;
    measureTicks?: ScoreMeasureTickRange[];
    keyTimeline?: ScoreKeyTimelineEntry[];
    timeTimeline?: ScoreTimeTimelineEntry[];
    tempo?: number;
  };
}
