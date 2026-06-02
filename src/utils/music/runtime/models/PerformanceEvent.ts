export type VoiceRole = "bass" | "root" | "third" | "fifth" | "seventh" | "tension";
export type VoiceId = "bass" | "tenor" | "alto" | "soprano" | "lead" | "tension" | "none";

export interface PerformanceEvent {
  startBeat: number;
  durationBeats: number;
  midiNotes: number[];
  velocity: number;
  sourceChord?: string;
  voiceRoles?: VoiceRole[];
  voiceIds?: VoiceId[];
}
