import type { RuntimePattern } from "../runtime/models/RuntimePattern";

export interface MidiChordEvent {
  startBeat: number;
  durationBeats: number;
  notes: number[];
  velocity: number;
  sourceChord?: string;
}

export interface MidiTrack {
  events: MidiChordEvent[];
  name?: string;
  instrumentProgram?: number;
  channel?: number;
}

export interface MidiRenderOptions {
  bpm?: number;
  velocity?: number;
  channel?: number;
  ticksPerBeat?: number;
  chordDurationBeats?: number;
  format?: 0 | 1;
  instrumentProgram?: number;
  timeSignature?: {
    numerator: number;
    denominator: number;
  };
  humanize?: {
    seed?: number;
    velocityVariance?: number;
    timingVarianceTicks?: number;
  };
  pattern?: RuntimePattern;
}


export interface MidiExportResult {
  bytes: Uint8Array;
  track: MidiTrack;
  tracks?: MidiTrack[];
}

