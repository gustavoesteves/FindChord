export interface TimeSignatureEvent {
  tickStart: number;
  numerator: number;
  denominator: number;
}

export interface KeySignatureEvent {
  tickStart: number;
  fifths: number;
  mode?: string;
}

export interface TempoEvent {
  tickStart: number;
  qpm: number; // Quarter notes per minute
}

export interface ParsedNote {
  id: string;
  pitchMidi: number;
  step: string;
  alter: number;
  octave: number;
  voice: number;
  staff: number;
  measure: number;
  tickStart: number;
  tickEnd: number;
  durationTicks: number;
  chordId?: string;
}

export interface ParsedChord {
  id: string;
  symbol: string;
  measure: number;
  beat: number;
  tickStart: number;
  tickEnd: number;
  durationTicks: number;
}

export type SectionFunction = 
  | 'PRESENTATION' 
  | 'DEVELOPMENT' 
  | 'CLIMAX' 
  | 'TRANSITION' 
  | 'RESOLUTION'
  | 'UNKNOWN';

export interface ParsedSection {
  id: string;
  label: string;
  type: string; // "INTRO", "VERSE", "CHORUS", "UNKNOWN"
  function?: SectionFunction;
  startMeasure: number;
  endMeasure: number;
  startTick: number;
  endTick: number;
}

export interface ParsedMeasure {
  number: number;
  tickStart: number;
  tickEnd: number;
  durationTicks: number;
}

export interface ScoreMetadata {
  title?: string;
  composer?: string;
  measures: number;
  keySignature?: string;
  timeSignature?: string;
  tempo?: number;
}

export interface ParsedScore {
  metadata: ScoreMetadata;
  measures: ParsedMeasure[];
  sections: ParsedSection[];
  chords: ParsedChord[];
  notes: ParsedNote[];
  timeSignatureMap: TimeSignatureEvent[];
  keySignatureMap: KeySignatureEvent[];
  tempoMap: TempoEvent[];
}
